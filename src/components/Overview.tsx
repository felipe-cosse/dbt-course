import { useMemo, useState } from 'react'
import {
  ArrowRight,
  Box,
  Check,
  ChevronDown,
  Circle,
  CircleDot,
  Clock3,
  Code2,
  PackageCheck,
  Play,
  ShieldCheck,
  TestTube2,
} from 'lucide-react'
import type { CourseModule, Lesson } from '../data/course'

type OverviewProps = {
  modules: CourseModule[]
  completedSet: Set<string>
  currentLesson: Lesson
  onContinue: () => void
  onSelectLesson: (lesson: Lesson) => void
  onOpenCapstone: () => void
  onOpenResources: () => void
}

export function Overview({
  modules,
  completedSet,
  currentLesson,
  onContinue,
  onSelectLesson,
  onOpenCapstone,
  onOpenResources,
}: OverviewProps) {
  const [expandedId, setExpandedId] = useState(modules[1]?.id ?? modules[0]?.id)
  const totalLessons = useMemo(
    () => modules.reduce((count, module) => count + module.lessons.length, 0),
    [modules],
  )
  const totalLabs = useMemo(
    () => modules.reduce((count, module) => count + module.lessons.filter((lesson) => lesson.lab).length, 0),
    [modules],
  )
  const percentage = Math.round((completedSet.size / totalLessons) * 100)

  return (
    <div className="overview-page page-pad">
      <section className="overview-intro">
        <div className="overview-title-block">
          <h1>Master dbt by<br />building the warehouse</h1>
          <p>{totalLessons} focused lessons. {totalLabs} hands-on labs. One production-grade capstone.</p>
        </div>
        <article className="continue-panel">
          <span className="continue-icon"><Play size={23} fill="currentColor" /></span>
          <div>
            <p>Continue lesson</p>
            <h2>{currentLesson.title}</h2>
            <span>{currentLesson.number} · {currentLesson.minutes} min</span>
          </div>
          <button type="button" className="primary-button" onClick={onContinue}>
            Continue lesson <ArrowRight size={18} />
          </button>
        </article>
      </section>

      <div className="overview-progress-row">
        <span>Overall progress</span>
        <strong>{percentage}% complete</strong>
        <span className="wide-progress"><span style={{ width: `${percentage}%` }} /></span>
      </div>

      <section className="course-layout">
        <div className="course-path">
          <h2>Course path</h2>
          <div className="module-list">
            {modules.map((module, index) => {
              const completed = module.lessons.filter((lesson) => completedSet.has(lesson.id)).length
              const isComplete = completed === module.lessons.length
              const isCurrent = !isComplete && completed > 0
              const isExpanded = module.id === expandedId
              const labs = module.lessons.filter((lesson) => lesson.lab).length

              return (
                <div className={`module-row-wrap ${isExpanded ? 'is-expanded' : ''}`} key={module.id}>
                  <span className={`timeline-node ${isComplete ? 'is-complete' : isCurrent ? 'is-current' : ''}`}>
                    {isComplete ? <Check size={16} /> : isCurrent ? <CircleDot size={16} /> : <Circle size={11} />}
                  </span>
                  <button
                    type="button"
                    className="module-row"
                    onClick={() => setExpandedId((current) => current === module.id ? '' : module.id)}
                    aria-expanded={isExpanded}
                  >
                    <span className="module-index">{String(index + 1).padStart(2, '0')}</span>
                    <span className="module-title">{module.title}</span>
                    <span className="module-meta">{module.lessons.length} lessons · {labs} {labs === 1 ? 'lab' : 'labs'}</span>
                    <span className={`module-status ${isComplete ? 'is-complete' : isCurrent ? 'is-current' : ''}`}>
                      {isComplete ? 'Complete' : isCurrent ? 'In progress' : `${completed}/${module.lessons.length}`}
                    </span>
                    <ChevronDown size={17} className="module-chevron" />
                  </button>
                  {isExpanded ? (
                    <div className="module-lessons">
                      <div className="module-learning-summary">
                        <p>{module.description}</p>
                        <ul>{module.outcomes.map((outcome) => <li key={outcome}>{outcome}</li>)}</ul>
                      </div>
                      {module.lessons.map((lesson) => (
                        <button type="button" key={lesson.id} onClick={() => onSelectLesson(lesson)}>
                          <span>{completedSet.has(lesson.id) ? <Check size={15} /> : lesson.number}</span>
                          <span>{lesson.title}</span>
                          <span>{lesson.minutes} min</span>
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
              )
            })}
          </div>
        </div>

        <aside className="overview-aside">
          <article className="capstone-panel">
            <div className="warehouse-illustration" aria-hidden="true">
              <span className="warehouse-roof" />
              <span className="warehouse-body"><i /><i /><i /></span>
              <PackageCheck size={30} />
            </div>
            <h2>Capstone: Commerce warehouse</h2>
            <p>Turn messy orders, customers, payments, and returns into tested dimensional models.</p>
            <div className="deliverable-list">
              <span><Box size={17} /> 14 core models</span>
              <span><TestTube2 size={17} /> 3 singular tests</span>
              <span><Clock3 size={17} /> 1 snapshot</span>
              <span><Code2 size={17} /> 3 database roles</span>
            </div>
            <button type="button" className="outline-button" onClick={onOpenCapstone}>
              View project brief <ArrowRight size={17} />
            </button>
          </article>

          <article className="resource-panel">
            <h2>Helpful resources</h2>
            <button type="button" onClick={onOpenResources}><Code2 size={17} /> dbt command guide <ArrowRight size={15} /></button>
            <button type="button" onClick={onOpenResources}><ShieldCheck size={17} /> SQL patterns <ArrowRight size={15} /></button>
            <button type="button" onClick={onOpenResources}><Box size={17} /> Glossary <ArrowRight size={15} /></button>
          </article>
        </aside>
      </section>
    </div>
  )
}
