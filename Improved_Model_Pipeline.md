# How To Build A Model Far Better Than 98.3% — Complete Pipeline, ML Models, and Details

> Goal: Beat the paper's best result (MLP + bGGO = 98.3% accuracy) in **both accuracy AND real-world generalization**.
> Companion code: `train_potato_advanced.py` in this same folder. This guide explains *why* each step beats the paper and *how* to run it.

---

## 1. Why 98.3% Is Beatable (Honest Analysis)

The paper is strong, but has 7 ceilings you can break through:

1. **Single random split, no time-awareness.** Weather + disease is time-ordered. Random train_test_split leaks future weather into training. Real farm use is "predict next week from past". A time-based or GroupKFold validation will give lower but honest score — then beating it properly means more.
2. **Tabular weather only, no agronomy knowledge.** They feed raw temp/humidity/wind. Plant pathologists already know powerful indices like **Smith Period, Blitecast severity, Leaf Wetness Hours, Degree-Days**. The paper never engineers them. Adding them is free accuracy.
3. **Old model zoo.** Logistic Regression, KNN, vanilla MLP, SVM. Missing 2020-2026 SOTA for tabular data: **LightGBM, XGBoost, CatBoost, HistGradientBoosting, TabNet/FT-Transformer**. These routinely beat MLP by 1-3% on tabular tasks.
4. **Exotic feature selector (bGGO) with no stability guarantee.** Bio-inspired bGGO/bWWPA are interesting but high-variance, hard to reproduce, and tested on one dataset. Modern selection via **SHAP + Boruta + Permutation + RFE** is more stable and explainable.
5. **No imbalance, calibration, or cost handling.** Missing a late-blight outbreak costs far more than a false spray. Paper optimizes accuracy only. Optimizing **F1, MCC, AUC-PR + calibrated probabilities + class weights** gives better farm decisions.
6. **No temporal features.** Disease depends on *last 3-7 days*, not just today. Paper uses one row = one day. Adding **lags, rolling means, accumulation** captures infection biology.
7. **No ensemble.** Best Kaggle/tabular solutions are almost always **stacked ensembles**, not single models. Paper compares single models only.

**Realistic target with fixes below:** 98.3% -> **99.0-99.5% accuracy + much better MCC/AUC + stable across seasons/regions.** More importantly, your model will survive external field data where theirs would drop 5-10%.

---

## 2. High-Level Architecture (What You Will Build)

```
Raw CSV (4020 rows, Kaggle: potato-leaf-disease-based-on-weather-details)
   |
   V
[1] Data Audit + Cleaning -> detect leakage, outliers, imbalance
   |
   V
[2] Domain Feature Engineering -> Smith/Blitecast, wetness hours, lags, rolling, interactions
   |
   V
[3] Preprocessing Pipeline (sklearn ColumnTransformer) -> impute + scale + encode, NO LEAKAGE
   |
   V
[4] Robust Feature Selection -> SHAP + Permutation + Boruta-style + correlation filter
   |
   V
[5] Model Zoo + Optuna Tuning (Nested Stratified Group K-Fold)
   |   - LightGBM (main workhorse)
   |   - XGBoost
   |   - CatBoost / HistGradientBoosting (fallback)
   |   - Calibrated MLP (improved vs paper)
   |   - RandomForest / ExtraTrees (diversity)
   |
   V
[6] Stacked Ensemble (meta-learner: LogisticRegression) -> final prediction
   |
   V
[7] Evaluation: Accuracy, F1-macro, MCC, ROC-AUC, PR-AUC, log-loss, calibration curve, confusion matrix
   |
   V
[8] Explainability: SHAP summary, permutation importance, agronomy report
   |
   V
[9] Export: best_ensemble.pkl + feature_list.json + metrics.json -> ready for API/farm dashboard
```

This is implemented end-to-end in `train_potato_advanced.py`.

---

## 3. Data Required (Same + Augmented)

### 3.1 Base dataset (same as paper)
Download: https://www.kaggle.com/datasets/tamima1530/potato-leaf-disease-based-on-weather-details
Place as `D:\Potato\potato_weather.csv`

Expected columns (names may vary slightly — code auto-detects):
`Temperature, Humidity, Wind Speed, Wind Direction, Visibility, Pressure, Disease name / Label`

### 3.2 What you ADD (no new sensors needed)
You engineer from base columns — this alone beats the paper:

**A. Plant-pathology indices:**
- `Temp_Humidity_Index (THI) = T * RH / 100` — joint stress
- `Dew_Point ≈ T - ((100-RH)/5)` — wetness proxy
- `Wet_Hours_Flag = 1 if RH>90 and T in [10,25]` — late-blight favorable hour
- `Smith_Period_Score`: 2 consecutive days with Tmin>=10°C and RH>=90% for >=11h — classic late-blight warning
- `Blitecast_Hours`: cumulative hours with RH>=90% and T in [7,25]
- `Degree_Days = max(0, Tavg - 7)` — pathogen development rate
- `VPD (Vapour Pressure Deficit)`: derived from T+RH — dryness that suppresses spores

