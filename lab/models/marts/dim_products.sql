select
    product_id,
    product_name,
    category,
    unit_cost,
    list_price,
    list_price - unit_cost as unit_margin,
    {{ safe_divide('list_price - unit_cost', 'list_price') }} as list_margin_rate,
    is_active
from {{ ref('stg_products') }}

