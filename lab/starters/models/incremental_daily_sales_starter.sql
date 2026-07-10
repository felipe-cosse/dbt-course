{{ config(materialized='incremental', unique_key=['order_date', 'currency']) }}

select
    order_date,
    currency,
    count(*) as orders,
    sum(net_revenue) as net_revenue
from {{ ref('fct_orders') }}
where is_fulfilled
-- TODO: add an is_incremental() filter that reprocesses a safe late-data window.
group by 1, 2

