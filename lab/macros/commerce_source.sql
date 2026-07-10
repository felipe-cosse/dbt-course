{% macro commerce_source(table_name) -%}
  {%- set allowed_tables = ['customers', 'products', 'orders', 'order_items', 'payments', 'returns'] -%}
  {%- if table_name not in allowed_tables -%}
    {{ exceptions.raise_compiler_error('Unknown commerce source table: ' ~ table_name) }}
  {%- endif -%}
  {%- set mode = var('source_mode', 'seed') -%}
  {%- if mode == 'seed' -%}
    {{ ref(table_name) }}
  {%- elif mode == 'mysql_extract' -%}
    {%- if target.type != 'duckdb' -%}
      {{ exceptions.raise_compiler_error('mysql_extract source_mode is supported only by the DuckDB target') }}
    {%- endif -%}
    read_csv_auto('{{ var("mysql_extract_dir", "../data/mysql_extracts") }}/{{ table_name }}.csv', header = true, auto_detect = true)
  {%- else -%}
    {{ exceptions.raise_compiler_error("source_mode must be 'seed' or 'mysql_extract'; received: " ~ mode) }}
  {%- endif -%}
{%- endmacro %}

