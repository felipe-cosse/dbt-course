with source as (
    select * from {{ commerce_source('payments') }}
)

select
    cast(payment_id as varchar) as payment_id,
    cast(order_id as varchar) as order_id,
    cast(payment_date as timestamp) as paid_at,
    lower(trim(cast(payment_method as varchar))) as payment_method,
    cast(amount as decimal(18, 2)) as payment_amount,
    lower(trim(cast(payment_status as varchar))) as payment_status
from source

