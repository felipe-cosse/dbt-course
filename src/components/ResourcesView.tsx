import { useDeferredValue, useMemo, useState } from 'react'
import { BookOpen, Braces, Database, Search, TerminalSquare } from 'lucide-react'

const commands = [
  { command: 'dbt debug', use: 'Validate profiles, credentials, and the target connection.' },
  { command: 'dbt build', use: 'Run models, tests, snapshots, and seeds in DAG order.' },
  { command: 'dbt run --select +fct_orders', use: 'Build a model and every upstream dependency.' },
  { command: 'dbt test --select source:*', use: 'Run tests defined on every declared source.' },
  { command: 'dbt compile', use: 'Render Jinja and inspect warehouse-ready SQL.' },
  { command: 'dbt ls --select state:modified+', use: 'List changed nodes and their descendants for CI.' },
  { command: 'dbt docs generate', use: 'Create manifest and catalog artifacts for lineage docs.' },
  { command: 'dbt snapshot', use: 'Capture Type 2 history for mutable source records.' },
]

const glossary = [
  ['Grain', 'What one row represents. State it before writing joins or measures.'],
  ['Source', 'A named contract around raw data loaded outside dbt.'],
  ['Model', 'A select statement that dbt materializes in the target warehouse.'],
  ['Materialization', 'The strategy used to persist a model: view, table, incremental, or ephemeral.'],
  ['Idempotency', 'A rerun produces the same correct state without duplicating side effects.'],
  ['Snapshot', 'A dbt resource that records changes to mutable source rows over time.'],
  ['Exposure', 'A downstream use such as a dashboard, notebook, or application.'],
  ['State selection', 'Selection based on differences between current and previous dbt artifacts.'],
]

export function ResourcesView() {
  const [query, setQuery] = useState('')
  const deferredQuery = useDeferredValue(query.trim().toLowerCase())
  const filteredGlossary = useMemo(
    () => glossary.filter(([term, definition]) => `${term} ${definition}`.toLowerCase().includes(deferredQuery)),
    [deferredQuery],
  )

  return (
    <div className="resources-page page-pad readable-page">
      <header className="section-header">
        <div>
          <h1>Field guide</h1>
          <p>The commands, patterns, and vocabulary worth keeping beside your terminal.</p>
        </div>
        <label className="resource-search">
          <Search size={17} />
          <span className="sr-only">Search glossary</span>
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search the glossary" />
        </label>
      </header>

      <section className="resource-section">
        <div className="resource-heading">
          <TerminalSquare size={21} />
          <div><h2>Command guide</h2><p>Use narrow selectors locally before running the whole project.</p></div>
        </div>
        <div className="command-table">
          {commands.map((item) => (
            <div key={item.command}>
              <code>{item.command}</code>
              <span>{item.use}</span>
              <button type="button" onClick={() => navigator.clipboard?.writeText(item.command)}>Copy</button>
            </div>
          ))}
        </div>
      </section>

      <div className="resource-columns">
        <section className="resource-section">
          <div className="resource-heading">
            <BookOpen size={21} />
            <div><h2>Glossary</h2><p>Shared language for reliable warehouse work.</p></div>
          </div>
          <dl className="glossary-list">
            {filteredGlossary.map(([term, definition]) => (
              <div key={term}><dt>{term}</dt><dd>{definition}</dd></div>
            ))}
          </dl>
        </section>

        <section className="resource-section dialect-section">
          <div className="resource-heading">
            <Database size={21} />
            <div><h2>Dialect matrix</h2><p>The differences used in portability labs.</p></div>
          </div>
          <div className="dialect-table" role="table" aria-label="SQL dialect comparison">
            <div role="row"><b>Pattern</b><b>DuckDB</b><b>PostgreSQL</b><b>MySQL</b></div>
            <div role="row"><span>Date diff</span><code>date_diff</code><code>age / -</code><code>datediff</code></div>
            <div role="row"><span>Safe cast</span><code>try_cast</code><code>case + cast</code><code>cast</code></div>
            <div role="row"><span>Upsert</span><code>merge</code><code>on conflict</code><code>on duplicate</code></div>
            <div role="row"><span>JSON text</span><code>-&gt;&gt;</code><code>-&gt;&gt;</code><code>json_unquote</code></div>
          </div>
          <div className="pattern-note"><Braces size={18} /><span>Keep dialect-specific SQL inside dispatched macros, not scattered through marts.</span></div>
        </section>
      </div>
    </div>
  )
}

