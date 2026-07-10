-- Target grain: one row per customer, calendar month, and currency.
with orders as (
    select * from {{ ref('fct_orders') }}
)

select
    -- TODO: month, customer_id, currency, order count, revenue, margin.
    customer_id
from orders
where is_fulfilled
group by 1

