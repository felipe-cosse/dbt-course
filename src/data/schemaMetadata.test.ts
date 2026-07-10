import { describe, expect, it } from 'vitest'
import { mergeSchemaInspection, schemaCatalog } from './schemaMetadata'

describe('browser schema catalog', () => {
  it('references only declared tables and fields', () => {
    const tables = new Map(schemaCatalog.map((table) => [table.physicalName, table]))
    expect(tables.size).toBe(schemaCatalog.length)

    for (const table of schemaCatalog) {
      expect(new Set(table.expectedColumns).size, `${table.physicalName} columns`).toBe(table.expectedColumns.length)
      for (const key of table.keys) {
        for (const column of key.columns) expect(table.expectedColumns, `${table.physicalName}.${column}`).toContain(column)
      }
      for (const relationship of table.relationships) {
        const target = tables.get(relationship.targetTable)
        expect(target, `${table.physicalName} target ${relationship.targetTable}`).toBeDefined()
        for (const column of relationship.columns) expect(table.expectedColumns).toContain(column)
        for (const column of relationship.targetColumns) expect(target?.expectedColumns).toContain(column)
      }
    }
  })

  it('merges live columns, counts, and curated key roles in ordinal order', () => {
    const columns = schemaCatalog.flatMap((table) => table.expectedColumns.map((column, index) => ({
      tableName: table.physicalName,
      columnName: column,
      dataType: index === 0 ? 'INTEGER' : 'VARCHAR',
      nullable: index !== 0,
      ordinal: index + 1,
    }))).reverse()
    const tables = mergeSchemaInspection(columns, schemaCatalog.map((table, index) => ({ tableName: table.physicalName, rowCount: index + 3 })))

    expect(tables).toHaveLength(schemaCatalog.length)
    expect(tables[0].columns.map((column) => column.name)).toEqual(schemaCatalog[0].expectedColumns)
    expect(tables.find((table) => table.physicalName === 'raw_orders')?.columns.find((column) => column.name === 'order_id')?.keyKinds).toContain('business')
    expect(tables.find((table) => table.physicalName === 'raw_returns')?.rowCount).toBeGreaterThan(0)
  })
})
