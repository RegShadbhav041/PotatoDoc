# EXT Report — External + Open-Set Evaluation (frozen grouped weights, `outputs_irish_grouped/`)

**Date:** 2026-09-26 · **Models:** M1/M2/M3 + soft-vote ensemble (Track A, grouped-train)
**Gate:** heuristic Unknown rule (normalized entropy > 0.85 or maxprob < 0.55).
No tuning on any external data. Native labels preserved verbatim — no forced mapping.

## A. Open-set rejection (`ext_openset_results.json`, n=590 locked, sha `89f9f6…`)

| bucket | n | →Non-Leaf | unknown rate |
|---|---|---|---|
| animals_people (OI) | 215 | 100% | 0.0% |
| phone_random (OI) | 76 | 100% | 1.3% |
| other_crops (OI) | 51 | 96% | 2.0% |
| soil_ground (WE3DS) | 150 | 91% | 26.0% |
| other_leaves (PlantDoc) | 98 | 72% | 22.5% |

Foreign leaves are the hardest negatives (27/98 leak to disease classes, mostly Late
Blight) — expected: they share leaf texture. Soil never reaches a confident disease
call at scale but is the least certain bucket (maxprob 0.67).

## B. External potato field (native labels kept)

**Central Java** (`ext_java_results.json`, n=3076, CC BY 4.0, paper Table 1 counts
matched exactly): phytophthora → Late Blight 55% (affinity noted, NOT counted as
correct); fungi split LB 44%/Non-Leaf 47%; bacteria → Non-Leaf 93% (good unseen-disease
rejection); healthy → Healthy only 23% (weak — stated); overall Unknown 32%.
Early Blight predictions abroad: Java 88/3076 (2.9%; fungi 46, pest 17, nematode 20,
virus 3, bacteria 1, phytophthora 1), Ethiopia 1/430, BARI 0/84 — but no external set
carries early-blight ground truth, so external EB recall is unmeasurable (low EB
false-positive rate is the valid reading; expert relabel of Java fungi would be needed
for sensitivity).
**Ethiopia** (n=430): healthy → Healthy 78% (284/363); late blight → Late Blight 81%
(54/67) — genuine external generalization on target classes.
**BARI originals** (n=84, not 804 — this mirror holds 84 originals + 2,267 augmented,
augmented excluded): late blight → LB 12/20; viral/bacterial mostly Non-Leaf/Unknown
(good open-set behavior); tiny-n, indicative only.

## C. Formal in-domain grouped result (reference)

`IR_report.md §7`: grouped-test n=962, M3 .9896 (Wilson95 [.9810, .9943]) / Ens .9865;
frozen random-split weights collapse to ~.39–.40 (leakage proof).

## D. Combined-weights re-eval (2026-09-27, `outputs_combined/`)
Ethiopia healthy 85% (310/363, was 78%) / late blight 100% (67/67, was 81%) — combined
training helped externally. Java phytophthora→LB 76% (was 55%), healthy→H 30% (was 23%).
BARI: near-total uncertainty (90–100% unknown; maxprob ~0.42–0.56) — honest domain limit.
Open-set: animals/phone 100%, crops 94%, leaves 64% (was 72%). REGRESSION: soil→Healthy
59% (was 91% rejected) — PV lab data shifted soil behavior; flagged for the quality-gate
and 4th-head retrain, not hidden.

## Files & reproduction

`central_java_manifest.csv` (folder→label via paper Table 1 counts + visual corroboration) ·
`external_manifests.csv` (3,590 rows) · `non_leaf_openset.csv` (locked, sha `89f9f6…`) ·
`non_leaf_v2_manifest.csv` (1,179, review pending-human) · `ext_{java,eth_bari,openset}_results.json` ·
`experiment_registry.csv`. Eval: `python scripts/eval_external.py <manifest> <out.json>`.
Limits: Java folder mapping is count+visual (no per-image source labels published);
BARI originals n=84; OI generic images are not farm-specific; human visual review of
non_leaf_v2 still open (user pass).
Declared scope gaps (not failures): 9 negative buckets empty (hands_gloves, farm_tools,
low_light, blurred, overexposed, tubers, multi_leaf, screenshots_indoor,
empty_background) — shoot list in `non_leaf_v2/SHOOT_LIST.md`; current rejection claims
cover only the 5 filled buckets + COCO persons. Track B full-data training pending.

## Phase 2 closure (2026-09-26)
Phase 2 is closed with the above declared limitations: external acquisition + eval (B3),
negatives acquisition + locked open set (B1/B2, 5 buckets), and this report (B4) are done;
the 9-bucket shoot list and full human review pass transfer to user-scheduled future work.
