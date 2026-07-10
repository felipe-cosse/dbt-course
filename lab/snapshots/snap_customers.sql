{% snapshot snap_customers %}

{{
    config(
      target_schema='snapshots',
      unique_key='customer_id',
      strategy='check',
      check_cols=['customer_name', 'email', 'country', 'region', 'marketing_opt_in']
    )
}}

select * from {{ ref('stg_customers') }}

{% endsnapshot %}

