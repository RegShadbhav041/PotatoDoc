"""Download a fixed Open Images V7 ID list into non_leaf_v2 buckets + manifest rows.
W3 rules: fixed IDs only, manual review AFTER download, license checked per image,
drop illustrations/product shots/irrelevant indoor. Never dump the whole dataset.
Usage: python scripts/fetch_openimages.py --ids openimages_ids.csv
Template columns: image_id,url,oi_label,bucket,license,split(train|openset)
Manifest out: non_leaf_v2/manifest_openimages.csv (same schema + sha256, phash,
manual_review_status, included_in_training, included_in_calibration, included_in_final_test)
"""
import argparse
import csv
import hashlib
import sys
import time
import urllib.request
from pathlib import Path

BASE = Path("D:/Potato")
DST = BASE / "non_leaf_v2"
UA = {"User-Agent": "PotatoDoc-thesis/1.0 (academic non-leaf set; rate-limited fetches)"}


def get(url, dest, tries=4):
    for a in range(tries):
        try:
            req = urllib.request.Request(url, headers=UA)
            with urllib.request.urlopen(req, timeout=120) as r, open(dest, "wb") as fh:
                while True:
                    c = r.read(4 * 1024 * 1024)
                    if not c:
                        break
                    fh.write(c)
            return True
        except Exception as e:  # noqa: BLE001
            time.sleep(2 ** a * 3)
            if a == tries - 1:
                print(f"SKIP {dest.name}: {e}", flush=True)
    return False


def sha(p):
    h = hashlib.sha256()
    with open(p, "rb") as f:
        for c in iter(lambda: f.read(8 * 1024 * 1024), b""):
            h.update(c)
    return h.hexdigest()


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--ids", required=True)
    a = ap.parse_args()
    rows = list(csv.DictReader(open(a.ids)))
    # only rows not already downloaded (resumable; skips 429-blocked reruns cheaply)
    rows = [r for r in rows if not (DST / r["bucket"] / f"oi_{r['image_id']}.jpg").exists()]
    print(f"to fetch: {len(rows)}", flush=True)
    out_rows = []
    for n, r in enumerate(rows):
        bdir = DST / r["bucket"]
        bdir.mkdir(parents=True, exist_ok=True)
        dest = bdir / f"oi_{r['image_id']}.jpg"
        url = r.get("thumb_url") or r["url"]  # thumbnails first: smaller, kinder host
        if not get(url, dest):
            continue
        time.sleep(1.5)  # stay under Flickr rate limits
        try:
            from PIL import Image
            import imagehash
            ph = str(imagehash.phash(Image.open(dest).convert("L")))
        except Exception:  # noqa: BLE001
            ph = ""
        out_rows.append({"dataset_name": "openimages_v7", "dataset_version": "v7",
                         "source_url": r["url"], "download_date": "",
                         "native_label": r["oi_label"], "mapped_label": "non_leaf",
                         "image_id": r["image_id"], "original_filename": dest.name,
                         "sha256": sha(dest), "perceptual_hash": ph,
                         "source_split": r.get("split", "openset"),
                         "manual_review_status": "pending",
                         "license": r.get("license", "CHECK-REQUIRED"),
                         "included_in_training": "0", "included_in_calibration": "0",
                         "included_in_final_test": "0"})
        print(f"OK {r['image_id']} -> {r['bucket']}", flush=True)
    if not out_rows:
        print("nothing new downloaded")
        return
    with open(DST / "manifest_openimages.csv", "w", newline="") as f:
        w = csv.DictWriter(f, fieldnames=list(out_rows[0].keys()))
        w.writeheader()
        w.writerows(out_rows)
    print(f"wrote manifest_openimages.csv ({len(out_rows)} rows) — MANUAL REVIEW STILL REQUIRED")


if __name__ == "__main__":
    if len(sys.argv) < 3:
        print(__doc__)
    else:
        main()
