with source as (
    select * from {{ commerce_source('products') }}
)

select
    cast(product_id as varchar) as product_id,
    trim(cast(product_name as varchar)) as product_name,
    trim(cast(category as varchar)) as category,
    cast(unit_cost as decimal(18, 2)) as unit_cost,
    cast(list_price as decimal(18, 2)) as list_price,
    cast(is_active as boolean) as is_active
from source

