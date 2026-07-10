with customers as (
    select * from {{ ref('stg_customers') }}
),
customer_orders as (
    select
        customer_id,
        min(order_date) as first_order_date,
        max(order_date) as most_recent_order_date,
        count(*) as order_count,
        sum(case when order_status != 'cancelled' then net_revenue_after_returns else 0 end) as lifetime_revenue
    from {{ ref('int_orders_enriched') }}
    group by 1
)

select
    customers.customer_id,
    customers.customer_name,
    customers.email,
    customers.country,
    customers.region,
    customers.signup_date,
    customers.marketing_opt_in,
    customer_orders.first_order_date,
    customer_orders.most_recent_order_date,
    coalesce(customer_orders.order_count, 0) as order_count,
    coalesce(customer_orders.lifetime_revenue, 0) as lifetime_revenue,
    case
        when coalesce(customer_orders.lifetime_revenue, 0) >= 1000 then 'high_value'
        when coalesce(customer_orders.lifetime_revenue, 0) >= 400 then 'growing'
        when coalesce(customer_orders.order_count, 0) > 0 then 'active'
        else 'prospect'
    end as customer_segment
from customers
left join customer_orders using (customer_id)

