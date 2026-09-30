# Varied-data evaluation report

- images: 221 (seed 42)
- models: small_cnn, mobilenetv2, efficientnetb0, ensemble
- requests ok: 884/884

## Accuracy by model

| model | correct | total | accuracy |
|---|---|---|---|
| Small CNN | 133 | 221 | 60.2% |
| MobileNetV2 | 165 | 221 | 74.7% |
| EfficientNetB0 | 169 | 221 | 76.5% |
| Ensemble | 184 | 221 | 83.3% |

## Accuracy by source x model

| source | n | Small CNN | MobileNetV2 | EfficientNetB0 | Ensemble |
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

## Failures (predicted class not in expected set)

total failures: 233

| model | true/native | predicted as | count |
|---|---|---|---|
| Small CNN | bari_healthy | Unknown | 6 |
| EfficientNetB0 | bari_healthy | Unknown | 6 |
| Ensemble | bari_healthy | Unknown | 6 |
| Small CNN | bari_viral_leaf_roll | Late Blight | 6 |
| Small CNN | healthy | Late Blight | 6 |
| Small CNN | bari_bacterial_soft_rot | Late Blight | 5 |
| MobileNetV2 | early_blight | Unknown | 5 |
| Ensemble | early_blight | Unknown | 5 |
| MobileNetV2 | bari_bacterial_soft_rot | Healthy | 4 |
| Small CNN | bari_viral_pvx | Late Blight | 4 |
| EfficientNetB0 | healthy | Unknown | 4 |
| MobileNetV2 | healthy | Late Blight | 4 |
| Ensemble | healthy | Late Blight | 4 |
| EfficientNetB0 | pest | Late Blight | 4 |
| EfficientNetB0 | virus | Late Blight | 4 |
| MobileNetV2 | soil_ground | Healthy | 4 |
| EfficientNetB0 | bari_bacterial_soft_rot | Late Blight | 3 |
| MobileNetV2 | bari_fungal_late_blight | Healthy | 3 |
| MobileNetV2 | bari_viral_leaf_roll | Healthy | 3 |
| MobileNetV2 | bari_viral_pvx | Healthy | 3 |
| MobileNetV2 | healthy | Unknown | 3 |
| Ensemble | healthy | Unknown | 3 |
| MobileNetV2 | nematode | Early Blight | 3 |
| EfficientNetB0 | nematode | Early Blight | 3 |
| MobileNetV2 | virus | Late Blight | 3 |
| EfficientNetB0 | soil_ground | Healthy | 3 |
| Ensemble | soil_ground | Healthy | 3 |
| Small CNN | early_blight | Late Blight | 3 |
| Small CNN | early_blight | Healthy | 2 |
| MobileNetV2 | bari_bacterial_soft_rot | Late Blight | 2 |
| Ensemble | bari_bacterial_soft_rot | Late Blight | 2 |
| EfficientNetB0 | bari_fungal_late_blight | Early Blight | 2 |
| Small CNN | bari_fungal_late_blight | Early Blight | 2 |
| Small CNN | bari_viral_pvx | Early Blight | 2 |
| Small CNN | bari_viral_pvy | Late Blight | 2 |
| MobileNetV2 | bari_viral_pvy | Healthy | 2 |
| Small CNN | ethiopia_healthy | Unknown | 2 |
| EfficientNetB0 | bacteria | Late Blight | 2 |
| Small CNN | fungi | Late Blight | 2 |
| EfficientNetB0 | fungi | Early Blight | 2 |
| MobileNetV2 | fungi | Late Blight | 2 |
| Small CNN | healthy | Unknown | 2 |
| Ensemble | nematode | Early Blight | 2 |
| Ensemble | virus | Late Blight | 2 |
| Small CNN | virus | Late Blight | 2 |
| Small CNN | Corn Gray leaf spot | Late Blight | 2 |
| EfficientNetB0 | grape leaf black rot | Late Blight | 2 |
| Small CNN | Tomato leaf bacterial spot | Late Blight | 2 |
| Small CNN | Tomato mold leaf | Late Blight | 2 |
| Small CNN | Tomato Septoria leaf spot | Early Blight | 2 |
| MobileNetV2 | Tomato Septoria leaf spot | Early Blight | 2 |
| EfficientNetB0 | Tomato Septoria leaf spot | Early Blight | 2 |
| Ensemble | Tomato Septoria leaf spot | Early Blight | 2 |
| Small CNN | early_blight | Unknown | 2 |
| Small CNN | late_blight | Unknown | 1 |
| Small CNN | non_leaf | Late Blight | 1 |
| MobileNetV2 | early_blight | Healthy | 1 |
| EfficientNetB0 | early_blight | Healthy | 1 |
| Ensemble | early_blight | Healthy | 1 |
| Small CNN | bari_bacterial_soft_rot | Early Blight | 1 |
| EfficientNetB0 | bari_bacterial_soft_rot | Early Blight | 1 |
| EfficientNetB0 | bari_bacterial_soft_rot | Healthy | 1 |
| MobileNetV2 | bari_fungal_late_blight | Early Blight | 1 |
| EfficientNetB0 | bari_viral_leaf_roll | Late Blight | 1 |
| EfficientNetB0 | bari_viral_leaf_roll | Early Blight | 1 |
| EfficientNetB0 | bari_viral_pvx | Early Blight | 1 |
| MobileNetV2 | ethiopia_healthy | Unknown | 1 |
| EfficientNetB0 | ethiopia_healthy | Unknown | 1 |
| MobileNetV2 | ethiopia_healthy | Late Blight | 1 |
| Small CNN | ethiopia_healthy | Late Blight | 1 |
| Ensemble | ethiopia_healthy | Unknown | 1 |
| Small CNN | bacteria | Healthy | 1 |
| Small CNN | bacteria | Late Blight | 1 |
| MobileNetV2 | bacteria | Late Blight | 1 |
| Ensemble | bacteria | Late Blight | 1 |
| MobileNetV2 | fungi | Early Blight | 1 |
| Small CNN | fungi | Healthy | 1 |
| EfficientNetB0 | fungi | Healthy | 1 |
| Ensemble | fungi | Healthy | 1 |
| Small CNN | nematode | Late Blight | 1 |
| Small CNN | nematode | Early Blight | 1 |
| Small CNN | pest | Late Blight | 1 |
| MobileNetV2 | pest | Late Blight | 1 |
| Ensemble | pest | Late Blight | 1 |
| Small CNN | virus | Healthy | 1 |
| Small CNN | Apple leaf | Healthy | 1 |
| MobileNetV2 | Apple leaf | Healthy | 1 |
| Small CNN | Apple rust leaf | Late Blight | 1 |
| MobileNetV2 | Apple rust leaf | Late Blight | 1 |
| EfficientNetB0 | Apple rust leaf | Late Blight | 1 |
| Ensemble | Apple rust leaf | Late Blight | 1 |
| EfficientNetB0 | Apple Scab Leaf | Early Blight | 1 |
| Small CNN | Apple Scab Leaf | Early Blight | 1 |
| Small CNN | Bell_pepper leaf spot | Early Blight | 1 |
| MobileNetV2 | Bell_pepper leaf spot | Late Blight | 1 |
| EfficientNetB0 | Blueberry leaf | Late Blight | 1 |
| Small CNN | Corn rust leaf | Late Blight | 1 |
| Small CNN | grape leaf | Early Blight | 1 |
| Small CNN | grape leaf | Healthy | 1 |
| MobileNetV2 | grape leaf | Healthy | 1 |
| Ensemble | grape leaf | Healthy | 1 |
| MobileNetV2 | grape leaf black rot | Healthy | 1 |
| Small CNN | Peach leaf | Late Blight | 1 |
| Small CNN | Raspberry leaf | Healthy | 1 |
| MobileNetV2 | Soyabean leaf | Healthy | 1 |
| Small CNN | Squash Powdery mildew leaf | Late Blight | 1 |
| Small CNN | Strawberry leaf | Late Blight | 1 |
| Small CNN | Strawberry leaf | Early Blight | 1 |
| Small CNN | Tomato leaf | Late Blight | 1 |
| Small CNN | Tomato leaf | Healthy | 1 |
| EfficientNetB0 | Tomato leaf bacterial spot | Late Blight | 1 |
| Small CNN | Tomato leaf mosaic virus | Early Blight | 1 |
| Small CNN | Tomato leaf yellow virus | Early Blight | 1 |
| EfficientNetB0 | Tomato leaf yellow virus | Late Blight | 1 |
| EfficientNetB0 | Tomato mold leaf | Early Blight | 1 |
| Ensemble | Tomato mold leaf | Late Blight | 1 |
| Small CNN | Tomato two spotted spider mites leaf | Early Blight | 1 |
| Small CNN | other_leaves | Early Blight | 1 |
| Small CNN | other_leaves | Late Blight | 1 |
| EfficientNetB0 | other_leaves | Late Blight | 1 |
| Small CNN | phone_random | Late Blight | 1 |
| Small CNN | soil_ground | Healthy | 1 |

