# Gate audit — Unknown-gate thresholds (2026-10-02)

Response to the four review concerns on the v3 gates
(`entropy_max=0.80`, `prob_min=0.55`, raw ensemble softmax).
All numbers below were recomputed from saved artifacts — no hand-waving.

Artifacts used: `Unused/outputs_archive/outputs_robust/val_probas.npz` (n=1613, per-model
logits + labels), `test_probas.npz` (n=446 external locked test), `calibration.json`
(per-model temperatures), plus live probing of the deployed backend
(`D:\PotatoBackend`, `outputs_combined` weights, gates `0.85/0.55`) on 60 ID leaves,
11 web potato photos and 1179 true-OOD images (persons/tools/hands/backgrounds).

Gate rule (both backends): reject → Unknown if `entropy > entropy_max OR maxprob < prob_min`.

## 1. "Gate is very permissive" — CONFIRMED

v3 recomputed on robust val (n=1613, acc 98.33%):

| metric | value |
|---|---|
| pass rate | 0.9919 (13 rejects: 5 errors + 8 correct) |
| P(reject \| error) | 0.1852 — 5 of 27 val errors caught |
| P(reject \| correct) | 0.0050 — 8 of 1586 correct lost |
| selective accuracy | 0.9862 |

Two sharper facts: the **entropy leg contributes nothing** on val — `maxprob < 0.55`
alone rejects the same 13 samples, so `e=0.80` is dead weight there. And 5/27 has a
wide binomial 95% CI (~6–38%): the "18.5%" headline stat is too noisy to steer by.
(The script now stores the exact Wilson CI `[0.0818, 0.367]` instead.)

Threshold attribution — read carefully, two different gates are in play, and the
difference is intentional (family-specific):
- **This file's v3 stats (`0.80/0.55`)** describe the `outputs_robust` experiment only
  (`D:\Potato\calibration\thresholds.json`, superseded backend — marked `served_by: NOT
  production`).
- **Production serves `0.85/0.55`** (`D:/PotatoBackend/calibration/thresholds.json`,
  `outputs_combined` weights) — strictly MORE permissive than v3 (a higher entropy_max
  rejects less), so every pass-through number below flatters the gate relative to v3.

Live production behavior (deployed weights + **`0.85/0.55`** — the permissive one):

| set | result |
|---|---|
| ID PlantVillage leaves (60) | 0 Unknown, 60/60 correct |
| Web potato photos (11) | 2 Unknown; 1 confident **misclassification** (`lateblt.jpg`, true late blight → Early Blight 0.79, not caught) |
| True OOD (1179) | 988 Unknown (83.8%) — **191 pass as potato (16.2%)**, 162 of them "Healthy", median conf 0.73, max 0.92 |

So the gate lets roughly 1 in 6 true-OOD images through, several with >0.90 confidence.
The concern is valid — and note the direction: these live numbers were measured under the
more permissive production gate (`0.85`), so v3 (`0.80`) would reject slightly more, at the
cost of more lost correct predictions. Neither point on this curve fixes the 1-in-6 problem.

## 2. "Tuned on tiny, different data" — CONFIRMED

History in the thresholds file tells the story: v1 Youden (`e=0.40/p=0.84`) and v2
coverage-97 (`e=0.588/p=0.697`) were val-optimal but caused mass-Unknown on web photos,
so both were abandoned for heuristic v3 (`e=0.80/p=0.55`, driven by ~11 web photos plus a
user-folder test). Val-optimal points failing in the field is textbook val↔field mismatch.

Direct evidence: on robust weights the 11 web potato photos score entropy ≈ 0.99
(near-uniform) — all rejected even under permissive v3. Curated-split val stats
(99.2% pass) do not predict field/web behavior. **Verdict: do not tune gates on val;
tune on field/web photos (see protocol below).**

## 3. "Validation stats don't reconcile" — CONFIRMED, root-caused

Three of four stored v3 numbers reproduce exactly (pass 0.9919, err-catch 0.1852,
selective 0.9862). The fourth does not:

- Stored `val_correct_rejected_rate = 0.0139` — recomputed `P(reject|correct) = 8/1586 = 0.0050`
  under every standard definition. The stored value matches no subset tried (val, test, pooled).
- With 0.0139 the implied overall accuracy is **103.4% — impossible**, exactly as the
  reviewer suspected. With the corrected 0.0050: `0.1852·(1−A) + 0.0050·A = 0.0081`
  gives **A = 98.33% = measured accuracy**. Consistent.
- Likely cause: the number was pasted from a different run/subset by hand — v3 stats live
  only in the JSON, no script produces that exact schema (`fit_gates.py`/`fit_threshold.py`
  use different key names).

**Correction applied 2026-10-02:** `D:\Potato\calibration\thresholds.json` now stores
`val_correct_rejected_rate = 0.005` with raw counts (`8/1586`, `5/27`), Wilson 95% CI
`[0.0818, 0.367]` on the error-catch rate, and a provenance note — all written by the new
`D:\Potato\scripts\gate_stats.py`, which self-checks reconcilement (fails loudly on a
repeat of this bug). The file also carries a `served_by` marker: it is NOT production;
production gates live only in `D:/PotatoBackend/calibration/thresholds.json` (verified
untouched, repo clean).

