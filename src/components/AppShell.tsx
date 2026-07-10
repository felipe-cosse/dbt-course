import type { ReactNode } from 'react'
import type { CourseModule, Lesson } from '../data/course'
import { Sidebar, type AppView } from './Sidebar'
import { Topbar } from './Topbar'

type AppShellProps = {
  children: ReactNode
  view: AppView
  modules: CourseModule[]
  selectedLesson: Lesson
  completedSet: Set<string>
  completedCount: number
  totalLessons: number
  mobileOpen: boolean
  sidebarCollapsed: boolean
  darkMode: boolean
  onSelectView: (view: AppView) => void
  onSelectLesson: (lesson: Lesson) => void
  onToggleMenu: () => void
  onCloseMenu: () => void
  onToggleCollapsed: () => void
  onToggleTheme: () => void
  onOpenHelp: () => void
}

export function AppShell({
  children,
  view,
  modules,
  selectedLesson,
  completedSet,
  completedCount,
  totalLessons,
  mobileOpen,
  sidebarCollapsed,
  darkMode,
  onSelectView,
  onSelectLesson,
  onToggleMenu,
  onCloseMenu,
  onToggleCollapsed,
  onToggleTheme,
  onOpenHelp,
}: AppShellProps) {
  return (
    <div className={`app-shell ${sidebarCollapsed ? 'sidebar-collapsed' : ''} ${darkMode ? 'theme-dark' : ''}`}>
      <Sidebar
        view={view}
        modules={modules}
        selectedLesson={selectedLesson}
        showOutline={view === 'lesson'}
        open={mobileOpen}
        collapsed={sidebarCollapsed}
        completedSet={completedSet}
        onSelectView={onSelectView}
        onSelectLesson={onSelectLesson}
        onClose={onCloseMenu}
        onToggleCollapsed={onToggleCollapsed}
      />
      <Topbar
        completedCount={completedCount}
        totalLessons={totalLessons}
        menuOpen={mobileOpen}
        onToggleMenu={onToggleMenu}
        darkMode={darkMode}
        onToggleTheme={onToggleTheme}
        onOpenHelp={onOpenHelp}
      />
      <main className="app-main">{children}</main>
    </div>
  )
}
