#!/usr/bin/env python3
"""Compute verified investment series + facts from normalized price files.

Usage: compute.py projects/<slug>/scenario.json  ->  projects/<slug>/calc.json

scenario.json:
{
  "mode": "lump_sum" | "dca" | "compare",
  "assets": [{"ticker": "GME", "label": "GameStop", "data": "data/GME.json"}],
  "amount": 10000,                # lump sum per asset (lump_sum / compare)
  "monthly": 100,                 # dca contribution
  "initial": 0,                   # dca optional starting lump
  "start": "2016-01-04",          # first trading day on/after this date is used
  "end": "2026-10-23",            # last trading day on/before this date is used
  "dividends": "none" | "reinvest" | "cash",
  "inflation": false | true,      # adds CPI-matched baseline + real return (needs "cpi")
  "cpi": "data/CPI.json"
}

Conventions (always written to calc.json "assumptions"):
- Buys and valuations use daily CLOSING prices, split-adjusted, so splits and
  reverse splits are handled exactly (share counts are reported both in today's
  split-adjusted units and as originally purchased).
- dividends=reinvest: each dividend buys more shares at that ex-date's close.
- dca: contribution on the first trading day of every month, bought at the close.
- Fractional shares, no fees, no taxes.
"""
import json
import math
import os
import sys
from datetime import date


def load(p):
    with open(p) as f:
        return json.load(f)


def years_between(a, b):
    return (date.fromisoformat(b) - date.fromisoformat(a)).days / 365.2425


def split_factor_after(splits, d):
    """Cumulative split multiplier for splits strictly after date d (shares then -> shares now)."""
    f = 1.0
    for s in splits:
        if s["date"] > d:
            f *= s["numerator"] / s["denominator"]
    return f


def simulate(px, scen, dates):
    """Return (values, contributed, shares_now_units, cash_divs, buys) on `dates`."""
    rows = {r["date"]: r for r in px["rows"]}
    divs = {d["date"]: d["amount"] for d in px.get("dividends", [])}
    mode = scen["mode"]
    divmode = scen.get("dividends", "none")
    if divmode != "none" and not px.get("dividends") and not any(r.get("adjclose") for r in px["rows"]):
        raise SystemExit(f"{px['ticker']}: dividend mode '{divmode}' requested but source has no dividend data.")
    shares = 0.0
    cash = 0.0
    contributed = 0.0
    vals, contr, buys = [], [], []
    last_month = None
    for i, d in enumerate(dates):
        c = rows[d]["close"]
        if mode == "dca":
            m = d[:7]
            if i == 0 and scen.get("initial"):
                shares += scen["initial"] / c
                contributed += scen["initial"]
                buys.append({"date": d, "amount": scen["initial"], "price": c})
            if m != last_month:
                shares += scen["monthly"] / c
                contributed += scen["monthly"]
                buys.append({"date": d, "amount": scen["monthly"], "price": c})
                last_month = m
        elif i == 0:
            shares = scen["amount"] / c
            contributed = scen["amount"]
            buys.append({"date": d, "amount": scen["amount"], "price": c})
        if i > 0 and d in divs and divmode != "none":
            amt = shares * divs[d]
            if divmode == "reinvest":
                shares += amt / c
            else:
                cash += amt
        vals.append(shares * c + cash)
        contr.append(contributed)
    return vals, contr, shares, cash, buys


def cpi_lookup(cpi, d):
    m = d[:7]
    months = cpi["months"]
    best = None
    for row in months:
        if row["month"] <= m:
            best = row
    return best or months[0], (best is None or best["month"] != m)


