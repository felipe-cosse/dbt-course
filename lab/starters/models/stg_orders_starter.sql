-- Copy into models only while working on Exercise 1.
with source as (
    select * from {{ commerce_source('orders') }}
)

select
    -- TODO: cast identifiers, timestamp, and normalize domain strings.
    *
from source

