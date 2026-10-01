# Robust split build report (EXP-ROBUST-001)

- holdout paths: 1397

- external candidates: 4801 -> after holdout+dedupe: 4543 (holdout-copies 60, self-dups 198)


## Splits

| split | rows | labels |
|---|---|---|
| robust_train | 12079 | {'late_blight': 3569, 'healthy': 2970, 'non_leaf': 2239, 'early_blight': 3301} |
| robust_val | 1613 | {'early_blight': 382, 'healthy': 410, 'late_blight': 437, 'non_leaf': 384} |
| robust_ext_test | 446 | {'late_blight': 39, 'non_leaf': 352, 'healthy': 55} |

## Assertions

- [OK] train âˆ© val = âˆ…
- [OK] train âˆ© ext_test = âˆ…
- [OK] val âˆ© ext_test = âˆ…
- [OK] holdout âˆ© train = âˆ…
- [OK] holdout âˆ© val = âˆ…
- [OK] holdout âˆ© ext_test = âˆ…
- [OK] all files exist

## External train additions by source

| source | rows |
|---|---|
| java_fungi | 286 |
| bari_ethiopia_healthy | 285 |
| java_phytophthora | 242 |
| java_pest | 231 |
| java_bacteria | 218 |
| java_virus | 203 |
| v2_animals_people | 159 |
| java_healthy | 155 |
| v2_soil_ground | 122 |
| v2_phone_random | 55 |
| bari_ethiopia_late_blight | 49 |
| v2_other_crops | 36 |
| java_nematode | 24 |
| bari_bari_fungal_late_blight | 11 |
| bari_bari_viral_leaf_roll | 10 |
| plantdoc_Apple leaf | 2 |
| plantdoc_Apple rust leaf | 2 |
| plantdoc_Bell_pepper leaf | 2 |
| plantdoc_Bell_pepper leaf spot | 2 |
| plantdoc_Blueberry leaf | 2 |
| plantdoc_Corn Gray leaf spot | 2 |
| plantdoc_Squash Powdery mildew leaf | 2 |
| plantdoc_Tomato leaf yellow virus | 2 |
| plantdoc_Tomato mold leaf | 2 |
| plantdoc_Apple Scab Leaf | 1 |
| plantdoc_Cherry leaf | 1 |
| plantdoc_Corn leaf blight | 1 |
| plantdoc_Corn rust leaf | 1 |
| plantdoc_Peach leaf | 1 |
| plantdoc_Raspberry leaf | 1 |
| plantdoc_Soyabean leaf | 1 |
| plantdoc_Strawberry leaf | 1 |
| plantdoc_Tomato Early blight leaf | 1 |
| plantdoc_Tomato Septoria leaf spot | 1 |
| plantdoc_Tomato leaf | 1 |
| plantdoc_Tomato leaf bacterial spot | 1 |
| plantdoc_Tomato leaf late blight | 1 |
| plantdoc_Tomato leaf mosaic virus | 1 |
| plantdoc_grape leaf | 1 |
| plantdoc_grape leaf black rot | 1 |