def facts_for(px, scen, dates, vals, contr, shares, cash, buys):
    rows = {r["date"]: r for r in px["rows"]}
    first, last = dates[0], dates[-1]
    peak_i = max(range(len(vals)), key=lambda i: vals[i])
    trough_i = min(range(len(vals)), key=lambda i: vals[i])
    # max drawdown
    mdd, run_max, run_i, dd_peak, dd_trough = 0.0, vals[0], 0, 0, 0
    for i, v in enumerate(vals):
        if v > run_max:
            run_max, run_i = v, i
        dd = v / run_max - 1
        if dd < mdd:
            mdd, dd_peak, dd_trough = dd, run_i, i
    final = vals[-1]
    invested = contr[-1]
    yrs = years_between(first, last)
    # As-traded price on the start date: provider value if present, else derived from split events.
    unadj0 = rows[first].get("unadjusted_close") or rows[first]["close"] * split_factor_after(px.get("splits", []), first)
    f = {
        "ticker": px["ticker"],
        "start_date": first,
        "end_date": last,
        "years": round(yrs, 2),
        "start_price": rows[first]["close"],
        "start_price_unadjusted": unadj0,
        "end_price": rows[last]["close"],
        "price_multiple": rows[last]["close"] / rows[first]["close"],
        "invested": invested,
        "final_value": final,
        "gain": final - invested,
        "total_return_pct": (final / invested - 1) * 100,
        "multiple": final / invested,
        "peak_value": vals[peak_i],
        "peak_date": dates[peak_i],
        "peak_close": rows[dates[peak_i]]["close"],
        "trough_value": vals[trough_i],
        "trough_date": dates[trough_i],
        "trough_close": rows[dates[trough_i]]["close"],
        "max_drawdown_pct": mdd * 100,
        "max_drawdown_from": dates[dd_peak],
        "max_drawdown_to": dates[dd_trough],
        "shares_now": shares,  # in today's split-adjusted units
        "shares_bought_original_units": (
            buys[0]["amount"] / unadj0
            if scen["mode"] != "dca" else None
        ),
        "cash_dividends": cash,
        "num_buys": len(buys),
    }
    if scen["mode"] != "dca" and yrs > 0.5:
        f["cagr_pct"] = ((final / invested) ** (1 / yrs) - 1) * 100
    highs = [(r["high"], r["date"]) for r in px["rows"] if r.get("high") and first <= r["date"] <= last]
    if highs:
        h, hd = max(highs)
        f["intraday_high"] = h
        f["intraday_high_date"] = hd
    return f