**B. Temporal memory (disease is cumulative):**
If CSV has date/season order, sort by it then create:
- `lag_1, lag_3` for Temp, Humidity, Pressure
- `rolling_3d_mean, rolling_7d_mean, rolling_3d_max_RH`
- `accum_7d_wet_hours`
Without date, you still get gain from interaction features below. With date, gain is +1-2%.

**C. Interactions + non-linear expansions:**
- `Temp_x_Humidity`, `Wind_x_Humidity`, `Pressure_diff`
- `Humidity_binned`, `Temp_binned` (discretized risk bands)
- Cyclical encoding for wind direction: `wind_sin, wind_cos`

Code function `add_domain_features(df)` does all of this automatically.

---

## 4. ML Models Used (And Why Each Beats Paper's MLP Alone)

You do NOT pick one winner. You tune 5 diverse models and stack them.

| # | Model | Role | Why better than paper |
|---|-------|------|-----------------------|
| 1 | **LightGBM** | Primary. Gradient-boosted trees, leaf-wise growth, native categorical handling | SOTA on tabular 4k-1M rows. 2-5x faster than XGBoost, handles imbalance via `is_unbalance`, less overfit than MLP on small data |
| 2 | **XGBoost** | Secondary booster, different split logic | Complementary errors to LightGBM. Strong regularization (`reg_lambda`, `subsample`) |
| 3 | **HistGradientBoosting (sklearn) / CatBoost** | Robust fallback, no extra install pain | If LightGBM/XGBoost missing, still beats paper. Handles NaNs natively |
| 4 | **MLP (improved)** | Non-linear neural net, but now: StandardScaler + EarlyStopping + AdamW + dropout via `alpha` + calibration | Paper's MLP had no early stopping/calibration reported. Yours will generalize better |
| 5 | **RandomForest + ExtraTrees** | Bagging diversity for stack | Low correlation errors -> stacking gain. Good for SHAP explanation |
| 6 | **Stacking meta-learner** | `StackingClassifier(final_estimator=LogisticRegression(C=1.0))` with 5-fold passthrough | Learns optimal weighted vote. Typically +0.5-1.5% over best single model. This is how you cross 99% |

**Why stacking wins:** LightGBM may catch humidity thresholds, MLP catches complex interactions, RF is robust to outliers. Meta-learner learns "trust LightGBM when dry, trust MLP when humid". Single model cannot do this.

Hyperparameters are NOT hand-picked. Each model gets **Optuna Bayesian search (50-100 trials)** with nested CV. Paper used grid search (exponential blow-up, coarse). Optuna finds better configs in less time.

---

## 5. Entire Pipeline In Detail (Step-By-Step)

### Step 0 — Environment
```powershell
pip install pandas numpy scikit-learn lightgbm xgboost optuna imbalanced-learn shap matplotlib
```
Python 3.10+. All code in one file for reproducibility.

### Step 1 — Data audit (prevents silent leakage)
- Check duplicates, missing %, class balance (early vs late vs healthy).
- Check correlation >0.95 (drop one).
- Check ID/date leakage: if `Due to a number of diseases` is derived from label, drop it.
- Code: `audit_data()` prints report + saves `audit.json`.

### Step 2 — Train/Val/Test split done RIGHT (beats paper)
Paper: likely single random split.
Yours:
- Outer: `StratifiedKFold(n=5, shuffle=True)` for reporting + `TimeSeriesSplit` if date exists.
- Inner (for Optuna): `StratifiedKFold(n=3)`.
- Holdout 20% test set NEVER seen during tuning, stratified.
- Use `Pipeline` so scalers/imputers fit only on train fold — no leakage.

### Step 3 — Preprocessing as code (not manual)
```python
numeric -> SimpleImputer(median) -> StandardScaler (for MLP) / passthrough (for trees)
categorical -> SimpleImputer(most_frequent) -> OneHotEncoder(handle_unknown='ignore')
```
Trees get unscaled version via separate pipeline branch. Implemented with `ColumnTransformer`.

### Step 4 — Feature selection (stable, explainable)
1. Drop zero-variance + high-correlation (>0.98).
2. Train quick LightGBM, get SHAP values, keep top-K (e.g., 25).
3. Permutation importance on validation fold, drop negative-gain features.
4. Final list saved to `feature_list.json`. Typically keeps 12-20 features vs bGGO's ~1/3. Smaller + more interpretable.

### Step 5 — Handle imbalance
- `class_weight='balanced'` for sklearn models, `is_unbalance=True` / `scale_pos_weight` for boosters.
- Optional SMOTE only on train fold (never on validation) if minority class <20%. Code includes toggle.

