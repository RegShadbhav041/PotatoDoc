"""Build the emulator varied-test image set: one shuffled, uniquely-named JPEG per cycle,
with ground truth + API-enumerated expectations for verification.

Output: reports/emulator_set/NN_<label>.jpg + reports/emulator_set/manifest.json
"""
import csv, json, random, shutil
from pathlib import Path

from PIL import Image

BASE = Path("D:/Potato")
OUT = BASE / "reports" / "emulator_set"
OUT.mkdir(parents=True, exist_ok=True)
SEED = 42
E, L, H, U = "Early Blight", "Late Blight", "Healthy", "Unknown"


def read(p):
    with open(p, newline="", encoding="utf-8") as f:
        return list(csv.DictReader(f))


def sample(rows, key, want, rng):
    by = {}
    for r in rows:
        by.setdefault(r[key], []).append(r)
    out = []
    for k in sorted(by):
        grp = sorted(by[k], key=lambda r: r["filepath"])
        out += rng.sample(grp, min(want, len(grp)))
    return out


rng = random.Random(SEED)
picks = []  # (path, tag, native, expected, source)

def add(path, tag, native, expected, source):
    picks.append({"path": str(path), "tag": tag, "native": native,
                  "expected": expected, "source": source})

pv = read(BASE / "PlantVillage_test.csv")
by = {}
for r in pv:
    by.setdefault(r["label"], []).append(r)
for lab, tag, exp, n in (("early_blight", "pv_early", [E], 3),
                         ("late_blight", "pv_late", [L], 3),
                         ("healthy", "pv_healthy", [H], 2),
                         ("non_leaf", "nonleaf_person", [U], 1)):
    for r in rng.sample(sorted(by[lab], key=lambda r: r["filepath"]), n):
        add(r["filepath"], tag, lab, exp, "plantvillage_test")

ir = read(BASE / "Irish_grouped_test.csv")
by = {}
for r in ir:
    by.setdefault(r["label"], []).append(r)
for lab, tag, exp, n in (("early_blight", "irish_early", [E], 1),
                         ("late_blight", "irish_late", [L], 1)):
    for r in rng.sample(sorted(by[lab], key=lambda r: r["filepath"]), n):
        add(r["filepath"], tag, lab, exp, "irish_test")

java = read(BASE / "ext_java.csv")
JEXP = {"healthy": [H], "phytophthora": [L, U], "bacteria": [U], "fungi": [U],
        "virus": [U], "nematode": [U], "pest": [U]}
for lab, n in (("bacteria", 2), ("fungi", 2), ("virus", 2), ("nematode", 1),
               ("pest", 1), ("phytophthora", 1), ("healthy", 1)):
    rows = [r for r in java if r["native_label"] == lab]
    for r in rng.sample(sorted(rows, key=lambda r: r["filepath"]), n):
        add(r["filepath"], f"java_{lab}", lab, JEXP[lab], "ext_central_java")

eb = read(BASE / "ext_eth_bari.csv")
for lab, n in (("bari_bacterial_soft_rot", 1), ("bari_fungal_late_blight", 1),
               ("bari_viral_leaf_roll", 1), ("bari_healthy", 1)):
    rows = [r for r in eb if r["native_label"] == lab]
    for r in rng.sample(sorted(rows, key=lambda r: r["filepath"]), n):
        exp = {"bari_fungal_late_blight": [L, U], "bari_healthy": [H]}.get(lab, [U])
        add(r["filepath"], lab, lab, exp, "ext_ethiopia_bari")

pd_dir = BASE / "_staging" / "plantdoc" / "train"
for cls, tag in (("Apple leaf", "pd_apple"), ("Tomato Septoria leaf spot", "pd_septoria"),
                 ("Corn leaf blight", "pd_corn")):
    files = sorted(f for f in (pd_dir / cls).iterdir()
                   if f.suffix.lower() in (".jpg", ".jpeg", ".png"))
    f = rng.sample(files, 1)[0]
    exp = [L, U] if cls.startswith("Tomato") else [U]
    add(f, tag, cls, exp, "plantdoc_other_crops")

nl = BASE / "non_leaf_v2"
for sub, tag, n in (("soil_ground", "soil", 2), ("animals_people", "animal", 1),
                    ("phone_random", "phone", 1), ("other_leaves", "other_leaf", 1),
                    ("other_crops", "other_crop", 1)):
    files = sorted(f for f in (nl / sub).rglob("*")
                   if f.suffix.lower() in (".jpg", ".jpeg", ".png"))
    for f in rng.sample(files, n):
        add(f, tag, sub, [U], f"non_leaf_v2/{sub}")

rng.shuffle(picks)

api_rows = json.loads((BASE / "reports" / "varied_eval_results.json").read_text())["rows"]
api = {}
for r in api_rows:
    if r["model"] == "ensemble" and r["pred"]:
        api.setdefault(r["path"], {"pred": r["pred"], "conf": r["conf"],
                                   "is_unknown": r["is_unknown"]})

manifest = []
for i, p in enumerate(picks, 1):
    name = f"{i:02d}_{p['tag']}.jpg"
    dst = OUT / name
    if dst.exists():
        dst.unlink()
    im = Image.open(p["path"]).convert("RGB")
    if max(im.size) > 1600:
        im.thumbnail((1600, 1600))
    im.save(dst, "JPEG", quality=90)
    m = dict(p)
    m["push_name"] = name
    m["push_path"] = f"/sdcard/Pictures/{name}"
    m["api_truth"] = api.get(p["path"])
    manifest.append(m)

(OUT / "manifest.json").write_text(json.dumps(manifest, indent=1))
print(f"wrote {len(manifest)} images to {OUT}")
for m in manifest:
    t = m["api_truth"]
    print(f"  {m['push_name']:<26} exp={'|'.join(m['expected']):<22} "
          f"api={t['pred'] if t else 'n/a'}")
