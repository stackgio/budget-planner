#!/usr/bin/env bash
# End-to-end pipeline self-test on SYNTHETIC data (lump sum, compare, DCA).
# Usage: bash scripts/selftest.sh [--full]   (--full also renders the lump-sum MP4 + QC)
set -euo pipefail
cd "$(dirname "$0")/.."
T=projects/_selftest; rm -rf "$T"; mkdir -p "$T/data"
python3 scripts/selftest/make_synthetic.py "$T/data"
for t in DEMO DEMOB; do
  python3 scripts/fetch_prices.py csv $t --file "$T/data/$t.csv" --source "SYNTHETIC TEST DATA" --close-basis synthetic --out "$T/data/$t.json" | head -1
done
mk() { mkdir -p "$T/$1"; echo "$2" > "$T/$1/scenario.json"; echo "$3" > "$T/$1/story.json"; }
mk lump '{"mode":"lump_sum","assets":[{"ticker":"DEMO","label":"Synthetic Co","data":"projects/_selftest/data/DEMO.json"}],"amount":10000,"start":"2016-01-04","end":"2026-10-23","dividends":"none"}' \
'{"durationSec":22,"hook":{"kicker":"SYNTHETIC TEST DATA","lines":["$10,000 into","a test stock","in 2016"],"highlight":"$10,000"},"counterLabel":"Test portfolio",
 "events":[{"date":"2017-09-04","title":"All-time high","subtitle":"Worth {DEMO.peak_value:money}","tone":"up","zoom":1.15},
           {"date":"2024-08-27","title":"The bottom","subtitle":"Down {DEMO.max_drawdown_pct:pctabs} from the peak","tone":"down","zoom":1.2}],
 "result":{"headline":"{DEMO.total_return_pct:pct} in {DEMO.years:int} years","headlineTone":"down","subline":"from $10,000 in {DEMO.start_date:month}",
   "stats":[{"label":"Total return","value":"{DEMO.total_return_pct:pct}","tone":"down"},{"label":"Peak value","value":"{DEMO.peak_value:money}","tone":"up"},
            {"label":"Max drawdown","value":"{DEMO.max_drawdown_pct:pct}","tone":"down"},{"label":"Per year","value":"{DEMO.cagr_pct:pct}","tone":"down"}]},
 "question":"Would you have sold at the top — or held on?","footnote":"SYNTHETIC TEST DATA — pipeline self-test only, not a real security."}'
mk cmp '{"mode":"compare","assets":[{"ticker":"DEMO","label":"Synthetic A","data":"projects/_selftest/data/DEMO.json"},{"ticker":"DEMOB","label":"Synthetic B","data":"projects/_selftest/data/DEMOB.json"}],"amount":10000,"start":"2016-01-04","end":"2026-10-23","dividends":"none"}' \
'{"durationSec":20,"colorMode":"series","hook":{"kicker":"SYNTHETIC TEST DATA","lines":["Test A vs Test B","$10,000 each"],"highlight":"Test B"},
 "events":[{"date":"2020-03-16","title":"Test event","subtitle":"B worth {DEMOB@2020-03-16.value:money}","seriesId":"DEMOB"}],
 "result":{"headline":"B ends {DEMOB.multiple:x}","stats":[{"label":"A","value":"{DEMO.final_value:money}"},{"label":"B","value":"{DEMOB.final_value:money}","tone":"up"}]},
 "question":"Which would you pick?","footnote":"SYNTHETIC TEST DATA — self-test only."}'
mk dca '{"mode":"dca","assets":[{"ticker":"DEMOB","label":"Synthetic B","data":"projects/_selftest/data/DEMOB.json"}],"monthly":100,"start":"2016-01-04","end":"2026-10-23","dividends":"none"}' \
'{"durationSec":20,"hook":{"kicker":"SYNTHETIC TEST DATA","lines":["$100 a month","into a test stock"],"highlight":"$100 a month"},"counterLabel":"Portfolio value",
 "result":{"headline":"{DEMOB.multiple:x} your money","subline":"{DEMOB.invested:money} invested","stats":[{"label":"Gain","value":"{DEMOB.gain:money}","tone":"up"},{"label":"Buys","value":"{DEMOB.num_buys:int}"}]},
 "question":"Could you stick with $100 a month?","footnote":"SYNTHETIC TEST DATA — self-test only."}'

BROWSER_FLAG=()
for c in /opt/pw-browsers/chromium_headless_shell-*/chrome-headless-shell-linux64/chrome-headless-shell; do [ -x "$c" ] && BROWSER_FLAG=(--browser-executable="$c"); done
[ -n "${REMOTION_BROWSER_EXECUTABLE:-}" ] && BROWSER_FLAG=(--browser-executable="$REMOTION_BROWSER_EXECUTABLE")
npx tsc --noEmit
for m in lump cmp dca; do
  python3 scripts/compute.py "$T/$m/scenario.json" | grep -E "OK|MISMATCH"
  python3 scripts/build_spec.py "$T/$m" | grep -E "^wrote|UNVERIFIED" || true
  for f in 0 300 590; do
    npx remotion still src/index.ts GraphVideo "$T/$m/still_$f.png" --props="$T/$m/spec.json" --frame=$f "${BROWSER_FLAG[@]}" >/dev/null
  done
  echo "stills OK: $m"
done
cp "$T/lump/spec.json" src/placeholder-spec.json
if [ "${1:-}" = "--full" ]; then
  mkdir -p projects/_selftest_full && cp "$T/lump/spec.json" projects/_selftest_full/spec.json
  bash scripts/render.sh _selftest_full && bash scripts/qc.sh _selftest_full
fi
echo "SELFTEST PASSED"
