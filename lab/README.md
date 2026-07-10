# Hands-on dbt engineering lab

This folder is a complete, runnable analytics-engineering project. It uses
DuckDB by default, can run the same graph in PostgreSQL, and can extract the
same six source tables from a MySQL OLTP service.

## Fastest path

From the repository root:

```bash
python scripts/lab.py doctor
python scripts/lab.py quickstart
python scripts/lab.py docs-generate
python scripts/lab.py docs-serve
```

Open `http://localhost:8080` for dbt's generated lineage catalog. Docker is the
default execution mode. Add `--local` to use a local `.venv` instead:

```bash
python scripts/lab.py setup --local
python scripts/lab.py build --local
```

The runner passes argument lists directly to subprocesses with `shell=False`.
Its command and option sets are allowlisted; it does not execute arbitrary
shell text.

## Three database roles

| System | Course role | Start or run |
| --- | --- | --- |
| DuckDB | Zero-setup analytical warehouse and default dbt target (`dev`) | `python scripts/lab.py build` |
| PostgreSQL | Optional production-like analytical warehouse (`postgres`) | `python scripts/lab.py postgres-build` |
| MySQL | OLTP source system to practice extraction boundaries | `python scripts/lab.py load-mysql` |

To complete the MySQL source-to-DuckDB path:

```bash
python scripts/lab.py load-mysql
python scripts/lab.py extract-mysql
python scripts/lab.py build-extract
```

This intentionally separates operational ingestion from dbt transformation.
dbt does not use MySQL as a target in this course.

## Data truthfulness

The six files in `seeds/` are deterministic, realistic **synthetic training
data**. Names, emails, orders, payments, and returns are invented; `.test`
email addresses cannot receive mail. They are bundled so every lesson works
offline after dependencies are installed.

The repository also includes a small attributed real-data sample under
`data/real/` and a download-on-demand importer for the full UCI Online Retail
dataset. See [`../data/README.md`](../data/README.md) before using either one.

## Useful commands

```text
doctor              validate Python and Docker/local prerequisites
setup               build the dbt image and install dbt packages
quickstart          setup plus a complete dbt build
seed/run/test/build execute the matching dbt command
docs-generate       build the catalog and lineage metadata
docs-serve          serve dbt docs on localhost:8080
services-up/down    manage the MySQL and PostgreSQL services
load-mysql          load synthetic seeds into MySQL
extract-mysql       extract allowlisted MySQL tables to local CSV
build-extract       transform the MySQL extract in DuckDB
postgres-build      build the full project in PostgreSQL
import-uci          download and convert the complete public UCI dataset
build-uci           build the opt-in full UCI DuckDB models
build-uci-sample    build the opt-in bundled UCI sample models
generate-synthetic  recreate the synthetic seeds using the fixed generator
status/clean        inspect services or remove generated dbt/DuckDB artifacts
```

`seed`, `run`, `test`, and `build` accept a dbt selector without shell
interpolation, for example:

```bash
python scripts/lab.py build --select fct_orders+
```

## Learning order

Read [`course/COURSE.md`](course/COURSE.md), complete the challenges in
`exercises/`, and compare only after attempting them with `solutions/`. Copy a
starter SQL file into `models/` when an exercise asks you to activate it.
