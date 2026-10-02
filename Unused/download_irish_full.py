"""Download remaining Irish Potato zips from Zenodo (resumable, md5-checked)."""
import hashlib, os, sys, zipfile
from pathlib import Path
try:
    import requests
except ImportError:
    print("pip install requests"); sys.exit(1)

BASE="https://zenodo.org/api/records/17553016/files"
OUT=Path("D:/Potato/IrishPotato37G/_zips"); OUT.mkdir(parents=True, exist_ok=True)
# (filename, md5, size)
FILES=[
 ("LATEBLT_6.zip","bd170633716f387cc6df8fae431f1877",138650858),
 ("HEALTHY_6.zip","7d3f17811268f843301ff76b6960e6f1",513156605),
 ("HEALTHY_5.zip","3baf516cafdc126acb6f8fbd44665ff2",723594084),
 ("HEALTHY_1.zip","fff8533b933a486ded9a2dc0829117ad",815894621),
 ("HEALTHY_4.zip","d284a50e2a24d64543845016f8e1bef4",821118411),
 ("HEALTHY_3.zip","c6ea7a6640e1df97ce63ac6d39debadc",870267010),
 ("HEALTHY_2.zip","6f47acba529fe57c51c1ea7434ef9c7b",903515865),
 ("LATEBLT_1.zip","0c342a1e0860374889e3fff23fc54849",2123595971),
 ("EARLYBLT_1.zip","f46ec2346858f6043a7056e9b1c4a39e",2045507285),
 ("LATEBLT_2.zip","c80147ae7b4bb6284c8c4493ce8294bd",2212413795),
 ("LATEBLT_5.zip","0428df0c6959769f95bac512bc42720d",2197961795),
 ("EARLYBLT_6.zip","f6e670589e19f5485e4570ad936f1435",2170672220),
 ("EARLYBLT_2.zip","300068d6f6d70f9ecdd66e2e697a1074",2356805104),
 ("EARLYBLT_5.zip","16f93049aaeaac8633c6935b5bb4f727",2354022251),
 ("EARLYBLT_4.zip","b005aa5cc30b185cbadd7be6b3d9ff89",2376023901),
 ("LATEBLT_3.zip","74b9a947e807f241840b5d83f4249513",2399523661),
 ("EARLYBLT_7.zip","53089ea6f3b754200c159c44b69a98ac",2429110634),
 ("EARLYBLT_3.zip","d037b9aa29413830a32f0d2f96404d8c",2457596748),
 ("LATEBLT_4.zip","5506e52c0d572c285f29b33c46e11aa1",2525244808),
 ("EARLYBLT_9.zip","f910e538eab07ff73ce04be864cfcb9e",1841750255),
 ("EARLYBLT_8.zip","768929cb1f4bd85855ba1ced82d26150",3222382486),
]
def md5_ok(p, expect):
    h=hashlib.md5()
    with open(p,'rb') as f:
        for c in iter(lambda: f.read(8*1024*1024), b''): h.update(c)
    return h.hexdigest()==expect

only=sys.argv[1:] or None
for key,md5,size in FILES:
    if only and key not in only: continue
    dest=OUT/key
    url=f"{BASE}/{key}/content"
    # resume
    have=dest.stat().st_size if dest.exists() else 0
    if dest.exists() and have==size and md5_ok(dest,md5):
        print(f"OK present {key}"); continue
    print(f"GET {key} ({size/1e9:.2f} GB, resume from {have})")
    hdr={"Range":f"bytes={have}-"} if have>0 else {}
    with requests.get(url,headers=hdr,stream=True,timeout=60) as r:
        r.raise_for_status()
        mode="ab" if have>0 and r.status_code==206 else "wb"
        with open(dest,mode) as f:
            for c in r.iter_content(8*1024*1024):
                if c: f.write(c)
    print("verify",key,md5_ok(dest,md5))
print("done")
