# Course data and provenance

This repository deliberately separates synthetic training fixtures from public
observed data.

## Bundled synthetic commerce data

`lab/seeds/{customers,products,orders,order_items,payments,returns}.csv` are
deterministically generated teaching fixtures. They are **not real transactions,
customers, payments, or returns**. See `SYNTHETIC_DATA.md` for generation rules,
limitations, and row counts.

## Bundled real sample

`data/real/uci_online_retail_sample.csv` is a small reproducible sample from the
UCI Online Retail dataset. It is real public transaction data, not a claim that
the records are current or representative. Preserve the citation and license:

- Chen, D. (2015). *Online Retail* [Dataset]. UCI Machine Learning Repository.
- DOI: <https://doi.org/10.24432/C5BW33>
- Dataset page: <https://archive.ics.uci.edu/dataset/352/online-retail>
- License: Creative Commons Attribution 4.0 International (CC BY 4.0),
  <https://creativecommons.org/licenses/by/4.0/>

`scripts/prepare_uci_sample.py` documents the deterministic selection used by
this repository.

## Optional full real dataset

Run:

```bash
python scripts/lab.py import-uci
```

The download-on-demand importer fetches the official UCI archive, converts the
XLSX to `data/uci_online_retail/online_retail.csv`, computes the downloaded
archive SHA-256, and records retrieval metadata. Downloaded data is ignored by
Git because the converted file is large and upstream remains the authority.

To build only the DuckDB real-data models with the full download:

```bash
python scripts/lab.py build-uci
```

To use the bundled sample without a download, run:

```bash
python scripts/lab.py build-uci-sample
```

The real-data models are disabled by default so the normal course remains
reproducible and does not imply that UCI fields match the six-table synthetic
schema.
