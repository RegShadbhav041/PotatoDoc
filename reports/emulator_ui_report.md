# Emulator UI varied-test run report

Generated: 2026-09-29 18:52:00

## Summary

- rows: 5  (ok=1, failed=4, ui!=api=0, saved=0)
- history entries visible at end: 4 (saved this run=0, unknown skipped=2)
- metro-side error lines: 0
- per-status: menu_fail=3, ok=1, timeout=1

## Failed rows (status != ok)

- `11_pv_early.jpg` model=ensemble status=timeout
- `11_pv_early.jpg` model=small_cnn status=menu_fail
- `11_pv_early.jpg` model=mobilenetv2 status=menu_fail
- `11_pv_early.jpg` model=efficientnetb0 status=menu_fail

## UI vs API mismatches (uiautomator result disagrees with API truth)

- none (all OK rows matched API truth within 3% conf)

## Full rows

| file | model | expected | ui_class | ui_conf | status | saved | ui==api |
|---|---|---|---|---|---|---|---|
| 11_pv_early.jpg | ensemble | Early Blight |  |  | timeout |  | False |
| 11_pv_early.jpg | small_cnn |  |  |  | menu_fail |  |  |
| 11_pv_early.jpg | mobilenetv2 |  |  |  | menu_fail |  |  |
| 11_pv_early.jpg | efficientnetb0 |  |  |  | menu_fail |  |  |
| 01_bari_viral_leaf_roll.jpg | ensemble | Unknown | Unknown | 50.49 | ok |  | True |

## Error log

All errors/incidents this session: ``D:\Potato\reports\errors.log``

## API-only reference reports

- ``reports/varied_eval_report.md`` (221 imgs x 4 models)
- ``reports/varied_eval_analysis.md`` (P0/P1/P2 failure enlistment)
- ``reports/varied_eval_results.json`` (raw)
