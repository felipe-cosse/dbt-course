select
    order_date,
    currency,
    sales_channel,
    count(*) as orders,
    sum(units_ordered) as units,
    sum(net_revenue) as net_revenue,
    sum(gross_margin) as gross_margin,
    {{ safe_divide('sum(gross_margin)', 'sum(net_revenue)') }} as gross_margin_rate
from {{ ref('fct_orders') }}
where is_fulfilled
group by 1, 2, 3

