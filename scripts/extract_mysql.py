#!/usr/bin/env python3
"""Extract allowlisted MySQL OLTP tables to CSV for the DuckDB dbt pipeline."""

from __future__ import annotations

import csv
import os
from pathlib import Path
import time

import mysql.connector
from mysql.connector import Error


ROOT = Path(__file__).resolve().parents[1]
OUTPUT_DIR = ROOT / "data" / "mysql_extracts"
TABLES = ("customers", "products", "orders", "order_items", "payments", "returns")


def connect_with_retry():
    config = {
        "host": os.getenv("MYSQL_HOST", "localhost"),
        "port": int(os.getenv("MYSQL_PORT", "3307")),
        "user": os.getenv("MYSQL_USER", "dbt_student"),
        "password": os.getenv("MYSQL_PASSWORD", "dbt_student"),
        "database": os.getenv("MYSQL_DATABASE", "commerce_oltp"),
    }
    last_error: Error | None = None
    for _ in range(30):
        try:
            return mysql.connector.connect(**config)
        except Error as exc:
            last_error = exc
            time.sleep(2)
    raise RuntimeError(f"MySQL was not ready: {last_error}")


def main() -> None:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    connection = connect_with_retry()
    cursor = connection.cursor()
    try:
        for table in TABLES:
            cursor.execute(f"SELECT * FROM `{table}` ORDER BY 1")
            destination = OUTPUT_DIR / f"{table}.csv"
            with destination.open("w", newline="", encoding="utf-8") as handle:
                writer = csv.writer(handle)
                writer.writerow(cursor.column_names)
                count = 0
                for row in cursor:
                    writer.writerow(row)
                    count += 1
            print(f"Extracted {count:>4} rows to {destination.relative_to(ROOT)}")
    finally:
        cursor.close()
        connection.close()
    print("Run `python scripts/lab.py build-extract` to transform this extract with DuckDB.")


if __name__ == "__main__":
    main()

