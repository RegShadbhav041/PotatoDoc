"""Download a Mendeley Data public dataset by ID into _staging/<name>/ byt folder_id.
Uses public-api (no login): per-file download_url + sha256 from metadata.
Writes file_index.json (folder_id -> files) for later native-label mapping.
Usage: python scripts/fetch_mendeley.py <dataset_id> <name>
e.g. python scripts/fetch_mendeley.py ptz377bwb8 central_java
"""
import hashlib
import json
import sys
import urllib.request
from pathlib import Path

BASE = Path("D:/Potato/_staging")


def get(url):
    req = urllib.request.Request(url, headers={"User-Agent": "PotatoDoc-thesis/1.0"})
    return json.loads(urllib.request.urlopen(req, timeout=120).read())


def sha(p):
    h = hashlib.sha256()
    with open(p, "rb") as f:
        for c in iter(lambda: f.read(8 * 1024 * 1024), b""):
            h.update(c)
    return h.hexdigest()


def main():
    dsid, name = sys.argv[1], sys.argv[2]
    out = BASE / name
    out.mkdir(parents=True, exist_ok=True)
    meta = get(f"https://data.mendeley.com/public-api/datasets/{dsid}")
    (out / "dataset_meta.json").write_text(json.dumps(
        {k: meta.get(k) for k in ("id", "doi", "name", "description", "data_licence",
                                  "publish_date", "size")}, indent=1))
    files = meta["files"]
    print(f"{name}: {len(files)} files", flush=True)
    idx = {}
    for i, f in enumerate(files):
        fid = f.get("folder_id", "root")[:8]
        cd = f["content_details"]
        dest = out / fid / f["filename"]
        dest.parent.mkdir(exist_ok=True)
        if not (dest.exists() and dest.stat().st_size == cd["size"]):
            req = urllib.request.Request(cd["download_url"],
                                         headers={"User-Agent": "PotatoDoc-thesis/1.0"})
            with urllib.request.urlopen(req, timeout=300) as r, open(dest, "wb") as fh:
                while True:
                    c = r.read(8 * 1024 * 1024)
                    if not c:
                        break
                    fh.write(c)
        ok = sha(dest) == cd["sha256_hash"]
        idx.setdefault(fid, []).append({"file": f["filename"],
                                        "sha_ok": ok, "size": cd["size"]})
        if not ok:
            print(f"  HASH MISMATCH {f['filename']}", flush=True)
        if (i + 1) % 250 == 0:
            print(f"  {i+1}/{len(files)}", flush=True)
    (out / "file_index.json").write_text(json.dumps(idx, indent=1))
    bad = sum(1 for v in idx.values() for r in v if not r["sha_ok"])
    print(f"done: {len(files)} files, sha mismatches: {bad}", flush=True)


if __name__ == "__main__":
    main()
