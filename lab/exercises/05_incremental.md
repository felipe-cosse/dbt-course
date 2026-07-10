# Exercise 5: late-arriving daily sales

Starting from `starters/models/incremental_daily_sales_starter.sql`, build a
daily incremental model with a unique key. Simulate an order arriving for the
latest already-processed date.

Acceptance criteria:

- A second unchanged run does not duplicate rows.
- The late order is included after the next run.
- The model documents its lookback boundary and full-refresh procedure.
- A schema change fails clearly instead of silently losing columns.

