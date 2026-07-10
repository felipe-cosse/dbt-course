CREATE DATABASE IF NOT EXISTS commerce_oltp;
USE commerce_oltp;

CREATE TABLE IF NOT EXISTS customers (
  customer_id VARCHAR(16) PRIMARY KEY,
  customer_name VARCHAR(120) NOT NULL,
  email VARCHAR(160) NOT NULL,
  country VARCHAR(80) NOT NULL,
  region VARCHAR(80) NOT NULL,
  signup_date DATE NOT NULL,
  marketing_opt_in BOOLEAN NOT NULL,
  updated_at TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS products (
  product_id VARCHAR(16) PRIMARY KEY,
  product_name VARCHAR(160) NOT NULL,
  category VARCHAR(80) NOT NULL,
  unit_cost DECIMAL(12, 2) NOT NULL,
  list_price DECIMAL(12, 2) NOT NULL,
  is_active BOOLEAN NOT NULL
);

CREATE TABLE IF NOT EXISTS orders (
  order_id VARCHAR(16) PRIMARY KEY,
  customer_id VARCHAR(16) NOT NULL,
  order_date TIMESTAMP NOT NULL,
  status VARCHAR(32) NOT NULL,
  currency CHAR(3) NOT NULL,
  sales_channel VARCHAR(32) NOT NULL,
  FOREIGN KEY (customer_id) REFERENCES customers(customer_id)
);

CREATE TABLE IF NOT EXISTS order_items (
  order_item_id VARCHAR(16) PRIMARY KEY,
  order_id VARCHAR(16) NOT NULL,
  product_id VARCHAR(16) NOT NULL,
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(12, 2) NOT NULL,
  discount_pct DECIMAL(6, 4) NOT NULL,
  FOREIGN KEY (order_id) REFERENCES orders(order_id),
  FOREIGN KEY (product_id) REFERENCES products(product_id)
);

CREATE TABLE IF NOT EXISTS payments (
  payment_id VARCHAR(16) PRIMARY KEY,
  order_id VARCHAR(16) NOT NULL,
  payment_date TIMESTAMP NOT NULL,
  payment_method VARCHAR(32) NOT NULL,
  amount DECIMAL(12, 2) NOT NULL,
  payment_status VARCHAR(32) NOT NULL,
  FOREIGN KEY (order_id) REFERENCES orders(order_id)
);

CREATE TABLE IF NOT EXISTS returns (
  return_id VARCHAR(16) PRIMARY KEY,
  order_item_id VARCHAR(16) NOT NULL,
  return_date DATE NOT NULL,
  return_reason VARCHAR(80) NOT NULL,
  quantity INTEGER NOT NULL,
  refund_amount DECIMAL(12, 2) NOT NULL,
  return_status VARCHAR(32) NOT NULL,
  FOREIGN KEY (order_item_id) REFERENCES order_items(order_item_id)
);
