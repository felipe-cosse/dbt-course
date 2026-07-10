select
    order_id,
    customer_id,
    ordered_at,
    order_date,
    order_status,
    currency,
    sales_channel,
    line_count,
    units_ordered,
    gross_order_amount,
    discount_amount,
    case when order_status = 'cancelled' then 0 else order_revenue end as recognized_order_revenue,
    order_cost,
    refund_amount,
    case when order_status = 'cancelled' then 0 else net_revenue_after_returns end as net_revenue,
    captured_payment_amount,
    case
        when order_status = 'cancelled' then 0
        else net_revenue_after_returns - order_cost
    end as gross_margin,
    has_failed_payment,
    case when order_status in ('completed', 'shipped', 'returned') then true else false end as is_fulfilled
from {{ ref('int_orders_enriched') }}

