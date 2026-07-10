select
    date_trunc('month', order_date) as order_month,
    customer_id,
    currency,
    count(*) as orders,
    sum(net_revenue) as net_revenue,
    sum(gross_margin) as gross_margin
from {{ ref('fct_orders') }}
where is_fulfilled
group by 1, 2, 3

