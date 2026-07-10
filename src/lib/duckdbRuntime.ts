import * as duckdb from '@duckdb/duckdb-wasm'
import mvpWasm from '@duckdb/duckdb-wasm/dist/duckdb-mvp.wasm?url'
import mvpWorker from '@duckdb/duckdb-wasm/dist/duckdb-browser-mvp.worker.js?url'
import { bootstrapStatements, type PreviewRow } from '../data/sampleData'
import {
  mergeSchemaInspection,
  schemaCatalog,
  schemaCountSql,
  type SchemaColumnInspection,
  type SchemaCountInspection,
  type SchemaTable,
} from '../data/schemaMetadata'

export type QueryResult = {
  columns: string[]
  rows: PreviewRow[]
  elapsedMs: number
  compiledSql: string
}

let connectionPromise: Promise<duckdb.AsyncDuckDBConnection> | undefined

function compileDbtSql(sql: string) {
  return sql
    .replace(/\{\{\s*config\([\s\S]*?\)\s*\}\}/g, '')
    .replace(/\{\{\s*source\(\s*['"][a-z_]+['"]\s*,\s*['"]([a-z_]+)['"]\s*\)\s*\}\}/g, 'raw_$1')
    .replace(/\{\{\s*ref\(\s*['"]stg_orders['"]\s*\)\s*\}\}/g, '(select * from raw_orders)')
    .replace(/\{\{\s*ref\(\s*['"]stg_customers['"]\s*\)\s*\}\}/g, '(select * from raw_customers)')
    .replace(/\{\{\s*ref\(\s*['"]stg_products['"]\s*\)\s*\}\}/g, '(select * from raw_products)')
    .replace(/\{\{\s*ref\(\s*['"]stg_order_items['"]\s*\)\s*\}\}/g, '(select * from raw_order_items)')
    .replace(/\{\{\s*ref\(\s*['"]stg_payments['"]\s*\)\s*\}\}/g, '(select * from raw_payments)')
    .replace(/\{\{\s*ref\(\s*['"]stg_returns['"]\s*\)\s*\}\}/g, '(select * from raw_returns)')
    .replace(/\braw\.orders\b/g, 'raw_orders')
    .replace(/\braw\.customers\b/g, 'raw_customers')
    .replace(/\braw\.products\b/g, 'raw_products')
    .replace(/\braw\.order_items\b/g, 'raw_order_items')
    .replace(/\braw\.payments\b/g, 'raw_payments')
    .replace(/\braw\.returns\b/g, 'raw_returns')
    .trim()
}

async function createConnection() {
  const bundle: duckdb.DuckDBBundle = {
    mainModule: mvpWasm,
    mainWorker: mvpWorker,
    pthreadWorker: null,
  }
  const worker = new Worker(bundle.mainWorker!)
  const logger = new duckdb.ConsoleLogger(duckdb.LogLevel.WARNING)
  const database = new duckdb.AsyncDuckDB(logger, worker)
  await database.instantiate(bundle.mainModule)
  const connection = await database.connect()

  for (const statement of bootstrapStatements) {
    await connection.query(statement)
  }

  return connection
}

function getConnection() {
  connectionPromise ??= createConnection().catch((error) => {
    connectionPromise = undefined
    throw error
  })
  return connectionPromise
}

export async function runDuckDbQuery(dbtSql: string): Promise<QueryResult> {
  const startedAt = performance.now()
  const compiledSql = compileDbtSql(dbtSql).replace(/;+\s*$/, '')
  if (!/^(select\b|with\b)/i.test(compiledSql)) {
    throw new Error('Browser labs are read-only. Start the exercise with SELECT or WITH.')
  }
  if (/\b(insert|update|delete|drop|alter|create|attach|copy|install|load)\b/i.test(compiledSql)) {
    throw new Error('Mutating statements belong in the isolated Docker lab, not the browser preview.')
  }
  const connection = await getConnection()
  const result = await connection.query(`select * from (${compiledSql}) as learner_result limit 100`)
  const rows = result.toArray().map((row) => {
    const raw = typeof row.toJSON === 'function' ? row.toJSON() : row
    return Object.fromEntries(
      Object.entries(raw).map(([key, value]) => [
        key,
        typeof value === 'bigint' ? Number(value) : value instanceof Date ? value.toISOString() : (value as string | number | null),
      ]),
    ) as PreviewRow
  })

  return {
    columns: result.schema.fields.map((field) => field.name),
    rows,
    elapsedMs: performance.now() - startedAt,
    compiledSql,
  }
}

export async function inspectDuckDbSchema(): Promise<SchemaTable[]> {
  const connection = await getConnection()
  const allowedTables = schemaCatalog.map((table) => `'${table.physicalName}'`).join(', ')
  const columnResult = await connection.query(`
    select
      table_name,
      column_name,
      data_type,
      is_nullable,
      ordinal_position
    from information_schema.columns
    where table_schema = 'main'
      and table_name in (${allowedTables})
    order by table_name, ordinal_position
  `)
  const countResult = await connection.query(schemaCountSql)

  const columns: SchemaColumnInspection[] = columnResult.toArray().map((row) => {
    const value = typeof row.toJSON === 'function' ? row.toJSON() : row
    return {
      tableName: String(value.table_name),
      columnName: String(value.column_name),
      dataType: String(value.data_type),
      nullable: String(value.is_nullable).toUpperCase() === 'YES',
      ordinal: Number(value.ordinal_position),
    }
  })
  const counts: SchemaCountInspection[] = countResult.toArray().map((row) => {
    const value = typeof row.toJSON === 'function' ? row.toJSON() : row
    return {
      tableName: String(value.table_name),
      rowCount: Number(value.row_count),
    }
  })

  return mergeSchemaInspection(columns, counts)
}