def main():
    scen_path = sys.argv[1]
    base = os.path.dirname(os.path.abspath(scen_path))
    root = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    scen = load(scen_path)
    resolve = lambda p: p if os.path.isabs(p) else os.path.join(root, p)
    pxs = [load(resolve(a["data"])) for a in scen["assets"]]

    # Common trading dates within [start, end]
    sets = [set(r["date"] for r in px["rows"] if scen["start"] <= r["date"] <= scen["end"]) for px in pxs]
    dates = sorted(set.intersection(*sets))
    if len(dates) < 20:
        raise SystemExit("Not enough overlapping trading days.")
    for px, s in zip(pxs, sets):
        missing = len(s) - len(dates)
        if missing:
            print(f"note: {px['ticker']} had {missing} dates not shared by all assets (dropped for alignment)")

    out = {"scenario": scen, "series": [], "facts": {}, "assumptions": [], "sources": [], "checks": []}
    for a, px in zip(scen["assets"], pxs):
        vals, contr, shares, cash, buys = simulate(px, scen, dates)
        f = facts_for(px, scen, dates, vals, contr, shares, cash, buys)
        # --- independent cross-checks
        rows = {r["date"]: r for r in px["rows"]}
        if scen["mode"] != "dca" and scen.get("dividends", "none") == "none":
            alt = scen["amount"] * rows[dates[-1]]["close"] / rows[dates[0]]["close"]
            ok = abs(alt - vals[-1]) < 0.01
            out["checks"].append(f"{px['ticker']} final value re-derived from price ratio: ${alt:,.2f} {'OK' if ok else 'MISMATCH'}")
            if not ok:
                raise SystemExit("cross-check failed")
        if scen.get("dividends") == "reinvest" and all(rows[d].get("adjclose") for d in (dates[0], dates[-1])):
            amt = scen.get("amount") or 0
            if scen["mode"] != "dca":
                alt = amt * rows[dates[-1]]["adjclose"] / rows[dates[0]]["adjclose"]
                diff = (vals[-1] / alt - 1) * 100
                out["checks"].append(
                    f"{px['ticker']} DRIP value vs provider adj-close total return: ${vals[-1]:,.0f} vs ${alt:,.0f} ({diff:+.2f}%)"
                )
                f["final_value_adjclose_method"] = alt
        if scen["mode"] == "dca":
            exp = scen["monthly"] * len({d[:7] for d in dates}) + (scen.get("initial") or 0)
            ok = abs(exp - contr[-1]) < 0.01
            out["checks"].append(f"{px['ticker']} DCA contributions {len(buys)} buys = ${contr[-1]:,.0f} {'OK' if ok else 'MISMATCH'}")
        series = {"id": px["ticker"], "label": a.get("label", px["ticker"]), "ticker": px["ticker"],
                  "logo": a.get("logo"), "dates": dates, "values": [round(v, 2) for v in vals],
                  "contributed": [round(c, 2) for c in contr]}
        if scen.get("inflation"):
            cpi = load(resolve(scen["cpi"]))
            c0, _ = cpi_lookup(cpi, dates[0])
            real_base, stale = [], False
            cpi_buys = [(b["date"], b["amount"], cpi_lookup(cpi, b["date"])[0]["cpi"]) for b in buys]
            for d in dates:
                ci, st = cpi_lookup(cpi, d)
                stale |= st
                real_base.append(round(sum(amt * ci["cpi"] / cb for bd, amt, cb in cpi_buys if bd <= d), 2))
            series["contributed_nominal"] = series["contributed"]
            series["contributed"] = real_base
            f["inflation_matched_cost"] = real_base[-1]
            f["real_return_pct"] = (vals[-1] / real_base[-1] - 1) * 100
            f["cpi_start_month"], f["cpi_end_month"] = c0["month"], cpi_lookup(cpi, dates[-1])[0]["month"]
            out["assumptions"].append(
                "Dashed baseline = cash invested grown with CPI (what it needed to be worth just to keep up with inflation)."
            )
            if stale:
                out["assumptions"].append("Latest CPI month is carried forward for dates after the most recent CPI release.")
            out["sources"].append(cpi["source"])
        out["series"].append(series)
        out["facts"][px["ticker"]] = f
        out["sources"].append(f"{px['ticker']}: {px['source']} ({px.get('sourceUrl') or 'file'}) retrieved {px.get('retrievedAt')}")
        out["assumptions"].append(f"{px['ticker']} prices: {px['closeBasis']}.")
        if px.get("splits"):
            sp = ", ".join(f"{s['numerator']:g}-for-{s['denominator']:g} on {s['date']}" for s in px["splits"] if dates[0] < s["date"] <= dates[-1])
            if sp:
                out["assumptions"].append(f"{px['ticker']} splits inside the period handled via split-adjusted prices: {sp}.")
        for w in px.get("warnings", []):
            out["checks"].append(f"{px['ticker']} data warning: {w}")

    divtxt = {"none": "Dividends not included (price return only).",
              "reinvest": "Dividends reinvested at the ex-date close.",
              "cash": "Dividends kept as cash (not reinvested)."}[scen.get("dividends", "none")]
    out["assumptions"] += [
        "Daily closing prices; buys executed at the close on the first trading day on/after the start date."
        if scen["mode"] != "dca" else
        f"${scen['monthly']:,} invested at the close on the first trading day of each month.",
        divtxt,
        "Fractional shares; no fees, taxes or slippage.",
        "Historical results; not a prediction of future returns.",
    ]
    for t, f in out["facts"].items():
        if f.get("intraday_high") and f["intraday_high"] > f["peak_close"] * 1.0001:
            out["assumptions"].append(
                f"{t}: chart uses closing prices; intraday high ${f['intraday_high']:,.2f} on {f['intraday_high_date']} is not shown as a close."
            )
    dst = os.path.join(base, "calc.json")
    json.dump(out, open(dst, "w"), indent=1)

    print(f"wrote {dst}  ({len(dates)} trading days {dates[0]}..{dates[-1]})")
    for t, f in out["facts"].items():
        print(f"\n[{t}]")
        for k, v in f.items():
            print(f"  {k:32s} {v:,.4f}" if isinstance(v, float) else f"  {k:32s} {v}")
    print("\nchecks:")
    for c in out["checks"]:
        print("  -", c)


if __name__ == "__main__":
    main()
