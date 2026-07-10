import { ArrowRight, Database, KeyRound, Link2, LoaderCircle, RefreshCw, Rows3 } from 'lucide-react'
import { schemaKeyLabels, type SchemaTable } from '../data/schemaMetadata'

type SchemaPanelProps = {
  state: 'idle' | 'loading' | 'ready' | 'error'
  tables: SchemaTable[]
  focusedTables: string[]
  selectedTable?: string
  onSelectTable: (tableName: string) => void
  onRetry: () => void
}

export function SchemaPanel({
  state,
  tables,
  focusedTables,
  selectedTable,
  onSelectTable,
  onRetry,
}: SchemaPanelProps) {
  if (state === 'idle' || state === 'loading') {
    return (
      <div className="schema-state" aria-live="polite">
        <LoaderCircle className="spin" size={24} />
        <strong>Inspecting the browser database</strong>
        <p>Reading tables, fields, types, nullability, and row counts from DuckDB.</p>
      </div>
    )
  }

  if (state === 'error') {
    return (
      <div className="schema-state is-error" role="alert">
        <Database size={24} />
        <strong>Schema inspection did not finish</strong>
        <p>The lesson is still available. Retry the read-only DuckDB metadata query.</p>
        <button type="button" className="secondary-button" onClick={onRetry}><RefreshCw size={15} /> Retry</button>
      </div>
    )
  }

  const orderedTables = tables.slice().sort((left, right) => {
    const leftIndex = focusedTables.indexOf(left.physicalName)
    const rightIndex = focusedTables.indexOf(right.physicalName)
    if (leftIndex === -1 && rightIndex === -1) return left.logicalName.localeCompare(right.logicalName)
    if (leftIndex === -1) return 1
    if (rightIndex === -1) return -1
    return leftIndex - rightIndex
  })
  const table = tables.find((item) => item.physicalName === selectedTable)
    ?? orderedTables[0]

  if (!table) {
    return <div className="schema-state"><Database size={24} /><strong>No browser tables found</strong></div>
  }

  const connections = tables.flatMap((source) => source.relationships
    .filter((relationship) => source.physicalName === table.physicalName || relationship.targetTable === table.physicalName)
    .map((relationship) => ({ source, relationship })))

  return (
    <div className="schema-browser">
      <div className="schema-notice">
        <Database size={16} />
        <p><strong>Live Browser DuckDB fixture.</strong> Keys and relationships are learning metadata over intentionally messy raw tables; they are not enforced constraints.</p>
      </div>

      <div className="schema-table-list" aria-label="Database tables">
        {orderedTables.map((item) => {
          const isFocused = focusedTables.includes(item.physicalName)
          const isSelected = item.physicalName === table.physicalName
          return (
            <button
              type="button"
              key={item.physicalName}
              className={isSelected ? 'is-selected' : ''}
              onClick={() => onSelectTable(item.physicalName)}
              aria-pressed={isSelected}
            >
              <span><Database size={13} />{item.logicalName}</span>
              <small>{item.rowCount} rows{isFocused ? ' · lesson data' : ''}</small>
            </button>
          )
        })}
      </div>

      <section className="schema-table-summary" aria-labelledby="schema-table-title">
        <div>
          <span>Selected table</span>
          <h3 id="schema-table-title">{table.logicalName}</h3>
          <code>{table.physicalName}</code>
        </div>
        <span className="schema-row-count"><Rows3 size={14} /> {table.rowCount} rows</span>
      </section>
      <p className="schema-description">{table.description}</p>
      <div className="schema-grain"><strong>Grain</strong><span>{table.grain}</span></div>

      <div className="schema-column-wrap">
        <table className="schema-column-table">
          <thead><tr><th>Key</th><th>Field</th><th>Type</th><th>Nullable</th></tr></thead>
          <tbody>
            {table.columns.map((column) => (
              <tr key={column.name}>
                <td>
                  <span className="schema-key-group">
                    {column.keyKinds.length
                      ? column.keyKinds.map((kind) => <span className={`schema-key-badge is-${kind}`} key={kind}>{schemaKeyLabels[kind]}</span>)
                      : <span className="schema-no-key">—</span>}
                  </span>
                </td>
                <td><code>{column.name}</code></td>
                <td>{column.dataType}</td>
                <td>{column.nullable ? 'Yes' : 'No'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <section className="schema-keys">
        <h4><KeyRound size={14} /> Key roles</h4>
        <ul>{table.keys.map((key) => <li key={`${key.kind}-${key.columns.join('-')}`}><strong>{schemaKeyLabels[key.kind]}</strong><code>{key.columns.join(' + ')}</code><span>{key.label}</span></li>)}</ul>
      </section>

      <section className="schema-relationships">
        <h4><Link2 size={14} /> Relationship graph</h4>
        {connections.length ? (
          <div className="schema-relationship-map">
            {connections.map(({ source, relationship }) => {
              const target = tables.find((item) => item.physicalName === relationship.targetTable)
              return (
                <div key={`${source.physicalName}-${relationship.targetTable}-${relationship.columns.join('-')}`}>
                  <button type="button" onClick={() => onSelectTable(source.physicalName)}>{source.logicalName}</button>
                  <span><small>{relationship.columns.join(' + ')}</small><ArrowRight size={15} /><small>{relationship.targetColumns.join(' + ')}</small></span>
                  <button type="button" onClick={() => onSelectTable(relationship.targetTable)}>{target?.logicalName ?? relationship.targetTable}</button>
                </div>
              )
            })}
          </div>
        ) : <p>No outgoing or incoming relationships are declared for this fixture table.</p>}
      </section>
    </div>
  )
}
