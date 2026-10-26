#!/usr/bin/env python3
"""Merge verified calc.json + creative story.json into the Remotion spec.json.

Usage: build_spec.py projects/<slug>

Story text may (and should) pull numbers straight from the computed data with
tokens, so nothing is retyped by hand:
  {GME.final_value:money}          -> $412,880
  {GME.total_return_pct:pct}       -> +4,028%
  {GME@2021-01-27.close:price}     -> $86.88   (close on/near that trading day)
  {GME@2021-01-27.value:money}     -> value of the investment that day
  {GME@2020-04-03.gain_pct:pct}    -> % vs cash invested that day
  {GME.peak_date:date}             -> Jan 27, 2021
Formats: money money2 compact price pct pctabs x date month year shares num num1 int

Any literal $ / % number typed directly into the story that is not one of the
scenario inputs is reported as UNVERIFIED so it can be checked or replaced.
"""
import json
import os
import re
import sys
from datetime import date

MINUS = "\u2212"  # typographic minus
MONTHS = "Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec".split()
TOKEN = re.compile(r"\{([^{}@:]+?)(?:@(\d{4}-\d{2}-\d{2}))?\.([a-z_]+)(?::([a-z0-9]+))?\}")


def fmt(v, kind):
    if kind == "int":
        return f"{round(v):,}"
    if kind == "num1":
        return f"{v:,.1f}"
    if kind in (None, "num"):
        return f"{v:,.2f}" if isinstance(v, float) else str(v)
    if kind == "money":
        return f"{MINUS if v < 0 else ''}${abs(v):,.0f}"
    if kind == "money2" or kind == "price":
        return f"{MINUS if v < 0 else ''}${abs(v):,.2f}"
    if kind == "compact":
        a = abs(v)
        for div, suf in ((1e9, "B"), (1e6, "M"), (1e3, "K")):
            if a >= div:
                n = a / div
                return f"${n:,.1f}{suf}".replace(".0" + suf, suf)
        return f"${a:,.0f}"
    if kind in ("pct", "pctabs"):
        sign = "" if kind == "pctabs" else ("+" if v >= 0 else MINUS)
        a = abs(v)
        return f"{sign}{a:,.0f}%" if a >= 100 else f"{sign}{a:.1f}%"
    if kind == "x":
        return f"{v:,.0f}x" if v >= 100 else f"{v:.1f}x"
    if kind in ("date", "month", "year"):
        y, m, d = map(int, v.split("-"))
        return {"date": f"{MONTHS[m-1]} {d}, {y}", "month": f"{MONTHS[m-1]} {y}", "year": str(y)}[kind]
    if kind == "shares":
        return f"{v:,.2f}" if v < 100 else f"{v:,.0f}"
    raise ValueError(f"unknown format {kind}")


def nearest(dates, d):
    t = date.fromisoformat(d)
    return min(range(len(dates)), key=lambda i: abs((date.fromisoformat(dates[i]) - t).days))


