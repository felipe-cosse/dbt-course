with orders as (
    select * from {{ ref('stg_orders') }}
),
item_totals as (
    select
        order_id,
        count(*) as line_count,
        sum(quantity) as units_ordered,
        sum(gross_item_amount) as gross_order_amount,
        sum(discount_amount) as discount_amount,
        sum(net_item_amount) as order_revenue,
        sum(item_cost) as order_cost,
        sum(refund_amount) as refund_amount,
        sum(net_revenue_after_returns) as net_revenue_after_returns
    from {{ ref('int_order_items_enriched') }}
    group by 1
),
payment_totals as (
    select
        order_id,
        sum(case when payment_status = 'captured' then payment_amount else 0 end) as captured_payment_amount,
        max(case when payment_status = 'failed' then 1 else 0 end) as has_failed_payment
    from {{ ref('stg_payments') }}
    group by 1
)

select
    orders.order_id,
    orders.customer_id,
    orders.ordered_at,
    cast(orders.ordered_at as date) as order_date,
    orders.order_status,
    orders.currency,
    orders.sales_channel,
    coalesce(item_totals.line_count, 0) as line_count,
    coalesce(item_totals.units_ordered, 0) as units_ordered,
    coalesce(item_totals.gross_order_amount, 0) as gross_order_amount,
    coalesce(item_totals.discount_amount, 0) as discount_amount,
    coalesce(item_totals.order_revenue, 0) as order_revenue,
    coalesce(item_totals.order_cost, 0) as order_cost,
    coalesce(item_totals.refund_amount, 0) as refund_amount,
    coalesce(item_totals.net_revenue_after_returns, 0) as net_revenue_after_returns,
    coalesce(payment_totals.captured_payment_amount, 0) as captured_payment_amount,
    coalesce(payment_totals.has_failed_payment, 0) as has_failed_payment
from orders
left join item_totals using (order_id)
left join payment_totals using (order_id)

