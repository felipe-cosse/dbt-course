#!/usr/bin/env python3
"""Load the six bundled synthetic dbt seed files into the MySQL OLTP source."""

from __future__ import annotations

import csv
import os
from pathlib import Path
import time

import mysql.connector
from mysql.connector import Error


ROOT = Path(__file__).resolve().parents[1]
SEED_DIR = ROOT / "lab" / "seeds"
TABLE_COLUMNS = {
    "customers": (
        "customer_id", "customer_name", "email", "country", "region",
        "signup_date", "marketing_opt_in", "updated_at",
    ),
    "products": (
        "product_id", "product_name", "category", "unit_cost", "list_price", "is_active",
    ),
    "orders": (
        "order_id", "customer_id", "order_date", "status", "currency", "sales_channel",
    ),
    "order_items": (
        "order_item_id", "order_id", "product_id", "quantity", "unit_price", "discount_pct",
    ),
    "payments": (
        "payment_id", "order_id", "payment_date", "payment_method", "amount", "payment_status",
    ),
    "returns": (
        "return_id", "order_item_id", "return_date", "return_reason", "quantity",
        "refund_amount", "return_status",
    ),
}
BOOLEAN_COLUMNS = {("customers", "marketing_opt_in"), ("products", "is_active")}


def connection_config() -> dict[str, object]:
    return {
        "host": os.getenv("MYSQL_HOST", "localhost"),
        "port": int(os.getenv("MYSQL_PORT", "3307")),
        "user": os.getenv("MYSQL_USER", "dbt_student"),
        "password": os.getenv("MYSQL_PASSWORD", "dbt_student"),
        "database": os.getenv("MYSQL_DATABASE", "commerce_oltp"),
    }


def connect_with_retry():
    last_error: Error | None = None
    for _ in range(30):
        try:
            return mysql.connector.connect(**connection_config())
        except Error as exc:
            last_error = exc
            time.sleep(2)
    raise RuntimeError(f"MySQL was not ready: {last_error}")


def mysql_value(table: str, column: str, value: str) -> object:
    if (table, column) in BOOLEAN_COLUMNS:
        normalized = value.strip().lower()
        if normalized not in {"true", "false"}:
            raise ValueError(f"Invalid boolean for {table}.{column}: {value!r}")
        return normalized == "true"
    return value


def read_rows(table: str) -> list[tuple[object, ...]]:
    path = SEED_DIR / f"{table}.csv"
    with path.open(newline="", encoding="utf-8") as handle:
        reader = csv.DictReader(handle)
        expected = TABLE_COLUMNS[table]
        if tuple(reader.fieldnames or ()) != expected:
            raise ValueError(f"Unexpected columns in {path}: {reader.fieldnames}; expected {expected}")
        return [
            tuple(mysql_value(table, column, row[column]) for column in expected)
            for row in reader
        ]


def main() -> None:
    connection = connect_with_retry()
    cursor = connection.cursor()
    try:
        cursor.execute("SET FOREIGN_KEY_CHECKS = 0")
        for table in reversed(tuple(TABLE_COLUMNS)):
            cursor.execute(f"TRUNCATE TABLE `{table}`")
        cursor.execute("SET FOREIGN_KEY_CHECKS = 1")

        for table, columns in TABLE_COLUMNS.items():
            rows = read_rows(table)
            placeholders = ", ".join(["%s"] * len(columns))
            column_sql = ", ".join(f"`{column}`" for column in columns)
            cursor.executemany(
                f"INSERT INTO `{table}` ({column_sql}) VALUES ({placeholders})",
                rows,
            )
            print(f"Loaded {len(rows):>4} rows into {table}")
        connection.commit()
        print("MySQL OLTP source is ready.")
    except Exception:
        connection.rollback()
        raise
    finally:
        cursor.close()
        connection.close()


if __name__ == "__main__":
    main()
