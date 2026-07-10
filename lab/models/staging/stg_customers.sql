with source as (
    select * from {{ commerce_source('customers') }}
)

select
    cast(customer_id as varchar) as customer_id,
    trim(cast(customer_name as varchar)) as customer_name,
    lower(trim(cast(email as varchar))) as email,
    trim(cast(country as varchar)) as country,
    trim(cast(region as varchar)) as region,
    cast(signup_date as date) as signup_date,
    cast(marketing_opt_in as boolean) as marketing_opt_in,
    cast(updated_at as timestamp) as updated_at
from source

