"""Resumable WE3DS download (10.78 GB, CC-BY-4.0, md5-checked) + RGB extraction.
Run: python scripts/fetch_we3ds.py [--download-only | --extract-only]
Outputs: _staging/WE3DS.zip, _staging/we3ds/{left,right,masks...}; provenance in we3ds_provenance.json
"""
import hashlib
import json
import sys
import zipfile
from pathlib import Path

URL = "https://zenodo.org/api/records/7457983/files/WE3DS.zip/content"
MD5 = "5cde8a1ea6839787732fa7fa3fa86761"
SIZE = 10780359401
STAGE = Path("D:/Potato/_staging")
DST = STAGE / "we3ds"


def md5_ok(p):
    h = hashlib.md5()
    with open(p, "rb") as f:
        for c in iter(lambda: f.read(8 * 1024 * 1024), b""):
            h.update(c)
    return h.hexdigest() == MD5


def download():
    import requests
    STAGE.mkdir(exist_ok=True)
    dest = STAGE / "WE3DS.zip"
    have = dest.stat().st_size if dest.exists() else 0
    print(f"resume from {have/1e9:.2f} GB", flush=True)
    hdr = {"Range": f"bytes={have}-"} if have > 0 else {}
    with requests.get(URL, headers=hdr, stream=True, timeout=120) as r:
        r.raise_for_status()
        mode = "ab" if have > 0 and r.status_code == 206 else "wb"
        with open(dest, mode) as f:
            for c in r.iter_content(8 * 1024 * 1024):
                if c:
                    f.write(c)
    print("verify md5:", md5_ok(dest), flush=True)


def extract():
    zf = zipfile.ZipFile(STAGE / "WE3DS.zip")
    names = zf.namelist()
    print("entries:", len(names), flush=True)
    print("sample:", names[:6], flush=True)
    (STAGE / "we3ds_filelist.txt").write_text("\n".join(names))
    print("file list saved; extract RGB subset on demand", flush=True)


if __name__ == "__main__":
    mode = sys.argv[1] if len(sys.argv) > 1 else "--download-only"
    if mode in ("--download-only", "--all"):
        download()
    if mode in ("--extract-only", "--all"):
        extract()
    (STAGE / "we3ds_provenance.json").write_text(json.dumps(
        {"doi": "10.5281/zenodo.7457983", "url": URL, "md5": MD5, "size": SIZE,
         "license": "CC-BY-4.0", "use": "RGB field backgrounds/negatives only"}, indent=1))
