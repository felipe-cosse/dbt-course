import { CheckCircle2, Database, FileCode2, GitBranch, ShieldCheck, Trophy } from 'lucide-react'

const deliverables = [
  '6 staging, 3 intermediate, and 4 mart models',
  'An incremental event model that handles late arrivals',
  'A timestamp snapshot for mutable order status',
  '15 generic tests, 2 singular tests, and 2 unit tests',
  'Source freshness, model contracts, descriptions, and one exposure',
  'A modified-model CI selector and production runbook',
]

const rubric = [
  ['Transformation correctness', 30],
  ['Testing and data quality', 20],
  ['Data model and grain', 15],
  ['Incremental safety', 15],
  ['Documentation and lineage', 10],
  ['Deployment operations', 10],
] as const

export function CapstoneView() {
  return (
    <div className="capstone-page page-pad readable-page">
      <header className="capstone-hero">
        <div>
          <h1>Build the Commerce Warehouse</h1>
          <p>Turn an operational commerce feed into a tested, documented, production-shaped warehouse that can survive late data and changing requirements.</p>
          <div className="capstone-engines"><span><Database size={17} /> DuckDB</span><span>PostgreSQL</span><span>MySQL source</span></div>
        </div>
        <div className="capstone-mark" aria-hidden="true"><Trophy size={54} /></div>
      </header>

      <div className="capstone-grid">
        <section className="brief-section" id="capstone-deliverables">
          <h2>The brief</h2>
          <p>Your operations team needs trusted daily GMV, collected revenue, cancellation rate, repeat-customer rate, seller SLA, and delivery-delay metrics. The source system mutates order status, sends late payments, and occasionally duplicates extracts.</p>
          <h3>Architecture</h3>
          <div className="pipeline-diagram">
            <span><Database size={20} /> MySQL OLTP</span>
            <i />
            <span><FileCode2 size={20} /> Raw extracts</span>
            <i />
            <span><GitBranch size={20} /> dbt DAG</span>
            <i />
            <span><ShieldCheck size={20} /> Trusted marts</span>
          </div>
          <h3>Required deliverables</h3>
          <ul className="check-list">
            {deliverables.map((item) => <li key={item}><CheckCircle2 size={18} />{item}</li>)}
          </ul>
        </section>

        <aside className="rubric-panel">
          <h2>Evaluation rubric</h2>
          <p>100 points. Correctness matters most, but production safety is part of correctness.</p>
          {rubric.map(([label, weight]) => (
            <div className="rubric-row" key={label}>
              <span>{label}</span><strong>{weight}%</strong>
              <i><i style={{ width: `${weight * 3.1}%` }} /></i>
            </div>
          ))}
          <div className="readiness-note">
            <strong>Before you begin</strong>
            <span>Complete Modules 01–10 and pass the incremental pipeline checkpoint.</span>
          </div>
          <a className="primary-button" href="#capstone-deliverables">Review project deliverables</a>
        </aside>
      </div>
    </div>
  )
}
