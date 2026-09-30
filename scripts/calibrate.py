"""Calibration + OOD utilities (W4). Fits temperature T and Unknown threshold on VAL probas only.
Usage: python scripts/calibrate.py --probas val_probas.npz  (keys: <model>_logits, true)
Outputs: calibration/calibration.json (T, ECE before/after, Brier, threshold).
Test-set evaluation must reuse the LOCKED threshold without refitting.
"""
import argparse, json
from pathlib import Path
import numpy as np

def softmax(z):
    z = z - z.max(1, keepdims=True)
    e = np.exp(z)
    return e / e.sum(1, keepdims=True)

def ece(probs, true, n_bins=15):
    conf = probs.max(1); pred = probs.argmax(1); acc = (pred == true)
    edges = np.linspace(0, 1, n_bins + 1); out = 0.0
    for i in range(n_bins):
        m = (conf > edges[i]) & (conf <= edges[i + 1])
        if m.sum():
            out += m.mean() * abs(acc[m].mean() - conf[m].mean())
    return float(out)

def brier(probs, true):
    oh = np.zeros_like(probs); oh[np.arange(len(true)), true] = 1
    return float(((probs - oh) ** 2).sum(1).mean())

def fit_temperature(logits, true):
    best_t, best_ll = 1.0, 1e18
    for t in np.linspace(0.2, 5.0, 97):
        p = softmax(logits / t)
        ll = -np.log(np.clip(p[np.arange(len(true)), true], 1e-12, 1)).mean()
        if ll < best_ll:
            best_ll, best_t = ll, float(t)
    return best_t

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--probas", required=True, help="npz with <model>_logits + true (VAL set)")
    ap.add_argument("--out", default="D:/Potato/calibration/calibration.json")
    a = ap.parse_args()
    d = np.load(a.probas)
    true = d["true"]
    res = {"fitted_on": "VAL only", "models": {}}
    for k in d.files:
        if k == "true" or not k.endswith("_logits"):
            continue
        name = k[:-len("_logits")]
        logits = d[k]
        t = fit_temperature(logits, true)
        p0, p1 = softmax(logits), softmax(logits / t)
        res["models"][name] = {"T": t, "ece_before": ece(p0, true),
                               "ece_after": ece(p1, true), "brier_after": brier(p1, true)}
    Path(a.out).parent.mkdir(parents=True, exist_ok=True)
    Path(a.out).write_text(json.dumps(res, indent=1))
    print(json.dumps(res, indent=1))

if __name__ == "__main__":
    main()
