#!/usr/bin/env python3
"""Regenerate the deterministic, explicitly synthetic commerce seed dataset."""

from __future__ import annotations

import argparse
import csv
from datetime import date, datetime, timedelta
from decimal import Decimal, ROUND_HALF_UP
from pathlib import Path
import random


ROOT = Path(__file__).resolve().parents[1]
DEFAULT_OUTPUT = ROOT / "lab" / "seeds"
RANDOM_SEED = 20260709

CUSTOMER_FIXTURES = (
    ("Avery Johnson", "United States", "West"),
    ("Sofia Ramirez", "United States", "Southwest"),
    ("Noah Williams", "Canada", "Ontario"),
    ("Amelia Brown", "United Kingdom", "England"),
    ("Lucas Martin", "France", "Ile-de-France"),
    ("Mia Schneider", "Germany", "Berlin"),
    ("Oliver Wilson", "Australia", "New South Wales"),
    ("Isabella Rossi", "Italy", "Lombardy"),
    ("Ethan Kim", "South Korea", "Seoul"),
    ("Harper Davis", "United States", "Northeast"),
    ("Leo Garcia", "Spain", "Catalonia"),
    ("Luna de Vries", "Netherlands", "North Holland"),
    ("Mateo Silva", "Brazil", "Sao Paulo"),
    ("Freya Evans", "United Kingdom", "Scotland"),
    ("Jack Thompson", "Canada", "British Columbia"),
    ("Yuki Tanaka", "Japan", "Tokyo"),
)

PRODUCT_FIXTURES = (
    ("Mechanical Keyboard", "Peripherals", "42.00", "89.00"),
    ("Wireless Mouse", "Peripherals", "18.00", "39.00"),
    ("USB-C Dock", "Connectivity", "54.00", "119.00"),
    ("1080p Webcam", "Video", "31.00", "69.00"),
    ("Noise-Cancelling Headset", "Audio", "68.00", "149.00"),
    ("Laptop Stand", "Workspace", "16.00", "45.00"),
    ("Desk Mat", "Workspace", "8.00", "24.00"),
    ("Portable SSD 1TB", "Storage", "62.00", "109.00"),
    ("USB-C Cable 2m", "Connectivity", "5.00", "16.00"),
    ("Smart LED Desk Lamp", "Workspace", "29.00", "64.00"),
    ("Microphone", "Audio", "49.00", "99.00"),
    ("Ergonomic Chair Cushion", "Workspace", "21.00", "52.00"),
)

CURRENCY_BY_COUNTRY = {
    "United Kingdom": "GBP",
    "France": "EUR",
    "Germany": "EUR",
    "Italy": "EUR",
    "Spain": "EUR",
    "Netherlands": "EUR",
    "Canada": "CAD",
    "Australia": "AUD",
    "Japan": "JPY",
    "South Korea": "KRW",
    "Brazil": "BRL",
}


def money(value: Decimal) -> str:
    return str(value.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP))


def write_csv(output: Path, name: str, headers: tuple[str, ...], rows: list[dict[str, object]]) -> None:
    path = output / f"{name}.csv"
    with path.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=headers)
        writer.writeheader()
        writer.writerows(rows)
    print(f"Wrote {len(rows):>4} rows to {path.relative_to(ROOT) if path.is_relative_to(ROOT) else path}")


