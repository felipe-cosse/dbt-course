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
  inspectDuckDbSchema: vi.fn().mockResolvedValue([
    {
      physicalName: 'raw_orders',
      logicalName: 'raw.orders',
      grain: 'One source version per order update',
      description: 'Mutable ecommerce orders.',
      expectedColumns: ['order_id', 'customer_id'],
      rowCount: 15,
      keys: [
        { kind: 'business', columns: ['order_id'], label: 'Order business key' },
        { kind: 'foreign', columns: ['customer_id'], label: 'Customer reference' },
      ],
      relationships: [
        { columns: ['customer_id'], targetTable: 'raw_customers', targetColumns: ['customer_id'], label: 'Order belongs to customer' },
      ],
      columns: [
        { name: 'order_id', dataType: 'INTEGER', nullable: false, ordinal: 1, keyKinds: ['business'] },
        { name: 'customer_id', dataType: 'INTEGER', nullable: true, ordinal: 2, keyKinds: ['foreign'] },
      ],
    },
    {
      physicalName: 'raw_customers',
      logicalName: 'raw.customers',
      grain: 'One row per customer',
      description: 'Customer fixture.',
      expectedColumns: ['customer_id'],
      rowCount: 10,
      keys: [{ kind: 'business', columns: ['customer_id'], label: 'Customer business key' }],
      relationships: [],
      columns: [{ name: 'customer_id', dataType: 'INTEGER', nullable: false, ordinal: 1, keyKinds: ['business'] }],
    },
  ]),
}))

const guidedLesson = courseModules.flatMap((module) => module.lessons).find((lesson) => lesson.id === 'm02-l01')!
const browserLesson = courseModules.flatMap((module) => module.lessons).find((lesson) => lesson.id === 'm01-l01')!
const guidedModule = courseModules.find((module) => module.lessons.includes(guidedLesson))!
const browserModule = courseModules.find((module) => module.lessons.includes(browserLesson))!

describe('lesson completion contract', () => {
  it('requires a passed exercise and quiz before completion', async () => {
    const onComplete = vi.fn()
    render(
      <LessonWorkspace
        lesson={guidedLesson}
        module={guidedModule}
        lessonIndex={3}
        totalLessons={44}
        isComplete={false}
        onBackToCourse={vi.fn()}
        onComplete={onComplete}
        onSaveQuiz={vi.fn()}
      />,
    )

    const completeButton = screen.getByRole('button', { name: 'Complete lesson' })
    expect(completeButton).toBeDisabled()

    fireEvent.click(screen.getByRole('tab', { name: 'Lab' }))
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
        module={browserModule}
        lessonIndex={0}
        totalLessons={44}
        isComplete={false}
        onBackToCourse={vi.fn()}
        onComplete={vi.fn()}
        onSaveQuiz={vi.fn()}
      />,
    )

    fireEvent.click(screen.getByRole('tab', { name: 'Lab' }))
    fireEvent.change(screen.getByRole('textbox', { name: /edit/i }), {
      target: { value: browserLesson.exercise.solutionSql },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Run model' }))

    await waitFor(() => expect(screen.getByText(/PASS in 0\.04s/)).toBeInTheDocument())
    expect(screen.getByRole('columnheader', { name: 'order_count' })).toBeInTheDocument()
    expect(screen.getByText('15')).toBeInTheDocument()
  })

  it('inspects tables and relationships in the Lab Schema view', async () => {
    render(
      <LessonWorkspace
        lesson={browserLesson}
        module={browserModule}
        lessonIndex={0}
        totalLessons={44}
        isComplete={false}
        onBackToCourse={vi.fn()}
        onComplete={vi.fn()}
        onSaveQuiz={vi.fn()}
      />,
    )

    fireEvent.click(screen.getByRole('tab', { name: 'Lab' }))
    fireEvent.click(screen.getByRole('tab', { name: 'Schema' }))

    await waitFor(() => expect(screen.getByRole('heading', { name: 'raw.orders' })).toBeInTheDocument())
    expect(screen.getByText('15 rows')).toBeInTheDocument()
    expect(screen.getByRole('cell', { name: 'order_id' })).toBeInTheDocument()
    expect(screen.getAllByRole('cell', { name: 'INTEGER' })).toHaveLength(2)
    expect(screen.getAllByText('BK').length).toBeGreaterThan(0)

    fireEvent.click(screen.getAllByRole('button', { name: 'raw.customers' })[0])
    expect(screen.getByRole('heading', { name: 'raw.customers' })).toBeInTheDocument()
  })
})
