with items as (
    select * from {{ ref('stg_order_items') }}
),
products as (
    select * from {{ ref('stg_products') }}
),
returns_by_item as (
    select
        order_item_id,
        sum(return_quantity) as returned_quantity,
        sum(case when return_status = 'completed' then refund_amount else 0 end) as completed_refund_amount
    from {{ ref('stg_returns') }}
    group by 1
)

select
    items.order_item_id,
    items.order_id,
    items.product_id,
    products.product_name,
    products.category,
    items.quantity,
    items.unit_price,
    products.unit_cost,
    items.discount_pct,
    items.quantity * items.unit_price as gross_item_amount,
    items.quantity * items.unit_price * items.discount_pct as discount_amount,
    {{ revenue_after_discount('items.quantity', 'items.unit_price', 'items.discount_pct') }} as net_item_amount,
    items.quantity * products.unit_cost as item_cost,
    coalesce(returns_by_item.returned_quantity, 0) as returned_quantity,
    coalesce(returns_by_item.completed_refund_amount, 0) as refund_amount,
    {{ revenue_after_discount('items.quantity', 'items.unit_price', 'items.discount_pct') }}
        - coalesce(returns_by_item.completed_refund_amount, 0) as net_revenue_after_returns
from items
left join products using (product_id)
left join returns_by_item using (order_item_id)

