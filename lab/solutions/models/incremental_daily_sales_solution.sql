{{ config(
    materialized='incremental',
    unique_key=['order_date', 'currency'],
    incremental_strategy='delete+insert',
    on_schema_change='fail'
) }}

select
    order_date,
    currency,
    count(*) as orders,
    sum(net_revenue) as net_revenue
from {{ ref('fct_orders') }}
where is_fulfilled
{% if is_incremental() %}
  and order_date >= (select coalesce(max(order_date), cast('1900-01-01' as date)) from {{ this }})
{% endif %}
group by 1, 2

