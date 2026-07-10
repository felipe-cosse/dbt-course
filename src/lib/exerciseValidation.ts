import type { CodeLanguage, Lesson } from '../data/course'

export type ExerciseMode = 'duckdb' | 'structure'

const browserSqlLessonIds = new Set(['m01-l01', 'm03-l01', 'm03-l02', 'm07-l03'])
const ignoredTokens = new Set([
  'select', 'from', 'where', 'with', 'then', 'else', 'when', 'case', 'cast',
  'table', 'model', 'models', 'true', 'false', 'null', 'config', 'source', 'ref',
  'string', 'integer', 'timestamp', 'decimal', 'schema', 'name', 'tests', 'data',
])

function stripComments(value: string) {
  return value
    .replace(/^\s*--(?:\s|$).*$/gm, '')
    .replace(/\s--\s.*$/gm, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*#.*$/gm, '')
}

function normalized(value: string) {
  return stripComments(value).replace(/\s+/g, ' ').trim().toLowerCase()
}

export function detectExerciseLanguage(lesson: Lesson): CodeLanguage {
  const source = lesson.exercise.solutionSql.trim()
  if (/^(select\b|with\b|\{\{\s*config|\{%)/i.test(source)) {
    return source.includes('{%') || source.includes('{{') ? 'jinja' : 'sql'
  }
  if (/^(version:|models:|sources:|snapshots:|exposures:)/i.test(source)) return 'yaml'
  if (/^(dbt\b|docker\b|python\b|export\b|git\b|curl\b)/i.test(source)) return 'shell'
  if (/^(from\s+\w+\s+import|import\s+\w+|def\s+\w+)/i.test(source)) return 'python'
  return lesson.codeExample.language
}

export function exerciseMode(lesson: Lesson): ExerciseMode {
  return browserSqlLessonIds.has(lesson.id) ? 'duckdb' : 'structure'
}

function solutionOnlyTokens(lesson: Lesson) {
  const starter = normalized(lesson.exercise.starterSql)
  const candidates = normalized(lesson.exercise.solutionSql).match(/[a-z_][a-z0-9_]{3,}/g) ?? []
  return [...new Set(candidates)]
    .filter((token) => !ignoredTokens.has(token) && !starter.includes(token))
    .slice(0, 3)
}

export function validateStructure(lesson: Lesson, answer: string) {
  const cleanAnswer = normalized(answer)
  const cleanStarter = normalized(lesson.exercise.starterSql)
  const cleanSolution = normalized(lesson.exercise.solutionSql)
  if (!cleanAnswer || cleanAnswer === cleanStarter) {
    return { ok: false, missing: ['a meaningful change to the starter'] }
  }

  const required = [
    ...lesson.exercise.expectedColumns
      .map((column) => column.toLowerCase())
      .filter((column) => cleanSolution.includes(column)),
    ...solutionOnlyTokens(lesson).slice(0, 2),
  ]
  const missing = [...new Set(required)].filter((token) => !cleanAnswer.includes(token))
  return { ok: missing.length === 0, missing }
}
