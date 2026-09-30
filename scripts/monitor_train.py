"""Lightweight training monitor (CPU-only, safe to run alongside training).
Usage: python scripts/monitor_train.py [--dir outputs_irish_grouped]
Prints: process alive?, last log lines, per-model best val-F1 from history.json.
"""
import argparse
import json
import subprocess
from pathlib import Path

ap = argparse.ArgumentParser()
ap.add_argument("--dir", default="outputs_irish_grouped")
a = ap.parse_args()
out = Path("D:/Potato") / a.dir
print("== process:", "ALIVE" if "python" in subprocess.run(
    ["powershell", "-c", "Get-Process python -ErrorAction SilentlyContinue | Select-Object -ExpandProperty Id"],
    capture_output=True, text=True).stdout else "NOT FOUND")
log = out / "train.log"
if log.exists():
    print("== last lines:")
    print("\n".join(log.read_text().splitlines()[-5:]))
for mid in ("small_cnn", "mobilenetv2", "efficientnetb0"):
    h = out / mid / "history.json"
    if h.exists():
        d = json.loads(h.read_text())
        f1 = d.get("val_f1", [])
        print(f"== {mid}: epochs={len(f1)} best_valF1={max(f1) if f1 else None}")
    else:
        print(f"== {mid}: not started")
