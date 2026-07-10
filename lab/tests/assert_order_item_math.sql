select *
from {{ ref('int_order_items_enriched') }}
where abs(
    net_item_amount - (gross_item_amount - discount_amount)
) > 0.01