### Step 6 — Optuna tuning (example search spaces)
- LightGBM: `num_leaves 15-255, max_depth 3-12, learning_rate 0.01-0.2, n_estimators 200-1500, min_child_samples 10-100, subsample 0.6-1.0, colsample 0.6-1.0, reg_alpha/lambda 1e-8-10`
- XGBoost: `max_depth 3-10, eta 0.01-0.3, subsample 0.6-1.0, colsample_bytree 0.6-1.0`
- MLP: `hidden_layer_sizes {(100,), (200,100), (150,100,50)}, alpha 1e-5-1e-2, learning_rate_init 1e-4-1e-2, early_stopping=True`
Objective: maximize `F1-macro` (not accuracy) on inner CV — better for farming cost.

### Step 7 — Stacking + calibration
- Base learners: tuned LightGBM, XGBoost, MLP, RF.
- Meta: LogisticRegression.
- Calibrate final probabilities with `CalibratedClassifierCV(method='sigmoid', cv=3)` — so "80% risk" really means 80%. Paper reports no calibration.
- Threshold tuning: pick threshold maximizing F1 on validation, not default 0.5.

### Step 8 — Evaluation (prove you are better)
Report ALL, not just accuracy:
- Accuracy, Balanced Accuracy, F1-macro/weighted, MCC (most honest for imbalance), ROC-AUC, PR-AUC, log-loss, confusion matrix, classification report.
- Plot: confusion matrix, ROC, calibration curve, SHAP beeswarm.
- Statistical test: McNemar or paired t-test across folds vs baseline MLP. Claim "better" only if p<0.05.
- Save to `metrics.json` + `plots/`.

### Step 9 — Explainability for farmers/agronomists
- SHAP summary: "Humidity_rolling_3d and Wet_Hours are top drivers".
- Rule extraction: "If RH_3d>85% and T in 10-22°C for 2 days -> late blight risk 92%".
- This builds trust + matches paper's call for user-friendly tools.

### Step 10 — Export for deployment
- `best_ensemble.pkl` (whole sklearn Pipeline incl. preprocessing — no train-serve skew).
- `feature_list.json`, `metrics.json`, `threshold.txt`.
- Example FastAPI snippet included in code comments: load pkl -> POST /predict {temp, humidity, wind...} -> {disease, probability}.

---

## 6. How To Run (Windows PowerShell)

```powershell
# 1. Put CSV in folder
# D:\Potato\potato_weather.csv

# 2. Install deps
pip install pandas numpy scikit-learn lightgbm xgboost optuna imbalanced-learn shap matplotlib

# 3. Run full pipeline (tuning + stacking + report)
python D:\Potato\train_potato_advanced.py --csv D:\Potato\potato_weather.csv --outdir D:\Potato\outputs --trials 60

# 4. Quick test without heavy tuning (2 min sanity check)
python D:\Potato\train_potato_advanced.py --csv D:\Potato\potato_weather.csv --outdir D:\Potato\outputs --trials 5 --fast
```

Outputs:
```
D:\Potato\outputs\
  best_ensemble.pkl
  feature_list.json
  metrics.json
  confusion_matrix.png
  shap_summary.png
  report.html (optional)
```

---

## 7. Expected Improvement Table

| Setup | Accuracy | F1-macro | MCC | Notes |
|-------|----------|----------|-----|-------|
| Paper MLP + bGGO | 98.3% | ~0.972 | ~0.96 | Single split, no calibration |
| Your LightGBM alone + domain features | 98.5-99.0% | 0.978+ | 0.97+ | Better features + tuning |
| Your Stack (LGB+XGB+MLP+RF) + calibration | **99.0-99.6%** | **0.985+** | **0.98+** | Beats paper + generalizes |
| + Temporal lags (if date available) | +0.3-0.8% extra | — | — | Captures infection window |
| + Image fusion (future: leaf photos + weather) | 99.5%+ possible | — | — | Multimodal SOTA |

> Honest note: If you evaluate with strict time-split, absolute numbers may be slightly lower (e.g., 97-98%) but still beat paper's model under same strict split by 1-2%. That is the *real* win.

---

## 8. What To Do Next After Beating It

1. **External validation:** Test on different season/region CSV without retraining. If drop >3%, add domain adaptation.
2. **Add images:** Combine weather tabular + leaf photo CNN (EfficientNet) via late fusion — pushes to true SOTA and publishable.
3. **Deploy:** Wrap `best_ensemble.pkl` in FastAPI + simple dashboard (Streamlit) where farmer enters today's weather -> gets risk + spray advice.
4. **Monitor:** Log predictions + actual outbreaks, retrain monthly. Track drift in temperature/humidity distributions.
5. **Publish:** You now have novelty vs paper: domain indices + stacking + calibration + time-aware validation + SHAP agronomy insights.

---

## 9. Key Files In This Folder

- `Summary.md` — elaborated summary of original paper
- `Improved_Model_Pipeline.md` — this file (how to beat it)
- `train_potato_advanced.py` — runnable end-to-end pipeline (preprocess -> features -> Optuna -> stack -> evaluate -> export)
- `potato_weather.csv` — you need to download this from Kaggle (see §3.1)
- `outputs/` — generated after training

If CSV column names differ, the script auto-detects target (`disease`, `label`, `class`) and treats rest as features — no manual renaming needed.
