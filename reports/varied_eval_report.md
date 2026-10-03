# Varied-data evaluation report

- images: 221 (seed 42)
- models: small_cnn, mobilenetv2, efficientnetb0, ensemble
- requests ok: 884/884

## Accuracy by model

| model | correct | total | accuracy |
|---|---|---|---|
| Small CNN | 175 | 221 | 79.2% |
| MobileNetV2 | 196 | 221 | 88.7% |
| EfficientNetB0 | 202 | 221 | 91.4% |
| Ensemble | 188 | 221 | 85.1% |

## Accuracy by source x model

| source | n | Small CNN | MobileNetV2 | EfficientNetB0 | Ensemble |
|---|---|---|---|---|---|
| ext_central_java | 42 | 86% | 93% | 95% | 88% |
| ext_ethiopia_bari | 44 | 66% | 82% | 80% | 77% |
| irish_test | 20 | 85% | 90% | 95% | 95% |
| non_leaf_v2/animals_people | 5 | 100% | 100% | 100% | 100% |
| non_leaf_v2/other_crops | 5 | 100% | 100% | 100% | 100% |
| non_leaf_v2/other_leaves | 5 | 100% | 100% | 100% | 100% |
| non_leaf_v2/phone_random | 5 | 100% | 100% | 100% | 100% |
| non_leaf_v2/soil_ground | 5 | 100% | 100% | 100% | 100% |
| plantdoc_other_crops | 52 | 100% | 96% | 100% | 100% |
| plantvillage_test | 20 | 80% | 95% | 100% | 95% |
| synthetic_blur | 6 | 0% | 0% | 0% | 0% |
| synthetic_dark | 6 | 0% | 100% | 100% | 0% |
| synthetic_overexposed | 6 | 0% | 50% | 83% | 33% |

## Failures (predicted class not in expected set)

total failures: 123

| model | true/native | predicted as | count |
|---|---|---|---|
| Small CNN | healthy | Unknown | 17 |
| Ensemble | healthy | Unknown | 12 |
| Ensemble | early_blight | Unknown | 9 |
| MobileNetV2 | healthy | Unknown | 8 |
| Small CNN | early_blight | Unknown | 7 |
| Small CNN | bari_healthy | Unknown | 6 |
| MobileNetV2 | bari_healthy | Unknown | 6 |
| EfficientNetB0 | bari_healthy | Unknown | 6 |
| Ensemble | bari_healthy | Unknown | 6 |
| Small CNN | ethiopia_late_blight | Unknown | 6 |
| EfficientNetB0 | healthy | Unknown | 5 |
| MobileNetV2 | early_blight | Unknown | 5 |
| Small CNN | late_blight | Unknown | 4 |
| EfficientNetB0 | early_blight | Unknown | 4 |
| Small CNN | ethiopia_healthy | Unknown | 3 |
| Ensemble | ethiopia_late_blight | Unknown | 3 |
| EfficientNetB0 | bari_bacterial_soft_rot | Late Blight | 2 |
| MobileNetV2 | bari_viral_pvx | Late Blight | 2 |
| Small CNN | early_blight | Late Blight | 2 |
| MobileNetV2 | late_blight | Unknown | 1 |
| Ensemble | late_blight | Unknown | 1 |
| Small CNN | early_blight | Healthy | 1 |
| MobileNetV2 | early_blight | Healthy | 1 |
| EfficientNetB0 | early_blight | Healthy | 1 |
| Ensemble | early_blight | Healthy | 1 |
| EfficientNetB0 | bari_viral_pvy | Late Blight | 1 |
| Ensemble | ethiopia_healthy | Unknown | 1 |
| MobileNetV2 | Apple rust leaf | Late Blight | 1 |
| MobileNetV2 | Soyabean leaf | Healthy | 1 |

## Per-image failure list

