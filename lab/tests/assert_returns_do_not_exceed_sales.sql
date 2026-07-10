select *
from {{ ref('int_order_items_enriched') }}
where returned_quantity > quantity
   or refund_amount > net_item_amount

