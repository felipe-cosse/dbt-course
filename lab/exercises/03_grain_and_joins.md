# Exercise 3: prevent join fan-out

Build an order-grain model from orders, items, payments, and returns.

Before writing SQL, record the grain and expected maximum multiplicity of every
join. Aggregate line items, payments, and returns to `order_id` before joining.
Prove that final row count equals source order count and `order_id` remains
unique. Reconcile net revenue by currency.

