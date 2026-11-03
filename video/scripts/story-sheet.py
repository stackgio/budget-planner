#!/usr/bin/env python3
"""Labelled contact sheet of QC stills. Usage: story-sheet.py <qc_dir> <report.json>"""
import json
import os
import subprocess
import sys

qc, report = sys.argv[1], sys.argv[2]
names = [q[0] for q in json.load(open(report))["qc"]]
args = []
for n in names:
    args += ["-i", os.path.join(qc, f"{n}.png")]
parts = []
for i, n in enumerate(names):
    parts.append(f"[{i}:v]scale=270:480,drawtext=text='{n}':x=6:y=6:fontsize=16:fontcolor=red:box=1:boxcolor=white[v{i}]")
layout = "|".join(f"{(i % 6) * 270}_{(i // 6) * 480}" for i in range(len(names)))
graph = ";".join(parts) + ";" + "".join(f"[v{i}]" for i in range(len(names))) + f"xstack=inputs={len(names)}:layout={layout}:fill=gray[out]"
subprocess.run(["ffmpeg", "-v", "error", "-y", *args, "-filter_complex", graph, "-map", "[out]", os.path.join(qc, "contact_sheet.png")], check=True)
print("contact sheet:", os.path.join(qc, "contact_sheet.png"))
