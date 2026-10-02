# PotatoDoc — full training report

Generated: 2026-10-02 00:26:16 — `python scripts/report_training.py` (idempotent; re-run after any train/retrain)

## Experiment registry (all past runs)

| exp_id | code | data split | test metrics | status |
|---|---|---|---|---|
| EXP-PV-PILOT-3CLS-30E | train_image_pv.py (3-class, ~30-epoch regime) | PlantVillage 2152, 1721/215/216, seed 42 | M1 .9907/M2 1.0/M3 1.0/Ens 1.0 | SUPERSEDED pilot; healthy=16 test only |
| EXP-PV-4CLS-16E | train_image_pv.py --epochs 16 (4-class +600 coco) | PlantVillage_train/val/test.csv 2201/275/276, seed 42 | M1 .9855/M2 1.0/M3 1.0/Ens 1.0 | FINAL lab baseline |
| EXP-IR-4CLS-25E | train_image.py --epochs 25 --resume (4-class +600 coco) | Irish_balanced_train/val/test.csv 7840/980/981, seed 42, RTX3060 | M1 .9633/M2 .9990/M3 .9990/Ens .9990 | FINAL field (deployed) |
| EXP-XDOMAIN-001 | cross-eval frozen best.pt both directions | PV test n=276; Irish test n=981 | PV->Irish ens .3721; Irish->PV ens .4783 | Symmetric collapse = shortcut learning |
| EXP-GROUPED-AUDIT-001 | make_grouped_split.py proxy-session bands | Irish_grouped_train/val/test.csv 7858/981/962, 749 groups, seed 42 | OLD random: 143/204 test groups also in train; NEW: 0 leak | P0-1; re-eval frozen weights next (no retrain) |
| EXP-UNCERT-001 | uncertainty.py Wilson+bootstrap from confusions | outputs_image/metrics.json | M2/M3/Ens acc .99898 Wilson95 [.99425,.99982] boot [.99694,1.0] | P0-2; ECE/Brier need proba dumps (P0-4) |
| EXP-FULLSPLIT-001 | scripts/build_full_splits.py proxy bands seed 42 | Irish_full_grouped_train/val/test.csv 47590/5859/5860, 1188 groups | pool 59309 (17772/20438/20499/600), 0 group leak; manifest+SHA recorded | DONE prep (report_2.md) |
| EXP-TRACKA-PLANNED | train_image.py --out-dir outputs_irish_grouped (grouped 9k retrain) | Irish_grouped_train/val/test.csv (remapped live, 7857/981/962; 34 _1->base fallbacks, 1 corrupt dropped) | DONE 2026-09-25: M1 stop (best F1 .97); M2 stop ep17 (best ep10 .9967); M3 stop ep23 (best ep16 .9966). Groupe |  |
| EXP-FROZEN-AUDIT-002 | scripts/frozen_audit.py (old outputs_image weights -> grouped test) | Irish_grouped_test.csv n=962 | OLD weights collapse: M1 .3898/M2 .3919/M3 .4023/Ens .3929 vs grouped-trained M3 .9896 — leakage proof (audit, |  |
| EXP-CALIB-001 | scripts/calibrate.py on outputs_irish_grouped/val_probas.npz (VAL only) | grouped val n=981 | T .30-.35; ECE .15-.18 -> .002-.005; Brier .009-.017; test-diagnostic ECE .145-.171 -> .007-.017 |  |
| EXP-CLOSEOUT-001 | scripts/error_review.py (12 ens errors, M3 Grad-CAM) + scripts/fit_threshold.py (Youden J on val) | grouped test n=962 / val n=981 | errors all early-blight boundary (8 E->L, 2 L->E, 2 E->H); attention lesion-localized, dew mimicry 1 case; gat |  |
| EXP-EXT-001 | scripts/fetch_mendeley.py + folder mapping (paper Table 1 counts + visual) + scripts/eval_external.py | central_java 3076 (sha-verified) + ethiopia 430 + bari-originals 84 | Java: phyto->LB 55%, bacteria->NonLeaf 93%, healthy->H 23%; Ethiopia: H 78%, LB 81%; BARI tiny but consistent; |  |
| EXP-OPENSET-001 | OI v7 subset (664/800, 429+404 losses) + WE3DS 320 (md5 ok) + PlantDoc 195 -> review_pass (1179 kept, 0 droppe | non_leaf_openset.csv locked sha 89f9f6 (590) | reject: animals/phone ~100%, crops 96%, soil 91%, leaves 72%; human visual review still open |  |
| EXP-TRACKB-DONE | train_image.py --epochs 25 --full-epochs --out-dir outputs_irish_full (47.6k) | Irish_full_grouped_*.csv (deep-cleaned, 47586/5859/5860) | M1 .9713/M2 .9927/M3 .9949/Ens .9855 (n=5860); non-leaf precision collapse (M1 .28/Ens .43, recall 1.0) from 9 |  |
| EXP-CALIB-FULL-001 | scripts/calibrate.py on outputs_irish_full/val_probas.npz | full val n=5859 | ECE .45-.47 -> .27-.34, T hit grid floor 0.2: temperature scaling INSUFFICIENT — 99x weight distorts probs; ne |  |
| EXP-COMBINED-001 | train_image.py --full-epochs --out-dir outputs_combined (PV 2201 + Irish 7857) | combined_train 10058/val 1256; Irish grouped test 962 + PV test 276 | Irish: M1 .9740/M2 .9823/M3 .9906/Ens .9875; PV: M1 .9783/M2 1.0/M3 1.0/Ens 1.0 — one family covers both domai |  |
| EXP-CORRUPT-001 | scripts/corrupt_eval.py (300 grouped-test imgs |  6 corruptions | Irish grouped subset | outputs_combined/corruption_results.json |
| EXP-EXT-COMBINED-001 | scripts/eval_external.py with outputs_combined weights | Java 3076 + eth/bari 514 + openset 590 | Ethiopia H 85% LB 100%; Java phyto->LB 76%; BARI uncertain (90-100% unk); openset animals/phone 100%, leaves 6 |  |
| EXP-VERDICT-001 | evidence review (grouped+full+external+corrupt+latency) | all metrics+audits | Deploy single M3 (combined weights); drop ensemble + M1 vote; quality gate future; segmentation not required |  |
| EXP-M1B-DONE | train_image.py m1 --drop 0.2 --m1-lr 2e-3 --oversample --loss focal --full-epochs --out-dir outputs_m1b_full | full grouped splits | M1B acc .9942 F1 .9956 MCC .9914 (non-leaf 1.00/1.00 — precision collapse FIXED); ECE .167 -> .0037 @T .35 (ca |  |
| EXP-TRACKB-PLANNED | train_image.py --out-dir outputs_irish_full (full 58k run) | Irish_full_grouped_*.csv + splits_hash_full.json | PLANNED — 40-60h full-res; use 512px mirror (~4x) or accept multi-day window |  |

## Cross-family comparison

| family | train rows | test file(s) | ens acc | ens F1 | ens MCC | best single |
|---|---|---|---|---|---|---|
| outputs_combined | 10058 | metrics.json, metrics_irish_grouped_test.json, metrics_pv_test.json | 1.0000 | 1.0000 | 1.0000 | MobileNetV2 (M2) 1.0000 |
| outputs_image | - | metrics.json | 0.9990 | 0.9992 | 0.9986 | MobileNetV2 (M2) 0.9992 |
| outputs_irish_full | 47586 | metrics.json | 0.9855 | 0.8948 | 0.9788 | EfficientNet-B0 (M3) 0.9632 |
| outputs_irish_grouped | 7857 | metrics.json | 0.9865 | 0.9889 | 0.9809 | EfficientNet-B0 (M3) 0.9914 |
| outputs_m1b_full | 47586 | metrics.json | 0.9942 | 0.9956 | 0.9914 | Small CNN (M1) 0.9956 |
| outputs_pv | - | metrics.json | 1.0000 | 1.0000 | 1.0000 | MobileNetV2 (M2) 1.0000 |
| outputs_robust | 12079 | metrics.json, metrics_irish_grouped_test.json, metrics_pv_test.json | 0.9529 | 0.6892 | 0.8678 | Small CNN (M1) 0.7399 |

---

## outputs_combined

### Run configuration

| field | value |
|---|---|
| mids | small_cnn, mobilenetv2, efficientnetb0 |
| epochs | 25 |
| batch | 32 |
| img | 224 |
| seed | 42 |
| classes_csv | early_blight, late_blight, healthy, non_leaf |
| classes_api | Early Blight, Late Blight, Healthy, Non-Leaf |
| train_csv | combined_train.csv |
| val_csv | combined_val.csv |
| test_csv | PlantVillage_test.csv |
| out_dir | outputs_combined |
| time | 2026-09-27 08:19 |

![training curves](training_report_assets/outputs_combined/curves.png)

### Test results — metrics.json

| model | acc | bal-acc | F1-macro | F1-w | MCC | per-class F1 | ROC-AUC |
|---|---|---|---|---|---|---|---|
| Small CNN (M1) | 0.9783 | 0.9817 | 0.9824 | 0.9782 | 0.9685 | Earl=0.985 Late=0.970 Heal=1.000 Non-=0.975 | 0.9992 |
| MobileNetV2 (M2) | 1.0000 | 1.0000 | 1.0000 | 1.0000 | 1.0000 | Earl=1.000 Late=1.000 Heal=1.000 Non-=1.000 | 1.0000 |
| EfficientNet-B0 (M3) | 1.0000 | 1.0000 | 1.0000 | 1.0000 | 1.0000 | Earl=1.000 Late=1.000 Heal=1.000 Non-=1.000 | 1.0000 |
| Ensemble | 1.0000 | 1.0000 | 1.0000 | 1.0000 | 1.0000 | Earl=1.000 Late=1.000 Heal=1.000 Non-=1.000 | 1.0000 |

![confusions](training_report_assets/outputs_combined/confusion_test.png)

### Test results — metrics_irish_grouped_test.json

| model | acc | bal-acc | F1-macro | F1-w | MCC | per-class F1 | ROC-AUC |
|---|---|---|---|---|---|---|---|
| Small CNN (M1) | 0.9740 | 0.9752 | 0.9771 | 0.9740 | 0.9630 | Earl=0.966 Late=0.960 Heal=0.991 Non-=0.992 | 0.9965 |
| MobileNetV2 (M2) | 0.9823 | 0.9854 | 0.9855 | 0.9823 | 0.9749 | Earl=0.975 Late=0.973 Heal=0.994 Non-=1.000 | 0.9989 |
| EfficientNet-B0 (M3) | 0.9906 | 0.9922 | 0.9923 | 0.9906 | 0.9867 | Earl=0.984 Late=0.988 Heal=0.997 Non-=1.000 | 0.9966 |
| Ensemble | 0.9875 | 0.9896 | 0.9898 | 0.9875 | 0.9823 | Earl=0.980 Late=0.983 Heal=0.995 Non-=1.000 | 0.9983 |

![confusions](training_report_assets/outputs_combined/confusion_test_irish_grouped_test.png)

### Test results — metrics_pv_test.json

| model | acc | bal-acc | F1-macro | F1-w | MCC | per-class F1 | ROC-AUC |
|---|---|---|---|---|---|---|---|
| Small CNN (M1) | 0.9783 | 0.9817 | 0.9824 | 0.9782 | 0.9685 | Earl=0.985 Late=0.970 Heal=1.000 Non-=0.975 | 0.9992 |
| MobileNetV2 (M2) | 1.0000 | 1.0000 | 1.0000 | 1.0000 | 1.0000 | Earl=1.000 Late=1.000 Heal=1.000 Non-=1.000 | 1.0000 |
| EfficientNet-B0 (M3) | 1.0000 | 1.0000 | 1.0000 | 1.0000 | 1.0000 | Earl=1.000 Late=1.000 Heal=1.000 Non-=1.000 | 1.0000 |
| Ensemble | 1.0000 | 1.0000 | 1.0000 | 1.0000 | 1.0000 | Earl=1.000 Late=1.000 Heal=1.000 Non-=1.000 | 1.0000 |

![confusions](training_report_assets/outputs_combined/confusion_test_pv_test.png)

### Reliability (from saved probas)

![reliability test](training_report_assets/outputs_combined/reliability_test.png)
![reliability val](training_report_assets/outputs_combined/reliability_val.png)

---

## outputs_image

### Run configuration

| field | value |
|---|---|
| mids | small_cnn, mobilenetv2, efficientnetb0 |
| epochs | 25 |
| batch | 32 |
| img | 224 |
| seed | 42 |
| classes_csv | early_blight, late_blight, healthy, non_leaf |
| classes_api | Early Blight, Late Blight, Healthy, Non-Leaf |
| time | 2026-09-25 07:50 |

![training curves](training_report_assets/outputs_image/curves.png)

### Test results — metrics.json

| model | acc | bal-acc | F1-macro | F1-w | MCC | per-class F1 | ROC-AUC |
|---|---|---|---|---|---|---|---|
| Small CNN (M1) | 0.9633 | 0.9573 | 0.9604 | 0.9633 | 0.9480 | Earl=0.957 Late=0.970 Heal=0.965 Non-=0.949 | 0.9965 |
| MobileNetV2 (M2) | 0.9990 | 0.9992 | 0.9992 | 0.9990 | 0.9986 | Earl=0.998 Late=0.998 Heal=1.000 Non-=1.000 | 1.0000 |
| EfficientNet-B0 (M3) | 0.9990 | 0.9992 | 0.9992 | 0.9990 | 0.9986 | Earl=0.998 Late=0.998 Heal=1.000 Non-=1.000 | 1.0000 |
| Ensemble | 0.9990 | 0.9992 | 0.9992 | 0.9990 | 0.9986 | Earl=0.998 Late=0.998 Heal=1.000 Non-=1.000 | 1.0000 |

![confusions](training_report_assets/outputs_image/confusion_test.png)

---

## outputs_irish_full

### Run configuration

| field | value |
|---|---|
| mids | small_cnn, mobilenetv2, efficientnetb0 |
| epochs | 25 |
| batch | 32 |
| img | 224 |
| seed | 42 |
| classes_csv | early_blight, late_blight, healthy, non_leaf |
| classes_api | Early Blight, Late Blight, Healthy, Non-Leaf |
| train_csv | Irish_full_grouped_train.csv |
| val_csv | Irish_full_grouped_val.csv |
| test_csv | Irish_full_grouped_test.csv |
| out_dir | outputs_irish_full |
| time | 2026-09-26 10:19 |

![training curves](training_report_assets/outputs_irish_full/curves.png)

### Test results — metrics.json

| model | acc | bal-acc | F1-macro | F1-w | MCC | per-class F1 | ROC-AUC |
|---|---|---|---|---|---|---|---|
| Small CNN (M1) | 0.9713 | 0.9783 | 0.8462 | 0.9788 | 0.9587 | Earl=0.985 Late=0.980 Heal=0.989 Non-=0.432 | 0.9995 |
| MobileNetV2 (M2) | 0.9927 | 0.9944 | 0.9402 | 0.9933 | 0.9892 | Earl=0.994 Late=0.994 Heal=0.999 Non-=0.774 | 0.9994 |
| EfficientNet-B0 (M3) | 0.9949 | 0.9962 | 0.9632 | 0.9951 | 0.9924 | Earl=0.998 Late=0.992 Heal=1.000 Non-=0.863 | 0.9996 |
| Ensemble | 0.9855 | 0.9890 | 0.8948 | 0.9881 | 0.9788 | Earl=0.991 Late=0.987 Heal=0.997 Non-=0.603 | 0.9996 |

![confusions](training_report_assets/outputs_irish_full/confusion_test.png)

### Calibration (temperature scaling, fitted on VAL only)

| model | T | ECE before | ECE after | Brier after |
|---|---|---|---|---|
| Small CNN (M1) | 0.20 | 0.4532 | 0.3336 | 0.2878 |
| MobileNetV2 (M2) | 0.20 | 0.4495 | 0.2653 | 0.1667 |
| EfficientNet-B0 (M3) | 0.20 | 0.4704 | 0.3398 | 0.2664 |

### Reliability (from saved probas)

![reliability test](training_report_assets/outputs_irish_full/reliability_test.png)
![reliability val](training_report_assets/outputs_irish_full/reliability_val.png)

---

## outputs_irish_grouped

### Run configuration

| field | value |
|---|---|
| mids | small_cnn, mobilenetv2, efficientnetb0 |
| epochs | 25 |
| batch | 32 |
| img | 224 |
| seed | 42 |
| classes_csv | early_blight, late_blight, healthy, non_leaf |
| classes_api | Early Blight, Late Blight, Healthy, Non-Leaf |
| train_csv | Irish_grouped_train.csv |
| val_csv | Irish_grouped_val.csv |
| test_csv | Irish_grouped_test.csv |
| out_dir | outputs_irish_grouped |
| time | 2026-09-25 20:17 |

![training curves](training_report_assets/outputs_irish_grouped/curves.png)

### Test results — metrics.json

| model | acc | bal-acc | F1-macro | F1-w | MCC | per-class F1 | ROC-AUC |
|---|---|---|---|---|---|---|---|
| Small CNN (M1) | 0.9678 | 0.9731 | 0.9737 | 0.9678 | 0.9547 | Earl=0.956 Late=0.951 Heal=0.988 Non-=1.000 | 0.9968 |
| MobileNetV2 (M2) | 0.9854 | 0.9878 | 0.9881 | 0.9854 | 0.9794 | Earl=0.977 Late=0.980 Heal=0.995 Non-=1.000 | 0.9975 |
| EfficientNet-B0 (M3) | 0.9896 | 0.9913 | 0.9914 | 0.9896 | 0.9852 | Earl=0.982 Late=0.987 Heal=0.997 Non-=1.000 | 0.9980 |
| Ensemble | 0.9865 | 0.9886 | 0.9889 | 0.9864 | 0.9809 | Earl=0.977 Late=0.982 Heal=0.997 Non-=1.000 | 0.9984 |

![confusions](training_report_assets/outputs_irish_grouped/confusion_test.png)

### Calibration (temperature scaling, fitted on VAL only)

| model | T | ECE before | ECE after | Brier after |
|---|---|---|---|---|
| Small CNN (M1) | 0.35 | 0.1768 | 0.0049 | 0.0174 |
| MobileNetV2 (M2) | 0.30 | 0.1569 | 0.0037 | 0.0094 |
| EfficientNet-B0 (M3) | 0.35 | 0.1505 | 0.0024 | 0.0087 |

### Reliability (from saved probas)

![reliability test](training_report_assets/outputs_irish_grouped/reliability_test.png)
![reliability val](training_report_assets/outputs_irish_grouped/reliability_val.png)

---

## outputs_m1b_full

### Run configuration

| field | value |
|---|---|
| mids | small_cnn |
| epochs | 25 |
| batch | 32 |
| img | 224 |
| seed | 42 |
| classes_csv | early_blight, late_blight, healthy, non_leaf |
| classes_api | Early Blight, Late Blight, Healthy, Non-Leaf |
| train_csv | Irish_full_grouped_train.csv |
| val_csv | Irish_full_grouped_val.csv |
| test_csv | Irish_full_grouped_test.csv |
| out_dir | outputs_m1b_full |
| oversample | True |
| loss | focal |
| drop | 0.2 |
| m1_lr | 0.002 |
| full_epochs | True |
| time | 2026-09-27 09:05 |

![training curves](training_report_assets/outputs_m1b_full/curves.png)

### Test results — metrics.json

| model | acc | bal-acc | F1-macro | F1-w | MCC | per-class F1 | ROC-AUC |
|---|---|---|---|---|---|---|---|
| Small CNN (M1) | 0.9942 | 0.9955 | 0.9956 | 0.9942 | 0.9914 | Earl=0.992 Late=0.991 Heal=0.998 Non-=1.000 | 0.9997 |
| Ensemble | 0.9942 | 0.9955 | 0.9956 | 0.9942 | 0.9914 | Earl=0.992 Late=0.991 Heal=0.998 Non-=1.000 | 0.9997 |

![confusions](training_report_assets/outputs_m1b_full/confusion_test.png)

### Calibration (temperature scaling, fitted on VAL only)

| model | T | ECE before | ECE after | Brier after |
|---|---|---|---|---|
| Small CNN (M1) | 0.35 | 0.1670 | 0.0037 | 0.0124 |

### Reliability (from saved probas)

![reliability test](training_report_assets/outputs_m1b_full/reliability_test.png)
![reliability val](training_report_assets/outputs_m1b_full/reliability_val.png)

---

## outputs_pv

### Run configuration

| field | value |
|---|---|
| mids | small_cnn, mobilenetv2, efficientnetb0 |
| epochs | 16 |
| batch | 32 |
| img | 224 |
| seed | 42 |
| classes_csv | early_blight, late_blight, healthy, non_leaf |
| classes_api | Early Blight, Late Blight, Healthy, Non-Leaf |
| early_stop | val macro-F1 patience 8 |
| resume | False |
| time | 2026-09-24 00:20 |

![training curves](training_report_assets/outputs_pv/curves.png)

### Test results — metrics.json

| model | acc | bal-acc | F1-macro | F1-w | MCC | per-class F1 | ROC-AUC |
|---|---|---|---|---|---|---|---|
| Small CNN (M1) | 0.9855 | 0.9883 | 0.9828 | 0.9855 | 0.9791 | Earl=0.985 Late=0.985 Heal=0.970 Non-=0.992 | 0.9999 |
| MobileNetV2 (M2) | 1.0000 | 1.0000 | 1.0000 | 1.0000 | 1.0000 | Earl=1.000 Late=1.000 Heal=1.000 Non-=1.000 | 1.0000 |
| EfficientNet-B0 (M3) | 1.0000 | 1.0000 | 1.0000 | 1.0000 | 1.0000 | Earl=1.000 Late=1.000 Heal=1.000 Non-=1.000 | 1.0000 |
| Ensemble | 1.0000 | 1.0000 | 1.0000 | 1.0000 | 1.0000 | Earl=1.000 Late=1.000 Heal=1.000 Non-=1.000 | 1.0000 |

![confusions](training_report_assets/outputs_pv/confusion_test.png)

---

## outputs_robust

### Run configuration

| field | value |
|---|---|
| mids | small_cnn, mobilenetv2, efficientnetb0 |
| epochs | 25 |
| batch | 64 |
| img | 224 |
| seed | 42 |
| classes_csv | early_blight, late_blight, healthy, non_leaf |
| classes_api | Early Blight, Late Blight, Healthy, Non-Leaf |
| train_csv | robust_train.csv |
| val_csv | robust_val.csv |
| test_csv | Irish_grouped_test.csv |
| out_dir | outputs_robust |
| oversample | False |
| loss | ce |
| drop | 0.4 |
| m1_lr | 0.001 |
| full_epochs | False |
| time | 2026-10-02 00:17 |

![training curves](training_report_assets/outputs_robust/curves.png)

### Test results — metrics.json

| model | acc | bal-acc | F1-macro | F1-w | MCC | per-class F1 | ROC-AUC |
|---|---|---|---|---|---|---|---|
| Small CNN (M1) | 0.8700 | 0.7316 | 0.7399 | 0.8682 | 0.6265 | Earl=0.000 Late=0.575 Heal=0.721 Non-=0.924 | {} |
| MobileNetV2 (M2) | 0.9350 | 0.8938 | 0.6660 | 0.9374 | 0.8209 | Earl=0.000 Late=0.821 Heal=0.885 Non-=0.959 | {} |
| EfficientNet-B0 (M3) | 0.9596 | 0.9474 | 0.7016 | 0.9622 | 0.8911 | Earl=0.000 Late=0.909 Heal=0.923 Non-=0.974 | {} |
| Ensemble | 0.9529 | 0.9141 | 0.6892 | 0.9540 | 0.8678 | Earl=0.000 Late=0.892 Heal=0.895 Non-=0.970 | {} |

![confusions](training_report_assets/outputs_robust/confusion_test.png)

### Test results — metrics_irish_grouped_test.json

| model | acc | bal-acc | F1-macro | F1-w | MCC | per-class F1 | ROC-AUC |
|---|---|---|---|---|---|---|---|
| Small CNN (M1) | 0.9771 | 0.9813 | 0.9707 | 0.9772 | 0.9677 | Earl=0.982 Late=0.971 Heal=0.985 Non-=0.945 | 0.9968 |
| MobileNetV2 (M2) | 0.9875 | 0.9895 | 0.9898 | 0.9875 | 0.9824 | Earl=0.980 Late=0.982 Heal=0.997 Non-=1.000 | 0.9971 |
| EfficientNet-B0 (M3) | 0.9865 | 0.9887 | 0.9889 | 0.9865 | 0.9808 | Earl=0.977 Late=0.982 Heal=0.997 Non-=1.000 | 0.9983 |
| Ensemble | 0.9865 | 0.9887 | 0.9889 | 0.9865 | 0.9808 | Earl=0.978 Late=0.982 Heal=0.995 Non-=1.000 | 0.9987 |

![confusions](training_report_assets/outputs_robust/confusion_test_irish_grouped_test.png)

### Test results — metrics_pv_test.json

| model | acc | bal-acc | F1-macro | F1-w | MCC | per-class F1 | ROC-AUC |
|---|---|---|---|---|---|---|---|
| Small CNN (M1) | 0.9928 | 0.9950 | 0.9878 | 0.9928 | 0.9895 | Earl=1.000 Late=0.990 Heal=0.970 Non-=0.992 | 0.9999 |
| MobileNetV2 (M2) | 1.0000 | 1.0000 | 1.0000 | 1.0000 | 1.0000 | Earl=1.000 Late=1.000 Heal=1.000 Non-=1.000 | 1.0000 |
| EfficientNet-B0 (M3) | 1.0000 | 1.0000 | 1.0000 | 1.0000 | 1.0000 | Earl=1.000 Late=1.000 Heal=1.000 Non-=1.000 | 1.0000 |
| Ensemble | 1.0000 | 1.0000 | 1.0000 | 1.0000 | 1.0000 | Earl=1.000 Late=1.000 Heal=1.000 Non-=1.000 | 1.0000 |

![confusions](training_report_assets/outputs_robust/confusion_test_pv_test.png)

### Calibration (temperature scaling, fitted on VAL only)

| model | T | ECE before | ECE after | Brier after |
|---|---|---|---|---|
| Small CNN (M1) | 0.55 | 0.0965 | 0.0152 | 0.0813 |
| MobileNetV2 (M2) | 0.60 | 0.0683 | 0.0074 | 0.0341 |
| EfficientNet-B0 (M3) | 0.60 | 0.0751 | 0.0058 | 0.0309 |

### Reliability (from saved probas)

![reliability test](training_report_assets/outputs_robust/reliability_test.png)
![reliability val](training_report_assets/outputs_robust/reliability_val.png)

## Latest external robustness evaluation (`varied_eval`, fixed seed holdout)

_seed=42, images=221, predictions=884_

### Overall (expected-set accuracy)

| model | correct | total | accuracy |
|---|---|---|---|
| EfficientNet-B0 (M3) | 169 | 221 | 76.5% |
| Ensemble | 184 | 221 | 83.3% |
| MobileNetV2 (M2) | 165 | 221 | 74.7% |
| Small CNN (M1) | 133 | 221 | 60.2% |

### Per-source × model

| source | n | Small CNN (M1) | MobileNetV2 (M2) | EfficientNet-B0 (M3) | Ensemble |
|---|---|---|---|---|---|
| ext_central_java | 42 | 62% | 62% | 52% | 71% |
| ext_ethiopia_bari | 44 | 30% | 55% | 61% | 80% |
| irish_test | 20 | 95% | 95% | 95% | 95% |
| non_leaf_v2/animals_people | 5 | 100% | 100% | 100% | 100% |
| non_leaf_v2/other_crops | 5 | 100% | 100% | 100% | 100% |
| non_leaf_v2/other_leaves | 5 | 60% | 100% | 80% | 100% |
| non_leaf_v2/phone_random | 5 | 80% | 100% | 100% | 100% |
| non_leaf_v2/soil_ground | 5 | 80% | 20% | 40% | 40% |
| plantdoc_other_crops | 52 | 52% | 85% | 81% | 90% |
| plantvillage_test | 20 | 90% | 100% | 100% | 100% |
| synthetic_blur | 6 | 17% | 17% | 100% | 17% |
| synthetic_dark | 6 | 83% | 100% | 100% | 100% |
| synthetic_overexposed | 6 | 50% | 67% | 100% | 67% |

![varied failures](training_report_assets/_varied/failures.png)

---

**Regenerate:** `python D:\Potato\scripts\report_training.py` — assets under `reports/training_report_assets/`.
