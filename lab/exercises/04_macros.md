# Exercise 4: write a readable macro

Implement `net_line_amount(quantity, unit_price, discount_pct)` and use it in a
model. Inspect compiled SQL. Then decide whether the macro makes the business
logic clearer than inline SQL and explain your decision.

Bonus: raise a compiler error for discounts outside the expected representation
or create a generic test that detects them at runtime.

