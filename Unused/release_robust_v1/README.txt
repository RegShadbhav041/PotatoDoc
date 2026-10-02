PotatoDoc robust retrain — release v1 (LOCAL ONLY, not deployed, not pushed)
Date: 2026-10-01/02 | Experiment: EXP-ROBUST-001 | Out dir: D:/Potato/outputs_robust

WHAT: all 3 models retrained 25 epochs on robust_train.csv (12,079 imgs =
combined PV+Irish 10,058 + 2,021 external: Central-Java, BARI/Ethiopia,
PlantDoc, non-leaf-v2). SHA1 dedupe vs 1,397 holdout paths: 0 leaks.

RESULTS
- External locked test (446 imgs, never trained on): EfficientNet 95.96%,
  ensemble 95.29% acc / ~0.95 weighted F1 (Late P.94/R.85, Healthy P.86/R.93,
  Non-Leaf P.97/R.97; no Early images exist externally)
- PlantVillage test regression: ensemble 100% (276/276)
- Irish grouped test regression: ensemble 98.65%
- Calibration (VAL-only T): small_cnn .55, mobilenetv2 .60, efficientnetb0 .60;
  ECE .015/.007/.006
- Best val F1: M1 ep23 .9456 / M2 ep21 .9810 / M3 ep18 .9820

CONTENTS
- weights/ : small_cnn|mobilenetv2|efficientnetb0/best.pt + labels.json
  (backend layout: copy as D:/PotatoBackend/outputs_robust/ + restart uvicorn
  with POTATO_WEIGHTS_DIR=<that dir> to deploy)
- curves/ : per-model loss + val-F1 curves (best epoch in TRAINING_REPORT.md)
- metrics/ : metrics.json (ext test) + pv/irish regression + calibration.json
  + config.json (exact train command inside)
- figures/ : confusion matrices (all 3 tests) + reliability diagrams
- reports/ : TRAINING_REPORT.md (all families incl. this one) + split report
  with leak assertions (7/7 OK)
- data/ : robust_{train,val,ext_test}.csv (exact file lists)

DEPLOY: DEFERRED 2026-10-02 by user — submission uses live outputs_combined only.
This folder moved to Unused/release_robust_v1/. To promote later:
copy weights/ as D:/PotatoBackend/outputs_robust/ + restart uvicorn
with POTATO_WEIGHTS_DIR=<that dir>, then rerun varied_eval vs 83.3% baseline.
Live server still runs outputs_combined weights.
