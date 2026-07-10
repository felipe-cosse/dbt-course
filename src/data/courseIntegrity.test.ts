import { describe, expect, it } from 'vitest'
import { course, courseModules } from './course'
import { getAssessmentAlignmentScore, getLessonAlignment } from './learningGuides'

const lessons = courseModules.flatMap((module) => module.lessons)

describe('course curriculum integrity', () => {
  it('keeps module and lesson numbering ordered and unique', () => {
    expect(courseModules.map((module) => module.number)).toEqual(Array.from({ length: 12 }, (_, index) => index + 1))

    const ids = new Set<string>()
    const numbers = new Set<string>()
    for (const module of courseModules) {
      module.lessons.forEach((lesson, index) => {
        expect(lesson.id).toBe(`m${String(module.number).padStart(2, '0')}-l${String(index + 1).padStart(2, '0')}`)
        expect(lesson.number).toBe(`${module.number}.${index + 1}`)
        expect(ids.has(lesson.id), `duplicate lesson id ${lesson.id}`).toBe(false)
        expect(numbers.has(lesson.number), `duplicate lesson number ${lesson.number}`).toBe(false)
        ids.add(lesson.id)
        numbers.add(lesson.number)
      })
    }
  })

  it('derives public counts from the expanded curriculum', () => {
    expect(lessons).toHaveLength(44)
    expect(lessons.filter((lesson) => lesson.lab)).toHaveLength(20)
    expect(course.lessonCount).toBe(44)
    expect(course.labCount).toBe(20)
  })

  it('keeps every exercise and question tied to its lesson objectives', () => {
    for (const lesson of lessons) {
      const alignment = getLessonAlignment(lesson)
      expect(lesson.objectives, `${lesson.id} exercise objective`).toContain(alignment.exerciseObjective)
      expect(lesson.objectives, `${lesson.id} quiz objective`).toContain(alignment.quizObjective)
      expect(getAssessmentAlignmentScore(lesson, 'exercise'), `${lesson.id} exercise topic overlap`).toBeGreaterThan(0)
      expect(getAssessmentAlignmentScore(lesson, 'quiz'), `${lesson.id} quiz topic overlap`).toBeGreaterThan(0)
    }
  })

  it('provides usable exercise and knowledge-check contracts', () => {
    for (const lesson of lessons) {
      expect(lesson.exercise.prompt.trim().length, `${lesson.id} prompt`).toBeGreaterThan(30)
      expect(lesson.exercise.starterSql.trim(), `${lesson.id} starter`).not.toBe(lesson.exercise.solutionSql.trim())
      expect(lesson.exercise.expectedColumns.length, `${lesson.id} evidence`).toBeGreaterThan(0)
      expect(new Set(lesson.quiz.options).size, `${lesson.id} quiz options`).toBe(4)
      expect(lesson.quiz.answerIndex, `${lesson.id} answer`).toBeGreaterThanOrEqual(0)
      expect(lesson.quiz.answerIndex, `${lesson.id} answer`).toBeLessThan(4)
      expect(lesson.quiz.explanation.trim().length, `${lesson.id} rationale`).toBeGreaterThan(25)
    }
  })
})
