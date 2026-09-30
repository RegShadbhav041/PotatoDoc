"""Aggregate risk analysis over reports/varied_eval_results.json (written by scripts/varied_eval.py)."""
import json
from pathlib import Path

rows = [r for r in json.loads(Path("D:/Potato/reports/varied_eval_results.json").read_text())["rows"] if r["pred"]]
MODELS = ["small_cnn", "mobilenetv2", "efficientnetb0", "ensemble"]
NAME = dict(zip(MODELS, ["SmallCNN", "MobileNetV2", "EffNetB0", "Ensemble"]))

print("=== risk breakdown per model ===")
hdr = f"{'model':<12} {'OOD->disease':<18} {'OOD->Unknown':<18} {'leaf->wrongDx':<18} {'leaf->Unknown':<18} {'leaf->correct':<14}"
print(hdr)
for m in MODELS:
    sub = [r for r in rows if r["model"] == m]
    ood = [r for r in sub if r["expected"] == ["Unknown"]]
    leaf = [r for r in sub if r["expected"] != ["Unknown"]]
    ood_dis = [r for r in ood if r["pred"] != "Unknown"]
    ood_unk = [r for r in ood if r["pred"] == "Unknown"]
    leaf_ok = [r for r in leaf if r["pred"] in r["expected"]]
    leaf_unk = [r for r in leaf if r["pred"] == "Unknown"]
    leaf_wrong = [r for r in leaf if r["pred"] not in r["expected"] and r["pred"] != "Unknown"]
    n_o, n_l = len(ood), len(leaf)
    print(f"{NAME[m]:<12} {len(ood_dis):>3}/{n_o} ({len(ood_dis)/n_o:.0%})".ljust(30)
          + f"{len(ood_unk):>3}/{n_o} ({len(ood_unk)/n_o:.0%})".ljust(34)
          + f"{len(leaf_wrong):>3}/{n_l} ({len(leaf_wrong)/n_l:.0%})".ljust(34)
          + f"{len(leaf_unk):>3}/{n_l} ({len(leaf_unk)/n_l:.0%})".ljust(34)
          + f"{len(leaf_ok):>3}/{n_l} ({len(leaf_ok)/n_l:.0%})")

print("\n=== dangerous: OOD called a disease with conf>=0.70 ===")
for m in MODELS:
    bad = sorted([r for r in rows if r["model"] == m and r["expected"] == ["Unknown"]
                  and r["pred"] != "Unknown" and r["conf"] >= 0.70], key=lambda r: -r["conf"])
    worst = ", ".join(f"{r['native']}->{r['pred']} {r['conf']:.2f}" for r in bad[:5])
    print(f"{NAME[m]}: {len(bad)} cases; worst: {worst}")

print("\n=== in-distribution (PV+Irish) exact-class errors ===")
for m in MODELS:
    bad = [r for r in rows if r["model"] == m and r["source"] in ("plantvillage_test", "irish_test")
           and r["native"] in ("early_blight", "late_blight", "healthy") and r["pred"] not in r["expected"]]
    txt = "; ".join(f"{r['native']}->{r['pred']} {r['conf']:.2f}" for r in bad)
    print(f"{NAME[m]}: {len(bad)} -> {txt}")

print("\n=== external healthy (java/bari/ethiopia): wrong, as disease vs Unknown ===")
for m in MODELS:
    bad = [r for r in rows if r["model"] == m
           and r["native"] in ("healthy", "bari_healthy", "ethiopia_healthy")
           and r["pred"] not in r["expected"]]
    dis = [r for r in bad if r["pred"] != "Unknown"]
    txt = "; ".join(f"{r['native']}->{r['pred']} {r['conf']:.2f}" for r in dis)
    print(f"{NAME[m]}: {len(bad)} wrong ({len(dis)} as disease) -> {txt}")

print("\n=== OOD categories: ensemble disease-call rate (danger) ===")
by_src = {}
for r in rows:
    if r["model"] != "ensemble" or r["expected"] != ["Unknown"]:
        continue
    by_src.setdefault(r["native"], []).append(r["pred"] != "Unknown")
for k in sorted(by_src):
    v = by_src[k]
    print(f"  {k:<32} {sum(v):>2}/{len(v)} ({sum(v)/len(v):.0%}) called a disease")
