#!/usr/bin/env python3
"""Fetch or import daily historical prices into a normalized JSON file.

Usage:
  fetch_prices.py yahoo  TICKER --start 2016-01-01 --end 2026-10-24 --out data/GME.json
  fetch_prices.py stooq  TICKER --start ... --end ... --out ...
  fetch_prices.py csv    TICKER --file export.csv --source "Nasdaq.com historical quotes" --out ...
  fetch_prices.py auto   TICKER --start ... --end ... --out ...     (yahoo, then stooq)
  fetch_prices.py firecrawl TICKER --file saved_result.txt [--file more.txt] --out ...
        (import Firecrawl Alexandria finance-yahoo-com/equities/history results;
         multiple files are merged, e.g. when the history was requested in chunks)
  fetch_prices.py cpi    --out data/CPI.json                          (FRED CPIAUCSL, monthly)
  fetch_prices.py cpi-csv --file CPIAUCSL.csv --out data/CPI.json

Output schema (prices):
  {ticker, source, sourceUrl, retrievedAt, closeBasis, adjcloseBasis,
   rows: [{date, open, high, low, close, adjclose}], dividends: [{date, amount}],
   splits: [{date, numerator, denominator}], warnings: [...]}

`close` is always the split-adjusted daily close (NOT dividend adjusted) when the
provider supplies it; `adjclose` is split+dividend adjusted. Every basis is
recorded so the video footnote can disclose it. Nothing is ever synthesized:
if a provider fails, the script exits non-zero.
"""
import argparse
import csv
import datetime as dt
import json
import os
import ssl
import sys
import urllib.request

UA = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36"


def http_get(url):
    ctx = ssl.create_default_context(cafile=os.environ.get("SSL_CERT_FILE") or None)
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "*/*"})
    with urllib.request.urlopen(req, timeout=30, context=ctx) as r:
        return r.read().decode("utf-8")


def to_epoch(d):
    return int(dt.datetime.strptime(d, "%Y-%m-%d").replace(tzinfo=dt.timezone.utc).timestamp())


