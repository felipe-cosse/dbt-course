import type { CourseModule, Lesson } from './course'

export type LearningTerm = {
  term: string
  definition: string
}

export type LearningVisual = {
  title: string
  caption: string
  nodes: [string, string, string, string]
}

export type ModuleLearningGuide = {
  bigIdea: string
  terms: [LearningTerm, LearningTerm, LearningTerm]
  pitfalls: [string, string, string]
  visual: LearningVisual
}

const guides: Record<string, ModuleLearningGuide> = {
  foundations: {
    bigIdea: 'dbt turns warehouse-resident source data into trusted analytical relations. Grain is the contract that keeps every transformation honest.',
    terms: [
      { term: 'ELT', definition: 'Load source data first, then transform it where analytical compute already lives.' },
      { term: 'Grain', definition: 'The precise business meaning represented by one row in a relation.' },
      { term: 'Model', definition: 'A versioned SELECT statement plus configuration that dbt compiles and materializes.' },
    ],
    pitfalls: [
      'Treating dbt as an ingestion or dashboard tool.',
      'Joining relations before stating the grain on both sides.',
      'Debugging authored Jinja without inspecting the compiled SQL.',
    ],
    visual: {
      title: 'The transformation responsibility map',
      caption: 'Data moves through clear ownership boundaries; dbt begins after ingestion and ends before consumption.',
      nodes: ['Operational data', 'Loaded raw data', 'dbt models + tests', 'Trusted marts'],
    },
  },
  'project-graph': {
    bigIdea: 'A dbt project is a directed graph. source() declares the external boundary and ref() makes internal dependencies explicit.',
    terms: [
      { term: 'Source', definition: 'A named external relation with freshness, ownership, and test metadata.' },
      { term: 'ref()', definition: 'A dependency declaration that resolves relation names and creates a lineage edge.' },
      { term: 'Selector', definition: 'Graph-aware syntax for choosing resources, parents, children, tags, or changed state.' },
    ],
    pitfalls: [
      'Hard-coding database and schema names inside models.',
      'Using seeds for large or sensitive operational data.',
      'Running a node without understanding which parents and descendants are selected.',
    ],
    visual: {
      title: 'How the project becomes a DAG',
      caption: 'Each dependency declaration gives dbt enough information to compile, order, test, and document the build.',
      nodes: ['source()', 'staging ref()', 'intermediate ref()', 'mart + exposure'],
    },
  },
  staging: {
    bigIdea: 'Staging models create a stable, typed, lightly cleaned interface over imperfect source data without hiding business history.',
    terms: [
      { term: 'Source contract', definition: 'The names, types, and meaning received from an upstream system.' },
      { term: 'Deduplication', definition: 'A deterministic rule that selects one source version for a business key.' },
      { term: 'Late arrival', definition: 'A record loaded after the time window in which it logically occurred.' },
    ],
    pitfalls: [
      'Aggregating in staging and silently changing the source grain.',
      'Dropping failed or cancelled events that are still operationally meaningful.',
      'Ordering CDC rows by a timestamp that can tie without a second tiebreaker.',
    ],
    visual: {
      title: 'Raw-to-staging contract',
      caption: 'Staging renames, casts, normalizes, and deduplicates while preserving traceability to the source.',
      nodes: ['Raw columns', 'Type + name cleanup', 'Deterministic winner', 'Stable stg_* model'],
    },
  },
  testing: {
    bigIdea: 'Quality checks should protect business risk: grain, required relationships, accepted states, financial reconciliation, and complex logic.',
    terms: [
      { term: 'Data test', definition: 'A query over built data that succeeds when it returns zero failing rows.' },
      { term: 'Unit test', definition: 'Static inputs and expected rows used to validate model logic before materialization.' },
      { term: 'Severity', definition: 'The policy that decides whether a failed assertion warns or stops the build.' },
    ],
    pitfalls: [
      'Testing every column while missing the model grain.',
      'Using a fixed total instead of reconciling independent transformation paths.',
      'Writing a regression test for the symptom rather than the causal invariant.',
    ],
    visual: {
      title: 'A risk-based test stack',
      caption: 'Unit tests validate logic early; data tests validate warehouse reality; reconciliation protects business measures.',
      nodes: ['Static fixtures', 'Model logic', 'Built relation', 'Business reconciliation'],
    },
  },
  'jinja-macros': {
    bigIdea: 'Jinja runs before warehouse SQL. Good macros remove mechanical repetition while leaving business logic readable in compiled output.',
    terms: [
      { term: 'Compile time', definition: 'The phase where dbt resolves the graph and renders Jinja into executable SQL.' },
      { term: 'Macro', definition: 'A reusable Jinja function that emits SQL or returns a value.' },
      { term: 'Dispatch', definition: 'A stable macro interface with adapter-specific implementations selected at compile time.' },
    ],
    pitfalls: [
      'Confusing a Jinja loop with a row-by-row database loop.',
      'Hiding domain logic in a macro that should be a tested model.',
      'Claiming portability without running the same fixture on each analytical target.',
    ],
    visual: {
      title: 'From authored template to warehouse result',
      caption: 'The compiler evaluates Jinja first; the database only receives the rendered SQL.',
      nodes: ['SQL + Jinja', 'dbt parse', 'Compiled SQL', 'Warehouse execution'],
    },
  },
  materializations: {
    bigIdea: 'Materialization is a physical-design decision. Choose it from access pattern, freshness, cost, inspectability, and rebuild behavior.',
    terms: [
      { term: 'View', definition: 'Stored query logic evaluated when a consumer reads it.' },
      { term: 'Table', definition: 'Persisted results rebuilt by dbt, trading storage for predictable reads.' },
      { term: 'Ephemeral', definition: 'A model inlined as a CTE into downstream compiled SQL.' },
    ],
    pitfalls: [
      'Making every model a table without measuring the workload.',
      'Benchmarking a tiny fixture and generalizing the result to production.',
      'Adding indexes or hooks that are not idempotent and environment-aware.',
    ],
    visual: {
      title: 'Materialization decision path',
      caption: 'Start with how the model is consumed, then validate the decision with query plans and repeatable timing.',
      nodes: ['Access pattern', 'Freshness + scale', 'Physical relation', 'Measured workload'],
    },
  },
  incremental: {
    bigIdea: 'Incremental models are stateful systems. Their boundary, unique key, late-data policy, and recovery path define correctness.',
    terms: [
      { term: 'Watermark', definition: 'A timestamp or sequence boundary used to identify candidate new and changed rows.' },
      { term: 'Lookback', definition: 'A bounded overlap that reprocesses recent history to catch late records.' },
      { term: 'Idempotency', definition: 'Repeated processing of the same input produces the same final state.' },
    ],
    pitfalls: [
      'Using append-only logic for mutable business entities.',
      'Assuming a finite lookback captures every possible late event.',
      'Running full refresh without first reconciling and preserving a rollback path.',
    ],
    visual: {
      title: 'The incremental decision flow',
      caption: 'A first build processes history; later builds reprocess a safe boundary and merge on a declared key.',
      nodes: ['Source changes', 'Watermark + lookback', 'Merge by unique key', 'Reconcile + recover'],
    },
  },
  snapshots: {
    bigIdea: 'Snapshots turn mutable source rows into validity intervals so analysis can use the attributes that were true at an event time.',
    terms: [
      { term: 'SCD Type 2', definition: 'History modeled as multiple versions with valid-from and valid-to boundaries.' },
      { term: 'Check strategy', definition: 'Detect changes by comparing configured source columns.' },
      { term: 'Point-in-time join', definition: 'Match an event to the dimension version whose validity interval contains the event time.' },
    ],
    pitfalls: [
      'Joining historical facts to only the current dimension row.',
      'Using overlapping or ambiguous validity boundaries.',
      'Assuming hard deletes are captured without configuring and testing their behavior.',
    ],
    visual: {
      title: 'Customer history as validity intervals',
      caption: 'Every change closes one version and opens the next; events join to exactly one interval.',
      nodes: ['Mutable source row', 'Change detected', '[valid_from, valid_to)', 'Point-in-time fact join'],
    },
  },
  'marts-metrics': {
    bigIdea: 'Marts encode stable business grain and measures; a semantic model makes entities, dimensions, and metric definitions reusable.',
    terms: [
      { term: 'Fact', definition: 'An event or process relation with measures at a declared grain.' },
      { term: 'Dimension', definition: 'Descriptive context used to group, filter, and label facts.' },
      { term: 'Semantic model', definition: 'Metadata that declares entities, dimensions, measures, and how metrics can be queried.' },
    ],
    pitfalls: [
      'Mixing measures from different grains in one aggregation.',
      'Averaging averages without weighting by the underlying population.',
      'Publishing a metric name without defining eligible rows, time grain, and null behavior.',
    ],
    visual: {
      title: 'From star schema to governed metric',
      caption: 'Facts connect to conformed dimensions; semantic metadata turns those joins into consistent metrics.',
      nodes: ['Staged events', 'Fact + dimensions', 'Semantic model', 'Reusable metric query'],
    },
  },
  'docs-lineage': {
    bigIdea: 'Documentation and lineage are operational interfaces: they reveal meaning, ownership, downstream impact, and contract risk before change.',
    terms: [
      { term: 'Contract', definition: 'An enforced guarantee about a model’s output column names and data types.' },
      { term: 'Exposure', definition: 'A declared downstream use such as a dashboard, application, or ML workflow.' },
      { term: 'Manifest', definition: 'The dbt artifact containing parsed resources, configuration, dependencies, and metadata.' },
    ],
    pitfalls: [
      'Descriptions that repeat a column name but omit business meaning.',
      'Enforcing contracts before a rapidly changing interface is ready for stability.',
      'Creating hidden lineage by hard-coding relation names instead of ref() or source().',
    ],
    visual: {
      title: 'The lineage impact graph',
      caption: 'Metadata connects an upstream source change to models, tests, owners, and downstream consumers.',
      nodes: ['Source contract', 'Model lineage', 'Tests + owners', 'Exposure impact'],
    },
  },
  'deployment-ci': {
    bigIdea: 'A production dbt release is a repeatable promotion of code, state, credentials, tests, and artifacts—not a manual command on a laptop.',
    terms: [
      { term: 'State selection', definition: 'Compare manifests to identify new or modified resources.' },
      { term: 'Defer', definition: 'Resolve unbuilt upstream references to relations represented by a prior manifest.' },
      { term: 'Artifact', definition: 'Machine-readable evidence such as manifest.json and run_results.json.' },
    ],
    pitfalls: [
      'Committing credentials in profiles or CI configuration.',
      'Using slim CI without preserving the production manifest baseline.',
      'Uploading artifacts without failing the job when they are missing or stale.',
    ],
    visual: {
      title: 'Promotion from branch to production',
      caption: 'Isolated CI builds changed graph slices, records evidence, and promotes only after quality gates pass.',
      nodes: ['Pull request', 'State-aware CI', 'Quality + artifacts', 'Production job'],
    },
  },
  capstone: {
    bigIdea: 'The capstone proves the complete boundary: MySQL supplies operational extracts; dbt builds equivalent analytical meaning in DuckDB and PostgreSQL.',
    terms: [
      { term: 'Source system', definition: 'The operational database that owns transactions and is extracted before dbt begins.' },
      { term: 'Analytical target', definition: 'A database where dbt compiles and materializes the transformation graph.' },
      { term: 'Parity', definition: 'Equivalent grain, contracts, tests, and business results across supported analytical targets.' },
    ],
    pitfalls: [
      'Treating the MySQL OLTP service as a dbt target in this project.',
      'Calling two builds equivalent without reconciling row counts and measures.',
      'Delivering SQL without recovery steps, artifacts, documentation, and acceptance evidence.',
    ],
    visual: {
      title: 'The three-database course architecture',
      caption: 'MySQL exercises the ingestion boundary; DuckDB and PostgreSQL run and validate the same dbt graph.',
      nodes: ['MySQL OLTP', 'Bounded CSV extract', 'DuckDB + PostgreSQL', 'Tested analytics marts'],
    },
  },
}

