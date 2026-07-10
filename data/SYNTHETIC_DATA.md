# Synthetic seed dataset specification

Version: `20260709`

The bundled seed files are generated with Python's `random.Random(20260709)` by
`scripts/generate_synthetic_data.py`. They use invented international customer
names, reserved `.test` email addresses, an invented technology catalog, and
simulated order/payment/return behavior.

Default generation produces:

| Table | Rows | Grain |
| --- | ---: | --- |
| customers | 16 | one row per invented customer |
| products | 12 | one row per invented SKU |
| orders | 72 | one row per simulated order |
| order_items | deterministic from the fixed seed | one row per simulated line |
| payments | 72 | one payment attempt per simulated order |
| returns | deterministic from returned orders | one row per simulated return |

Regenerate the exact default version with:

```bash
python scripts/lab.py generate-synthetic
```

Intentional simplifications:

- currency codes vary, but prices are not converted with FX rates;
- there is one payment attempt per order and at most one return per returned order;
- order timestamps are historical but invented;
- no addresses, phone numbers, real emails, card data, or other sensitive data
  are present;
- statistical distributions are teaching choices, not observations of a real
  business.

These limitations are useful prompts for the capstone rather than facts to hide.