## Per-image failure list

- [Small CNN] plantvillage_test/b9302a2f-a369-4b05-aed6-632287f42ed7___RS_LB 4452.JPG (late_blight) -> Unknown conf=0.4672 expected=Late Blight
- [Small CNN] plantvillage_test/000000079229.jpg (non_leaf) -> Late Blight conf=0.7519 expected=Unknown
- [Small CNN] irish_test/earlyblt92.jpg (early_blight) -> Healthy conf=0.8945 expected=Early Blight
- [MobileNetV2] irish_test/earlyblt92.jpg (early_blight) -> Healthy conf=0.8918 expected=Early Blight
- [EfficientNetB0] irish_test/earlyblt92.jpg (early_blight) -> Healthy conf=0.8843 expected=Early Blight
- [Ensemble] irish_test/earlyblt92.jpg (early_blight) -> Healthy conf=0.8902 expected=Early Blight
- [Small CNN] ext_ethiopia_bari/orig_0.jpg (bari_bacterial_soft_rot) -> Early Blight conf=0.6516 expected=Unknown
- [MobileNetV2] ext_ethiopia_bari/orig_0.jpg (bari_bacterial_soft_rot) -> Healthy conf=0.7462 expected=Unknown
- [Small CNN] ext_ethiopia_bari/orig_3.jpg (bari_bacterial_soft_rot) -> Late Blight conf=0.6088 expected=Unknown
- [MobileNetV2] ext_ethiopia_bari/orig_3.jpg (bari_bacterial_soft_rot) -> Healthy conf=0.876 expected=Unknown
- [EfficientNetB0] ext_ethiopia_bari/orig_3.jpg (bari_bacterial_soft_rot) -> Early Blight conf=0.6455 expected=Unknown
- [Small CNN] ext_ethiopia_bari/orig_6.jpg (bari_bacterial_soft_rot) -> Late Blight conf=0.7162 expected=Unknown
- [MobileNetV2] ext_ethiopia_bari/orig_6.jpg (bari_bacterial_soft_rot) -> Late Blight conf=0.6464 expected=Unknown
- [EfficientNetB0] ext_ethiopia_bari/orig_6.jpg (bari_bacterial_soft_rot) -> Late Blight conf=0.662 expected=Unknown
- [Ensemble] ext_ethiopia_bari/orig_6.jpg (bari_bacterial_soft_rot) -> Late Blight conf=0.6748 expected=Unknown
- [Small CNN] ext_ethiopia_bari/orig_2.jpg (bari_bacterial_soft_rot) -> Late Blight conf=0.8017 expected=Unknown
- [MobileNetV2] ext_ethiopia_bari/orig_2.jpg (bari_bacterial_soft_rot) -> Healthy conf=0.8908 expected=Unknown
- [EfficientNetB0] ext_ethiopia_bari/orig_2.jpg (bari_bacterial_soft_rot) -> Late Blight conf=0.824 expected=Unknown
- [Small CNN] ext_ethiopia_bari/orig_1.jpg (bari_bacterial_soft_rot) -> Late Blight conf=0.6331 expected=Unknown
- [MobileNetV2] ext_ethiopia_bari/orig_1.jpg (bari_bacterial_soft_rot) -> Healthy conf=0.9007 expected=Unknown
- [EfficientNetB0] ext_ethiopia_bari/orig_1.jpg (bari_bacterial_soft_rot) -> Healthy conf=0.5641 expected=Unknown
- [Small CNN] ext_ethiopia_bari/orig_5.jpg (bari_bacterial_soft_rot) -> Late Blight conf=0.8373 expected=Unknown
- [MobileNetV2] ext_ethiopia_bari/orig_5.jpg (bari_bacterial_soft_rot) -> Late Blight conf=0.8711 expected=Unknown
- [EfficientNetB0] ext_ethiopia_bari/orig_5.jpg (bari_bacterial_soft_rot) -> Late Blight conf=0.6788 expected=Unknown
- [Ensemble] ext_ethiopia_bari/orig_5.jpg (bari_bacterial_soft_rot) -> Late Blight conf=0.7957 expected=Unknown
- [MobileNetV2] ext_ethiopia_bari/orig_1.jpg (bari_fungal_late_blight) -> Healthy conf=0.7043 expected=Late Blight|Unknown
- [EfficientNetB0] ext_ethiopia_bari/orig_1.jpg (bari_fungal_late_blight) -> Early Blight conf=0.7086 expected=Late Blight|Unknown
- [Small CNN] ext_ethiopia_bari/orig_7.jpg (bari_fungal_late_blight) -> Early Blight conf=0.702 expected=Late Blight|Unknown
- [MobileNetV2] ext_ethiopia_bari/orig_11.jpg (bari_fungal_late_blight) -> Healthy conf=0.774 expected=Late Blight|Unknown
- [MobileNetV2] ext_ethiopia_bari/orig_2.jpg (bari_fungal_late_blight) -> Healthy conf=0.8645 expected=Late Blight|Unknown
- [EfficientNetB0] ext_ethiopia_bari/orig_2.jpg (bari_fungal_late_blight) -> Early Blight conf=0.6839 expected=Late Blight|Unknown
- [Small CNN] ext_ethiopia_bari/orig_9.jpg (bari_fungal_late_blight) -> Early Blight conf=0.6081 expected=Late Blight|Unknown
- [MobileNetV2] ext_ethiopia_bari/orig_9.jpg (bari_fungal_late_blight) -> Early Blight conf=0.5929 expected=Late Blight|Unknown
- [Small CNN] ext_ethiopia_bari/orig_3.jpg (bari_healthy) -> Unknown conf=0.5211 expected=Healthy
- [EfficientNetB0] ext_ethiopia_bari/orig_3.jpg (bari_healthy) -> Unknown conf=0.3385 expected=Healthy
- [Ensemble] ext_ethiopia_bari/orig_3.jpg (bari_healthy) -> Unknown conf=0.4169 expected=Healthy
- [Small CNN] ext_ethiopia_bari/orig_7.jpg (bari_healthy) -> Unknown conf=0.4178 expected=Healthy
- [EfficientNetB0] ext_ethiopia_bari/orig_7.jpg (bari_healthy) -> Unknown conf=0.2862 expected=Healthy
- [Ensemble] ext_ethiopia_bari/orig_7.jpg (bari_healthy) -> Unknown conf=0.4235 expected=Healthy
- [Small CNN] ext_ethiopia_bari/orig_4.jpg (bari_healthy) -> Unknown conf=0.5211 expected=Healthy
- [EfficientNetB0] ext_ethiopia_bari/orig_4.jpg (bari_healthy) -> Unknown conf=0.3385 expected=Healthy
- [Ensemble] ext_ethiopia_bari/orig_4.jpg (bari_healthy) -> Unknown conf=0.4169 expected=Healthy
- [Small CNN] ext_ethiopia_bari/orig_9.jpg (bari_healthy) -> Unknown conf=0.4178 expected=Healthy
- [EfficientNetB0] ext_ethiopia_bari/orig_9.jpg (bari_healthy) -> Unknown conf=0.2862 expected=Healthy
- [Ensemble] ext_ethiopia_bari/orig_9.jpg (bari_healthy) -> Unknown conf=0.4235 expected=Healthy
- [Small CNN] ext_ethiopia_bari/orig_13.jpg (bari_healthy) -> Unknown conf=0.417 expected=Healthy
- [EfficientNetB0] ext_ethiopia_bari/orig_13.jpg (bari_healthy) -> Unknown conf=0.3373 expected=Healthy
- [Ensemble] ext_ethiopia_bari/orig_13.jpg (bari_healthy) -> Unknown conf=0.4382 expected=Healthy
- [Small CNN] ext_ethiopia_bari/orig_6.jpg (bari_healthy) -> Unknown conf=0.417 expected=Healthy
- [EfficientNetB0] ext_ethiopia_bari/orig_6.jpg (bari_healthy) -> Unknown conf=0.3373 expected=Healthy
- [Ensemble] ext_ethiopia_bari/orig_6.jpg (bari_healthy) -> Unknown conf=0.4382 expected=Healthy
- [Small CNN] ext_ethiopia_bari/orig_2.jpg (bari_viral_leaf_roll) -> Late Blight conf=0.7836 expected=Unknown
- [MobileNetV2] ext_ethiopia_bari/orig_2.jpg (bari_viral_leaf_roll) -> Healthy conf=0.8863 expected=Unknown
- [Small CNN] ext_ethiopia_bari/orig_12.jpg (bari_viral_leaf_roll) -> Late Blight conf=0.6998 expected=Unknown
- [EfficientNetB0] ext_ethiopia_bari/orig_12.jpg (bari_viral_leaf_roll) -> Late Blight conf=0.5805 expected=Unknown
- [Small CNN] ext_ethiopia_bari/orig_1.jpg (bari_viral_leaf_roll) -> Late Blight conf=0.7839 expected=Unknown
- [MobileNetV2] ext_ethiopia_bari/orig_1.jpg (bari_viral_leaf_roll) -> Healthy conf=0.8402 expected=Unknown
- [Small CNN] ext_ethiopia_bari/orig_28.jpg (bari_viral_leaf_roll) -> Late Blight conf=0.6937 expected=Unknown
- [Small CNN] ext_ethiopia_bari/orig_15.jpg (bari_viral_leaf_roll) -> Late Blight conf=0.7041 expected=Unknown
- [MobileNetV2] ext_ethiopia_bari/orig_15.jpg (bari_viral_leaf_roll) -> Healthy conf=0.6794 expected=Unknown
- [EfficientNetB0] ext_ethiopia_bari/orig_15.jpg (bari_viral_leaf_roll) -> Early Blight conf=0.6971 expected=Unknown
- [Small CNN] ext_ethiopia_bari/orig_30.jpg (bari_viral_leaf_roll) -> Late Blight conf=0.6673 expected=Unknown
- [Small CNN] ext_ethiopia_bari/orig_2.jpg (bari_viral_pvx) -> Early Blight conf=0.8436 expected=Unknown
- [MobileNetV2] ext_ethiopia_bari/orig_2.jpg (bari_viral_pvx) -> Healthy conf=0.7611 expected=Unknown
- [Small CNN] ext_ethiopia_bari/orig_0.jpg (bari_viral_pvx) -> Late Blight conf=0.7429 expected=Unknown
- [Small CNN] ext_ethiopia_bari/orig_1.jpg (bari_viral_pvx) -> Early Blight conf=0.878 expected=Unknown
- [MobileNetV2] ext_ethiopia_bari/orig_1.jpg (bari_viral_pvx) -> Healthy conf=0.8597 expected=Unknown
- [EfficientNetB0] ext_ethiopia_bari/orig_1.jpg (bari_viral_pvx) -> Early Blight conf=0.6192 expected=Unknown
- [Small CNN] ext_ethiopia_bari/orig_4.jpg (bari_viral_pvx) -> Late Blight conf=0.7052 expected=Unknown
- [MobileNetV2] ext_ethiopia_bari/orig_4.jpg (bari_viral_pvx) -> Healthy conf=0.659 expected=Unknown
- [Small CNN] ext_ethiopia_bari/orig_3.jpg (bari_viral_pvx) -> Late Blight conf=0.7594 expected=Unknown
- [Small CNN] ext_ethiopia_bari/orig_5.jpg (bari_viral_pvx) -> Late Blight conf=0.6971 expected=Unknown
- [Small CNN] ext_ethiopia_bari/orig_1.jpg (bari_viral_pvy) -> Late Blight conf=0.7764 expected=Unknown
- [MobileNetV2] ext_ethiopia_bari/orig_1.jpg (bari_viral_pvy) -> Healthy conf=0.7764 expected=Unknown
- [Small CNN] ext_ethiopia_bari/orig_0.jpg (bari_viral_pvy) -> Late Blight conf=0.7464 expected=Unknown
- [MobileNetV2] ext_ethiopia_bari/orig_0.jpg (bari_viral_pvy) -> Healthy conf=0.8956 expected=Unknown
- [Small CNN] ext_ethiopia_bari/Healthy (246).jpg (ethiopia_healthy) -> Unknown conf=0.4786 expected=Healthy
- [MobileNetV2] ext_ethiopia_bari/Healthy (348).jpg (ethiopia_healthy) -> Unknown conf=0.4607 expected=Healthy
- [EfficientNetB0] ext_ethiopia_bari/Healthy (348).jpg (ethiopia_healthy) -> Unknown conf=0.5252 expected=Healthy
- [MobileNetV2] ext_ethiopia_bari/Healthy (340).jpg (ethiopia_healthy) -> Late Blight conf=0.6006 expected=Healthy
- [Small CNN] ext_ethiopia_bari/Healthy (268).jpg (ethiopia_healthy) -> Unknown conf=0.335 expected=Healthy
- [Small CNN] ext_ethiopia_bari/Healthy (500).jpg (ethiopia_healthy) -> Late Blight conf=0.8272 expected=Healthy
- [Ensemble] ext_ethiopia_bari/Healthy (500).jpg (ethiopia_healthy) -> Unknown conf=0.4497 expected=Healthy
- [Small CNN] ext_central_java/20230815_114456.jpg (bacteria) -> Healthy conf=0.5792 expected=Unknown
- [EfficientNetB0] ext_central_java/20230815_114456.jpg (bacteria) -> Late Blight conf=0.7963 expected=Unknown
- [Small CNN] ext_central_java/20230815_113834.jpg (bacteria) -> Late Blight conf=0.5789 expected=Unknown
- [MobileNetV2] ext_central_java/20230815_113834.jpg (bacteria) -> Late Blight conf=0.5912 expected=Unknown
- [EfficientNetB0] ext_central_java/20230815_113834.jpg (bacteria) -> Late Blight conf=0.7608 expected=Unknown
- [Ensemble] ext_central_java/20230815_113834.jpg (bacteria) -> Late Blight conf=0.6436 expected=Unknown
- [Small CNN] ext_central_java/20230816_123310.jpg (fungi) -> Late Blight conf=0.7855 expected=Unknown
- [MobileNetV2] ext_central_java/20230816_123310.jpg (fungi) -> Early Blight conf=0.6809 expected=Unknown
- [EfficientNetB0] ext_central_java/20230816_123310.jpg (fungi) -> Early Blight conf=0.8367 expected=Unknown
- [MobileNetV2] ext_central_java/20230802_130230.jpg (fungi) -> Late Blight conf=0.5916 expected=Unknown
- [Small CNN] ext_central_java/20230802_111439410.jpg (fungi) -> Healthy conf=0.7566 expected=Unknown
- [EfficientNetB0] ext_central_java/20230802_111439410.jpg (fungi) -> Healthy conf=0.7522 expected=Unknown
- [Ensemble] ext_central_java/20230802_111439410.jpg (fungi) -> Healthy conf=0.6619 expected=Unknown
- [Small CNN] ext_central_java/IMG_20230816_122600.jpg (fungi) -> Late Blight conf=0.7537 expected=Unknown
- [MobileNetV2] ext_central_java/IMG_20230816_122600.jpg (fungi) -> Late Blight conf=0.8543 expected=Unknown
- [EfficientNetB0] ext_central_java/IMG_20230816_122600.jpg (fungi) -> Early Blight conf=0.8277 expected=Unknown
- [Small CNN] ext_central_java/IMG_4696.JPG (healthy) -> Unknown conf=0.5181 expected=Healthy
- [MobileNetV2] ext_central_java/IMG_4696.JPG (healthy) -> Unknown conf=0.5396 expected=Healthy
- [EfficientNetB0] ext_central_java/IMG_4696.JPG (healthy) -> Unknown conf=0.5095 expected=Healthy
- [Ensemble] ext_central_java/IMG_4696.JPG (healthy) -> Unknown conf=0.44 expected=Healthy
- [Small CNN] ext_central_java/20230802_121046.jpg (healthy) -> Late Blight conf=0.7521 expected=Healthy
- [MobileNetV2] ext_central_java/20230802_121046.jpg (healthy) -> Late Blight conf=0.6064 expected=Healthy
- [EfficientNetB0] ext_central_java/20230802_121046.jpg (healthy) -> Unknown conf=0.3864 expected=Healthy
- [Ensemble] ext_central_java/20230802_121046.jpg (healthy) -> Late Blight conf=0.5701 expected=Healthy
- [Small CNN] ext_central_java/20230712_132347.jpg (healthy) -> Late Blight conf=0.6301 expected=Healthy
- [MobileNetV2] ext_central_java/20230712_132347.jpg (healthy) -> Late Blight conf=0.5757 expected=Healthy
- [EfficientNetB0] ext_central_java/20230712_132347.jpg (healthy) -> Unknown conf=0.5179 expected=Healthy
- [Ensemble] ext_central_java/20230712_132347.jpg (healthy) -> Late Blight conf=0.5746 expected=Healthy
- [Small CNN] ext_central_java/IMG_0132.JPG (healthy) -> Late Blight conf=0.8123 expected=Healthy
- [MobileNetV2] ext_central_java/IMG_0132.JPG (healthy) -> Late Blight conf=0.7758 expected=Healthy
- [EfficientNetB0] ext_central_java/IMG_0132.JPG (healthy) -> Unknown conf=0.4353 expected=Healthy
- [Ensemble] ext_central_java/IMG_0132.JPG (healthy) -> Late Blight conf=0.6744 expected=Healthy
- [Small CNN] ext_central_java/20230816_115745.jpg (healthy) -> Late Blight conf=0.7068 expected=Healthy
- [MobileNetV2] ext_central_java/20230816_115745.jpg (healthy) -> Late Blight conf=0.8813 expected=Healthy
- [Ensemble] ext_central_java/20230816_115745.jpg (healthy) -> Late Blight conf=0.5614 expected=Healthy
- [Small CNN] ext_central_java/20230802_105249.jpg (nematode) -> Late Blight conf=0.7109 expected=Unknown
- [MobileNetV2] ext_central_java/20230816_121307.jpg (nematode) -> Early Blight conf=0.5672 expected=Unknown
- [EfficientNetB0] ext_central_java/20230816_121307.jpg (nematode) -> Early Blight conf=0.7209 expected=Unknown
- [Small CNN] ext_central_java/20230802_105230.jpg (nematode) -> Early Blight conf=0.6407 expected=Unknown
- [MobileNetV2] ext_central_java/20230802_105230.jpg (nematode) -> Early Blight conf=0.8148 expected=Unknown
- [EfficientNetB0] ext_central_java/20230802_105230.jpg (nematode) -> Early Blight conf=0.8023 expected=Unknown
- [Ensemble] ext_central_java/20230802_105230.jpg (nematode) -> Early Blight conf=0.7526 expected=Unknown
- [MobileNetV2] ext_central_java/20230816_084203.jpg (nematode) -> Early Blight conf=0.8134 expected=Unknown
- [EfficientNetB0] ext_central_java/20230816_084203.jpg (nematode) -> Early Blight conf=0.8431 expected=Unknown
- [Ensemble] ext_central_java/20230816_084203.jpg (nematode) -> Early Blight conf=0.6387 expected=Unknown
- [Small CNN] ext_central_java/IMG_4813.JPG (pest) -> Late Blight conf=0.6007 expected=Unknown
- [MobileNetV2] ext_central_java/IMG_4813.JPG (pest) -> Late Blight conf=0.6643 expected=Unknown
- [EfficientNetB0] ext_central_java/IMG_4813.JPG (pest) -> Late Blight conf=0.7041 expected=Unknown
- [Ensemble] ext_central_java/IMG_4813.JPG (pest) -> Late Blight conf=0.6564 expected=Unknown
- [EfficientNetB0] ext_central_java/20230816_142514.jpg (pest) -> Late Blight conf=0.5852 expected=Unknown
- [EfficientNetB0] ext_central_java/IMG_20230816_134419~2.jpg (pest) -> Late Blight conf=0.8826 expected=Unknown
- [EfficientNetB0] ext_central_java/IMG_8350.JPG (pest) -> Late Blight conf=0.7302 expected=Unknown
- [MobileNetV2] ext_central_java/20230815_114243.jpg (virus) -> Late Blight conf=0.8334 expected=Unknown
- [EfficientNetB0] ext_central_java/20230815_114243.jpg (virus) -> Late Blight conf=0.8736 expected=Unknown
- [Ensemble] ext_central_java/20230815_114243.jpg (virus) -> Late Blight conf=0.7444 expected=Unknown
- [Small CNN] ext_central_java/20230802_120716.jpg (virus) -> Late Blight conf=0.7822 expected=Unknown
- [MobileNetV2] ext_central_java/20230802_120716.jpg (virus) -> Late Blight conf=0.7196 expected=Unknown
- [EfficientNetB0] ext_central_java/20230802_120716.jpg (virus) -> Late Blight conf=0.6464 expected=Unknown
- [Ensemble] ext_central_java/20230802_120716.jpg (virus) -> Late Blight conf=0.7161 expected=Unknown
- [Small CNN] ext_central_java/20230815_120551.jpg (virus) -> Late Blight conf=0.8864 expected=Unknown
- [Small CNN] ext_central_java/20230815_150846.jpg (virus) -> Healthy conf=0.634 expected=Unknown
- [MobileNetV2] ext_central_java/20230815_150846.jpg (virus) -> Late Blight conf=0.6237 expected=Unknown
- [EfficientNetB0] ext_central_java/20230815_150846.jpg (virus) -> Late Blight conf=0.6478 expected=Unknown
- [EfficientNetB0] ext_central_java/20230815_151217.jpg (virus) -> Late Blight conf=0.8474 expected=Unknown
- [Small CNN] plantdoc_other_crops/yellow-apple-leaves-isolated-10868989.jpg (Apple leaf) -> Healthy conf=0.695 expected=Unknown
- [MobileNetV2] plantdoc_other_crops/AppleLeavesInRain.jpg (Apple leaf) -> Healthy conf=0.5781 expected=Unknown
- [Small CNN] plantdoc_other_crops/Figure-1.-Typical-cedar-apple-rust-lesions-on-upper-surface-of-apple-leaf.jpg (Apple rust leaf) -> Late Blight conf=0.9566 expected=Unknown
- [MobileNetV2] plantdoc_other_crops/Figure-1.-Typical-cedar-apple-rust-lesions-on-upper-surface-of-apple-leaf.jpg (Apple rust leaf) -> Late Blight conf=0.8637 expected=Unknown
- [EfficientNetB0] plantdoc_other_crops/Figure-1.-Typical-cedar-apple-rust-lesions-on-upper-surface-of-apple-leaf.jpg (Apple rust leaf) -> Late Blight conf=0.7827 expected=Unknown
- [Ensemble] plantdoc_other_crops/Figure-1.-Typical-cedar-apple-rust-lesions-on-upper-surface-of-apple-leaf.jpg (Apple rust leaf) -> Late Blight conf=0.8677 expected=Unknown
- [EfficientNetB0] plantdoc_other_crops/Apple_scab_symptoms_on_leaf.jpg (Apple Scab Leaf) -> Early Blight conf=0.7967 expected=Unknown
- [Small CNN] plantdoc_other_crops/apple-scab-venturia-inaequalis-lesions-mycelium-on-leaves-a8h9nb.jpg (Apple Scab Leaf) -> Early Blight conf=0.6826 expected=Unknown
- [Small CNN] plantdoc_other_crops/534a.jpg (Bell_pepper leaf spot) -> Early Blight conf=0.5802 expected=Unknown
- [MobileNetV2] plantdoc_other_crops/534a.jpg (Bell_pepper leaf spot) -> Late Blight conf=0.5508 expected=Unknown
- [EfficientNetB0] plantdoc_other_crops/blueberry+leaves+in+fall.jpg (Blueberry leaf) -> Late Blight conf=0.7019 expected=Unknown
- [Small CNN] plantdoc_other_crops/Gray%20Leaf%20SpotCORN039.JPG.jpg (Corn Gray leaf spot) -> Late Blight conf=0.5916 expected=Unknown
- [Small CNN] plantdoc_other_crops/Figure%201%20Gray%20leaf%20spot%20and%20Northern%20corn%20leaf%20blight.jpg (Corn Gray leaf spot) -> Late Blight conf=0.7548 expected=Unknown
- [Small CNN] plantdoc_other_crops/Ontario-Field-Crop-Report_July_27_2017_f2-1024x768.jpg (Corn rust leaf) -> Late Blight conf=0.5988 expected=Unknown
- [Small CNN] plantdoc_other_crops/IMG_2666.jpg (grape leaf) -> Early Blight conf=0.6017 expected=Unknown
- [Small CNN] plantdoc_other_crops/grape-leaves-up-close.jpg (grape leaf) -> Healthy conf=0.8717 expected=Unknown
- [MobileNetV2] plantdoc_other_crops/grape-leaves-up-close.jpg (grape leaf) -> Healthy conf=0.8271 expected=Unknown
- [Ensemble] plantdoc_other_crops/grape-leaves-up-close.jpg (grape leaf) -> Healthy conf=0.7079 expected=Unknown
- [MobileNetV2] plantdoc_other_crops/Black_Rot_of_Grapes1166.jpg (grape leaf black rot) -> Healthy conf=0.6807 expected=Unknown
- [EfficientNetB0] plantdoc_other_crops/Black_Rot_of_Grapes1166.jpg (grape leaf black rot) -> Late Blight conf=0.7116 expected=Unknown
- [EfficientNetB0] plantdoc_other_crops/2009+06+069+Downy+mildew.jpg (grape leaf black rot) -> Late Blight conf=0.7836 expected=Unknown
- [Small CNN] plantdoc_other_crops/depositphotos_140609182-stock-photo-beauty-peach-with-leaf.jpg (Peach leaf) -> Late Blight conf=0.7148 expected=Unknown
- [Small CNN] plantdoc_other_crops/raspberry-leaf-isolated-white-18415125.jpg (Raspberry leaf) -> Healthy conf=0.8031 expected=Unknown
- [MobileNetV2] plantdoc_other_crops/IMG_4810.jpg (Soyabean leaf) -> Healthy conf=0.7491 expected=Unknown
- [Small CNN] plantdoc_other_crops/_1030395.JPG.jpg (Squash Powdery mildew leaf) -> Late Blight conf=0.6965 expected=Unknown
- [Small CNN] plantdoc_other_crops/41.jpg (Strawberry leaf) -> Late Blight conf=0.7256 expected=Unknown
- [Small CNN] plantdoc_other_crops/344d1150577229-strange-strawberry-leaves-unhealthy-maxim.jpg (Strawberry leaf) -> Early Blight conf=0.7309 expected=Unknown
- [Small CNN] plantdoc_other_crops/15481477375.jpg (Tomato leaf) -> Late Blight conf=0.7573 expected=Unknown
- [Small CNN] plantdoc_other_crops/fpls-08-01602-g001.jpg (Tomato leaf) -> Healthy conf=0.8728 expected=Unknown
- [Small CNN] plantdoc_other_crops/Bacterial-Leaf-Spot-2.jpg (Tomato leaf bacterial spot) -> Late Blight conf=0.6301 expected=Unknown
- [Small CNN] plantdoc_other_crops/bacterialSpeck03510339f27656b-1scmgh1.jpg (Tomato leaf bacterial spot) -> Late Blight conf=0.5995 expected=Unknown
- [EfficientNetB0] plantdoc_other_crops/bacterialSpeck03510339f27656b-1scmgh1.jpg (Tomato leaf bacterial spot) -> Late Blight conf=0.58 expected=Unknown
- [Small CNN] plantdoc_other_crops/mosaic_virus_tomato.jpg (Tomato leaf mosaic virus) -> Early Blight conf=0.8959 expected=Unknown
- [Small CNN] plantdoc_other_crops/leaves-curling-on-tomato-plant-characteristic-symptoms-tomato-plants-leaves-curling-down-on-tomato-plant.jpg (Tomato leaf yellow virus) -> Early Blight conf=0.8288 expected=Unknown
- [EfficientNetB0] plantdoc_other_crops/072.jpg (Tomato leaf yellow virus) -> Late Blight conf=0.5624 expected=Unknown
- [Small CNN] plantdoc_other_crops/P1020365.jpg (Tomato mold leaf) -> Late Blight conf=0.6382 expected=Unknown
- [EfficientNetB0] plantdoc_other_crops/P1020365.jpg (Tomato mold leaf) -> Early Blight conf=0.7732 expected=Unknown
- [Small CNN] plantdoc_other_crops/IMG_1261.jpg (Tomato mold leaf) -> Late Blight conf=0.7411 expected=Unknown
- [Ensemble] plantdoc_other_crops/IMG_1261.jpg (Tomato mold leaf) -> Late Blight conf=0.5829 expected=Unknown
- [Small CNN] plantdoc_other_crops/bd0b83af4c5e4b739ccc6c36fa66f141.jpg (Tomato Septoria leaf spot) -> Early Blight conf=0.7714 expected=Unknown
- [MobileNetV2] plantdoc_other_crops/bd0b83af4c5e4b739ccc6c36fa66f141.jpg (Tomato Septoria leaf spot) -> Early Blight conf=0.735 expected=Unknown
- [EfficientNetB0] plantdoc_other_crops/bd0b83af4c5e4b739ccc6c36fa66f141.jpg (Tomato Septoria leaf spot) -> Early Blight conf=0.7229 expected=Unknown
- [Ensemble] plantdoc_other_crops/bd0b83af4c5e4b739ccc6c36fa66f141.jpg (Tomato Septoria leaf spot) -> Early Blight conf=0.7431 expected=Unknown
- [Small CNN] plantdoc_other_crops/tomato-blight-treatment-blight.jpg (Tomato Septoria leaf spot) -> Early Blight conf=0.8035 expected=Unknown
- [MobileNetV2] plantdoc_other_crops/tomato-blight-treatment-blight.jpg (Tomato Septoria leaf spot) -> Early Blight conf=0.7642 expected=Unknown
- [EfficientNetB0] plantdoc_other_crops/tomato-blight-treatment-blight.jpg (Tomato Septoria leaf spot) -> Early Blight conf=0.8087 expected=Unknown
- [Ensemble] plantdoc_other_crops/tomato-blight-treatment-blight.jpg (Tomato Septoria leaf spot) -> Early Blight conf=0.7922 expected=Unknown
- [Small CNN] plantdoc_other_crops/SpotSpeckBlightMite-1l4v879.jpg (Tomato two spotted spider mites leaf) -> Early Blight conf=0.5792 expected=Unknown
- [Small CNN] non_leaf_v2/other_leaves/plantdoc_Tomato leaf mosaic virus_TNRV2.jpg (other_leaves) -> Early Blight conf=0.6724 expected=Unknown
- [Small CNN] non_leaf_v2/other_leaves/plantdoc_Tomato leaf bacterial spot_59380.jpg (other_leaves) -> Late Blight conf=0.7896 expected=Unknown
- [EfficientNetB0] non_leaf_v2/other_leaves/plantdoc_Tomato leaf bacterial spot_59380.jpg (other_leaves) -> Late Blight conf=0.747 expected=Unknown
- [Small CNN] non_leaf_v2/phone_random/oi_a8c2597904589591.jpg (phone_random) -> Late Blight conf=0.8537 expected=Unknown
- [MobileNetV2] non_leaf_v2/soil_ground/we3ds_img_02112.png (soil_ground) -> Healthy conf=0.9148 expected=Unknown
- [EfficientNetB0] non_leaf_v2/soil_ground/we3ds_img_02112.png (soil_ground) -> Healthy conf=0.9057 expected=Unknown
- [Ensemble] non_leaf_v2/soil_ground/we3ds_img_02112.png (soil_ground) -> Healthy conf=0.7761 expected=Unknown
- [MobileNetV2] non_leaf_v2/soil_ground/we3ds_img_01848.png (soil_ground) -> Healthy conf=0.812 expected=Unknown
- [EfficientNetB0] non_leaf_v2/soil_ground/we3ds_img_01848.png (soil_ground) -> Healthy conf=0.7443 expected=Unknown
- [Ensemble] non_leaf_v2/soil_ground/we3ds_img_01848.png (soil_ground) -> Healthy conf=0.6099 expected=Unknown
- [Small CNN] non_leaf_v2/soil_ground/we3ds_img_00488.png (soil_ground) -> Healthy conf=0.7827 expected=Unknown
- [MobileNetV2] non_leaf_v2/soil_ground/we3ds_img_00488.png (soil_ground) -> Healthy conf=0.905 expected=Unknown
- [EfficientNetB0] non_leaf_v2/soil_ground/we3ds_img_00488.png (soil_ground) -> Healthy conf=0.8657 expected=Unknown
- [Ensemble] non_leaf_v2/soil_ground/we3ds_img_00488.png (soil_ground) -> Healthy conf=0.8511 expected=Unknown
- [MobileNetV2] non_leaf_v2/soil_ground/we3ds_img_01008.png (soil_ground) -> Healthy conf=0.9125 expected=Unknown
- [Small CNN] synthetic_blur/24a34259-1c47-4e87-ac83-5decf37b42e4___RS_Early.B 6896.JPG (early_blight) -> Late Blight conf=0.7492 expected=Early Blight
- [MobileNetV2] synthetic_blur/24a34259-1c47-4e87-ac83-5decf37b42e4___RS_Early.B 6896.JPG (early_blight) -> Unknown conf=0.9264 expected=Early Blight
- [Ensemble] synthetic_blur/24a34259-1c47-4e87-ac83-5decf37b42e4___RS_Early.B 6896.JPG (early_blight) -> Unknown conf=0.3665 expected=Early Blight
- [Small CNN] synthetic_overexposed/24a34259-1c47-4e87-ac83-5decf37b42e4___RS_Early.B 6896.JPG (early_blight) -> Unknown conf=0.3403 expected=Early Blight
- [MobileNetV2] synthetic_overexposed/24a34259-1c47-4e87-ac83-5decf37b42e4___RS_Early.B 6896.JPG (early_blight) -> Unknown conf=0.437 expected=Early Blight
- [Ensemble] synthetic_overexposed/24a34259-1c47-4e87-ac83-5decf37b42e4___RS_Early.B 6896.JPG (early_blight) -> Unknown conf=0.4317 expected=Early Blight
- [Small CNN] synthetic_blur/683b04ad-7941-4819-9965-ba32c725eb22___RS_HL 1861.JPG (healthy) -> Late Blight conf=0.5906 expected=Healthy
- [MobileNetV2] synthetic_blur/683b04ad-7941-4819-9965-ba32c725eb22___RS_HL 1861.JPG (healthy) -> Unknown conf=0.5068 expected=Healthy
- [Ensemble] synthetic_blur/683b04ad-7941-4819-9965-ba32c725eb22___RS_HL 1861.JPG (healthy) -> Unknown conf=0.5051 expected=Healthy
- [Small CNN] synthetic_blur/d286d101-227f-48ba-b906-586879eb6a00___RS_Early.B 7095.JPG (early_blight) -> Late Blight conf=0.8555 expected=Early Blight
- [MobileNetV2] synthetic_blur/d286d101-227f-48ba-b906-586879eb6a00___RS_Early.B 7095.JPG (early_blight) -> Unknown conf=0.8936 expected=Early Blight
- [Ensemble] synthetic_blur/d286d101-227f-48ba-b906-586879eb6a00___RS_Early.B 7095.JPG (early_blight) -> Unknown conf=0.353 expected=Early Blight
- [Small CNN] synthetic_overexposed/d286d101-227f-48ba-b906-586879eb6a00___RS_Early.B 7095.JPG (early_blight) -> Healthy conf=0.8787 expected=Early Blight
- [MobileNetV2] synthetic_overexposed/d286d101-227f-48ba-b906-586879eb6a00___RS_Early.B 7095.JPG (early_blight) -> Unknown conf=0.7816 expected=Early Blight
- [Ensemble] synthetic_overexposed/d286d101-227f-48ba-b906-586879eb6a00___RS_Early.B 7095.JPG (early_blight) -> Unknown conf=0.4058 expected=Early Blight
- [MobileNetV2] synthetic_blur/144d2475-21ab-4bdc-a67c-9672a9b711e6___RS_HL 5376.JPG (healthy) -> Unknown conf=0.5529 expected=Healthy
- [Small CNN] synthetic_blur/9a6eb7c4-6b43-477a-89e0-69f62ef67991___RS_HL 1846.JPG (healthy) -> Late Blight conf=0.7031 expected=Healthy
- [Ensemble] synthetic_blur/9a6eb7c4-6b43-477a-89e0-69f62ef67991___RS_HL 1846.JPG (healthy) -> Unknown conf=0.5075 expected=Healthy
- [Small CNN] synthetic_dark/9a6eb7c4-6b43-477a-89e0-69f62ef67991___RS_HL 1846.JPG (healthy) -> Unknown conf=0.4282 expected=Healthy
- [Small CNN] synthetic_blur/e50bd734-03b9-479b-9ca0-48ef217a2c59___RS_Early.B 7976.JPG (early_blight) -> Late Blight conf=0.7816 expected=Early Blight
- [MobileNetV2] synthetic_blur/e50bd734-03b9-479b-9ca0-48ef217a2c59___RS_Early.B 7976.JPG (early_blight) -> Unknown conf=0.7382 expected=Early Blight
- [Ensemble] synthetic_blur/e50bd734-03b9-479b-9ca0-48ef217a2c59___RS_Early.B 7976.JPG (early_blight) -> Unknown conf=0.319 expected=Early Blight
- [Small CNN] synthetic_overexposed/e50bd734-03b9-479b-9ca0-48ef217a2c59___RS_Early.B 7976.JPG (early_blight) -> Unknown conf=0.3866 expected=Early Blight