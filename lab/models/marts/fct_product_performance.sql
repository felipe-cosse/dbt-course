with order_context as (
    select order_id, order_status, currency
    from {{ ref('stg_orders') }}
)

select
    items.product_id,
    items.product_name,
    items.category,
    orders.currency,
    count(distinct items.order_id) as orders,
    sum(items.quantity) as units_ordered,
    sum(items.returned_quantity) as units_returned,
    sum(case when orders.order_status != 'cancelled' then items.net_revenue_after_returns else 0 end) as net_revenue,
    sum(case when orders.order_status != 'cancelled' then items.item_cost else 0 end) as product_cost
from {{ ref('int_order_items_enriched') }} as items
left join order_context as orders using (order_id)
group by 1, 2, 3, 4
