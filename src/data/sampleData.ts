export type PreviewRow = Record<string, string | number | null>

export const orderPreview: PreviewRow[] = [
  { order_id: 1001, customer_id: 2001, ordered_at: '2024-01-01 08:15:27', status: 'completed', amount: 59.99 },
  { order_id: 1002, customer_id: 2002, ordered_at: '2024-01-01 08:17:14', status: 'completed', amount: 23.5 },
  { order_id: 1003, customer_id: 2003, ordered_at: '2024-01-01 08:21:09', status: 'processing', amount: 129 },
  { order_id: 1004, customer_id: 2001, ordered_at: '2024-01-01 08:45:43', status: 'completed', amount: 45 },
  { order_id: 1005, customer_id: 2004, ordered_at: '2024-01-01 09:02:11', status: 'cancelled', amount: 15 },
  { order_id: 1006, customer_id: 2005, ordered_at: '2024-01-01 09:15:33', status: 'completed', amount: 89.99 },
  { order_id: 1007, customer_id: 2002, ordered_at: '2024-01-01 09:33:47', status: 'completed', amount: 35.2 },
  { order_id: 1008, customer_id: 2006, ordered_at: '2024-01-01 09:45:01', status: 'processing', amount: 12.75 },
  { order_id: 1009, customer_id: 2007, ordered_at: '2024-01-01 10:05:18', status: 'completed', amount: 99.5 },
  { order_id: 1010, customer_id: 2003, ordered_at: '2024-01-01 10:22:31', status: 'completed', amount: 23 },
]

