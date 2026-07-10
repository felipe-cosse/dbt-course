{% test positive_value(model, column_name, allow_zero=false) %}
select *
from {{ model }}
where {{ column_name }} is null
   or {{ column_name }} {% if allow_zero %} < 0 {% else %} <= 0 {% endif %}
{% endtest %}

