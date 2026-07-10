import * as duckdb from '@duckdb/duckdb-wasm'
import mvpWasm from '@duckdb/duckdb-wasm/dist/duckdb-mvp.wasm?url'
import mvpWorker from '@duckdb/duckdb-wasm/dist/duckdb-browser-mvp.worker.js?url'
import { bootstrapStatements, type PreviewRow } from '../data/sampleData'

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
    .replace(/\braw\.orders\b/g, 'raw_orders')
    .replace(/\braw\.customers\b/g, 'raw_customers')
    .replace(/\braw\.products\b/g, 'raw_products')
    .replace(/\braw\.order_items\b/g, 'raw_order_items')
    .replace(/\braw\.payments\b/g, 'raw_payments')
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
