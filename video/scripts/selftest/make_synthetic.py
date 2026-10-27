#!/usr/bin/env python3
"""Deterministic SYNTHETIC price files for pipeline self-tests. Never use for real videos."""
import datetime as dt
import math
import random
import sys

out_dir = sys.argv[1]
for name, seed, drift, vol in (("DEMO", 7, 0.0002, 0.025), ("DEMOB", 11, 0.0006, 0.015)):
    random.seed(seed)
    d, p = dt.date(2016, 1, 4), 20.0
    with open(f"{out_dir}/{name}.csv", "w") as f:
        f.write("Date,Close,High,Low\n")
        while d <= dt.date(2026, 10, 23):
            if d.weekday() < 5:
                p *= math.exp(drift + random.gauss(0, vol))
                f.write(f"{d},{p:.4f},{p*1.01:.4f},{p*0.99:.4f}\n")
            d += dt.timedelta(days=1)
