# Exercise 6: cross the operational boundary

Run the MySQL load and extraction workflow, then build with
`source_mode=mysql_extract`.

Produce a short audit containing source/extract row counts for all six tables,
the extraction time, and at least one checksum or total. Explain which
production capabilities are missing from this local batch extract: watermarks,
CDC, idempotency, retries, observability, secrets management, and encryption.

