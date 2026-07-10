import { describe, expect, it } from 'vitest'
import { courseModules } from '../data/course'
import { detectExerciseLanguage, exerciseMode, validateQueryEvidence, validateStructure } from './exerciseValidation'

const lessons = courseModules.flatMap((module) => module.lessons)

describe('course exercise contracts', () => {
  it('routes only explicitly supported SQL labs to browser DuckDB', () => {
    const browserLessons = lessons.filter((lesson) => exerciseMode(lesson) === 'duckdb')
    expect(browserLessons.map((lesson) => lesson.id)).toEqual([
      'm01-l01',
      'm03-l01',
      'm03-l02',
      'm07-l03',
    ])
    expect(browserLessons.every((lesson) => ['sql', 'jinja'].includes(detectExerciseLanguage(lesson)))).toBe(true)
  })

  it('rejects every untouched starter and accepts every reference solution in guided mode', () => {
    const guidedLessons = lessons.filter((lesson) => exerciseMode(lesson) === 'structure')

    for (const lesson of guidedLessons) {
      expect(validateStructure(lesson, lesson.exercise.starterSql).ok, `${lesson.id} starter`).toBe(false)
      const solutionResult = validateStructure(lesson, lesson.exercise.solutionSql)
      expect(solutionResult, `${lesson.id} solution ${JSON.stringify(solutionResult)}`).toMatchObject({ ok: true })
    }
  })

  it('rejects token soup that has lesson words but no valid answer structure', () => {
    const projectLesson = lessons.find((lesson) => lesson.id === 'm02-l01')!
    const deploymentLesson = lessons.find((lesson) => lesson.id === 'm11-l01')!

    expect(validateStructure(projectLesson, 'staging analytics schema models profile').ok).toBe(false)
    expect(validateStructure(deploymentLesson, 'deps freshness production target docs').ok).toBe(false)
  })

  it('rejects constant browser results that only mimic the expected columns', () => {
    expect(validateQueryEvidence('m01-l01', [{ order_count: 1, first_order_at: 2, last_order_at: 3 }])).toMatch(/real 15-row count/i)
    expect(validateQueryEvidence('m01-l01', [{ order_count: 15, first_order_at: '2024-01-01', last_order_at: '2024-01-04' }])).toBeNull()
  })
})
