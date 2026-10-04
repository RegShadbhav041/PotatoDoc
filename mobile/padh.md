Yo तपाईंको viva / interview answer script jasto banayo — romanized ma, English words sanga. Yaad garna saknuhos, kura sunincha.
३०-सेकेन्डको छोटो answer (pahilo prashna ko lagi)
"Mero pipeline ma maile three-model ensemble banayeu — euta custom small CNN (random init bata), aru dui wota ImageNet pretrained model, MobileNetV2 ra EfficientNetB0. Tinjana ko prediction ko soft-voting average liyera final output dinchu. Training ma AdamW optimizer, class-weighted cross-entropy with label smoothing, strong augmentation, ra early stopping on validation macro-F1 use garey. Final model lai FastAPI backend ma deploy garera mobile app bata chalinchha."
Eutai paragraph le pailo parda gardinchha. Aba detail ma jane ho bhane nicherko structure follow garnus:
Step-by-step answer (gahiro prashna aayo bhane)
1. Data kasto thyo?
"Irish dataset (thulo, real-world) + PlantVillage (sano, clean) use gare. Labels 3 wota thyo: Early Blight, Late Blight, Healthy. Tara class imbalance thyo — healthy ko photo dherai. Tyasailai handle garna stratified 80/10/10 split garey seed 42 le, ra class weights (N/count per class) lagaye."
2. Preprocessing / augmentation k k garey?
"Eval ma resize + center crop + ImageNet normalization. Train ma matra RandomResizedCrop, horizontal flip, rotation, color jitter, Gaussian blur, sharpness/autocontrast, random erasing — sabai train-only augmentation. Uddesya thiyo domain generalization: model le background, lighting, compression cue ma najhukos, leaf ko texturebata matra bujhos."
3. Model architecture k ho?
"Tin wota:
- M1 — custom SmallCNN: 4 conv blocks (32→256), BatchNorm, MaxPool, dropout, feri 256→128→3 dense head. Random init, kina ki transfer bina pani chalcha ki bhayera prove garna.
- M2 — MobileNetV2 ra M3 — EfficientNetB0: ImageNet pretrained weights, last classification layer matra replace garey (nn.Linear(last_channel, 3)), baaki fine-tune.

Dui approach jodera diversity aunchha — tyahi ensemble ko strength ho."
4. Training algorithms / tricks k k use gare?
"List garda:
- Optimizer: AdamW (weight_decay=1e-4)
- Loss: weighted CrossEntropyLoss + label_smoothing=0.1; experimental option ma Focal loss ra WeightedRandomSampler oversampling pani rakheko (imbalanced non_leaf class ko lagi)
- Scheduler: ReduceLROnPlateau (val loss patience 3, factor 0.3)
- Mixed precision: torch.amp autocast + GradScaler (CUDA ma)
- Regularization: heavy augmentation, dropout 0.4, weight decay, label smoothing
- Early stopping: validation macro-F1 ma patience 7–8; best.pt = best epoch ko checkpoint
- Reproducibility: seed 42 + deterministic cuDNN
- Resume: har ek epoch ma resume.pt — power loss bhaye pani continue"
5. Ensemble kasari gare?
"Test image bata each model le softmax probability nikalyo, feri element-wise mean garyo — yo nai soft voting. Extra training lagdaina. Ensemble le generally single model bhanda badi robust hunchha, kina ki tin wota alag-alag inductive bias le galti eklai garchha."
6. Evaluation kasto gare?
"Test split ma accuracy, balanced accuracy, macro/weighted F1, MCC, per-class F1, confusion matrix, ROC-AUC (one-vs-rest) nikaley. Class imbalance le accuracy misleading banaucha, tesailai primary metric macro-F1 rakhey — training pani tyasaima early-stop hunchha."
7. Calibration / post-processing?
"Raw softmax directly trust garchhaina. Validation logits bata temperature/threshold fit garne (test ma hoina — tyo data leakage hunthyo), ra backend ma thresholds.json le entropy gate (ENT_MAX) + min probability gate (PROB_MIN) lagaudicha. Low-confidence prediction ma model 'Not sure' bhanna sakcha."
8. Deployment?
"Winner weights outputs_combined/ ma jancha. Backend le FastAPI ma load garchha, /predict le per-model probability pauchha, ensemble average garchha, ra mobile app (React Native) le result dekhauchha. Plus GradCAM pani banako chha explainability ko lagi."
Interviewer le sodhna sakne 10 prashna + jawaf
#	Prashna
1	"Why ensemble?"
2	"Why transfer learning?"
3	"Overfitting kaise rokyou?"
4	"Imbalance kasto handle gare?"
5	"Why macro-F1 and not accuracy?"
6	"Transformers (ViT) kina use gareko chaina?"
7	"Reproducibility?"
8	"Sabai bhanda garo challenge k thiyo?"
9	"Accuracy kati aayo?"
10	"Model kaha chalcha?"
Yaad rakhnu milne punchy lines
- "Imbalance cha bhane accuracy hoina, macro-F1 nai metric ho"
- "Augmentation train-only — test ma kei ni gardina, tyo leakage ho"
- "Threshold validation ma fit garchu, test ma hoina"
- "Ensemble = free lunch — training nai lagdaina"
- "best.pt nai deploy hunchha, last.pt hoina"
Tips: (1) metrics.json kholi aafno real number yaad garau — fake number pakro bhayo bhane bigrincha; (2) pahilo 30-second answer ratayera rakhnuhos, aghi jasto an structure ma details aafai auchha; (3) "kina yo?" wala prashna sabai bhanda badi sodya inchan — vyapak bhanda vyapak macro-F1, ensemble, augmentation tinta ko reasoning clear bhayo bhane dami janchha.