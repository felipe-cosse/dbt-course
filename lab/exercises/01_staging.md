# Exercise 1: stage order headers

Copy `starters/models/stg_orders_starter.sql` into a temporary model, replace
the TODOs, and preserve exactly one row per source order.

Acceptance criteria:

- IDs are strings, order time is a timestamp, and text domains are normalized.
- No business aggregation or joins occur in staging.
- `order_id` is unique/not null and `customer_id` has a relationship test.
- The model works with both `seed` and `mysql_extract` source modes.

