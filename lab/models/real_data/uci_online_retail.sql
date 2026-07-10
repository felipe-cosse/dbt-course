{{ config(enabled=var('enable_uci', false)) }}

with source as (
    select *
    from read_csv_auto('{{ var("uci_csv_path", "../data/uci_online_retail/online_retail.csv") }}', header = true)
)

select
    cast(invoice_no as varchar) as invoice_no,
    cast(stock_code as varchar) as stock_code,
    trim(cast(description as varchar)) as description,
    cast(quantity as integer) as quantity,
    cast(invoice_date as timestamp) as invoice_date,
    cast(unit_price_gbp as decimal(18, 2)) as unit_price_gbp,
    cast(customer_id as varchar) as customer_id,
    trim(cast(country as varchar)) as country,
    upper(substr(cast(invoice_no as varchar), 1, 1)) = 'C' as is_cancellation,
    cast(quantity as decimal(18, 2)) * cast(unit_price_gbp as decimal(18, 2)) as line_amount_gbp
from source