export const bootstrapStatements = [
  `create table raw_orders (
    order_id integer,
    customer_id integer,
    order_created_at timestamp,
    ordered_at timestamp,
    order_status varchar,
    status varchar,
    amount decimal(12, 2),
    currency_code varchar,
    shipping_country varchar,
    updated_at timestamp,
    _loaded_at timestamp
  )`,
  `insert into raw_orders values
    (1001, 2001, '2024-01-01 08:15:27', '2024-01-01 08:15:27', 'completed', 'completed', 59.99, 'USD', 'US', '2024-01-01 08:16:02', '2024-01-01 08:17:00'),
    (1002, 2002, '2024-01-01 08:17:14', '2024-01-01 08:17:14', 'completed', 'completed', 23.50, 'BRL', 'BR', '2024-01-01 08:18:10', '2024-01-01 08:19:00'),
    (1003, 2003, '2024-01-01 08:21:09', '2024-01-01 08:21:09', 'processing', 'processing', 129.00, 'EUR', 'DE', '2024-01-01 08:22:04', '2024-01-01 08:23:00'),
    (1004, 2001, '2024-01-01 08:45:43', '2024-01-01 08:45:43', 'completed', 'completed', 45.00, 'USD', 'US', '2024-01-01 08:46:12', '2024-01-01 08:47:00'),
    (1005, 2004, '2024-01-01 09:02:11', '2024-01-01 09:02:11', 'cancelled', 'cancelled', 15.00, 'CAD', 'CA', '2024-01-01 09:15:44', '2024-01-01 09:16:00'),
    (1006, 2005, '2024-01-01 09:15:33', '2024-01-01 09:15:33', 'completed', 'completed', 89.99, 'GBP', 'GB', '2024-01-01 09:16:01', '2024-01-01 09:17:00'),
    (1007, 2002, '2024-01-01 09:33:47', '2024-01-01 09:33:47', 'completed', 'completed', 35.20, 'BRL', 'BR', '2024-01-01 09:34:05', '2024-01-01 09:35:00'),
    (1008, 2006, '2024-01-01 09:45:01', '2024-01-01 09:45:01', 'processing', 'processing', 12.75, 'EUR', 'FR', '2024-01-01 09:45:31', '2024-01-01 09:46:00'),
    (1009, 2007, '2024-01-01 10:05:18', '2024-01-01 10:05:18', 'completed', 'completed', 99.50, 'AUD', 'AU', '2024-01-01 10:07:18', '2024-01-01 10:08:00'),
    (1010, 2003, '2024-01-01 10:22:31', '2024-01-01 10:22:31', 'completed', 'completed', 23.00, 'EUR', 'DE', '2024-01-01 10:23:09', '2024-01-01 10:24:00'),
    (1011, 2008, '2024-01-02 07:12:11', '2024-01-02 07:12:11', 'refunded', 'refunded', 49.95, 'USD', 'US', '2024-01-05 12:22:09', '2024-01-05 12:23:00'),
    (1012, null, '2024-01-02 11:28:39', '2024-01-02 11:28:39', 'completed', 'completed', 8.50, 'USD', 'US', '2024-01-02 11:29:01', '2024-01-02 11:30:00'),
    (1013, 2009, '2024-01-03 14:02:18', '2024-01-03 14:02:18', 'COMPLETED', 'COMPLETED', 210.00, 'MXN', 'MX', '2024-01-03 14:04:52', '2024-01-03 14:05:00'),
    (1013, 2009, '2024-01-03 14:02:18', '2024-01-03 14:02:18', 'COMPLETED', 'COMPLETED', 210.00, 'MXN', 'MX', '2024-01-03 14:06:12', '2024-01-03 14:07:00'),
    (1014, 2010, '2024-01-04 18:44:23', '2024-01-04 18:44:23', null, null, 0.00, 'BRL', 'BR', '2024-01-04 18:45:30', '2024-01-04 18:46:00')`,
  `create table raw_customers (
    customer_id integer,
    full_name varchar,
    email varchar,
    country varchar,
    created_at timestamp
  )`,
  `insert into raw_customers values
    (2001, 'Avery Stone', 'avery@example.test', 'US', '2023-11-02'),
    (2002, 'Marina Costa', 'marina@example.test', 'BR', '2023-11-18'),
    (2003, 'Jonas Weber', 'jonas@example.test', 'DE', '2023-12-01'),
    (2004, 'Noah Martin', 'noah@example.test', 'CA', '2023-12-05'),
    (2005, 'Priya Shah', 'priya@example.test', 'GB', '2023-12-08'),
    (2006, 'Camille Bernard', 'camille@example.test', 'FR', '2023-12-11'),
    (2007, 'Mia Wilson', 'mia@example.test', 'AU', '2023-12-15'),
    (2008, 'Sofia Reed', 'sofia@example.test', 'US', '2023-12-19'),
    (2009, 'Diego Luna', 'diego@example.test', 'MX', '2023-12-23'),
    (2010, 'Rafaela Lima', 'rafaela@example.test', 'BR', '2023-12-29')`,
  `create table raw_products (
    id integer,
    product_id integer,
    product_name varchar,
    category varchar,
    unit_cost decimal(12, 2),
    price_cents integer,
    status varchar
  )`,
  `insert into raw_products values
    (301, 301, ' Pour-over kettle ', 'kitchen', 34.00, 5999, 'active'),
    (302, 302, 'Linen notebook', 'stationery', 8.50, 1175, 'active'),
    (303, 303, 'Desk lamp', 'home', 42.25, 6450, 'active'),
    (304, 304, 'Wool throw', 'home', 55.00, 8999, 'inactive'),
    (305, 305, 'Travel tumbler', 'kitchen', 12.00, 1760, 'active')`,
  `create table raw_order_items (
    order_id integer,
    line_id integer,
    line_number integer,
    product_id integer,
    quantity integer,
    unit_price decimal(12, 2),
    unit_price_cents integer
  )`,
  `insert into raw_order_items values
    (1001, 1, 1, 301, 1, 59.99, 5999),
    (1002, 1, 1, 302, 2, 11.75, 1175),
    (1003, 1, 1, 303, 2, 64.50, 6450),
    (1004, 1, 1, 305, 3, 15.00, 1500),
    (1005, 1, 1, 302, 1, 15.00, 1500),
    (1006, 1, 1, 304, 1, 89.99, 8999),
    (1007, 1, 1, 305, 2, 17.60, 1760),
    (1008, 1, 1, 302, 1, 12.75, 1275),
    (1009, 1, 1, 301, 1, 99.50, 9950),
    (1010, 1, 1, 302, 2, 11.50, 1150)`,
  `create table raw_payments (
    payment_id integer,
    order_id integer,
    payment_method varchar,
    payment_status varchar,
    amount varchar,
    processed_at timestamp,
    _loaded_at timestamp
  )`,
  `insert into raw_payments values
    (501, 1001, 'card', 'captured', '59.99', '2024-01-01 08:16:00', '2024-01-01 08:17:00'),
    (502, 1002, 'wallet', 'captured', '23.50', '2024-01-01 08:18:00', '2024-01-01 08:19:00'),
    (503, 1003, 'card', 'pending', '129.00', '2024-01-01 08:22:00', '2024-01-01 08:23:00'),
    (504, 1004, 'bank_transfer', 'captured', '45.00', '2024-01-01 08:46:00', '2024-01-01 08:47:00'),
    (505, 1005, 'card', 'failed', '15.00', '2024-01-01 09:04:00', '2024-01-01 09:05:00')`,
]
