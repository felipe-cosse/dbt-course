import {
  BarChart3,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  FolderKanban,
  Gauge,
  CircleHelp,
  X,
} from 'lucide-react'
import type { CourseModule, Lesson } from '../data/course'
import { Brand } from './Brand'

export type AppView = 'overview' | 'lesson' | 'progress' | 'resources' | 'capstone'

type SidebarProps = {
  view: AppView
  modules: CourseModule[]
  selectedLesson: Lesson
  showOutline: boolean
  open: boolean
  collapsed: boolean
  completedSet: Set<string>
  onSelectView: (view: AppView) => void
  onSelectLesson: (lesson: Lesson) => void
  onClose: () => void
  onToggleCollapsed: () => void
}

const mainNavigation = [
  { id: 'overview' as const, label: 'Overview', icon: Gauge },
  { id: 'progress' as const, label: 'Your progress', icon: BarChart3 },
  { id: 'resources' as const, label: 'Resources', icon: BookOpen },
  { id: 'capstone' as const, label: 'Capstone', icon: FolderKanban },
]

export function Sidebar({
  view,
  modules,
  selectedLesson,
  showOutline,
  open,
  collapsed,
  completedSet,
  onSelectView,
  onSelectLesson,
  onClose,
  onToggleCollapsed,
}: SidebarProps) {
  return (
    <>
      <button
        className={`sidebar-scrim ${open ? 'is-visible' : ''}`}
        type="button"
        aria-label="Close navigation"
        onClick={onClose}
      />
      <aside className={`sidebar ${open ? 'is-open' : ''} ${collapsed ? 'is-collapsed' : ''}`}>
        <div className="sidebar-head">
          <Brand />
          <button className="sidebar-close" type="button" aria-label="Close navigation" onClick={onClose}>
            <X size={21} />
          </button>
        </div>

        <nav className="primary-nav" aria-label="Primary">
          {mainNavigation.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              aria-label={label}
              className={view === id ? 'is-active' : ''}
              onClick={() => onSelectView(id)}
            >
              <Icon size={19} />
              <span>{label}</span>
            </button>
          ))}
        </nav>

        {showOutline ? (
          <div className="course-outline">
            <p className="rail-label">COURSE</p>
            {modules.map((module) => (
              <section className="rail-module" key={module.id}>
                <h2>{module.title}</h2>
                {module.lessons.map((lesson) => (
                  <button
                    key={lesson.id}
                    type="button"
                    aria-label={`${lesson.number} ${lesson.title}`}
                    className={selectedLesson.id === lesson.id ? 'is-active' : ''}
                    onClick={() => onSelectLesson(lesson)}
                  >
                    <span className={completedSet.has(lesson.id) ? 'lesson-number is-complete' : 'lesson-number'}>
                      {lesson.number}
                    </span>
                    <span>{lesson.title}</span>
                  </button>
                ))}
              </section>
            ))}
          </div>
        ) : null}

        <div className="sidebar-footer">
          <button type="button" aria-label="Course guide" onClick={() => onSelectView('resources')}>
            <CircleHelp size={19} />
            <span>Course guide</span>
          </button>
          <button type="button" aria-label={collapsed ? 'Expand navigation' : 'Collapse navigation'} onClick={onToggleCollapsed}>
            {collapsed ? <ChevronRight size={19} /> : <ChevronLeft size={19} />}
            <span>{collapsed ? 'Expand' : 'Collapse'}</span>
          </button>
        </div>
      </aside>
    </>
  )
}
