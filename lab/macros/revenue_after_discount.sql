{% macro revenue_after_discount(quantity, unit_price, discount_pct) -%}
  ({{ quantity }}) * ({{ unit_price }}) * (1 - ({{ discount_pct }}))
{%- endmacro %}

