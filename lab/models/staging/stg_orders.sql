with source as (
    select * from {{ commerce_source('orders') }}
)

select
    cast(order_id as varchar) as order_id,
    cast(customer_id as varchar) as customer_id,
    cast(order_date as timestamp) as ordered_at,
    lower(trim(cast(status as varchar))) as order_status,
    upper(trim(cast(currency as varchar))) as currency,
    lower(trim(cast(sales_channel as varchar))) as sales_channel
from source

