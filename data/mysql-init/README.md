# MySQL source schema

`001_schema.sql` creates a small normalized OLTP schema when the MySQL container
starts for the first time. `scripts/load_mysql.py` then loads only the six
allowlisted synthetic seed files using parameterized inserts. Resetting Compose
without deleting the named volume preserves MySQL data.

