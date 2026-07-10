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

function languageShapeErrors(lesson: Lesson, answer: string) {
  const language = detectExerciseLanguage(lesson)
  const clean = stripComments(answer).trim()
  const missing: string[] = []

  if (clean.includes('___')) missing.push('replace every starter placeholder')
  if (language === 'sql' && !/\b(select|with|explain)\b/i.test(clean)) missing.push('a SQL SELECT, WITH, or EXPLAIN statement')
  if (language === 'jinja') {
    if (!/({{|{%)/.test(clean)) missing.push('a Jinja expression or statement')
    if ((clean.match(/{{/g)?.length ?? 0) !== (clean.match(/}}/g)?.length ?? 0)) missing.push('balanced Jinja expressions')
    if ((clean.match(/{%/g)?.length ?? 0) !== (clean.match(/%}/g)?.length ?? 0)) missing.push('balanced Jinja statements')
  }
  if (language === 'yaml') {
    if (!/^\s*[a-z_][a-z0-9_-]*\s*:/im.test(clean)) missing.push('valid YAML keys')
    if (!/^\s{2,}[-a-z_][a-z0-9_-]*\s*:/im.test(clean)) missing.push('nested YAML structure')
  }
  if (language === 'shell') {
    const commands = clean.split('\n').map((line) => line.trim()).filter(Boolean)
    const allowed = /^(dbt|python|docker|test|set|export|git|curl|jq|echo)\b|^(--|\\)/
    const isJqProgram = /^jq\b/.test(clean) && /target\/manifest\.json\s*$/.test(clean)
    if (!isJqProgram && (!commands.length || commands.some((line) => !allowed.test(line)))) missing.push('one allowed command per line')
  }
  if (language === 'python' && !/\b(import|from|def)\b/.test(clean)) missing.push('a Python import or function definition')

  return missing
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

  const shapeErrors = languageShapeErrors(lesson, answer)
  if (shapeErrors.length) return { ok: false, missing: shapeErrors }

  const required = [
    ...lesson.exercise.expectedColumns
      .map((column) => column.toLowerCase())
      .filter((column) => cleanSolution.includes(column)),
    ...solutionOnlyTokens(lesson).slice(0, 2),
  ]
  const missing = [...new Set(required)].filter((token) => !cleanAnswer.includes(token))
  return { ok: missing.length === 0, missing }
}

type ResultRow = Record<string, string | number | boolean | null>

function asNumber(value: ResultRow[string]) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

export function validateQueryEvidence(lessonId: string, rows: ResultRow[]) {
  if (lessonId === 'm01-l01') {
    const row = rows[0]
    const valid = rows.length === 1
      && asNumber(row?.order_count) === 15
      && String(row?.first_order_at).startsWith('2024-01-01')
      && String(row?.last_order_at).startsWith('2024-01-04')
    return valid ? null : 'The profile must return the real 15-row count and the fixture’s January 1–4 timestamp range.'
  }

  if (lessonId === 'm03-l01') {
    const ids = new Set(rows.map((row) => String(row.product_id)))
    const namesAreTrimmed = rows.every((row) => String(row.product_name).trim() === String(row.product_name))
    return rows.length === 5 && ids.size === rows.length && namesAreTrimmed
      ? null
      : 'The staged product result must preserve five unique products and trim every product name.'
  }

  if (lessonId === 'm03-l02') {
    const keys = new Set(rows.map((row) => `${row.order_id}:${row.order_item_id}`))
    const mathIsValid = rows.every((row) => {
      const quantity = asNumber(row.quantity)
      const unitPrice = asNumber(row.unit_price)
      const gross = asNumber(row.gross_line_amount)
      return quantity !== null && unitPrice !== null && gross !== null && Math.abs(quantity * unitPrice - gross) < 0.01
    })
    return rows.length === 12 && keys.size === rows.length && mathIsValid
      ? null
      : 'The staged item result must preserve 12 unique line keys and calculate quantity × unit price for every row.'
  }

  if (lessonId === 'm07-l03') {
    const row = rows[0]
    const pct = asNumber(row?.late_payment_pct)
    const valid = rows.length === 1
      && asNumber(row?.late_payment_count) === 1
      && asNumber(row?.total_payment_count) === 7
      && pct !== null
      && Math.abs(pct - (100 / 7)) < 0.01
    return valid ? null : 'The latency evidence must find 1 late payment out of 7 attempts (about 14.29%).'
  }

  return null
}
