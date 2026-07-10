import { useMemo, useState } from 'react'
import { AppShell } from './components/AppShell'
import { CapstoneView } from './components/CapstoneView'
import { LessonWorkspace } from './components/LessonWorkspace'
import { Overview } from './components/Overview'
import { ProgressView } from './components/ProgressView'
import { ResourcesView } from './components/ResourcesView'
import type { AppView } from './components/Sidebar'
import { courseModules, type Lesson } from './data/course'
import { useProgress } from './hooks/useProgress'

export default function App() {
  const allLessons = useMemo(() => courseModules.flatMap((module) => module.lessons), [])
  const allLessonIds = useMemo(() => allLessons.map((lesson) => lesson.id), [allLessons])
  const progress = useProgress(allLessonIds)
  const firstIncomplete = allLessons.find((lesson) => !progress.completedSet.has(lesson.id)) ?? allLessons[0]
  const [view, setView] = useState<AppView>('overview')
  const [selectedLesson, setSelectedLesson] = useState<Lesson>(() => allLessons[0])
  const [mobileOpen, setMobileOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [darkMode, setDarkMode] = useState(false)

  const selectedIndex = allLessons.findIndex((lesson) => lesson.id === selectedLesson.id)
  const selectedModule = courseModules.find((module) => module.lessons.some((lesson) => lesson.id === selectedLesson.id)) ?? courseModules[0]

  function selectView(nextView: AppView) {
    setView(nextView)
    setMobileOpen(false)
  }

  function selectLesson(lesson: Lesson) {
    setSelectedLesson(lesson)
    setView('lesson')
    setMobileOpen(false)
  }

  function goToLessonAt(index: number) {
    const lesson = allLessons[index]
    if (lesson) selectLesson(lesson)
  }

  return (
    <AppShell
      view={view}
      modules={courseModules}
      selectedLesson={selectedLesson}
      completedSet={progress.completedSet}
      completedCount={progress.completedCount}
      totalLessons={allLessons.length}
      mobileOpen={mobileOpen}
      sidebarCollapsed={sidebarCollapsed}
      darkMode={darkMode}
      onSelectView={selectView}
      onSelectLesson={selectLesson}
      onToggleMenu={() => setMobileOpen((open) => !open)}
      onCloseMenu={() => setMobileOpen(false)}
      onToggleCollapsed={() => setSidebarCollapsed((collapsed) => !collapsed)}
      onToggleTheme={() => setDarkMode((dark) => !dark)}
      onOpenHelp={() => selectView('resources')}
    >
      {view === 'overview' ? (
        <Overview
          modules={courseModules}
          completedSet={progress.completedSet}
          currentLesson={firstIncomplete}
          onContinue={() => selectLesson(firstIncomplete)}
          onSelectLesson={selectLesson}
          onOpenCapstone={() => selectView('capstone')}
          onOpenResources={() => selectView('resources')}
        />
      ) : null}

      {view === 'lesson' ? (
        <LessonWorkspace
          key={selectedLesson.id}
          lesson={selectedLesson}
          module={selectedModule}
          lessonIndex={selectedIndex}
          totalLessons={allLessons.length}
          isComplete={progress.completedSet.has(selectedLesson.id)}
          onBackToCourse={() => selectView('overview')}
          onPrevious={selectedIndex > 0 ? () => goToLessonAt(selectedIndex - 1) : undefined}
          onNext={selectedIndex < allLessons.length - 1 ? () => goToLessonAt(selectedIndex + 1) : undefined}
          onComplete={() => progress.completeLesson(selectedLesson.id)}
          onSaveQuiz={(score) => progress.saveQuizScore(selectedLesson.id, score)}
        />
      ) : null}

      {view === 'progress' ? (
        <ProgressView
          modules={courseModules}
          completedSet={progress.completedSet}
          quizScores={progress.quizScores}
          onReset={progress.resetProgress}
        />
      ) : null}

      {view === 'resources' ? <ResourcesView /> : null}
      {view === 'capstone' ? <CapstoneView /> : null}
    </AppShell>
  )
}