**Fix applied to process, not data:** no production file was changed by this audit
(deployed backend already runs repo gates `0.85/0.55`). Recommend correcting or
annotating the stored `0.0139` wherever it is quoted (it also still sits in
`D:\Potato\calibration\thresholds.json`, which was intentionally left untouched —
only `D:\PotatoBackend` was reverted).

## 4. "Raw softmax overconfident; temperature does more" — CONFIRMED, with a twist

| set | ensemble ECE, raw | ensemble ECE, T-scaled (T fit on val) |
|---|---|---|
| val (in-sample) | 0.098 | 0.018 |
| test n=446 (honest) | 0.109 | 0.039 |

Overconfidence confirmed; per-model T (0.55–0.60) transfers to unseen data. But the twist:
T < 1 **sharpens**, so reusing the same numeric gates on T-scaled probs catches almost
nothing (val err-catch 18.5% → 3.6%, rejects 13 → 3). **Temperature and thresholds must be
fit jointly** — fit T, then refit gates on T-scaled probs (the v1 `fit_threshold.py`
pipeline did this; v2/v3 dropped T). Note the deployed backend serves **raw** softmax,
so temperature currently does nothing at serve time.

## Coverage-vs-selective-accuracy (val, raw ensemble)

Entropy gate alone (`prob_min` off):

| ent_max | coverage | sel acc | err catch | correct loss |
|---|---|---|---|---|
| 0.90 | 1.000 | 0.983 | 0.000 | 0.000 |
| 0.85 | 0.999 | 0.983 | 0.000 | 0.001 |
| 0.80 | 0.999 | 0.983 | 0.000 | 0.001 |
| 0.70 | 0.991 | 0.986 | 0.185 | 0.006 |
| 0.60 | 0.965 | 0.990 | 0.444 | 0.028 |
| 0.50 | 0.915 | 0.995 | 0.741 | 0.074 |
| 0.40 | 0.844 | 0.997 | 0.852 | 0.144 |

Maxprob floor alone (entropy off):

| prob_min | coverage | sel acc | err catch | correct loss |
|---|---|---|---|---|
| 0.55 | 0.992 | 0.986 | 0.185 | 0.005 |
| 0.70 | 0.960 | 0.992 | 0.519 | 0.032 |
| 0.80 | 0.908 | 0.995 | 0.741 | 0.081 |
| 0.90 | 0.635 | 0.998 | 0.926 | 0.356 |

Takeaway: the operating point sits on a kink where a small move in either gate trades
~3–8% coverage for large error-catch gains. A single point hides this; ship the curve.

## Dedicated OOD signals — tested, negative result

Error-detection AUROC on val (label = ensemble wrong): entropy 0.918, 1−maxprob **0.927**,
disagreement 0.909, energy 0.913. Nothing beats maxprob; disagreement/energy add nothing
for ID errors. Worse, on the deployed family **ID-vs-OOD entropy AUROC = 0.46** — OOD
images score *lower* entropy (median 0.225) than ID leaves (0.321). Softmax confidence is
directionally wrong for novel OOD here, and ensemble disagreement won't rescue it
(0.82 even in the easy case). A dedicated signal needs OOD-aware training data or a
feature-space method, not another softmax transform. (Caveat: on robust weights the same
AUROC is ~1.0, but robust training *saw* non-leaf-v2-like images — contaminated comparison.)

## Recommended next steps

1. **Collect 100–300 labeled field/web photos** (incl. 30–50% out-of-class: people, soil,
   tools, other crops). Split 50/50 fit/test by capture session (not randomly).
2. **Fit jointly on the fit half:** temperature on NLL → gates on T-scaled probs over a
   grid → pick the point off the coverage curve, not Youden alone (Youden over-rejects
   in the field — twice bitten). Report the curve + the locked point's stats on the test half.
3. **Correct the stored `0.0139`** (true 0.0050) wherever quoted; keep stats schemas
   script-generated (`fit_gates.py` style) so hand-paste drift can't recur.
4. **Short-term production knob** (no retrain): the curve shows `prob_min 0.70` catches
   52% of val errors at 96% coverage — but validate any move on the field set from (1)
   first, because val↔field mismatch is the whole problem.

### Refit protocol (runnable once the field set exists)

```bash
# 1. manifest: CSV with columns path,true_label (labels: early_blight,late_blight,healthy,non_leaf,OOD)
#    OOD rows = out-of-class photos, counted as "should reject".
# 2. dump logits with the deployed weights (reuse ood_check.py inference loop), save field_probas.npz
# 3. split by capture session into fit/test, then:
python - <<'EOF'
import numpy as np, math, json
d = np.load('field_probas.npz')  # keys: <mid>_logits, true, split(fit/test), is_ood
# fit T per model on fit-split NLL, refit gates on T-scaled ensemble, report curve on test split
EOF
# 4. lock the chosen (T, entropy_max, prob_min) into calibration/thresholds.json via PR, restart uvicorn.
```
