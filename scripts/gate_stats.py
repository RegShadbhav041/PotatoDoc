"""Recompute Unknown-gate stats from saved ensemble predictions — never hand-paste rates.

Rule (matches backend app.py): reject -> Unknown if
    normalized_entropy(probs) > e_max OR max(probs) < p_min.

Rates alone can't be verified, so this script stores raw counts alongside every
rate, adds a Wilson 95% CI on the error-catch rate (val error counts are small),
and self-checks that the stats imply the measured accuracy. The check fails
loudly on the class of bug that once stored an impossible 0.0139 here
(implied accuracy 103.4%; true value 0.0050).

Usage:
    # dry-run (default): print recomputed stats, touch nothing
    python scripts/gate_stats.py <val_probas.npz> --e-max 0.8 --p-min 0.55
    # preview what --update would change (diff old -> new), still writes nothing
    python scripts/gate_stats.py <val_probas.npz> --e-max 0.8 --p-min 0.55 --update calibration/thresholds.json
    # actually write (only after the reconcile assert passes; atomic temp+rename)
    python scripts/gate_stats.py <val_probas.npz> --e-max 0.8 --p-min 0.55 --update calibration/thresholds.json --force

val_probas.npz holds per-model logits as <member>_logits plus `true` labels
(falls back to <member>_proba if logits are absent). Ensemble = mean of member
softmax (RAW, no temperature — matches app.py probs_of). Temperature and gates
must be fit jointly on field-like data; see reports/gate_audit.md.
"""
import argparse
import json
import math
import os
import tempfile
from pathlib import Path

import numpy as np

# Keys this script owns inside a thresholds.json. --update merges exactly these;
# everything else (method, entropy_type, history, status, served_by, ...) is
# preserved byte-for-byte. If a key below is missing from the file it is added;
# no existing key outside this set is ever touched or deleted.
OWNED_KEYS = (
    "entropy_max",
    "prob_min",
    "val_n",
    "val_n_correct",
    "val_n_error",
    "val_pass_rate",
    "val_correct_rejected_rate",
    "val_correct_rejected_counts",
    "val_error_caught_rate",
    "val_error_caught_counts",
    "val_error_caught_ci95",
    "val_selective_accuracy",
    "stats_provenance",
)


def softmax(z):
    z = z - z.max(1, keepdims=True)
    e = np.exp(z)
    return e / e.sum(1, keepdims=True)


def wilson(k, n, z=1.96):
    """Wilson 95% CI for k/n. Returns (lo, hi)."""
    if n == 0:
        return (0.0, 0.0)
    p = k / n
    den = 1 + z * z / n
    center = (p + z * z / (2 * n)) / den
    half = z * math.sqrt(p * (1 - p) / n + z * z / (4 * n * n)) / den
    return (round(max(0.0, center - half), 4), round(min(1.0, center + half), 4))


def gate_stats(probs, labels, e_max, p_min):
    # probs: (N,C) raw ensemble softmax, labels: (N,)
    pred = probs.argmax(1)
    correct = pred == labels
    p_top = probs.max(1)
    pc = np.clip(probs, 1e-12, 1)
    H = -(pc * np.log(pc)).sum(1) / math.log(probs.shape[1])
    passed = (H <= e_max) & (p_top >= p_min)
    n, nc, ne = len(labels), int(correct.sum()), int((~correct).sum())
    n_rej_err = int((~correct & ~passed).sum())
    n_rej_ok = int((correct & ~passed).sum())
    s = {
        "val_n": n,
        "val_n_correct": nc,
        "val_n_error": ne,
        "val_pass_rate": round(float(passed.mean()), 4),
        "val_correct_rejected_rate": round(n_rej_ok / nc, 4),
        "val_correct_rejected_counts": f"{n_rej_ok}/{nc}",
        "val_error_caught_rate": round(n_rej_err / ne, 4),
        "val_error_caught_counts": f"{n_rej_err}/{ne}",
        "val_error_caught_ci95": list(wilson(n_rej_err, ne)),
        "val_selective_accuracy": round(float(correct[passed].mean()), 4),
    }
    # self-check: stats must imply the measured accuracy
    implied = (s["val_selective_accuracy"] * int(passed.sum()) + n_rej_ok) / n
    assert abs(implied - float(correct.mean())) < 1e-3, (
        f"stats don't reconcile: implied acc {implied:.4f} vs "
        f"measured {float(correct.mean()):.4f}"
    )
    return s