def main():
    proj = sys.argv[1].rstrip("/")
    calc = json.load(open(os.path.join(proj, "calc.json")))
    story = json.load(open(os.path.join(proj, "story.json")))
    scen = calc["scenario"]
    series = {s["id"]: s for s in calc["series"]}
    raw_prices = {}
    root = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    for a in scen["assets"]:
        p = a["data"] if os.path.isabs(a["data"]) else os.path.join(root, a["data"])
        px = json.load(open(p))
        raw_prices[px["ticker"]] = {r["date"]: r for r in px["rows"]}
    notes, unverified = [], []

    def resolve(m):
        tk, at, field, kind = m.group(1), m.group(2), m.group(3), m.group(4)
        if tk not in calc["facts"]:
            raise SystemExit(f"unknown ticker in token {m.group(0)}")
        if at:
            s = series[tk]
            i = nearest(s["dates"], at)
            if s["dates"][i] != at:
                notes.append(f"token {m.group(0)}: {at} is not a trading day, used {s['dates'][i]}")
            d = s["dates"][i]
            v = {
                "close": raw_prices[tk][d]["close"],
                "value": s["values"][i],
                "contributed": s["contributed"][i],
                "gain_pct": (s["values"][i] / s["contributed"][i] - 1) * 100,
                "date": d,
            }.get(field)
            if v is None:
                raise SystemExit(f"bad at-date field in {m.group(0)}")
        else:
            v = calc["facts"][tk].get(field)
            if v is None:
                raise SystemExit(f"unknown fact {m.group(0)}; available: {sorted(calc['facts'][tk])}")
        return fmt(v, kind)

    allowed = {float(x) for x in (scen.get("amount"), scen.get("monthly"), scen.get("initial")) if x}
    allowed |= {float(date.fromisoformat(scen["start"]).year), float(date.fromisoformat(scen["end"]).year)}

    def render(text, where):
        if text is None:
            return None
        bare = TOKEN.sub("", text)
        for num in re.findall(r"\$\s?[\d,]+(?:\.\d+)?[KMB]?|[\d,]+(?:\.\d+)?\s?%|\b\d+(?:\.\d+)?x\b", bare):
            clean = float(re.sub(r"[^\d.]", "", num) or 0)
            if clean not in allowed:
                unverified.append(f"{where}: literal '{num}' is not computed — replace with a token or verify")
        return TOKEN.sub(resolve, text)

    # ---- assemble spec
    spec = {k: story[k] for k in ("durationSec", "background", "colorMode", "yScale", "dynamicY", "timing", "brand") if k in story}
    spec["slug"] = os.path.basename(proj)
    spec["hook"] = {
        "lines": [render(l, "hook") for l in story["hook"]["lines"]],
        **({"highlight": render(story["hook"]["highlight"], "hook")} if story["hook"].get("highlight") else {}),
        **({"kicker": render(story["hook"]["kicker"], "hook")} if story["hook"].get("kicker") else {}),
    }
    if story.get("counterLabel"):
        spec["counterLabel"] = render(story["counterLabel"], "counterLabel")
    spec["question"] = render(story["question"], "question")

    # series (+ downsampling that keeps every local extreme and event day)
    ids = [s["id"] for s in calc["series"]]
    dates = calc["series"][0]["dates"]
    keep = set(range(len(dates)))
    max_pts = story.get("maxPoints", 2600)
    ev_idx = [nearest(dates, e["date"]) for e in story.get("events", [])]
    if len(dates) > max_pts:
        bucket = len(dates) / (max_pts / 2)
        keep = {0, len(dates) - 1, *ev_idx}
        b = 0.0
        while b < len(dates):
            lo, hi = int(b), min(len(dates), int(b + bucket) or 1)
            for s in calc["series"]:
                seg = range(lo, max(hi, lo + 1))
                keep.add(max(seg, key=lambda i: s["values"][i]))
                keep.add(min(seg, key=lambda i: s["values"][i]))
            b += bucket
        if scen["mode"] == "dca":  # keep every contribution day so the cash line steps correctly
            c0 = calc["series"][0]["contributed"]
            keep |= {i for i in range(1, len(c0)) if c0[i] != c0[i - 1]}
        notes.append(f"downsampled {len(dates)} -> {len(keep)} real data points (bucket min/max + events kept)")
    idx = sorted(keep)
    spec["series"] = []
    for i, s in enumerate(calc["series"]):
        spec["series"].append({
            "id": s["id"], "label": s["label"], "ticker": s["ticker"], "logo": s.get("logo"),
            **({"color": story["colors"][i]} if story.get("colors") and i < len(story["colors"]) else {}),
            "dates": [s["dates"][j] for j in idx], "values": [s["values"][j] for j in idx],
            "contributed": [s["contributed"][j] for j in idx],
        })

    spec["events"] = []
    for e, ei in zip(story.get("events", []), ev_idx):
        if dates[ei] != e["date"]:
            notes.append(f"event '{e['title']}' {e['date']} snapped to trading day {dates[ei]}")
        ev = dict(e)
        ev["date"] = dates[ei]
        ev["title"] = render(e["title"], "event")
        if e.get("subtitle"):
            ev["subtitle"] = render(e["subtitle"], "event")
        if ev.get("seriesId") and ev["seriesId"] not in ids:
            raise SystemExit(f"event seriesId {ev['seriesId']} not in {ids}")
        spec["events"].append(ev)
    if [e["date"] for e in spec["events"]] != sorted(e["date"] for e in spec["events"]):
        raise SystemExit("events must be in chronological order")

    r = story["result"]
    spec["result"] = {
        **{k: r[k] for k in ("kicker", "headlineTone") if k in r},
        **({"headline": render(r["headline"], "result")} if r.get("headline") else {}),
        **({"subline": render(r["subline"], "result")} if r.get("subline") else {}),
        "stats": [{"label": render(s["label"], "stat"), "value": render(s["value"], "stat"), "tone": s.get("tone", "neutral")} for s in r.get("stats", [])],
    }

    if story.get("footnote", "auto") == "auto":
        srcs = sorted({calc_src.split(": ", 1)[1].split(" (")[0] for calc_src in calc["sources"] if ": " in calc_src})
        div = {"none": "price only, dividends excluded", "reinvest": "dividends reinvested", "cash": "dividends as cash"}[scen.get("dividends", "none")]
        how = "monthly buys at first trading day close" if scen["mode"] == "dca" else "daily closes"
        spec["footnote"] = f"Data: {', '.join(srcs)} · split-adjusted {how}, {div}. Hypothetical, not financial advice."
    else:
        spec["footnote"] = render(story["footnote"], "footnote")

    json.dump(spec, open(os.path.join(proj, "spec.json"), "w"), indent=1)
    print(f"wrote {proj}/spec.json  ({len(idx)} points, {len(spec['events'])} events, {spec.get('durationSec', 23)}s)")
    print("hook:", " / ".join(spec["hook"]["lines"]))
    for e in spec["events"]:
        print(f"event {e['date']}: {e['title']} — {e.get('subtitle', '')}")
    print("result:", spec["result"].get("headline", "(none)"), "|", spec["result"].get("subline", ""))
    for s in spec["result"]["stats"]:
        print(f"  {s['label']}: {s['value']}")
    print("question:", spec["question"])
    print("footnote:", spec["footnote"])
    for n in notes:
        print("note:", n)
    for u in unverified:
        print("UNVERIFIED:", u)
    if len(spec["footnote"]) > 170:
        print("WARNING: footnote longer than ~2 lines on screen; shorten it")


if __name__ == "__main__":
    main()
