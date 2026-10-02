"""Full external-image sweep with the retrained model (outputs_robust) using EXACT
backend transforms + deployed gates. Offline batched (fast), reports per-source
accuracy / Unknown rate / confusion. Writes reports/external_sweep_report.md"""
import csv
import json
import math
import sys
from collections import Counter, defaultdict
from pathlib import Path

import numpy as np
import torch
from PIL import Image
from torchvision import transforms

sys.path.insert(0, r'D:\Potato')
from train_image import build_model

BASE = Path(r'D:\Potato')
API = ['Early Blight', 'Late Blight', 'Healthy', 'Non-Leaf']
MID = ['small_cnn', 'mobilenetv2', 'efficientnetb0']
MEAN = [0.485, 0.456, 0.406]; STD = [0.229, 0.224, 0.225]
EXP2API = {'early_blight': 'Early Blight', 'late_blight': 'Late Blight', 'healthy': 'Healthy', 'non_leaf': 'Unknown'}
gates = json.loads((BASE / 'outputs_robust' / 'thresholds.json').read_text())
EM, PM = gates['entropy_max'], gates['prob_min']
device = torch.device('cuda')

JAVA_MAP = {'healthy': 'healthy', 'phytophthora': 'late_blight', 'fungi': 'non_leaf',
            'bacteria': 'non_leaf', 'virus': 'non_leaf', 'nematode': 'non_leaf', 'pest': 'non_leaf'}
BARI_MAP = {'ethiopia_healthy': 'healthy', 'ethiopia_late_blight': 'late_blight',
            'bari_healthy': 'healthy', 'bari_fungal_late_blight': 'late_blight',
            'bari_bacterial_soft_rot': 'non_leaf', 'bari_viral_leaf_roll': 'non_leaf',
            'bari_viral_pvx': 'non_leaf', 'bari_viral_pvy': 'non_leaf'}

items = []  # (path, expected_api, source)
def rd(p):
    return list(csv.DictReader(open(p, encoding='utf-8')))

for r in rd(BASE / 'ext_java.csv'):
    lab = JAVA_MAP.get(r['native_label'])
    if lab and Path(r['filepath']).exists():
        items.append((r['filepath'], lab, 'java'))
for r in rd(BASE / 'ext_eth_bari.csv'):
    lab = BARI_MAP.get(r['native_label'])
    if lab and Path(r['filepath']).exists():
        items.append((r['filepath'], lab, 'bari_eth'))
for d in sorted((BASE / '_staging' / 'plantdoc' / 'train').iterdir()):
    if d.is_dir():
        for f in sorted(d.iterdir()):
            if f.suffix.lower() in ('.jpg', '.jpeg', '.png'):
                items.append((str(f), 'non_leaf', 'plantdoc'))
for d in sorted((BASE / 'non_leaf_v2').iterdir()):
    if d.is_dir():
        for f in sorted(d.rglob('*')):
            if f.suffix.lower() in ('.jpg', '.jpeg', '.png'):
                items.append((str(f), 'non_leaf', 'non_leaf_v2'))

# exclude robust train/val/test (sweep = unseen-by-training eval where possible)
seen = set()
for csvn in ('robust_train.csv', 'robust_val.csv', 'robust_ext_test.csv'):
    seen |= {r['filepath'] for r in rd(BASE / csvn)}
trained = sum(1 for p, _, _ in items if p in seen)
items_tr = [i for i in items if i[0] not in seen]
print(f'sweep: {len(items)} total, {trained} were in training (reported separately), eval {len(items_tr)}')

models = []
for m in MID:
    ck = torch.load(BASE / 'outputs_robust' / m / 'best.pt', map_location=device, weights_only=False)
    net = build_model(m, int(ck.get('n_classes', 4))).to(device)
    net.load_state_dict(ck['state']); net.eval(); models.append(net)

tfms = []
for m in MID:
    norm = transforms.Normalize(MEAN, STD) if m != 'small_cnn' else transforms.Normalize([0.5]*3, [0.5]*3)
    tfms.append(transforms.Compose([transforms.Resize(int(224*1.14)), transforms.CenterCrop(224),
                                    transforms.ToTensor(), norm]))