def load_ensemble(npz_path):
    d = np.load(npz_path)
    logit_keys = [k for k in d.files if k.endswith("_logits")]
    if logit_keys:
        members = [k[: -len("_logits")] for k in logit_keys]
        probs = np.mean(
            [softmax(d[f"{m}_logits"].astype(np.float64)) for m in members], axis=0
        )
    else:
        prob_keys = [k for k in d.files if k.endswith("_proba")]
        if not prob_keys:
            raise KeyError(f"{npz_path}: no *_logits or *_proba arrays")
        members = [k[: -len("_proba")] for k in prob_keys]
        probs = np.mean([d[k].astype(np.float64) for k in prob_keys], axis=0)
    return probs, d["true"], members


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("npz", help="val_probas.npz with <member>_logits (or _proba) + true")
    ap.add_argument("--e-max", type=float, required=True)
    ap.add_argument("--p-min", type=float, required=True)
    ap.add_argument("--update", help="thresholds.json to update (needs --force to write)")
    ap.add_argument("--force", action="store_true", help="actually write --update target")
    ap.add_argument("--provenance", default=None,
                    help="override stats_provenance string (default: script-generated note)")
    args = ap.parse_args()

    probs, labels, members = load_ensemble(args.npz)
    print(f"members={members} n={len(labels)}", flush=True)
    # Reconcile assert runs here, BEFORE any file is touched: a bad stats
    # computation can never reach the output file.
    s = gate_stats(probs, labels, args.e_max, args.p_min)
    new_doc = {"entropy_max": args.e_max, "prob_min": args.p_min, **s}
    print(json.dumps(new_doc, indent=1))

    if not args.update:
        print("dry-run: no file written (pass --update <file> to preview, + --force to write)")
        return

    p = Path(args.update)
    old = json.loads(p.read_text())
    provenance = args.provenance or (
        "recomputed from predictions by scripts/gate_stats.py "
        "(counts + Wilson CI + reconcile self-check); "
        "previous val_correct_rejected_rate 0.0139 was a hand-pasted error, "
        "corrected 2026-10-02 -- see reports/gate_audit.md"
    )
    merged = dict(old)
    for k in OWNED_KEYS:
        if k == "stats_provenance":
            merged[k] = provenance
        else:
            merged[k] = new_doc[k]
    print(f"--- diff {p} (old -> new), {len(OWNED_KEYS)} owned keys ---")
    changed = False
    for k in OWNED_KEYS:
        ov, nv = old.get(k, "<absent>"), merged[k]
        flag = "" if ov == nv else "  <-- CHANGES"
        if ov != nv:
            changed = True
        print(f"  {k}: {ov!r} -> {nv!r}{flag}")
    untouched = [k for k in old if k not in OWNED_KEYS]
    print(f"preserved untouched keys ({len(untouched)}): {untouched}")
    if not args.force:
        print("dry-run: file NOT written (add --force to write)")
        return
    if not changed:
        print("no changes vs file; nothing to write")
        return
    # Atomic write: temp file in same dir + os.replace, so a crash or a late
    # assert can never leave a half-written thresholds.json.
    fd, tmp = tempfile.mkstemp(dir=str(p.parent), prefix=p.stem + ".", suffix=".tmp")
    try:
        with os.fdopen(fd, "w") as f:
            f.write(json.dumps(merged, indent=1) + "\n")
        os.replace(tmp, p)
    except BaseException:
        try:
            os.unlink(tmp)
        except OSError:
            pass
        raise
    print(f"updated {p} (merged {len(OWNED_KEYS)} owned keys, rest preserved)")


if __name__ == "__main__":
    main()