def now_iso():
    return dt.datetime.now(dt.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def fetch_yahoo(ticker, start, end):
    p1 = to_epoch(start) - 86400 * 7
    p2 = to_epoch(end) + 86400 * 2
    url = (
        f"https://query2.finance.yahoo.com/v8/finance/chart/{ticker}"
        f"?period1={p1}&period2={p2}&interval=1d&events=div%2Csplits&includeAdjustedClose=true"
    )
    data = json.loads(http_get(url))
    res = data["chart"]["result"][0]
    off = res["meta"].get("gmtoffset", 0)
    ts = res["timestamp"]
    q = res["indicators"]["quote"][0]
    adj = res["indicators"].get("adjclose", [{}])[0].get("adjclose")
    rows = []
    for i, t in enumerate(ts):
        c = q["close"][i]
        if c is None:
            continue
        d = dt.datetime.fromtimestamp(t + off, dt.timezone.utc).strftime("%Y-%m-%d")
        rows.append(
            {
                "date": d,
                "open": q["open"][i],
                "high": q["high"][i],
                "low": q["low"][i],
                "close": c,
                "adjclose": adj[i] if adj else None,
            }
        )
    ev = res.get("events", {})
    divs = sorted(
        (
            {"date": dt.datetime.fromtimestamp(int(k) + off, dt.timezone.utc).strftime("%Y-%m-%d"), "amount": v["amount"]}
            for k, v in ev.get("dividends", {}).items()
        ),
        key=lambda x: x["date"],
    )
    splits = sorted(
        (
            {
                "date": dt.datetime.fromtimestamp(int(k) + off, dt.timezone.utc).strftime("%Y-%m-%d"),
                "numerator": v["numerator"],
                "denominator": v["denominator"],
            }
            for k, v in ev.get("splits", {}).items()
        ),
        key=lambda x: x["date"],
    )
    return {
        "source": "Yahoo Finance chart API (daily)",
        "sourceUrl": f"https://finance.yahoo.com/quote/{ticker}/history",
        "closeBasis": "split-adjusted daily close (not dividend-adjusted)",
        "adjcloseBasis": "split- and dividend-adjusted close (Yahoo methodology)",
        "rows": rows,
        "dividends": divs,
        "splits": splits,
    }


def fetch_stooq(ticker, start, end):
    sym = ticker.lower() if "." in ticker else f"{ticker.lower()}.us"
    url = f"https://stooq.com/q/d/l/?s={sym}&d1={start.replace('-', '')}&d2={end.replace('-', '')}&i=d"
    text = http_get(url)
    if not text.lower().startswith("date"):
        raise RuntimeError(f"Stooq returned no data: {text[:120]!r}")
    rows = []
    for r in csv.DictReader(text.splitlines()):
        rows.append(
            {"date": r["Date"], "open": float(r["Open"]), "high": float(r["High"]), "low": float(r["Low"]),
             "close": float(r["Close"]), "adjclose": None}
        )
    return {
        "source": "Stooq daily history",
        "sourceUrl": f"https://stooq.com/q/d/?s={sym}",
        "closeBasis": "Stooq adjusted close (split-adjusted; Stooq also adjusts for dividends — verify before using for price-only math)",
        "adjcloseBasis": None,
        "rows": rows,
        "dividends": [],
        "splits": [],
    }


def import_firecrawl(paths, ticker):
    bars, divs, splits, meta = {}, {}, {}, {}
    for path in paths:
        doc = json.load(open(path, encoding="utf-8"))
        blocks = doc.get("data", doc).get("alexandria", [doc.get("data", doc)]) if isinstance(doc, dict) else doc
        for blk in blocks:
            d = blk.get("data", blk)
            if "error" in blk and not d.get("bars"):
                raise RuntimeError(f"provider error in {path}: {blk['error']}")
            if d.get("symbol") and d["symbol"].upper() != ticker.upper():
                raise RuntimeError(f"{path} is for {d['symbol']}, not {ticker}")
            if d.get("interval") and d["interval"] != "1d":
                meta["interval"] = d["interval"]
            meta.setdefault("source_url", d.get("source_url"))
            meta.setdefault("name", d.get("name"))
            for b in d.get("bars", []):
                bars[b["date"]] = {
                    "date": b["date"], "open": b.get("open"), "high": b.get("high"), "low": b.get("low"),
                    "close": b["close"], "adjclose": b.get("adj_close"),
                    "unadjusted_close": b.get("unadjusted_close"), "split_factor": b.get("split_factor"),
                }
            for x in d.get("dividends", []):
                divs[x.get("date") or x.get("ex_date")] = {"date": x.get("date") or x.get("ex_date"), "amount": x["amount"]}
            for x in d.get("splits", []):
                splits[x["date"]] = {"date": x["date"], "numerator": x["numerator"], "denominator": x["denominator"]}
    if not bars:
        raise RuntimeError("no bars found in the provided files")
    interval = meta.get("interval", "1d")
    return {
        "source": "Yahoo Finance via Firecrawl (finance-yahoo-com/equities/history"
        + ("" if interval == "1d" else f", {interval} bars") + ")",
        "sourceUrl": meta.get("source_url") or f"https://finance.yahoo.com/quote/{ticker}/history/",
        "companyName": meta.get("name"),
        "closeBasis": "split-adjusted daily close (not dividend-adjusted)" if interval == "1d"
        else f"split-adjusted {interval} close (not dividend-adjusted)",
        "adjcloseBasis": "split- and dividend-adjusted close (Yahoo methodology)",
        "rows": [bars[k] for k in sorted(bars)],
        "dividends": [divs[k] for k in sorted(divs)],
        "splits": [splits[k] for k in sorted(splits)],
    }


def _num(s):
    s = (s or "").strip().replace("$", "").replace(",", "")
    return float(s) if s not in ("", "null", "N/A", "-") else None


def _date(s):
    s = s.strip()
    for fmt in ("%Y-%m-%d", "%m/%d/%Y", "%d/%m/%Y", "%b %d, %Y", "%Y/%m/%d"):
        try:
            return dt.datetime.strptime(s, fmt).strftime("%Y-%m-%d")
        except ValueError:
            pass
    raise ValueError(f"Unrecognized date: {s}")


def import_csv(path, source, close_basis):
    with open(path, newline="", encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)
        cols = {c.lower().strip(): c for c in reader.fieldnames}
        pick = lambda *names: next((cols[n] for n in names if n in cols), None)
        cd, cc = pick("date"), pick("close", "close/last", "price")
        ca, ch, cl, co = pick("adj close", "adj_close", "adjclose"), pick("high"), pick("low"), pick("open")
        if not cd or not cc:
            raise SystemExit(f"CSV needs Date and Close columns, found {reader.fieldnames}")
        rows = []
        for r in reader:
            c = _num(r[cc])
            if c is None:
                continue
            rows.append({
                "date": _date(r[cd]), "close": c,
                "adjclose": _num(r[ca]) if ca else None,
                "high": _num(r[ch]) if ch else None, "low": _num(r[cl]) if cl else None,
                "open": _num(r[co]) if co else None,
            })
    rows.sort(key=lambda x: x["date"])
    return {"source": source, "sourceUrl": None, "closeBasis": close_basis,
            "adjcloseBasis": "as provided in CSV" if any(r["adjclose"] for r in rows) else None,
            "rows": rows, "dividends": [], "splits": []}


def validate(out):
    w = []
    rows = out["rows"]
    if len(rows) < 20:
        raise SystemExit(f"Only {len(rows)} rows — refusing to continue.")
    seen = set()
    for i, r in enumerate(rows):
        if r["date"] in seen:
            w.append(f"duplicate date {r['date']}")
        seen.add(r["date"])
        if r["close"] is None or r["close"] <= 0:
            w.append(f"non-positive close on {r['date']}")
        if i:
            gap = (dt.date.fromisoformat(r["date"]) - dt.date.fromisoformat(rows[i - 1]["date"])).days
            if gap > 6:
                w.append(f"{gap}-day gap before {r['date']} (market closure or missing data — verify)")
            ch = r["close"] / rows[i - 1]["close"] - 1
            if abs(ch) > 0.5:
                w.append(
                    f"{ch:+.0%} one-day move on {r['date']} — confirm it is real and not an unadjusted split"
                )
    return w


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("provider", choices=["yahoo", "stooq", "auto", "csv", "firecrawl", "cpi", "cpi-csv"])
    ap.add_argument("ticker", nargs="?")
    ap.add_argument("--start")
    ap.add_argument("--end", default=dt.date.today().isoformat())
    ap.add_argument("--file", action="append")
    ap.add_argument("--source", default="User-supplied CSV")
    ap.add_argument("--close-basis", default="split-adjusted daily close (as stated by source)")
    ap.add_argument("--out", required=True)
    a = ap.parse_args()

    if a.provider in ("cpi", "cpi-csv"):
        if a.provider == "cpi":
            text = http_get("https://fred.stlouisfed.org/graph/fredgraph.csv?id=CPIAUCSL")
            src = "FRED CPIAUCSL (BLS CPI-U, seasonally adjusted)"
        else:
            text = open(a.file[0], encoding="utf-8-sig").read()
            src = a.source
        rd = csv.reader(text.splitlines())
        next(rd)
        months = [{"month": r[0][:7], "cpi": float(r[1])} for r in rd if len(r) > 1 and r[1] not in ("", ".")]
        json.dump({"source": src, "retrievedAt": now_iso(), "months": months}, open(a.out, "w"), indent=1)
        print(f"CPI: {len(months)} months, {months[0]['month']}..{months[-1]['month']} -> {a.out}")
        return

    if not a.ticker:
        raise SystemExit("ticker required")
    tried = []
    out = None
    order = {"auto": ["yahoo", "stooq"]}.get(a.provider, [a.provider])
    for prov in order:
        try:
            if prov == "yahoo":
                out = fetch_yahoo(a.ticker, a.start, a.end)
            elif prov == "stooq":
                out = fetch_stooq(a.ticker, a.start, a.end)
            elif prov == "csv":
                out = import_csv(a.file[0], a.source, a.close_basis)
            elif prov == "firecrawl":
                out = import_firecrawl(a.file, a.ticker)
            break
        except Exception as e:  # noqa: BLE001 — report and try next provider
            tried.append(f"{prov}: {type(e).__name__}: {e}")
    if out is None:
        print("NO DATA. Provider errors:\n  " + "\n  ".join(tried), file=sys.stderr)
        print(
            "Do NOT fabricate data. Use the web-research fallback in .claude/commands/graph.md "
            "or ask the user for a CSV export.",
            file=sys.stderr,
        )
        sys.exit(2)
    if a.start:
        out["rows"] = [r for r in out["rows"] if a.start <= r["date"] <= a.end]
    out["ticker"] = a.ticker.upper()
    out["retrievedAt"] = now_iso()
    out["warnings"] = validate(out)
    os.makedirs(os.path.dirname(os.path.abspath(a.out)), exist_ok=True)
    json.dump(out, open(a.out, "w"), indent=1)
    r = out["rows"]
    print(f"{out['ticker']}: {len(r)} rows {r[0]['date']}..{r[-1]['date']} from {out['source']} -> {a.out}")
    print(f"  splits: {out['splits'] or 'none reported'}; dividends: {len(out['dividends'])}")
    for w in out["warnings"]:
        print("  WARNING:", w)


if __name__ == "__main__":
    main()
