# Capstone: Commerce Reliability Data Product

## Scenario

Operations needs a daily data product that identifies revenue, margin, return
risk, payment problems, and customer health. Analysts currently join raw OLTP
tables differently and produce conflicting totals.

## Required deliverables

1. A source-to-mart dbt DAG that runs on DuckDB and PostgreSQL.
2. A daily fact with a stated grain and a composite uniqueness test.
3. A customer or product dimension with at least one useful derived segment.
4. At least eight tests spanning structural, referential, domain, and business
   invariants; include one custom generic and one singular test.
5. An incremental strategy that explains late-arriving data and full refreshes.
6. One snapshot with a justified strategy and attribute list.
7. Documentation for every mart, important column, metric filter, currency
   assumption, and owner.
8. A lineage screenshot or saved dbt docs artifact plus a five-minute demo.
9. A runbook covering setup, normal execution, failure triage, and recovery.
10. A reconciliation query showing source totals and mart totals by currency.

## Required engineering constraints

- Do not sum monetary amounts across currencies without an FX conversion model.
- Do not expose raw email addresses in the final reporting mart.
- Keep MySQL extraction separate from dbt transformations.
- Make all file and table names explicit; do not execute user-provided shell text.
- Label synthetic and public data accurately in all outputs.

## Stretch options

- Add an FX seed with effective dates and convert to one reporting currency.
- Add an audit model for freshness, row count, and reconciliation history.
- Create a CI workflow using a temporary PostgreSQL service.
- Profile the full UCI dataset and model cancellations separately from returns.
- Add a second incremental strategy and compare runtime/correctness trade-offs.

## Evaluation rubric (100 points)

| Area | Points | Evidence |
| --- | ---: | --- |
| Correct grain and joins | 25 | No fan-out; reconciled totals |
| Data quality design | 20 | Tests map to actionable risks |
| Maintainability | 15 | Clear layers, naming, and macros |
| Incremental/history correctness | 15 | Late data and snapshot behavior demonstrated |
| Documentation and lineage | 15 | Catalog, owners, definitions, caveats |
| Operational thinking | 10 | Repeatable commands and recovery plan |

