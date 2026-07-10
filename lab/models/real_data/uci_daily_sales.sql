{{ config(enabled=var('enable_uci', false)) }}

select
    cast(invoice_date as date) as sales_date,
    country,
    count(distinct invoice_no) as invoices,
    sum(quantity) as net_units,
    sum(line_amount_gbp) as net_sales_gbp,
    sum(case when is_cancellation then 1 else 0 end) as cancellation_lines
from {{ ref('uci_online_retail') }}
group by 1, 2