export function getModuleLearningGuide(module: CourseModule) {
  return guides[module.id] ?? guides.foundations
}

function significantTokens(value: string) {
  const ignored = new Set(['and', 'the', 'with', 'from', 'into', 'that', 'this', 'using', 'write', 'build', 'create'])
  return value
    .toLowerCase()
    .match(/[a-z][a-z0-9_]+/g)
    ?.filter((token) => token.length > 3 && !ignored.has(token)) ?? []
}

function closestObjective(lesson: Lesson, evidence: string, fallbackIndex: number) {
  const evidenceTokens = significantTokens(evidence)
  let bestIndex = fallbackIndex
  let bestScore = 0

  lesson.objectives.forEach((objective, index) => {
    const score = significantTokens(objective).reduce(
      (total, token) => total + (evidenceTokens.some((candidate) => candidate.startsWith(token.slice(0, 5)) || token.startsWith(candidate.slice(0, 5))) ? 1 : 0),
      0,
    )
    if (score > bestScore) {
      bestScore = score
      bestIndex = index
    }
  })

  return lesson.objectives[bestIndex]
}

export function getLessonAlignment(lesson: Lesson) {
  const exerciseEvidence = `${lesson.exercise.prompt} ${lesson.exercise.solutionSql}`
  const quizEvidence = `${lesson.quiz.question} ${lesson.quiz.explanation}`

  return {
    exerciseObjective: closestObjective(lesson, exerciseEvidence, lesson.objectives.length - 1),
    quizObjective: closestObjective(lesson, quizEvidence, 0),
  }
}

export function getAssessmentAlignmentScore(lesson: Lesson, assessment: 'exercise' | 'quiz') {
  const lessonTokens = significantTokens([
    lesson.title,
    lesson.summary,
    ...lesson.objectives,
    ...lesson.explanation,
  ].join(' '))
  const evidence = assessment === 'exercise'
    ? `${lesson.exercise.prompt} ${lesson.exercise.solutionSql}`
    : `${lesson.quiz.question} ${lesson.quiz.explanation}`
  const evidenceTokens = significantTokens(evidence)

  return evidenceTokens.filter((candidate) => lessonTokens.some(
    (token) => candidate.startsWith(token.slice(0, 5)) || token.startsWith(candidate.slice(0, 5)),
  )).length
}