- [Small CNN] plantvillage_test/4bbccfb6-5720-4c80-9b37-0c3ed8999c9f___RS_HL 1791.JPG (healthy) -> Unknown conf=0.8432 expected=Healthy
- [Small CNN] plantvillage_test/3a00204c-5e53-4e5d-95a6-f8819031744e___RS_HL 5420.JPG (healthy) -> Unknown conf=0.8257 expected=Healthy
- [Small CNN] plantvillage_test/f68e448a-c2f5-4638-a7cb-45e73083ae4a___RS_LB 3892.JPG (late_blight) -> Unknown conf=0.7859 expected=Late Blight
- [Small CNN] plantvillage_test/b9302a2f-a369-4b05-aed6-632287f42ed7___RS_LB 4452.JPG (late_blight) -> Unknown conf=0.7372 expected=Late Blight
- [MobileNetV2] plantvillage_test/b9302a2f-a369-4b05-aed6-632287f42ed7___RS_LB 4452.JPG (late_blight) -> Unknown conf=0.7453 expected=Late Blight
- [Ensemble] plantvillage_test/b9302a2f-a369-4b05-aed6-632287f42ed7___RS_LB 4452.JPG (late_blight) -> Unknown conf=0.8046 expected=Late Blight
- [Small CNN] irish_test/earlyblt92.jpg (early_blight) -> Healthy conf=0.8749 expected=Early Blight
- [MobileNetV2] irish_test/earlyblt92.jpg (early_blight) -> Healthy conf=0.9091 expected=Early Blight
- [EfficientNetB0] irish_test/earlyblt92.jpg (early_blight) -> Healthy conf=0.9101 expected=Early Blight
- [Ensemble] irish_test/earlyblt92.jpg (early_blight) -> Healthy conf=0.898 expected=Early Blight
- [MobileNetV2] irish_test/healthy4553.jpg (healthy) -> Unknown conf=0.7664 expected=Healthy
- [Small CNN] irish_test/lateblt1081.jpg (late_blight) -> Unknown conf=0.8366 expected=Late Blight
- [Small CNN] irish_test/lateblt2342.jpg (late_blight) -> Unknown conf=0.7664 expected=Late Blight
- [EfficientNetB0] ext_ethiopia_bari/orig_6.jpg (bari_bacterial_soft_rot) -> Late Blight conf=0.9354 expected=Unknown
- [EfficientNetB0] ext_ethiopia_bari/orig_5.jpg (bari_bacterial_soft_rot) -> Late Blight conf=0.9233 expected=Unknown
- [Small CNN] ext_ethiopia_bari/orig_3.jpg (bari_healthy) -> Unknown conf=0.907 expected=Healthy
- [MobileNetV2] ext_ethiopia_bari/orig_3.jpg (bari_healthy) -> Unknown conf=0.9341 expected=Healthy
- [EfficientNetB0] ext_ethiopia_bari/orig_3.jpg (bari_healthy) -> Unknown conf=0.9529 expected=Healthy
- [Ensemble] ext_ethiopia_bari/orig_3.jpg (bari_healthy) -> Unknown conf=0.9313 expected=Healthy
- [Small CNN] ext_ethiopia_bari/orig_7.jpg (bari_healthy) -> Unknown conf=0.863 expected=Healthy
- [MobileNetV2] ext_ethiopia_bari/orig_7.jpg (bari_healthy) -> Unknown conf=0.928 expected=Healthy
- [EfficientNetB0] ext_ethiopia_bari/orig_7.jpg (bari_healthy) -> Unknown conf=0.9055 expected=Healthy
- [Ensemble] ext_ethiopia_bari/orig_7.jpg (bari_healthy) -> Unknown conf=0.8988 expected=Healthy
- [Small CNN] ext_ethiopia_bari/orig_4.jpg (bari_healthy) -> Unknown conf=0.907 expected=Healthy
- [MobileNetV2] ext_ethiopia_bari/orig_4.jpg (bari_healthy) -> Unknown conf=0.9341 expected=Healthy
- [EfficientNetB0] ext_ethiopia_bari/orig_4.jpg (bari_healthy) -> Unknown conf=0.9529 expected=Healthy
- [Ensemble] ext_ethiopia_bari/orig_4.jpg (bari_healthy) -> Unknown conf=0.9313 expected=Healthy
- [Small CNN] ext_ethiopia_bari/orig_9.jpg (bari_healthy) -> Unknown conf=0.863 expected=Healthy
- [MobileNetV2] ext_ethiopia_bari/orig_9.jpg (bari_healthy) -> Unknown conf=0.928 expected=Healthy
- [EfficientNetB0] ext_ethiopia_bari/orig_9.jpg (bari_healthy) -> Unknown conf=0.9055 expected=Healthy
- [Ensemble] ext_ethiopia_bari/orig_9.jpg (bari_healthy) -> Unknown conf=0.8988 expected=Healthy
- [Small CNN] ext_ethiopia_bari/orig_13.jpg (bari_healthy) -> Unknown conf=0.8334 expected=Healthy
- [MobileNetV2] ext_ethiopia_bari/orig_13.jpg (bari_healthy) -> Unknown conf=0.9504 expected=Healthy
- [EfficientNetB0] ext_ethiopia_bari/orig_13.jpg (bari_healthy) -> Unknown conf=0.9308 expected=Healthy
- [Ensemble] ext_ethiopia_bari/orig_13.jpg (bari_healthy) -> Unknown conf=0.9049 expected=Healthy
- [Small CNN] ext_ethiopia_bari/orig_6.jpg (bari_healthy) -> Unknown conf=0.8334 expected=Healthy
- [MobileNetV2] ext_ethiopia_bari/orig_6.jpg (bari_healthy) -> Unknown conf=0.9504 expected=Healthy
- [EfficientNetB0] ext_ethiopia_bari/orig_6.jpg (bari_healthy) -> Unknown conf=0.9308 expected=Healthy
- [Ensemble] ext_ethiopia_bari/orig_6.jpg (bari_healthy) -> Unknown conf=0.9049 expected=Healthy
- [MobileNetV2] ext_ethiopia_bari/orig_2.jpg (bari_viral_pvx) -> Late Blight conf=0.8668 expected=Unknown
- [MobileNetV2] ext_ethiopia_bari/orig_1.jpg (bari_viral_pvx) -> Late Blight conf=0.9147 expected=Unknown
- [EfficientNetB0] ext_ethiopia_bari/orig_0.jpg (bari_viral_pvy) -> Late Blight conf=0.9334 expected=Unknown
- [Small CNN] ext_ethiopia_bari/Healthy (246).jpg (ethiopia_healthy) -> Unknown conf=0.7546 expected=Healthy
- [Small CNN] ext_ethiopia_bari/Healthy (348).jpg (ethiopia_healthy) -> Unknown conf=0.7957 expected=Healthy
- [Small CNN] ext_ethiopia_bari/Healthy (500).jpg (ethiopia_healthy) -> Unknown conf=0.8261 expected=Healthy
- [Ensemble] ext_ethiopia_bari/Healthy (500).jpg (ethiopia_healthy) -> Unknown conf=0.6445 expected=Healthy
- [Small CNN] ext_ethiopia_bari/Late_Blight (458).jpg (ethiopia_late_blight) -> Unknown conf=0.6668 expected=Late Blight
- [Ensemble] ext_ethiopia_bari/Late_Blight (458).jpg (ethiopia_late_blight) -> Unknown conf=0.829 expected=Late Blight
- [Small CNN] ext_ethiopia_bari/Late_Blight (470).jpg (ethiopia_late_blight) -> Unknown conf=0.6962 expected=Late Blight
- [Ensemble] ext_ethiopia_bari/Late_Blight (470).jpg (ethiopia_late_blight) -> Unknown conf=0.8349 expected=Late Blight
- [Small CNN] ext_ethiopia_bari/Late_Blight (480).jpg (ethiopia_late_blight) -> Unknown conf=0.6755 expected=Late Blight
- [Ensemble] ext_ethiopia_bari/Late_Blight (480).jpg (ethiopia_late_blight) -> Unknown conf=0.8307 expected=Late Blight
- [Small CNN] ext_ethiopia_bari/Late_Blight (469).jpg (ethiopia_late_blight) -> Unknown conf=0.7896 expected=Late Blight
- [Small CNN] ext_ethiopia_bari/Late_Blight (478).jpg (ethiopia_late_blight) -> Unknown conf=0.804 expected=Late Blight
- [Small CNN] ext_ethiopia_bari/Late_Blight (473).jpg (ethiopia_late_blight) -> Unknown conf=0.8124 expected=Late Blight
- [Small CNN] ext_central_java/IMG_4696.JPG (healthy) -> Unknown conf=0.4938 expected=Healthy
- [Ensemble] ext_central_java/IMG_4696.JPG (healthy) -> Unknown conf=0.7516 expected=Healthy
- [Small CNN] ext_central_java/20230802_121046.jpg (healthy) -> Unknown conf=0.4589 expected=Healthy
- [MobileNetV2] ext_central_java/20230802_121046.jpg (healthy) -> Unknown conf=0.7361 expected=Healthy
- [Ensemble] ext_central_java/20230802_121046.jpg (healthy) -> Unknown conf=0.5817 expected=Healthy
- [Small CNN] ext_central_java/20230712_132347.jpg (healthy) -> Unknown conf=0.7942 expected=Healthy
- [Ensemble] ext_central_java/20230712_132347.jpg (healthy) -> Unknown conf=0.6885 expected=Healthy
- [Small CNN] ext_central_java/IMG_0132.JPG (healthy) -> Unknown conf=0.523 expected=Healthy
- [MobileNetV2] ext_central_java/IMG_0132.JPG (healthy) -> Unknown conf=0.5494 expected=Healthy
- [EfficientNetB0] ext_central_java/IMG_0132.JPG (healthy) -> Unknown conf=0.5134 expected=Healthy
- [Ensemble] ext_central_java/IMG_0132.JPG (healthy) -> Unknown conf=0.4722 expected=Healthy
- [Small CNN] ext_central_java/20230816_115745.jpg (healthy) -> Unknown conf=0.5863 expected=Healthy
- [MobileNetV2] ext_central_java/20230816_115745.jpg (healthy) -> Unknown conf=0.5653 expected=Healthy
- [EfficientNetB0] ext_central_java/20230816_115745.jpg (healthy) -> Unknown conf=0.5671 expected=Healthy
- [Ensemble] ext_central_java/20230816_115745.jpg (healthy) -> Unknown conf=0.5097 expected=Healthy
- [Small CNN] ext_central_java/20230815_115544.jpg (healthy) -> Unknown conf=0.8006 expected=Healthy
- [MobileNetV2] plantdoc_other_crops/Figure-1.-Typical-cedar-apple-rust-lesions-on-upper-surface-of-apple-leaf.jpg (Apple rust leaf) -> Late Blight conf=0.8588 expected=Unknown
- [MobileNetV2] plantdoc_other_crops/Soybean%20oil%20leaf.JPG.jpg (Soyabean leaf) -> Healthy conf=0.8974 expected=Unknown
- [Small CNN] synthetic_blur/24a34259-1c47-4e87-ac83-5decf37b42e4___RS_Early.B 6896.JPG (early_blight) -> Unknown conf=0.7542 expected=Early Blight
- [MobileNetV2] synthetic_blur/24a34259-1c47-4e87-ac83-5decf37b42e4___RS_Early.B 6896.JPG (early_blight) -> Unknown conf=0.948 expected=Early Blight
- [EfficientNetB0] synthetic_blur/24a34259-1c47-4e87-ac83-5decf37b42e4___RS_Early.B 6896.JPG (early_blight) -> Unknown conf=0.3571 expected=Early Blight
- [Ensemble] synthetic_blur/24a34259-1c47-4e87-ac83-5decf37b42e4___RS_Early.B 6896.JPG (early_blight) -> Unknown conf=0.4441 expected=Early Blight
- [Small CNN] synthetic_dark/24a34259-1c47-4e87-ac83-5decf37b42e4___RS_Early.B 6896.JPG (early_blight) -> Unknown conf=0.5968 expected=Early Blight
- [Ensemble] synthetic_dark/24a34259-1c47-4e87-ac83-5decf37b42e4___RS_Early.B 6896.JPG (early_blight) -> Unknown conf=0.6993 expected=Early Blight
- [Small CNN] synthetic_overexposed/24a34259-1c47-4e87-ac83-5decf37b42e4___RS_Early.B 6896.JPG (early_blight) -> Unknown conf=0.6298 expected=Early Blight
- [MobileNetV2] synthetic_overexposed/24a34259-1c47-4e87-ac83-5decf37b42e4___RS_Early.B 6896.JPG (early_blight) -> Unknown conf=0.4894 expected=Early Blight
- [Ensemble] synthetic_overexposed/24a34259-1c47-4e87-ac83-5decf37b42e4___RS_Early.B 6896.JPG (early_blight) -> Unknown conf=0.4167 expected=Early Blight
- [Small CNN] synthetic_blur/683b04ad-7941-4819-9965-ba32c725eb22___RS_HL 1861.JPG (healthy) -> Unknown conf=0.6064 expected=Healthy
- [MobileNetV2] synthetic_blur/683b04ad-7941-4819-9965-ba32c725eb22___RS_HL 1861.JPG (healthy) -> Unknown conf=0.9275 expected=Healthy
- [EfficientNetB0] synthetic_blur/683b04ad-7941-4819-9965-ba32c725eb22___RS_HL 1861.JPG (healthy) -> Unknown conf=0.9394 expected=Healthy
- [Ensemble] synthetic_blur/683b04ad-7941-4819-9965-ba32c725eb22___RS_HL 1861.JPG (healthy) -> Unknown conf=0.6556 expected=Healthy
- [Small CNN] synthetic_dark/683b04ad-7941-4819-9965-ba32c725eb22___RS_HL 1861.JPG (healthy) -> Unknown conf=0.6876 expected=Healthy
- [Ensemble] synthetic_dark/683b04ad-7941-4819-9965-ba32c725eb22___RS_HL 1861.JPG (healthy) -> Unknown conf=0.6482 expected=Healthy
- [Small CNN] synthetic_overexposed/683b04ad-7941-4819-9965-ba32c725eb22___RS_HL 1861.JPG (healthy) -> Unknown conf=0.7922 expected=Healthy
- [MobileNetV2] synthetic_overexposed/683b04ad-7941-4819-9965-ba32c725eb22___RS_HL 1861.JPG (healthy) -> Unknown conf=0.8461 expected=Healthy
- [Ensemble] synthetic_overexposed/683b04ad-7941-4819-9965-ba32c725eb22___RS_HL 1861.JPG (healthy) -> Unknown conf=0.841 expected=Healthy
- [Small CNN] synthetic_blur/d286d101-227f-48ba-b906-586879eb6a00___RS_Early.B 7095.JPG (early_blight) -> Late Blight conf=0.8948 expected=Early Blight
- [MobileNetV2] synthetic_blur/d286d101-227f-48ba-b906-586879eb6a00___RS_Early.B 7095.JPG (early_blight) -> Unknown conf=0.9496 expected=Early Blight
- [EfficientNetB0] synthetic_blur/d286d101-227f-48ba-b906-586879eb6a00___RS_Early.B 7095.JPG (early_blight) -> Unknown conf=0.7404 expected=Early Blight
- [Ensemble] synthetic_blur/d286d101-227f-48ba-b906-586879eb6a00___RS_Early.B 7095.JPG (early_blight) -> Unknown conf=0.3838 expected=Early Blight
- [Small CNN] synthetic_dark/d286d101-227f-48ba-b906-586879eb6a00___RS_Early.B 7095.JPG (early_blight) -> Late Blight conf=0.8648 expected=Early Blight
- [Ensemble] synthetic_dark/d286d101-227f-48ba-b906-586879eb6a00___RS_Early.B 7095.JPG (early_blight) -> Unknown conf=0.6117 expected=Early Blight
- [Small CNN] synthetic_overexposed/d286d101-227f-48ba-b906-586879eb6a00___RS_Early.B 7095.JPG (early_blight) -> Unknown conf=0.5907 expected=Early Blight
- [MobileNetV2] synthetic_overexposed/d286d101-227f-48ba-b906-586879eb6a00___RS_Early.B 7095.JPG (early_blight) -> Unknown conf=0.8065 expected=Early Blight
- [EfficientNetB0] synthetic_overexposed/d286d101-227f-48ba-b906-586879eb6a00___RS_Early.B 7095.JPG (early_blight) -> Unknown conf=0.8035 expected=Early Blight
- [Ensemble] synthetic_overexposed/d286d101-227f-48ba-b906-586879eb6a00___RS_Early.B 7095.JPG (early_blight) -> Unknown conf=0.4938 expected=Early Blight
- [Small CNN] synthetic_blur/144d2475-21ab-4bdc-a67c-9672a9b711e6___RS_HL 5376.JPG (healthy) -> Unknown conf=0.7456 expected=Healthy
- [MobileNetV2] synthetic_blur/144d2475-21ab-4bdc-a67c-9672a9b711e6___RS_HL 5376.JPG (healthy) -> Unknown conf=0.9244 expected=Healthy
- [EfficientNetB0] synthetic_blur/144d2475-21ab-4bdc-a67c-9672a9b711e6___RS_HL 5376.JPG (healthy) -> Unknown conf=0.7562 expected=Healthy
- [Ensemble] synthetic_blur/144d2475-21ab-4bdc-a67c-9672a9b711e6___RS_HL 5376.JPG (healthy) -> Unknown conf=0.5909 expected=Healthy
- [Small CNN] synthetic_dark/144d2475-21ab-4bdc-a67c-9672a9b711e6___RS_HL 5376.JPG (healthy) -> Unknown conf=0.7811 expected=Healthy
- [Ensemble] synthetic_dark/144d2475-21ab-4bdc-a67c-9672a9b711e6___RS_HL 5376.JPG (healthy) -> Unknown conf=0.6481 expected=Healthy
- [Small CNN] synthetic_overexposed/144d2475-21ab-4bdc-a67c-9672a9b711e6___RS_HL 5376.JPG (healthy) -> Unknown conf=0.8081 expected=Healthy
- [Small CNN] synthetic_blur/9a6eb7c4-6b43-477a-89e0-69f62ef67991___RS_HL 1846.JPG (healthy) -> Unknown conf=0.7711 expected=Healthy
- [MobileNetV2] synthetic_blur/9a6eb7c4-6b43-477a-89e0-69f62ef67991___RS_HL 1846.JPG (healthy) -> Unknown conf=0.8335 expected=Healthy
- [EfficientNetB0] synthetic_blur/9a6eb7c4-6b43-477a-89e0-69f62ef67991___RS_HL 1846.JPG (healthy) -> Unknown conf=0.5049 expected=Healthy
- [Ensemble] synthetic_blur/9a6eb7c4-6b43-477a-89e0-69f62ef67991___RS_HL 1846.JPG (healthy) -> Unknown conf=0.4653 expected=Healthy
- [Small CNN] synthetic_dark/9a6eb7c4-6b43-477a-89e0-69f62ef67991___RS_HL 1846.JPG (healthy) -> Unknown conf=0.7279 expected=Healthy
- [Ensemble] synthetic_dark/9a6eb7c4-6b43-477a-89e0-69f62ef67991___RS_HL 1846.JPG (healthy) -> Unknown conf=0.6493 expected=Healthy
- [Small CNN] synthetic_overexposed/9a6eb7c4-6b43-477a-89e0-69f62ef67991___RS_HL 1846.JPG (healthy) -> Unknown conf=0.7075 expected=Healthy
- [Small CNN] synthetic_blur/e50bd734-03b9-479b-9ca0-48ef217a2c59___RS_Early.B 7976.JPG (early_blight) -> Unknown conf=0.7261 expected=Early Blight
- [MobileNetV2] synthetic_blur/e50bd734-03b9-479b-9ca0-48ef217a2c59___RS_Early.B 7976.JPG (early_blight) -> Unknown conf=0.9465 expected=Early Blight
- [EfficientNetB0] synthetic_blur/e50bd734-03b9-479b-9ca0-48ef217a2c59___RS_Early.B 7976.JPG (early_blight) -> Unknown conf=0.7526 expected=Early Blight
- [Ensemble] synthetic_blur/e50bd734-03b9-479b-9ca0-48ef217a2c59___RS_Early.B 7976.JPG (early_blight) -> Unknown conf=0.4116 expected=Early Blight
- [Small CNN] synthetic_dark/e50bd734-03b9-479b-9ca0-48ef217a2c59___RS_Early.B 7976.JPG (early_blight) -> Unknown conf=0.4866 expected=Early Blight
- [Ensemble] synthetic_dark/e50bd734-03b9-479b-9ca0-48ef217a2c59___RS_Early.B 7976.JPG (early_blight) -> Unknown conf=0.7761 expected=Early Blight
- [Small CNN] synthetic_overexposed/e50bd734-03b9-479b-9ca0-48ef217a2c59___RS_Early.B 7976.JPG (early_blight) -> Unknown conf=0.4399 expected=Early Blight
- [Ensemble] synthetic_overexposed/e50bd734-03b9-479b-9ca0-48ef217a2c59___RS_Early.B 7976.JPG (early_blight) -> Unknown conf=0.6774 expected=Early Blight