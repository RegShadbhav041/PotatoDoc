"""Fill api_truth for every emulator_set manifest entry (all 4 models) via the running backend."""
import json, sys, time
from pathlib import Path

import requests

SET = Path("D:/Potato/reports/emulator_set")
API = "http://127.0.0.1:8000/predict"
MODELS = ["small_cnn", "mobilenetv2", "efficientnetb0", "ensemble"]

man = json.loads((SET / "manifest.json").read_text())
for m in man:
    raw = (SET / m["push_name"]).read_bytes()
    truth = {}
    for mid in MODELS:
        r = requests.post(API, params={"model_id": mid},
                          files={"file": ("t.jpg", raw, "image/jpeg")}, timeout=60)
        d = r.json()
        truth[mid] = {"pred": d["class"], "conf": round(float(d["confidence"]), 4),
                      "is_unknown": d["is_unknown"]}
    m["api_truth"] = truth
    print(f"{m['push_name']:<26} ens={truth['ensemble']['pred']:<13} "
          f"unk={truth['ensemble']['is_unknown']}")

(SET / "manifest.json").write_text(json.dumps(man, indent=1))
print("manifest updated with 4-model API truth")
