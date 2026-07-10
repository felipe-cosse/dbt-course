import { describe, expect, it } from 'vitest'
import { courseModules } from '../data/course'
import { detectExerciseLanguage, exerciseMode, validateStructure } from './exerciseValidation'

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
})
