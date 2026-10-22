"""Financial model for the video, exactly as specified in the brief.

Start at $0, end-of-month deposits, 8%/12 monthly rate, no withdrawals,
taxes/fees/inflation excluded. Returns the first whole month the balance
reaches or exceeds $100,000.
"""
import json

TARGET, RATE = 100_000, 0.08 / 12


def months_to_target(monthly):
    bal, m = 0.0, 0
    while bal < TARGET:
        bal = bal * (1 + RATE) + monthly
        m += 1
    return m, bal


if __name__ == "__main__":
    rows = []
    for c in (100, 250, 500, 1000):
        m, bal = months_to_target(c)
        rows.append({"monthly": c, "months": m, "years": round(m / 12, 4), "balance": round(bal, 2)})
        print(f"${c:>5}/mo: {m} months = {m/12:.2f} years (balance ${bal:,.2f})")
    print(json.dumps(rows))
