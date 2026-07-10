select *
from {{ ref('fct_orders') }}
where is_fulfilled
  and captured_payment_amount <= 0

