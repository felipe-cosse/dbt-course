export type SchemaKeyKind = 'business' | 'source-version' | 'foreign'

export type SchemaKey = {
  kind: SchemaKeyKind
  columns: string[]
  label: string
}

export type SchemaRelationship = {
  columns: string[]
  targetTable: string
  targetColumns: string[]
  label: string
}

export type SchemaTableMetadata = {
  physicalName: string
  logicalName: string
  grain: string
  description: string
  expectedColumns: string[]
  keys: SchemaKey[]
  relationships: SchemaRelationship[]
}

export type SchemaColumn = {
  name: string
  dataType: string
  nullable: boolean
  ordinal: number
  keyKinds: SchemaKeyKind[]
}

export type SchemaTable = SchemaTableMetadata & {
  rowCount: number
  columns: SchemaColumn[]
}

export type SchemaColumnInspection = {
  tableName: string
  columnName: string
  dataType: string
  nullable: boolean
  ordinal: number
}

export type SchemaCountInspection = {
  tableName: string
  rowCount: number
}

export const schemaCatalog: SchemaTableMetadata[] = [
  {
    physicalName: 'raw_customers',
    logicalName: 'raw.customers',
    grain: 'One current browser-fixture row per customer',
    description: 'Customer identity and acquisition context used for joins, null checks, and dimensional modeling.',
    expectedColumns: ['customer_id', 'full_name', 'email', 'country', 'created_at'],
    keys: [{ kind: 'business', columns: ['customer_id'], label: 'Customer business key' }],
    relationships: [],
  },
  {
    physicalName: 'raw_products',
    logicalName: 'raw.products',
    grain: 'One current browser-fixture row per product',
    description: 'A deliberately imperfect catalog with whitespace, status, cost, and integer-cent price fields.',
    expectedColumns: ['id', 'product_id', 'product_name', 'category', 'unit_cost', 'price_cents', 'status'],
    keys: [{ kind: 'business', columns: ['product_id'], label: 'Product business key' }],
    relationships: [],
  },
  {
    physicalName: 'raw_orders',
    logicalName: 'raw.orders',
    grain: 'One source version per order update',
    description: 'Mutable ecommerce orders with mixed currencies, nullable fields, and a controlled duplicate CDC version.',
    expectedColumns: ['order_id', 'customer_id', 'order_created_at', 'ordered_at', 'order_status', 'status', 'amount', 'currency_code', 'shipping_country', 'updated_at', '_loaded_at'],
    keys: [
      { kind: 'business', columns: ['order_id'], label: 'Order business key; duplicates can exist across versions' },
      { kind: 'source-version', columns: ['order_id', 'updated_at', '_loaded_at'], label: 'Source-version key' },
      { kind: 'foreign', columns: ['customer_id'], label: 'Logical customer reference' },
    ],
    relationships: [
      { columns: ['customer_id'], targetTable: 'raw_customers', targetColumns: ['customer_id'], label: 'Order belongs to customer' },
    ],
  },
  {
    physicalName: 'raw_order_items',
    logicalName: 'raw.order_items',
    grain: 'One row per line item within an order',
    description: 'Product quantities and prices used to teach composite grain, fanout, and financial reconciliation.',
    expectedColumns: ['order_id', 'line_id', 'line_number', 'product_id', 'quantity', 'unit_price', 'unit_price_cents'],
    keys: [
      { kind: 'business', columns: ['order_id', 'line_id'], label: 'Composite line-item key' },
      { kind: 'foreign', columns: ['order_id'], label: 'Logical order reference' },
      { kind: 'foreign', columns: ['product_id'], label: 'Logical product reference' },
    ],
    relationships: [
      { columns: ['order_id'], targetTable: 'raw_orders', targetColumns: ['order_id'], label: 'Line belongs to order' },
      { columns: ['product_id'], targetTable: 'raw_products', targetColumns: ['product_id'], label: 'Line references product' },
    ],
  },
  {
    physicalName: 'raw_payments',
    logicalName: 'raw.payments',
    grain: 'One row per payment attempt',
    description: 'Captured, pending, and failed attempts used to separate payment-event grain from order grain.',
    expectedColumns: ['payment_id', 'order_id', 'payment_method', 'payment_status', 'amount', 'processed_at', '_loaded_at'],
    keys: [
      { kind: 'business', columns: ['payment_id'], label: 'Payment-attempt business key' },
      { kind: 'foreign', columns: ['order_id'], label: 'Logical order reference' },
    ],
    relationships: [
      { columns: ['order_id'], targetTable: 'raw_orders', targetColumns: ['order_id'], label: 'Attempt pays for order' },
    ],
  },
  {
    physicalName: 'raw_returns',
    logicalName: 'raw.returns',
    grain: 'One row per returned line-item event',
    description: 'Return quantities, reasons, refunds, and timing used for revenue-after-returns and date-difference practice.',
    expectedColumns: ['return_id', 'order_id', 'line_id', 'return_status', 'return_amount', 'requested_at', 'processed_at'],
    keys: [
      { kind: 'business', columns: ['return_id'], label: 'Return event business key' },
      { kind: 'foreign', columns: ['order_id', 'line_id'], label: 'Logical line-item reference' },
    ],
    relationships: [
      { columns: ['order_id', 'line_id'], targetTable: 'raw_order_items', targetColumns: ['order_id', 'line_id'], label: 'Return references sold line' },
    ],
  },
]