def predict_batch(imgs):
    outs = []
    for net, tf in zip(models, tfms):
        x = torch.stack([tf(im) for im in imgs]).to(device)
        with torch.no_grad():
            outs.append(torch.softmax(net(x), 1).cpu().numpy())
    return outs[0] + outs[1] + outs[2]

def final(p):
    mx = float(p.max()); q = np.clip(p, 1e-9, 1)
    ent = float(-(q * np.log(q)).sum() / math.log(4))
    pred = API[int(p.argmax())]
    if pred == 'Non-Leaf':
        return 'Unknown', True, 'gate2'
    if ent > EM or mx < PM:
        return 'Unknown', True, 'gate3'
    return pred, False, 'pass'

rows_out = []
B = 64
for i in range(0, len(items_tr), B):
    chunk = items_tr[i:i+B]
    imgs = []
    keep_idx = []
    for j, (p, _, _) in enumerate(chunk):
        try:
            imgs.append(Image.open(p).convert('RGB')); keep_idx.append(j)
        except Exception:
            pass
    if not imgs:
        continue
    proba = predict_batch(imgs)
    for k, j in enumerate(keep_idx):
        path, exp, src = chunk[j]
        pred, unk, gate = final(proba[k])
        conf = float(proba[k].max())
        rows_out.append({'source': src, 'expected': exp, 'pred': pred, 'conf': round(conf, 3),
                         'gate': gate, 'ok': (pred == EXP2API.get(exp, exp)) or (exp == 'non_leaf' and unk)})
    if i % 512 == 0:
        print(f'{i}/{len(items_tr)}', flush=True)

json.dump(rows_out, open(BASE / 'reports' / 'external_sweep_results.json', 'w'), indent=1)

# ---- report ----
L = ['# External sweep â€” retrained outputs_robust with deployed gates', '',
     f"- images evaluated (not in training): {len(rows_out)}", f"- gates: entropy_max={EM}, prob_min={PM}",
     f"- expected mapped to 4-class space; non_leaf expected â†’ Unknown", '']
acc = sum(r['ok'] for r in rows_out) / len(rows_out)
unk = sum(r['pred'] == 'Unknown' for r in rows_out) / len(rows_out)
L += [f"## Overall: accuracy {acc:.1%} | Unknown rate {unk:.1%}", '', '## Per source', '',
      '| source | n | accuracy | unknown% |', '|---|---|---|---|']
for s in sorted({r['source'] for r in rows_out}):
    rs = [r for r in rows_out if r['source'] == s]
    a = sum(r['ok'] for r in rs) / len(rs)
    u = sum(r['pred'] == 'Unknown' for r in rs) / len(rs)
    L.append(f'| {s} | {len(rs)} | {a:.1%} | {u:.1%} |')
L += ['', '## Per expected class', '', '| expected | n | accuracy | unknown% |', '|---|---|---|---|']
for e in ['healthy', 'late_blight', 'early_blight', 'non_leaf']:
    rs = [r for r in rows_out if r['expected'] == e]
    if not rs:
        continue
    a = sum(r['ok'] for r in rs) / len(rs)
    u = sum(r['pred'] == 'Unknown' for r in rs) / len(rs)
    L.append(f'| {e} | {len(rs)} | {a:.1%} | {u:.1%} |')
L += ['', '## Wrong non-Unknown predictions (top)', '',
      '| expected | predicted | count |', '|---|---|---|']
bad = Counter((r['expected'], r['pred']) for r in rows_out if not r['ok'] and r['pred'] != 'Unknown')
for (e, p), n in bad.most_common(10):
    L.append(f'| {e} | {p} | {n} |')
L += ['', '## Rejected as Unknown though expected a class (gates)', '',
      '| expected | count |', '|---|---|']
rej = Counter(r['expected'] for r in rows_out if r['pred'] == 'Unknown' and r['expected'] != 'non_leaf')
for e, n in rej.most_common():
    L.append(f'| {e} | {n} |')
Path(BASE / 'reports' / 'external_sweep_report.md').write_text('\n'.join(L))
print('\n'.join(L[:30]))
print('-> reports/external_sweep_report.md')
