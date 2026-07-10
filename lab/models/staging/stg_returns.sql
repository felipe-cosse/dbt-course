with source as (
    select * from {{ commerce_source('returns') }}
)

select
    cast(return_id as varchar) as return_id,
    cast(order_item_id as varchar) as order_item_id,
    cast(return_date as date) as returned_at,
    lower(trim(cast(return_reason as varchar))) as return_reason,
    cast(quantity as integer) as return_quantity,
    cast(refund_amount as decimal(18, 2)) as refund_amount,
    lower(trim(cast(return_status as varchar))) as return_status
from source

