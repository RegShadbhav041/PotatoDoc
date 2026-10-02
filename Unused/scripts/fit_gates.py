"""Fit Unknown gates (entropy_max + prob_min) on a family's VAL set, method-matched
to the DEPLOYED backend (raw softmax, no temperature — app.py probs_of).
Youden J on correct-vs-incorrect separation; never touches test data.

Usage: python scripts/fit_gates.py outputs_robust
Writes: <family>/thresholds.json  (+ prints summary)
"""
import json
import math
import sys
from pathlib import Path

import numpy as np

BASE = Path("D:/Potato")
fam = BASE / (sys.argv[1] if len(sys.argv) > 1 else "outputs_robust")
d = np.load(fam / "val_probas.npz")
true = d["true"]


def softmax(z):
    z = z - z.max(1, keepdims=True)
    e = np.exp(z)
    return e / e.sum(1, keepdims=True)


members = [k[:-len("_logits")] for k in d.files if k.endswith("_logits")]
ens = np.mean([softmax(d[f"{m}_logits"]) for m in members], axis=0)
p = np.clip(ens, 1e-9, 1)
ent = (-(p * np.log(p)).sum(1)) / math.log(ens.shape[1])
mx = ens.max(1)
correct = ens.argmax(1) == true
n_err, n_ok = int((~correct).sum()), int(correct.sum())


def youden(flag_fn, grid, **kw):
    best = None
    for th in grid:
        flag = flag_fn(th)
        tpr = float((flag & ~correct).sum() / max(1, n_err))
        fpr = float((flag & correct).sum() / max(1, n_ok))
        j = tpr - fpr
        if best is None or j > best[0]:
            keep = ~flag
            best = (j, float(th), tpr, fpr, float(keep.mean()),
                    float(correct[keep].mean()) if keep.sum() else 0.0)
    return best


je, th_e, tpr_e, fpr_e, cov_e, sel_e = youden(lambda t: ent > t, np.linspace(0.1, 0.99, 90))
jp, th_p, tpr_p, fpr_p, cov_p, sel_p = youden(lambda t: mx < t, np.linspace(0.30, 0.99, 70))

out = {
    "entropy_max": round(th_e, 3),
    "prob_min": round(th_p, 3),
    "entropy_type": "normalized (H / log(4)) on RAW ensemble softmax (matches app.py)",
    "method": "Youden J on val correct-vs-incorrect separation (no temperature)",
    "fitted_on": f"robust_val (n={len(true)}, errors={n_err}) via val_probas.npz",
    "entropy_gate": {"youden_J": round(je, 4), "error_catch_rate": round(tpr_e, 4),
                     "correct_loss_rate": round(fpr_e, 4), "coverage": round(cov_e, 4),
                     "selective_accuracy": round(sel_e, 4)},
    "prob_gate": {"youden_J": round(jp, 4), "error_catch_rate": round(tpr_p, 4),
                  "correct_loss_rate": round(fpr_p, 4), "coverage": round(cov_p, 4),
                  "selective_accuracy": round(sel_p, 4)},
    "heuristic_before": {"entropy_max": 0.85, "prob_min": 0.55},
    "status": f"fitted for {fam.name}; deploy into calibration/thresholds.json to activate",
}
(fam / "thresholds.json").write_text(json.dumps(out, indent=1))
print(json.dumps(out, indent=1))
