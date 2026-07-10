import { useMemo, useState, type KeyboardEvent } from 'react'
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Code2,
  Copy,
  Database,
  FileCode2,
  FlaskConical,
  Lightbulb,
  Play,
  RefreshCw,
  RotateCcw,
  TerminalSquare,
} from 'lucide-react'
import type { Lesson } from '../data/course'
import { orderPreview, type PreviewRow } from '../data/sampleData'
import { detectExerciseLanguage, exerciseMode, validateStructure } from '../lib/exerciseValidation'

type LessonTab = 'learn' | 'lab' | 'check'
type RunState = 'idle' | 'loading' | 'success' | 'error'

type LessonWorkspaceProps = {
  lesson: Lesson
  lessonIndex: number
  totalLessons: number
  isComplete: boolean
  onBackToCourse: () => void
  onPrevious?: () => void
  onNext?: () => void
  onComplete: () => void
  onSaveQuiz: (score: number) => void
}

function fallbackColumns(rows: PreviewRow[]) {
  return rows.length ? Object.keys(rows[0]) : []
}

export function LessonWorkspace({
  lesson,
  lessonIndex,
  totalLessons,
  isComplete,
  onBackToCourse,
  onPrevious,
  onNext,
  onComplete,
  onSaveQuiz,
}: LessonWorkspaceProps) {
  const [tab, setTab] = useState<LessonTab>('lab')
  const [editorValue, setEditorValue] = useState(lesson.exercise.starterSql)
  const [runState, setRunState] = useState<RunState>('idle')
  const [terminalLines, setTerminalLines] = useState<string[]>([
    `$ dbt run --select ${lesson.id.replaceAll('-', '_')}`,
    'Ready. Edit the model, then run it against the local learning database.',
  ])
  const [previewRows, setPreviewRows] = useState<PreviewRow[]>(orderPreview)
  const [previewColumns, setPreviewColumns] = useState<string[]>(fallbackColumns(orderPreview))
  const [elapsedMs, setElapsedMs] = useState<number | null>(null)
  const [hintCount, setHintCount] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [submittedAnswer, setSubmittedAnswer] = useState(false)
  const [exercisePassed, setExercisePassed] = useState(false)
  const [quizPassed, setQuizPassed] = useState(false)
  const [solutionLoaded, setSolutionLoaded] = useState(false)

  const lineNumbers = useMemo(
    () => Array.from({ length: Math.max(12, editorValue.split('\n').length) }, (_, index) => index + 1),
    [editorValue],
  )
  const language = detectExerciseLanguage(lesson)
  const mode = exerciseMode(lesson)
  const exerciseFilename = mode === 'duckdb'
    ? `models/${lesson.id.replaceAll('-', '_')}.sql`
    : language === 'yaml'
      ? `${lesson.id}.yml`
      : language === 'shell'
        ? 'commands.sh'
        : language === 'python'
          ? `${lesson.id}.py`
          : `models/${lesson.id.replaceAll('-', '_')}.sql`
  const isCorrect = selectedAnswer === lesson.quiz.answerIndex
  const canComplete = isComplete || (exercisePassed && quizPassed)

  async function runModel() {
    setTab('lab')
    setRunState('loading')
    setTerminalLines([
      `$ dbt run --select ${lesson.id.replaceAll('-', '_')}`,
      mode === 'duckdb' ? 'Compiling dbt source/ref expressions…' : 'Running the guided structure check…',
    ])

    try {
      if (!editorValue.trim()) throw new Error('The exercise file is empty. Restore the starter or write your solution first.')

      if (mode === 'duckdb') {
        const { runDuckDbQuery } = await import('../lib/duckdbRuntime')
        const result = await runDuckDbQuery(editorValue)
        const missingColumns = lesson.exercise.expectedColumns.filter((column) => !result.columns.includes(column))
        if (missingColumns.length) {
          throw new Error(`The result is missing required columns: ${missingColumns.join(', ')}.`)
        }
        setPreviewRows(result.rows.slice(0, 100))
        setPreviewColumns(result.columns)
        setElapsedMs(result.elapsedMs)
        setTerminalLines([
          `$ dbt run --select ${lesson.id.replaceAll('-', '_')}`,
          `Compiled SQL: ${result.compiledSql.replace(/\s+/g, ' ').slice(0, 145)}${result.compiledSql.length > 145 ? '…' : ''}`,
          `1 of 1 OK created sql model ${lesson.id.replaceAll('-', '_')} [SUCCESS in ${(result.elapsedMs / 1000).toFixed(2)}s]`,
          `PASS in ${(result.elapsedMs / 1000).toFixed(2)}s · ${result.rows.length} rows returned`,
        ])
      } else {
        const validation = validateStructure(lesson, editorValue)
        if (!validation.ok) {
          throw new Error(`The guided check still needs: ${validation.missing.join(', ')}.`)
        }
        const validationTime = 82 + editorValue.length % 140
        setPreviewRows([])
        setPreviewColumns(lesson.exercise.expectedColumns)
        setElapsedMs(validationTime)
        setTerminalLines([
          `$ validate ${exerciseFilename}`,
          `Parsed ${language.toUpperCase()} structure successfully`,
          `Required structure found for: ${lesson.exercise.expectedColumns.join(', ')}`,
          'Use scripts/lab.py build for real dbt compilation and warehouse assertions.',
          `PASS in ${(validationTime / 1000).toFixed(2)}s`,
        ])
      }
      setExercisePassed(true)
      setRunState('success')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'The local runner could not execute this exercise.'
      setRunState('error')
      setExercisePassed(false)
      setElapsedMs(null)
      setTerminalLines((current) => [...current, `ERROR: ${message}`])
    }
  }

  function resetExercise() {
    setEditorValue(lesson.exercise.starterSql)
    setRunState('idle')
    setElapsedMs(null)
    setExercisePassed(false)
    setSolutionLoaded(false)
    setHintCount(0)
    setPreviewRows(orderPreview)
    setPreviewColumns(fallbackColumns(orderPreview))
    setTerminalLines([
      `$ dbt run --select ${lesson.id.replaceAll('-', '_')}`,
      'Starter restored. Your local database was not modified.',
    ])
  }

  function submitQuiz() {
    if (selectedAnswer === null) return
    setSubmittedAnswer(true)
    onSaveQuiz(isCorrect ? 100 : 0)
    setQuizPassed(isCorrect)
  }

  function finishLesson() {
    if (!canComplete) return
    onComplete()
    onNext?.()
  }

  function moveTab(event: KeyboardEvent<HTMLButtonElement>) {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return
    event.preventDefault()
    const tabs: LessonTab[] = ['learn', 'lab', 'check']
    const currentIndex = tabs.indexOf(tab)
    const nextIndex = event.key === 'Home'
      ? 0
      : event.key === 'End'
        ? tabs.length - 1
        : (currentIndex + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length
    setTab(tabs[nextIndex])
    const controls = event.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>('[role="tab"]')
    controls?.[nextIndex]?.focus()
  }

  return (
    <div className="lesson-page">
      <header className="lesson-header">
        <p className="lesson-breadcrumb">
          <button type="button" onClick={onBackToCourse}>Course</button>
          <ChevronRight size={13} />
          <span>{lesson.number}</span>
        </p>
        <div className="lesson-title-row">
          <div>
            <h1>{lesson.title}</h1>
            <p>{lesson.summary}</p>
          </div>
          <div className="lesson-actions">
            <button type="button" className="primary-button" onClick={runModel} disabled={runState === 'loading'}>
              {runState === 'loading' ? <RefreshCw size={17} className="spin" /> : <Play size={17} fill="currentColor" />}
              {mode === 'duckdb' ? 'Run model' : 'Validate'}
            </button>
            <button type="button" className="secondary-button" onClick={resetExercise}>
              <RotateCcw size={16} /> Reset
            </button>
          </div>
        </div>
        <div className="lesson-nav-row">
          <div className="lesson-tabs" role="tablist" aria-label="Lesson sections">
            <button id="lesson-tab-learn" aria-controls="lesson-panel-learn" type="button" className={`lesson-tab ${tab === 'learn' ? 'is-active' : ''}`} onClick={() => setTab('learn')} onKeyDown={moveTab} role="tab" tabIndex={tab === 'learn' ? 0 : -1} aria-selected={tab === 'learn'}>
              <BookOpen size={17} /> Learn
            </button>
            <button id="lesson-tab-lab" aria-controls="lesson-panel-lab" type="button" className={`lesson-tab ${tab === 'lab' ? 'is-active' : ''}`} onClick={() => setTab('lab')} onKeyDown={moveTab} role="tab" tabIndex={tab === 'lab' ? 0 : -1} aria-selected={tab === 'lab'}>
              <FlaskConical size={17} /> Lab
            </button>
            <button id="lesson-tab-check" aria-controls="lesson-panel-check" type="button" className={`lesson-tab ${tab === 'check' ? 'is-active' : ''}`} onClick={() => setTab('check')} onKeyDown={moveTab} role="tab" tabIndex={tab === 'check' ? 0 : -1} aria-selected={tab === 'check'}>
              <CheckCircle2 size={17} /> Check
            </button>
          </div>
          <span className="lesson-duration"><Clock3 size={12} /> {lesson.minutes} min · {lesson.engine}</span>
        </div>
      </header>

      {tab === 'learn' ? (
        <div id="lesson-panel-learn" aria-labelledby="lesson-tab-learn" className="learn-layout" role="tabpanel">
          <article className="lesson-article">
            <h2>What you’ll build</h2>
            <ul className="objective-list">
              {lesson.objectives.map((objective) => <li key={objective}><CheckCircle2 size={18} />{objective}</li>)}
            </ul>
            {lesson.explanation.map((paragraph, index) => (
              <div key={paragraph}>
                {index === 1 ? <h2>Production perspective</h2> : null}
                <p>{paragraph}</p>
              </div>
            ))}
            <div className="code-example">
              <header><span>{lesson.codeExample.filename}</span><span>{lesson.codeExample.language}</span></header>
              <pre><code>{lesson.codeExample.code}</code></pre>
            </div>
            <div className="concept-callout">
              <strong>Engineering rule</strong>
              <p>Make the model’s grain and contract obvious before optimizing the query. Reliability is a design decision, not a cleanup step.</p>
            </div>
          </article>
          <aside className="lesson-sidecard">
            <h2>Lesson map</h2>
            <dl>
              <div><dt>Scenario</dt><dd>{lesson.summary}</dd></div>
              <div><dt>Engine</dt><dd>{lesson.engine}</dd></div>
              <div><dt>File</dt><dd><code>{lesson.codeExample.filename}</code></dd></div>
              <div><dt>Practice</dt><dd>{lesson.exercise.prompt}</dd></div>
            </dl>
            <button type="button" className="primary-button" onClick={() => setTab('lab')}>Open the lab <ArrowRight size={16} /></button>
          </aside>
        </div>
      ) : null}

      {tab === 'lab' ? (
        <div id="lesson-panel-lab" aria-labelledby="lesson-tab-lab" role="tabpanel">
          <div className="lab-grid">
            <section className="editor-panel" aria-label="Code editor and terminal">
              <div className="editor-toolbar">
                <div className="editor-tabs">
                  <span className="editor-file is-active"><FileCode2 size={14} />{exerciseFilename}</span>
                </div>
                <div className="editor-tools">
                  <button type="button" aria-label="Copy exercise" onClick={() => navigator.clipboard?.writeText(editorValue)}><Copy size={15} /></button>
                </div>
              </div>
              <div className="editor-body">
                <div className="line-numbers" aria-hidden="true">{lineNumbers.map((line) => <div key={line}>{line}</div>)}</div>
                <textarea
                  className="sql-editor"
                  aria-label={`Edit ${exerciseFilename}`}
                  spellCheck={false}
                  value={editorValue}
                  onChange={(event) => setEditorValue(event.target.value)}
                />
              </div>
              <div className="terminal-panel">
                <div className="terminal-head"><TerminalSquare size={15} /><strong>Terminal</strong><span>{mode === 'duckdb' ? 'Real DuckDB WASM' : 'Guided check · local dbt required'}</span><button type="button" aria-label="Clear terminal" onClick={() => setTerminalLines([])}><RotateCcw size={14} /></button></div>
                <div className="terminal-output" aria-live="polite">
                  {terminalLines.map((line, index) => (
                    <p
                      key={`${line}-${index}`}
                      className={line.startsWith('$') ? 'command' : line.includes('PASS') || line.includes('SUCCESS') ? 'success-output' : line.includes('ERROR') ? 'error-output' : 'muted-output'}
                    >{line}</p>
                  ))}
                  {runState === 'loading' ? <span className="terminal-cursor" /> : null}
                </div>
              </div>
            </section>

            <section className="data-panel" aria-label="Query result preview">
              <div className="data-head">
                <div><h2>Data preview: <span>{lesson.id.replaceAll('-', '_')}</span></h2><p>Source: DuckDB · Rows: {previewRows.length}{elapsedMs ? ` · ${elapsedMs.toFixed(0)} ms` : ''}</p></div>
                <button type="button" aria-label="Refresh preview" onClick={runModel} disabled={runState === 'loading'}><RefreshCw size={16} /></button>
              </div>
              {previewRows.length ? (
                <div className="data-table-wrap">
                  <table className="data-table">
                    <thead><tr>{previewColumns.map((column) => <th key={column}>{column}</th>)}</tr></thead>
                    <tbody>
                      {previewRows.map((row, index) => (
                        <tr key={`${index}-${String(row[previewColumns[0]])}`}>
                          {previewColumns.map((column) => <td key={column}>{row[column] === null ? 'NULL' : String(row[column])}</td>)}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : <div className="data-empty"><Database size={28} /><p>{mode === 'duckdb' ? 'Run the model to inspect its rows and column contract.' : 'This guided check validates file structure. Run scripts/lab.py build for real dbt results.'}</p></div>}
              <div className="data-footer"><span>Showing {Math.min(100, previewRows.length)} of {previewRows.length} rows</span><span>Local browser database</span></div>
            </section>

            <aside className="steps-column">
              <article>
                <h2>Lesson steps</h2>
                <div className="step-item is-complete">
                  <span className="step-number"><Check size={14} /></span>
                  <div className="step-copy"><strong>Understand the task</strong><p>{lesson.exercise.prompt}</p><span className="step-state">Complete</span></div>
                </div>
                <div className={`step-item ${runState === 'success' ? 'is-complete' : 'is-current'}`}>
                  <span className="step-number">2</span>
                  <div className="step-copy"><strong>Shape the model</strong><p>Edit the starter, preserving the intended grain.</p><span className="step-state">{runState === 'success' ? 'Complete' : 'In progress'}</span></div>
                </div>
                <div className={`step-item ${runState === 'success' ? 'is-current' : ''}`}>
                  <span className="step-number">3</span>
                  <div className="step-copy"><strong>Validate the contract</strong><p>Confirm the result has {lesson.exercise.expectedColumns.join(', ')}.</p><span className="step-state">{runState === 'success' ? 'Ready' : 'Pending'}</span></div>
                </div>
                {hintCount > 0 ? <div className="hint-box"><Lightbulb size={14} /><span>{lesson.exercise.hints[hintCount - 1]}</span></div> : null}
                {hintCount < lesson.exercise.hints.length ? <button type="button" className="hint-button" onClick={() => setHintCount((count) => count + 1)}>Reveal hint {hintCount + 1}</button> : null}
                {hintCount === lesson.exercise.hints.length && !solutionLoaded ? (
                  <button type="button" className="hint-button" onClick={() => { setEditorValue(lesson.exercise.solutionSql); setSolutionLoaded(true); setRunState('idle') }}>Load reference solution</button>
                ) : null}
              </article>
              <article className="dataset-card">
                <h3>Learning dataset</h3>
                <p>A deliberately messy commerce fixture. The full local lab also supports the public UCI Online Retail dataset.</p>
                <dl><dt>Adapter</dt><dd>{lesson.engine}</dd><dt>Profile</dt><dd>dbt_forge</dd><dt>Mode</dt><dd>{mode === 'duckdb' ? 'Real browser SQL' : 'Guided check + local dbt'}</dd></dl>
              </article>
            </aside>
          </div>
        </div>
      ) : null}

      {tab === 'check' ? (
        <div id="lesson-panel-check" aria-labelledby="lesson-tab-check" className="check-layout" role="tabpanel">
          <article className="quiz-card">
            <span>KNOWLEDGE CHECK</span>
            <h2>{lesson.quiz.question}</h2>
            <div className="quiz-options">
              {lesson.quiz.options.map((option, index) => {
                const answerClass = submittedAnswer
                  ? index === lesson.quiz.answerIndex ? 'is-correct' : index === selectedAnswer ? 'is-wrong' : ''
                  : selectedAnswer === index ? 'is-selected' : ''
                return (
                  <button key={option} type="button" className={`quiz-option ${answerClass}`} onClick={() => { setSelectedAnswer(index); setSubmittedAnswer(false) }}>
                    <i>{String.fromCharCode(65 + index)}</i><span>{option}</span>
                  </button>
                )
              })}
            </div>
            <button type="button" className="primary-button" disabled={selectedAnswer === null} onClick={submitQuiz}>Check answer</button>
            {submittedAnswer ? (
              <div className={`quiz-feedback ${isCorrect ? '' : 'is-wrong'}`}>
                <strong>{isCorrect ? 'Correct — contract understood.' : 'Not yet — trace the model again.'}</strong>
                <p>{lesson.quiz.explanation}</p>
              </div>
            ) : null}
          </article>
          <aside className="check-aside">
            <h2>Before you move on</h2>
            <p>A lesson is complete when you can explain the decision, not just recognize the syntax.</p>
            <ul>{lesson.objectives.map((objective) => <li key={objective}><CheckCircle2 size={15} />{objective}</li>)}</ul>
          </aside>
        </div>
      ) : null}

      <footer className="lesson-footer">
        <button type="button" className="secondary-button" onClick={onPrevious} disabled={!onPrevious}><ArrowLeft size={16} /> Previous</button>
        <span className="lesson-count">Lesson {lessonIndex + 1} of {totalLessons}</span>
        <button type="button" className="primary-button" onClick={finishLesson} disabled={!canComplete} title={!canComplete ? 'Pass the exercise and knowledge check first' : undefined}>
          {isComplete ? 'Next lesson' : 'Complete lesson'} {isComplete ? <ArrowRight size={16} /> : <Check size={16} />}
        </button>
      </footer>
    </div>
  )
}