def build_dataset(order_count: int) -> dict[str, list[dict[str, object]]]:
    rng = random.Random(RANDOM_SEED)
    customers: list[dict[str, object]] = []
    for index, (name, country, region) in enumerate(CUSTOMER_FIXTURES, start=1):
        slug = name.lower().replace(" ", ".")
        customers.append(
            {
                "customer_id": f"C{index:03d}",
                "customer_name": name,
                "email": f"{slug}@example.test",
                "country": country,
                "region": region,
                "signup_date": date(2024, 1, 1) + timedelta(days=index * 19),
                "marketing_opt_in": "true" if index % 3 else "false",
                "updated_at": datetime(2025, 7, 1, 9, index % 60).isoformat(sep=" "),
            }
        )

    products: list[dict[str, object]] = []
    for index, (name, category, unit_cost, list_price) in enumerate(PRODUCT_FIXTURES, start=1):
        products.append(
            {
                "product_id": f"SKU{index:03d}",
                "product_name": name,
                "category": category,
                "unit_cost": unit_cost,
                "list_price": list_price,
                "is_active": "false" if index == len(PRODUCT_FIXTURES) else "true",
            }
        )

    orders: list[dict[str, object]] = []
    order_items: list[dict[str, object]] = []
    payments: list[dict[str, object]] = []
    returns: list[dict[str, object]] = []
    start = datetime(2025, 1, 3, 8, 30)
    item_number = 1
    return_number = 1

    for order_index in range(1, order_count + 1):
        customer = rng.choice(customers)
        order_id = f"O{1000 + order_index}"
        order_date = start + timedelta(days=(order_index - 1) * 2 + rng.randint(0, 2), hours=rng.randint(0, 10))
        status = rng.choices(
            ["completed", "shipped", "returned", "cancelled", "pending"],
            weights=[52, 18, 10, 8, 12],
            k=1,
        )[0]
        country = str(customer["country"])
        orders.append(
            {
                "order_id": order_id,
                "customer_id": customer["customer_id"],
                "order_date": order_date.isoformat(sep=" "),
                "status": status,
                "currency": CURRENCY_BY_COUNTRY.get(country, "USD"),
                "sales_channel": rng.choices(
                    ["web", "mobile", "marketplace"], weights=[55, 30, 15], k=1
                )[0],
            }
        )

        chosen_products = rng.sample(products, k=rng.randint(1, 4))
        order_total = Decimal("0")
        this_order_items: list[dict[str, object]] = []
        for product in chosen_products:
            quantity = rng.choices([1, 2, 3, 4], weights=[58, 27, 11, 4], k=1)[0]
            unit_price = Decimal(str(product["list_price"]))
            discount = rng.choices(
                [Decimal("0"), Decimal("0.05"), Decimal("0.10"), Decimal("0.15")],
                weights=[62, 18, 15, 5],
                k=1,
            )[0]
            line_total = unit_price * quantity * (Decimal("1") - discount)
            order_total += line_total
            item = {
                "order_item_id": f"I{item_number:04d}",
                "order_id": order_id,
                "product_id": product["product_id"],
                "quantity": quantity,
                "unit_price": money(unit_price),
                "discount_pct": str(discount),
            }
            order_items.append(item)
            this_order_items.append(item)
            item_number += 1

        payment_status = "failed" if status == "cancelled" else "authorized" if status == "pending" else "captured"
        payments.append(
            {
                "payment_id": f"PAY{order_index:04d}",
                "order_id": order_id,
                "payment_date": (order_date + timedelta(minutes=rng.randint(1, 45))).isoformat(sep=" "),
                "payment_method": rng.choices(
                    ["card", "paypal", "bank_transfer", "digital_wallet"],
                    weights=[58, 18, 9, 15],
                    k=1,
                )[0],
                "amount": money(order_total),
                "payment_status": payment_status,
            }
        )

        if status == "returned":
            returned_item = rng.choice(this_order_items)
            returned_quantity = 1
            refund = (
                Decimal(str(returned_item["unit_price"]))
                * returned_quantity
                * (Decimal("1") - Decimal(str(returned_item["discount_pct"])))
            )
            returns.append(
                {
                    "return_id": f"R{return_number:03d}",
                    "order_item_id": returned_item["order_item_id"],
                    "return_date": (order_date + timedelta(days=rng.randint(4, 21))).date(),
                    "return_reason": rng.choice(
                        ["damaged", "not_as_expected", "wrong_item", "changed_mind"]
                    ),
                    "quantity": returned_quantity,
                    "refund_amount": money(refund),
                    "return_status": rng.choice(["completed", "completed", "processing"]),
                }
            )
            return_number += 1

    return {
        "customers": customers,
        "products": products,
        "orders": orders,
        "order_items": order_items,
        "payments": payments,
        "returns": returns,
    }


HEADERS = {
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


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    parser.add_argument("--orders", type=int, default=72)
    args = parser.parse_args()
    if not 12 <= args.orders <= 10000:
        parser.error("--orders must be between 12 and 10,000")
    output = args.output.resolve()
    output.mkdir(parents=True, exist_ok=True)
    dataset = build_dataset(args.orders)
    for name, rows in dataset.items():
        write_csv(output, name, HEADERS[name], rows)
    print(f"Synthetic dataset version seed: {RANDOM_SEED}. These are not real customer records.")


if __name__ == "__main__":
    main()

