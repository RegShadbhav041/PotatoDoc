"""Fit Unknown gate on grouped VAL only (val_probas.npz logits + calibration.json T).
Method: normalized entropy of T-scaled probs; threshold = Youden J on correct-vs-
incorrect separation; maxprob counterpart reported. Writes family-specific
outputs_irish_grouped/thresholds.json. Deployed gate (calibration/thresholds.json)
is untouched until this family ships.
Usage: python scripts/fit_threshold.py
"""
import json
import math
from pathlib import Path

import numpy as np

BASE = Path("D:/Potato")
NEW = BASE / "outputs_irish_grouped"
d = np.load(NEW / "val_probas.npz")
true = d["true"]
cal = json.loads((NEW / "calibration.json").read_text())["models"]


def softmax(z):
    z = z - z.max(1, keepdims=True)
    e = np.exp(z)
    return e / e.sum(1, keepdims=True)


scaled = {m: softmax(d[f"{m}_logits"] / cal[m]["T"]) for m in
          ("small_cnn", "mobilenetv2", "efficientnetb0")}
ens = np.mean(list(scaled.values()), axis=0)
p = np.clip(ens, 1e-9, 1)
ent = (-(p * np.log(p)).sum(1)) / math.log(4)
mx = ens.max(1)
correct = ens.argmax(1) == true

best = None
for th in np.linspace(0.1, 0.99, 90):
    flag = ent > th
    tpr = float((flag & ~correct).sum() / max(1, (~correct).sum()))  # catch errors
    fpr = float((flag & correct).sum() / max(1, correct.sum()))      # lose correct
    j = tpr - fpr
    if best is None or j > best[0]:
        keep = ent <= th
        best = (j, float(th), tpr, fpr, float(keep.mean()),
                float(correct[keep].mean()) if keep.sum() else 0.0)
j, th, tpr, fpr, cov, sel = best
out = {"entropy_max": round(th, 3), "prob_min": 0.55,
       "entropy_type": "normalized (H / log(4)) on T-scaled ensemble probs",
       "method": "Youden J on val correct-vs-incorrect separation",
       "fitted_on": "Irish_grouped_val (n=981), T from calibration.json",
       "val_youden_J": round(j, 4), "val_error_catch_rate": round(tpr, 4),
       "val_correct_loss_rate": round(fpr, 4), "val_coverage": round(cov, 4),
       "val_selective_accuracy": round(sel, 4),
       "heuristic": {"entropy_max": 0.85, "prob_min": 0.55},
       "status": "locked for outputs_irish_grouped family; swap into "
                 "calibration/thresholds.json only when this family deploys"}
(NEW / "thresholds.json").write_text(json.dumps(out, indent=1))
print(json.dumps(out, indent=1))
