import { CircleHelp, Database, Menu, Moon, Sun } from 'lucide-react'

type TopbarProps = {
  completedCount: number
  totalLessons: number
  menuOpen: boolean
  onToggleMenu: () => void
  darkMode: boolean
  onToggleTheme: () => void
  onOpenHelp: () => void
}

export function Topbar({
  completedCount,
  totalLessons,
  menuOpen,
  onToggleMenu,
  darkMode,
  onToggleTheme,
  onOpenHelp,
}: TopbarProps) {
  const percentage = Math.round((completedCount / totalLessons) * 100)

  return (
    <header className="topbar">
      <button
        className="icon-button mobile-menu"
        type="button"
        aria-label={menuOpen ? 'Close course navigation' : 'Open course navigation'}
        aria-expanded={menuOpen}
        onClick={onToggleMenu}
      >
        <Menu size={22} />
      </button>
      <div className="topbar-progress" aria-label={`${completedCount} of ${totalLessons} lessons complete`}>
        <span>{completedCount} of {totalLessons} lessons</span>
        <span className="progress-track">
          <span style={{ width: `${percentage}%` }} />
        </span>
      </div>
      <div className="topbar-actions">
        <div className="connection-control" role="status" title="DuckDB-WASM loads locally when a supported browser lab runs">
          <Database size={17} />
          <span>DuckDB · on demand</span>
          <i className="is-on-demand" aria-label="loads on demand" />
        </div>
        <button className="icon-button" type="button" aria-label="Open course help" onClick={onOpenHelp}>
          <CircleHelp size={20} />
        </button>
        <button className="icon-button" type="button" aria-label="Toggle color theme" onClick={onToggleTheme}>
          {darkMode ? <Sun size={20} /> : <Moon size={20} />}
        </button>
      </div>
    </header>
  )
}
