import { useCallback, useMemo, useState } from 'react'

const STORAGE_KEY = 'dbt-forge-progress-v1'

type StoredProgress = {
  version: 1
  completedLessonIds: string[]
  quizScores: Record<string, number>
}

const emptyProgress: StoredProgress = {
  version: 1,
  completedLessonIds: [],
  quizScores: {},
}

function readProgress(_seedIds: string[]): StoredProgress {
  if (typeof window === 'undefined') return emptyProgress

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return emptyProgress
    }

    const parsed = JSON.parse(raw) as StoredProgress
    return parsed.version === 1 ? parsed : emptyProgress
  } catch {
    return emptyProgress
  }
}

export function useProgress(allLessonIds: string[]) {
  const [progress, setProgress] = useState<StoredProgress>(() => readProgress(allLessonIds))
  const completedSet = useMemo(
    () => new Set(progress.completedLessonIds),
    [progress.completedLessonIds],
  )

  const persist = useCallback((next: StoredProgress) => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    return next
  }, [])

  const completeLesson = useCallback(
    (lessonId: string) => {
      setProgress((current) => {
        if (current.completedLessonIds.includes(lessonId)) return current
        return persist({
          ...current,
          completedLessonIds: [...current.completedLessonIds, lessonId],
        })
      })
    },
    [persist],
  )

  const saveQuizScore = useCallback(
    (lessonId: string, score: number) => {
      setProgress((current) =>
        persist({
          ...current,
          quizScores: { ...current.quizScores, [lessonId]: score },
        }),
      )
    },
    [persist],
  )

  const resetProgress = useCallback(() => {
    setProgress(persist(emptyProgress))
  }, [persist])

  return {
    completedSet,
    completedCount: completedSet.size,
    quizScores: progress.quizScores,
    completeLesson,
    saveQuizScore,
    resetProgress,
  }
}
