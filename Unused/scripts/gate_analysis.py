"""green_ratio + entropy gate analysis over varied_eval_results.json (ensemble rows = per-image)."""
import json
from pathlib import Path
from statistics import mean

rows = [r for r in json.loads(Path("D:/Potato/reports/varied_eval_results.json").read_text())["rows"]
        if r.get("green_ratio") is not None and r["model"] == "ensemble"]

def show(label, srcs):
    v = [r["green_ratio"] for r in rows if r["source"] in srcs]
    e = [r.get("entropy") or 0 for r in rows if r["source"] in srcs]
    if v:
        print(f"{label:<28} n={len(v):>3}  green mean={mean(v):.3f} [{min(v):.3f}..{max(v):.3f}]  "
              f"entropy mean={mean(e):.3f}")

show("real leaves (PV+Irish)", ("plantvillage_test", "irish_test"))
show("java (all)", ("ext_central_java",))
show("bari/ethiopia", ("ext_ethiopia_bari",))
show("soil_ground", ("non_leaf_v2/soil_ground",))
show("animals_people", ("non_leaf_v2/animals_people",))
show("phone_random", ("non_leaf_v2/phone_random",))
show("other_leaves/crops", ("non_leaf_v2/other_leaves", "non_leaf_v2/other_crops"))
show("plantdoc", ("plantdoc_other_crops",))

print("\nsoil_ground detail (ensemble):")
for r in rows:
    if r["source"] == "non_leaf_v2/soil_ground":
        print(f"  {Path(r['path']).name:<28} green={r['green_ratio']:.3f} ent={r.get('entropy')} "
              f"-> {r['pred']} {r['conf']}")

print("\nfalse-Unknown real leaves (ensemble):")
for r in rows:
    if r["expected"] != ["Unknown"] and r["pred"] == "Unknown":
        print(f"  {r['source']}/{Path(r['path']).name:<40} green={r['green_ratio']:.3f} "
              f"ent={r.get('entropy')} exp={r['expected']}")

print("\nleaf entropy distribution:")
for grp, srcs in (("correct", None),):
    pass
ok = [r.get("entropy") or 0 for r in rows if r["expected"] != ["Unknown"] and r["pred"] != "Unknown"]
bad = [r.get("entropy") or 0 for r in rows if r["expected"] != ["Unknown"] and r["pred"] == "Unknown"]
print(f"  non-unknown leaf preds: n={len(ok)} mean_ent={mean(ok):.3f} max={max(ok):.3f}")
if bad:
    print(f"  false-unknown leaves:  n={len(bad)} mean_ent={mean(bad):.3f} min={min(bad):.3f}")
