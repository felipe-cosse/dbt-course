# Exercise 2: design tests from risk

Create tests for these failure stories:

1. A duplicate payment is sent after a retry.
2. An order item references a deleted product.
3. A discount is loaded as `15` instead of `0.15`.
4. A refund exceeds the original discounted line value.
5. A new, undocumented order status arrives.

For each test, state the protected invariant, severity, owner, and immediate
response. At least one must be a singular test and one a reusable generic test.

