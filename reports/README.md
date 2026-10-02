# Reports index — PotatoDoc

All project reports are kept separate in this folder. Start with `main_report.md`, then `TRAINING_REPORT.md` and `test.md`.

| File | What it is |
|------|------------|
| `main_report.md` | Main consolidated project report (2026-09-27) — start here |
| `TRAINING_REPORT.md` | Full training report (all model families) |
| `test.md` | Emulator UI test campaign report (58/59 pass) |
| `errors.log` | Incident log — real bugs found and fixed (kept per `.gitignore`) |
| `PV_report.md` | PlantVillage family, lab domain |
| `IR_report.md` | Irish family, field domain (deployed weights) |
| `EXT_report.md` | External + open-set evaluation (grouped weights) |
| `report.md` | Model training report — Potato Leaf Classification (PlantVillage) |
| `report_2.md` | Forward plan — full-dataset Irish training + mitigations |
| `analysis.md` | Analysis — Early vs Late Blight vs Healthy classification |
| `answer.md` | Answer bank — project Q&A (living document) |
| `explanation.md` | Line-by-line explanation of `train_image_pv.py` |
| `project.md` | Project map — files, folders, code connections |
| `deploy.md` | Backend models, sizes & free deployment notes |
| `Improved_Model_Pipeline.md` | Pipeline notes for beating 98.3% |
| `Summary.md` | Summary of the optimized-ML paper approach |
| `robust_split_report.md` | Robust split build report (EXP-ROBUST-001) |
| `external_sweep_report.md` | External sweep with retrained `outputs_robust` + deployed gates |
| `external_sweep_results.json` | Machine-readable results for the external sweep |
| `external_images_folder_results.json` | Machine-readable external-folder results |
| `emulator_ui_report.md` | Emulator UI varied-test run report |
| `emulator_ui_driver.ps1` | Driver script for the automated emulator campaign |
| `emulator_ui_results.jsonl` | Canonical 59-row emulator results |
| `varied_eval_report.md` | Varied-data evaluation report |
| `varied_eval_analysis.md` | Varied-data evaluation analysis & failure list |
| `varied_eval_results.json` | Machine-readable varied-eval results |
| `training_report_assets/` | Figures/assets for `TRAINING_REPORT.md` |
| `emulator_set/` | Emulator test image manifest |
| `Potato_Leaf_Disease_Classification_Using_Optimized.pdf` | Reference paper (PDF) |

Archived scratch (backups, metro/uvicorn logs, screenshots) lives in `../Unused/logs/reports_scratch/`.
Experiment manifests (CSV/JSON splits, metrics) live in `../Unused/root_csv_json/`.
