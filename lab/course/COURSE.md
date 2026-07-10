# Data Engineering with dbt: lab curriculum

The course is designed for roughly 24-32 focused hours. Each module follows a
short loop: learn the concept, predict the result, implement it, run dbt, inspect
the warehouse, and explain what production concern the pattern addresses.

This lab workbook uses 14 execution stages so environment setup and real-data
provenance can stand alone. They map back to the frontend's 12 learning modules;
they are additional practical checkpoints, not a second competing curriculum.

## 1. Warehouse orientation and SQL grain (60-90 min)

**Outcomes:** identify DuckDB, PostgreSQL, and MySQL responsibilities; define
the grain of all six source tables; recognize primary and foreign keys.

1. Run `python scripts/lab.py quickstart`.
2. Inspect the seed headers and draw their entity relationship diagram.
3. Query `fct_orders` and explain why `order_id` is unique but `customer_id` is not.
4. Complete Exercise 1.

Production lens: grain mistakes are often more expensive than syntax mistakes.

## 2. dbt projects, profiles, and the DAG (60 min)

**Outcomes:** distinguish `dbt_project.yml` from `profiles.yml`; use `ref`;
read selection syntax and dependency direction.

1. Compare the `dev` and `postgres` outputs.
2. Run `python scripts/lab.py build --select stg_orders+`.
3. Generate docs and trace `orders` to the scorecard exposure.

Production lens: environment-specific credentials belong in environment
variables, while project behavior belongs in version control.

## 3. Seeds and source contracts (90 min)

**Outcomes:** load reproducible training fixtures; understand why seeds are not
an ingestion strategy; document provenance and type expectations.

1. Read `seeds/_seeds.yml` and `data/SYNTHETIC_DATA.md`.
2. Run `dbt seed --full-refresh` through the wrapper.
3. Change one row locally, predict which tests could catch a defect, then revert it.

Production lens: use seeds for small reference/teaching data, not growing
operational feeds.

## 4. Staging models and naming conventions (2 hours)

**Outcomes:** perform only renaming, casting, and basic cleanup in staging;
maintain a one-to-one source relation; use `commerce_source` safely.

1. Complete `exercises/01_staging.md` using the starter model.
2. Compare `stg_orders.sql` with `stg_order_items.sql`.
3. Run only the affected model and its children.

Production lens: predictable staging conventions make code review faster.

## 5. Data quality tests and failure design (2 hours)

**Outcomes:** use not-null, uniqueness, relationship, accepted-value, generic,
and singular tests; distinguish warnings from blocking failures.

1. Run `python scripts/lab.py test`.
2. Complete `exercises/02_testing.md`.
3. Read the three singular assertions and classify each protected invariant.

Production lens: a test is useful only when its owner knows how to respond.

## 6. Intermediate joins and fan-out control (2-3 hours)

**Outcomes:** join models without changing grain accidentally; aggregate before
joining one-to-many facts; reconcile totals across layers.

1. Explain why returns and payments aggregate before the order join.
2. Compare row counts at source, staging, intermediate, and mart layers.
3. Complete `exercises/03_grain_and_joins.md`.

Production lens: always state grain in the model description and review it
before adding a join.

## 7. Dimensional marts and business definitions (2 hours)

**Outcomes:** build facts and dimensions; centralize revenue recognition;
document currency limitations; expose decision-ready metrics.

1. Trace `recognized_order_revenue` from line item inputs.
2. Explain why totals must not be summed across currencies without FX rates.
3. Build the customer-month solution only after writing your own version.

Production lens: metric names without explicit filters and grain are ambiguous.

## 8. Jinja and reusable macros (90 min)

**Outcomes:** use Jinja for compile-time reuse; keep business logic readable;
raise compiler errors for unsupported modes.

1. Run `dbt compile` and inspect the compiled SQL for a macro call.
2. Complete `exercises/04_macros.md`.
3. Extend `safe_divide` or write a small test macro.

Production lens: macros should remove repetition, not hide the model's intent.

## 9. Incremental models and late data (2 hours)

**Outcomes:** use `is_incremental`, a unique key, and a lookback/reprocessing
window; understand full refresh and schema-change behavior.

1. Build `fct_daily_sales_incremental` twice and compare logs.
2. Add a late order on the latest date and rebuild.
3. Complete `exercises/05_incremental.md`.

Production lens: incremental correctness requires a late-arriving-data policy.

## 10. Snapshots and slowly changing dimensions (90 min)

**Outcomes:** distinguish snapshots from incremental facts; understand check
strategy and validity windows.

1. Run the build, change one synthetic customer's region, and run it again.
2. Query `snapshots.snap_customers` and inspect `dbt_valid_from/to`.
3. Restore the seed with `python scripts/lab.py generate-synthetic`.

Production lens: snapshot only the attributes whose history has analytical value.

## 11. Operational extraction: MySQL to DuckDB (2-3 hours)

**Outcomes:** load an OLTP schema, produce bounded extracts, swap source modes,
and keep transformation logic unchanged.

1. Run `load-mysql`, `extract-mysql`, and `build-extract`.
2. Compare seed and extract row counts/checksums.
3. Complete `exercises/06_source_to_warehouse.md`.

Production lens: real pipelines add watermarks, CDC, retries, encryption, and
an orchestrator; the lab extract is intentionally a local batch boundary.

## 12. Deployment target, docs, and CI (2 hours)

**Outcomes:** run the graph against PostgreSQL; use state-aware selection ideas;
generate documentation; define a minimum CI gate.

1. Run `python scripts/lab.py postgres-build`.
2. Propose CI steps for parse, build, and artifact retention.
3. Inspect `manifest.json`, `run_results.json`, and `catalog.json`.

Production lens: keep deployment artifacts, surface failed tests, and pin
compatible adapter versions.

## 13. Real public data and responsible provenance (2 hours)

**Outcomes:** distinguish synthetic and observed records; preserve attribution;
profile cancellations, null identifiers, negative quantities, and outliers.

1. Start with the bundled attributed UCI sample in `data/real/`.
2. Optionally run `python scripts/lab.py import-uci` for the full dataset.
3. Enable `models/real_data` using the explicit variables described in
   `data/README.md`.
4. Document which cleaning choices alter the meaning of a cancellation.

Production lens: never silently relabel public, sampled, or synthetic data.

## 14. Capstone

Complete [`CAPSTONE.md`](CAPSTONE.md). Treat the acceptance criteria as a data
product contract and present the lineage, quality results, and trade-offs.
