import { Award, Check, RotateCcw, Target, TestTube2, TimerReset, Trophy } from 'lucide-react'
import type { CourseModule } from '../data/course'

type ProgressViewProps = {
  modules: CourseModule[]
  completedSet: Set<string>
  quizScores: Record<string, number>
  onReset: () => void
}

export function ProgressView({ modules, completedSet, quizScores, onReset }: ProgressViewProps) {
  const totalLessons = modules.reduce((count, module) => count + module.lessons.length, 0)
  const completedLabs = modules.reduce(
    (count, module) => count + module.lessons.filter((lesson) => lesson.lab && completedSet.has(lesson.id)).length,
    0,
  )
  const totalLabs = modules.reduce(
    (count, module) => count + module.lessons.filter((lesson) => lesson.lab).length,
    0,
  )
  const quizValues = Object.values(quizScores)
  const quizAverage = quizValues.length
    ? Math.round(quizValues.reduce((sum, score) => sum + score, 0) / quizValues.length)
    : 0
  const capstoneReady = modules
    .filter((module) => module.number <= 10)
    .every((module) => module.lessons.every((lesson) => completedSet.has(lesson.id)))

  return (
    <div className="progress-page page-pad readable-page">
      <header className="section-header">
        <div>
          <h1>Your engineering progress</h1>
          <p>Mastery comes from shipping models, breaking them, and proving the fix.</p>
        </div>
        <button type="button" className="text-button" onClick={onReset}>
          <RotateCcw size={16} /> Reset progress
        </button>
      </header>

      <section className="progress-summary">
        <article>
          <Target size={22} />
          <strong>{completedSet.size}/{totalLessons}</strong>
          <span>Lessons complete</span>
        </article>
        <article>
          <TestTube2 size={22} />
          <strong>{completedLabs}/{totalLabs}</strong>
          <span>Labs shipped</span>
        </article>
        <article>
          <Award size={22} />
          <strong>{quizAverage || '—'}{quizAverage ? '%' : ''}</strong>
          <span>Quiz average</span>
        </article>
        <article>
          <TimerReset size={22} />
          <strong>{Math.max(0, Math.round((totalLessons - completedSet.size) * 0.55))}h</strong>
          <span>Estimated remaining</span>
        </article>
      </section>

      <section className="mastery-section">
        <div>
          <h2>Module mastery</h2>
          <p>Each bar includes lessons and the practical lab checkpoint.</p>
        </div>
        <div className="mastery-list">
          {modules.map((module, index) => {
            const complete = module.lessons.filter((lesson) => completedSet.has(lesson.id)).length
            const percent = Math.round((complete / module.lessons.length) * 100)
            return (
              <div className="mastery-row" key={module.id}>
                <span className="mastery-index">{String(index + 1).padStart(2, '0')}</span>
                <div>
                  <strong>{module.title}</strong>
                  <span>{complete} of {module.lessons.length} lessons</span>
                </div>
                <span className="mastery-track"><span style={{ width: `${percent}%` }} /></span>
                <b>{percent}%</b>
              </div>
            )
          })}
        </div>
      </section>

      <section className="readiness-callout">
        <span><Trophy size={25} /></span>
        <div>
          <h2>Capstone readiness</h2>
          <p>Complete the incremental pipelines, testing, and deployment modules to unlock the final readiness check.</p>
        </div>
        <strong>{capstoneReady ? <><Check size={17} /> Ready</> : 'Complete Modules 01–10'}</strong>
      </section>
    </div>
  )
}
