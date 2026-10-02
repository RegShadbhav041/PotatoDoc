# External sweep — retrained outputs_robust with deployed gates

- images evaluated (not in training): 1931
- gates: entropy_max=0.8, prob_min=0.55
- expected mapped to 4-class space; non_leaf expected → Unknown

## Overall: accuracy 94.5% | Unknown rate 92.2%

## Per source

| source | n | accuracy | unknown% |
|---|---|---|---|
| bari_eth | 66 | 65.2% | 59.1% |
| java | 1121 | 96.2% | 92.7% |
| non_leaf_v2 | 614 | 96.1% | 96.1% |
| plantdoc | 130 | 86.9% | 86.9% |

## Per expected class

| expected | n | accuracy | unknown% |
|---|---|---|---|
| healthy | 29 | 44.8% | 55.2% |
| late_blight | 56 | 91.1% | 8.9% |
| non_leaf | 1846 | 95.3% | 95.3% |

## Wrong non-Unknown predictions (top)

| expected | predicted | count |
|---|---|---|
| non_leaf | Healthy | 40 |
| non_leaf | Late Blight | 34 |
| non_leaf | Early Blight | 12 |

## Rejected as Unknown though expected a class (gates)

| expected | count |
|---|---|
| healthy | 16 |
| late_blight | 5 |