import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { courseModules } from '../data/course'
import { LessonWorkspace } from './LessonWorkspace'

vi.mock('../lib/duckdbRuntime', () => ({
  runDuckDbQuery: vi.fn().mockResolvedValue({
    columns: ['order_count', 'first_order_at', 'last_order_at'],
    rows: [{ order_count: 15, first_order_at: '2024-01-01', last_order_at: '2024-01-04' }],
    elapsedMs: 42,
    compiledSql: 'select count(*) as order_count from raw_orders',
  }),
}))

const guidedLesson = courseModules.flatMap((module) => module.lessons).find((lesson) => lesson.id === 'm02-l01')!
const browserLesson = courseModules.flatMap((module) => module.lessons).find((lesson) => lesson.id === 'm01-l01')!

describe('lesson completion contract', () => {
  it('requires a passed exercise and quiz before completion', async () => {
    const onComplete = vi.fn()
    render(
      <LessonWorkspace
        lesson={guidedLesson}
        lessonIndex={3}
        totalLessons={42}
        isComplete={false}
        onBackToCourse={vi.fn()}
        onComplete={onComplete}
        onSaveQuiz={vi.fn()}
      />,
    )

    const completeButton = screen.getByRole('button', { name: 'Complete lesson' })
    expect(completeButton).toBeDisabled()

    fireEvent.change(screen.getByRole('textbox', { name: /edit/i }), {
      target: { value: guidedLesson.exercise.solutionSql },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Validate' }))
    await waitFor(() => expect(screen.getByText(/PASS in/)).toBeInTheDocument())
    expect(completeButton).toBeDisabled()

    fireEvent.click(screen.getByRole('tab', { name: 'Check' }))
    const answerName = `${String.fromCharCode(65 + guidedLesson.quiz.answerIndex)} ${guidedLesson.quiz.options[guidedLesson.quiz.answerIndex]}`
    fireEvent.click(screen.getByRole('button', { name: answerName }))
    fireEvent.click(screen.getByRole('button', { name: 'Check answer' }))

    expect(completeButton).toBeEnabled()
    fireEvent.click(completeButton)
    expect(onComplete).toHaveBeenCalledOnce()
  })

  it('routes supported SQL through the lazy DuckDB runner and checks its columns', async () => {
    render(
      <LessonWorkspace
        lesson={browserLesson}
        lessonIndex={0}
        totalLessons={42}
        isComplete={false}
        onBackToCourse={vi.fn()}
        onComplete={vi.fn()}
        onSaveQuiz={vi.fn()}
      />,
    )

    fireEvent.change(screen.getByRole('textbox', { name: /edit/i }), {
      target: { value: browserLesson.exercise.solutionSql },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Run model' }))

    await waitFor(() => expect(screen.getByText(/PASS in 0\.04s/)).toBeInTheDocument())
    expect(screen.getByRole('columnheader', { name: 'order_count' })).toBeInTheDocument()
    expect(screen.getByText('15')).toBeInTheDocument()
  })
})
