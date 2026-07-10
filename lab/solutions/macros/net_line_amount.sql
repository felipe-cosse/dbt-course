{% macro net_line_amount(quantity, unit_price, discount_pct) -%}
  ({{ quantity }}) * ({{ unit_price }}) * (1 - ({{ discount_pct }}))
{%- endmacro %}

