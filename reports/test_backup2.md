# PotatoDoc emulator UI test report

Generated: 2026-09-29 22:30:15

## Summary

- rows: 59  (ok=58, failed=1, ui!=api=0, saved=41)
- history entries visible at end: 43 (rows with saved=true: 41; recount after final report pass - first auto-count returned 9 due to a screen-transition glitch, manual top-to-bottom scan verified 43)
- metro-side error lines: 0
- per-status: menu_fail=1, ok=58

## Failed rows (status != ok)

- `D:\Potato\reports\emulator_set\27_java_bacteria.jpg` (27_java_bacteria.jpg) model=small_cnn status=menu_fail

## UI vs API mismatches (uiautomator result disagrees with API truth)

- none (all OK rows matched API truth within 3% conf)

## Full rows

| image_path | model | expected | ui_class | ui_conf | status | saved | ui==api |
|---|---|---|---|---|---|---|---|
| D:\Potato\reports\emulator_set\11_pv_early.jpg | ensemble | Early Blight | Early Blight | 88.45 | ok | True | True |
| D:\Potato\reports\emulator_set\11_pv_early.jpg | small_cnn | Early Blight | Early Blight | 90.02 | ok | True | True |
| D:\Potato\reports\emulator_set\11_pv_early.jpg | mobilenetv2 | Early Blight | Early Blight | 89.24 | ok | True | True |
| D:\Potato\reports\emulator_set\11_pv_early.jpg | efficientnetb0 | Early Blight | Early Blight | 86.11 | ok | True | True |
| D:\Potato\reports\emulator_set\01_bari_viral_leaf_roll.jpg | ensemble | Unknown | Unknown | 50.49 | ok |  | True |
| D:\Potato\reports\emulator_set\02_java_healthy.jpg | ensemble | Healthy | Late Blight | 57.91 | ok | True | True |
| D:\Potato\reports\emulator_set\03_pv_late.jpg | ensemble | Late Blight | Late Blight | 88.01 | ok | True | True |
| D:\Potato\reports\emulator_set\03_pv_late.jpg | small_cnn | Late Blight | Late Blight | 87.07 | ok | True | True |
| D:\Potato\reports\emulator_set\03_pv_late.jpg | mobilenetv2 | Late Blight | Late Blight | 90.45 | ok | True | True |
| D:\Potato\reports\emulator_set\03_pv_late.jpg | efficientnetb0 | Late Blight | Late Blight | 86.51 | ok | True | True |
| D:\Potato\reports\emulator_set\04_phone.jpg | ensemble | Unknown | Unknown | 96.26 | ok |  | True |
| D:\Potato\reports\emulator_set\05_irish_late.jpg | ensemble | Late Blight | Late Blight | 85.6 | ok | True | True |
| D:\Potato\reports\emulator_set\06_pv_healthy.jpg | ensemble | Healthy | Healthy | 90.59 | ok | True | True |
| D:\Potato\reports\emulator_set\06_pv_healthy.jpg | small_cnn | Healthy | Healthy | 90.26 | ok | True | True |
| D:\Potato\reports\emulator_set\06_pv_healthy.jpg | mobilenetv2 | Healthy | Healthy | 92.49 | ok | True | True |
| D:\Potato\reports\emulator_set\06_pv_healthy.jpg | efficientnetb0 | Healthy | Healthy | 89.02 | ok | True | True |
| D:\Potato\reports\emulator_set\07_pv_healthy.jpg | ensemble | Healthy | Healthy | 92.17 | ok | True | True |
| D:\Potato\reports\emulator_set\08_java_pest.jpg | ensemble | Unknown | Healthy | 67.53 | ok | True | True |
| D:\Potato\reports\emulator_set\09_pv_late.jpg | ensemble | Late Blight | Late Blight | 82.68 | ok | True | True |
| D:\Potato\reports\emulator_set\10_other_leaf.jpg | ensemble | Unknown | Late Blight | 63.4 | ok | True | True |
| D:\Potato\reports\emulator_set\12_bari_fungal_late_blight.jpg | ensemble | Late Blight+Unknown | Unknown | 45.53 | ok |  | True |
| D:\Potato\reports\emulator_set\13_java_virus.jpg | ensemble | Unknown | Late Blight | 79.3 | ok | True | True |
| D:\Potato\reports\emulator_set\14_bari_healthy.jpg | ensemble | Healthy | Unknown | 44.63 | ok |  | True |
| D:\Potato\reports\emulator_set\15_java_virus.jpg | ensemble | Unknown | Unknown | 45.57 | ok |  | True |
| D:\Potato\reports\emulator_set\16_pd_apple.jpg | ensemble | Unknown | Unknown | 92.34 | ok |  | True |
| D:\Potato\reports\emulator_set\17_other_crop.jpg | ensemble | Unknown | Unknown | 72.58 | ok |  | True |
| D:\Potato\reports\emulator_set\18_soil.jpg | ensemble | Unknown | Healthy | 60.6 | ok | True | True |
| D:\Potato\reports\emulator_set\18_soil.jpg | small_cnn | Unknown | Unknown | 93.37 | ok |  | True |
| D:\Potato\reports\emulator_set\18_soil.jpg | mobilenetv2 | Unknown | Healthy | 90.39 | ok | True | True |
| D:\Potato\reports\emulator_set\18_soil.jpg | efficientnetb0 | Unknown | Healthy | 88.47 | ok | True | True |
| D:\Potato\reports\emulator_set\19_soil.jpg | ensemble | Unknown | Unknown | 67.14 | ok |  | True |
| D:\Potato\reports\emulator_set\20_pd_corn.jpg | ensemble | Unknown | Unknown | 60.04 | ok |  | True |
| D:\Potato\reports\emulator_set\21_java_nematode.jpg | ensemble | Unknown | Unknown | 50.27 | ok |  | True |
| D:\Potato\reports\emulator_set\22_java_fungi.jpg | ensemble | Unknown | Late Blight | 86.41 | ok | True | True |
| D:\Potato\reports\emulator_set\22_java_fungi.jpg | small_cnn | Unknown | Late Blight | 86.39 | ok | True | True |
| D:\Potato\reports\emulator_set\22_java_fungi.jpg | mobilenetv2 | Unknown | Late Blight | 87.87 | ok | True | True |
| D:\Potato\reports\emulator_set\22_java_fungi.jpg | efficientnetb0 | Unknown | Late Blight | 84.97 | ok | True | True |
| D:\Potato\reports\emulator_set\23_pv_early.jpg | ensemble | Early Blight | Early Blight | 89.99 | ok | True | True |
| D:\Potato\reports\emulator_set\24_nonleaf_person.jpg | ensemble | Unknown | Unknown | 94.85 | ok |  | True |
| D:\Potato\reports\emulator_set\25_java_phytophthora.jpg | ensemble | Late Blight+Unknown | Late Blight | 81.84 | ok | True | True |
| D:\Potato\reports\emulator_set\26_pd_septoria.jpg | ensemble | Late Blight+Unknown | Unknown | 54.44 | ok |  | True |
| D:\Potato\reports\emulator_set\26_pd_septoria.jpg | small_cnn | Late Blight+Unknown | Late Blight | 66.68 | ok | True | True |
| D:\Potato\reports\emulator_set\26_pd_septoria.jpg | mobilenetv2 | Late Blight+Unknown | Early Blight | 62.38 | ok | True | True |
| D:\Potato\reports\emulator_set\26_pd_septoria.jpg | efficientnetb0 | Late Blight+Unknown | Early Blight | 86.36 | ok | True | True |
| D:\Potato\reports\emulator_set\27_java_bacteria.jpg | small_cnn |  |  |  | menu_fail |  |  |
| D:\Potato\reports\emulator_set\29_java_bacteria.jpg | ensemble | Unknown | Unknown | 94.59 | ok |  | True |
| D:\Potato\reports\emulator_set\30_pv_early.jpg | ensemble | Early Blight | Early Blight | 87.22 | ok | True | True |
| D:\Potato\reports\emulator_set\31_pv_late.jpg | ensemble | Late Blight | Late Blight | 83.26 | ok | True | True |
| D:\Potato\reports\emulator_set\32_bari_bacterial_soft_rot.jpg | ensemble | Unknown | Unknown | 37.59 | ok |  | True |
| D:\Potato\reports\emulator_set\33_java_fungi.jpg | ensemble | Unknown | Unknown | 47.27 | ok |  | True |
| D:\Potato\reports\emulator_set\27_java_bacteria.jpg | ensemble | Unknown | Late Blight | 79.54 | ok | True | True |
| D:\Potato\reports\emulator_set\27_java_bacteria.jpg | small_cnn | Unknown | Late Blight | 65.66 | ok | True | True |
| D:\Potato\reports\emulator_set\27_java_bacteria.jpg | mobilenetv2 | Unknown | Late Blight | 86.42 | ok | True | True |
| D:\Potato\reports\emulator_set\27_java_bacteria.jpg | efficientnetb0 | Unknown | Late Blight | 86.55 | ok | True | True |
| D:\Potato\reports\emulator_set\28_animal.jpg | ensemble | Unknown | Unknown | 98.28 | ok |  | True |
| D:\Potato\reports\emulator_set\34_irish_early.jpg | ensemble | Early Blight | Early Blight | 86.76 | ok | True | True |
| D:\Potato\reports\emulator_set\34_irish_early.jpg | small_cnn | Early Blight | Early Blight | 86.93 | ok | True | True |
| D:\Potato\reports\emulator_set\34_irish_early.jpg | mobilenetv2 | Early Blight | Early Blight | 87 | ok | True | True |
| D:\Potato\reports\emulator_set\34_irish_early.jpg | efficientnetb0 | Early Blight | Early Blight | 86.34 | ok | True | True |

## Error log

All errors/incidents this session: ``D:\Potato\reports\errors.log``

## API-only reference reports

- ``reports/varied_eval_report.md`` (221 imgs x 4 models)
- ``reports/varied_eval_analysis.md`` (P0/P1/P2 failure enlistment)
- ``reports/varied_eval_results.json`` (raw)