const moduleFocus: Record<string, string[]> = {
  foundations: ['raw_orders', 'raw_order_items', 'raw_payments'],
  'project-graph': ['raw_customers', 'raw_orders', 'raw_order_items', 'raw_products'],
  staging: ['raw_orders', 'raw_order_items', 'raw_payments', 'raw_products', 'raw_returns'],
  testing: ['raw_orders', 'raw_order_items', 'raw_payments', 'raw_returns'],
  'jinja-macros': ['raw_orders', 'raw_order_items', 'raw_payments', 'raw_returns'],
  materializations: ['raw_orders', 'raw_customers'],
  incremental: ['raw_orders', 'raw_payments'],
  snapshots: ['raw_customers', 'raw_orders'],
  'marts-metrics': ['raw_customers', 'raw_orders', 'raw_order_items', 'raw_products', 'raw_payments', 'raw_returns'],
  'docs-lineage': ['raw_customers', 'raw_orders', 'raw_order_items'],
  'deployment-ci': ['raw_orders', 'raw_payments'],
  capstone: schemaCatalog.map((table) => table.physicalName),
}

const lessonFocus: Record<string, string[]> = {
  'm01-l01': ['raw_orders'],
  'm01-l02': ['raw_order_items', 'raw_orders', 'raw_payments'],
  'm01-l03': ['raw_orders'],
  'm03-l01': ['raw_products'],
  'm03-l02': ['raw_orders', 'raw_order_items', 'raw_payments'],
  'm03-l03': ['raw_customers', 'raw_orders'],
  'm03-l04': ['raw_returns', 'raw_order_items', 'raw_orders'],
  'm04-l04': ['raw_order_items', 'raw_payments', 'raw_orders'],
  'm04-l05': ['raw_customers'],
  'm05-l03': ['raw_returns', 'raw_order_items', 'raw_orders'],
  'm07-l03': ['raw_payments'],
}

export function getLessonSchemaFocus(moduleId: string, lessonId: string) {
  return lessonFocus[lessonId] ?? moduleFocus[moduleId] ?? schemaCatalog.map((table) => table.physicalName)
}

export const schemaKeyLabels: Record<SchemaKeyKind, string> = {
  business: 'BK',
  'source-version': 'VK',
  foreign: 'FK',
}

export const schemaCountSql = schemaCatalog
  .map((table) => `select '${table.physicalName}' as table_name, count(*) as row_count from ${table.physicalName}`)
  .join('\nunion all\n')

export function mergeSchemaInspection(
  inspectedColumns: SchemaColumnInspection[],
  inspectedCounts: SchemaCountInspection[],
): SchemaTable[] {
  const counts = new Map(inspectedCounts.map((row) => [row.tableName, row.rowCount]))

  return schemaCatalog.map((table) => ({
    ...table,
    rowCount: counts.get(table.physicalName) ?? 0,
    columns: inspectedColumns
      .filter((column) => column.tableName === table.physicalName)
      .slice()
      .sort((left, right) => left.ordinal - right.ordinal)
      .map((column) => ({
        name: column.columnName,
        dataType: column.dataType,
        nullable: column.nullable,
        ordinal: column.ordinal,
        keyKinds: table.keys
          .filter((key) => key.columns.includes(column.columnName))
          .map((key) => key.kind),
      })),
  }))
}
