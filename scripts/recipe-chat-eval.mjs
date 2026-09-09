#!/usr/bin/env node
// Offline-only evaluation contract. It has no network client, credential lookup, or live mode.
// A paid comparison remains a separately authorized operation.
const fixtures = new Set(['garlic-shrimp', 'chicken-mushroom', 'lemon-pasta', 'quick-chicken', 'greek-chicken'])
const cases = [
  ['title-exact', 'Find Garlic Shrimp', 'answer', ['garlic-shrimp']], ['ingredient', 'Which recipes use shrimp?', 'answer', ['garlic-shrimp']],
  ['two-ingredients', 'chicken and mushrooms', 'answer', ['chicken-mushroom']], ['exclude', 'chicken without mushrooms', 'answer', ['quick-chicken']],
  ['time-strict', 'under 30 minutes', 'answer', ['quick-chicken']], ['time-inclusive', '30 minutes or less', 'answer', ['garlic-shrimp', 'quick-chicken']],
  ['unknown-time', 'Which of those is quickest?', 'clarification', []], ['no-match', 'recipes with dragonfruit', 'no_match', []],
  ['ambiguous', 'something fast', 'clarification', []], ['cuisine', 'Greek chicken', 'answer', ['greek-chicken']],
  ['category', 'dinner recipes', 'answer', ['garlic-shrimp']], ['favorite', 'my favorite shrimp recipes', 'answer', ['garlic-shrimp']],
  ['instruction', 'recipes that grill chicken', 'answer', ['quick-chicken']], ['notes', 'recipes with blackstone notes', 'answer', ['quick-chicken']],
  ['follow-up', 'Which of those is quickest?', 'answer', ['quick-chicken']], ['follow-up-missing', 'Which of those?', 'clarification', []],
  ['excluded-case', 'no Mushrooms', 'answer', ['quick-chicken']], ['time-fallback', 'under 45 minutes', 'answer', ['quick-chicken']],
  ['scope', 'make me a new recipe', 'clarification', []], ['source-gap', 'find a vegan recipe', 'no_match', []],
].map(([id, question, outcome, allowedRecipeIds]) => ({ id, question, expected: { outcome, allowedRecipeIds, rubric: outcome === 'answer' ? 'Cite only allowed fixture IDs; do not make unsupported claims.' : 'Return the expected safe non-answer outcome.' } }))

function assert(condition, message) { if (!condition) throw new Error(message) }
function percentile(values, fraction) { const sorted = [...values].sort((a, b) => a - b); return sorted[Math.max(0, Math.ceil(sorted.length * fraction) - 1)] }
function cost(usage, rates) {
  if (!usage || !Number.isFinite(usage.inputTokens) || !Number.isFinite(usage.outputTokens)) return undefined
  return ((usage.inputTokens * rates.input) + (usage.outputTokens * rates.output) + ((usage.cachedInputTokens ?? 0) * rates.cachedInput) + ((usage.reasoningTokens ?? 0) * rates.reasoning)) / 1_000_000
}
function report(results, rates) {
  const elapsed = results.map((result) => result.elapsedMs).filter(Number.isFinite)
  const costs = results.map((result) => cost(result.usage, rates))
  const unusable = results.filter((result) => result.failure === 'provider' || result.failure === 'invalid_output')
  return { total: results.length, correct: results.filter((result) => result.quality === 'correct').length, retrievalFailures: results.filter((result) => result.failure === 'retrieval').length, unusableResponses: unusable.length, unusableRate: results.length ? unusable.length / results.length : undefined, medianElapsedMs: elapsed.length ? percentile(elapsed, 0.5) : undefined, p95ElapsedMs: elapsed.length ? percentile(elapsed, 0.95) : undefined, totalCostUsd: costs.every((value) => value !== undefined) ? costs.reduce((sum, value) => sum + value, 0) : undefined, qualityReview: 'required-before-recommendation', recommendation: 'insufficient-evidence' }
}

function validate() {
  assert(cases.length === 20, 'Evaluation dataset must contain exactly 20 cases.')
  assert(new Set(cases.map((item) => item.id)).size === 20, 'Evaluation case IDs must be unique.')
  for (const category of ['title-exact', 'ingredient', 'exclude', 'time-strict', 'time-inclusive', 'no-match', 'ambiguous', 'follow-up', 'scope']) assert(cases.some((item) => item.id === category), `Missing required case: ${category}`)
  for (const item of cases) for (const id of item.expected.allowedRecipeIds) assert(fixtures.has(id), `Unknown fixture ID: ${id}`)
  const sample = report([{ elapsedMs: 100, quality: 'correct', usage: { inputTokens: 1_000, outputTokens: 500 } }, { elapsedMs: 200, quality: 'incorrect', failure: 'retrieval', usage: { inputTokens: 1_000, outputTokens: 500 } }, { elapsedMs: 300, quality: 'unreviewed', failure: 'provider' }], { input: 1, output: 2, cachedInput: 0.5, reasoning: 3 })
  assert(sample.correct === 1 && sample.retrievalFailures === 1 && sample.unusableResponses === 1, 'Failure classes must remain separate.')
  assert(sample.medianElapsedMs === 200 && sample.p95ElapsedMs === 300, 'Percentile calculation is incorrect.')
  assert(sample.totalCostUsd === undefined, 'Missing usage must remain unknown, never zero.')
}

validate()
console.log(JSON.stringify({ mode: 'offline-dry-run', datasetVersion: 1, cases: cases.length, fixtures: fixtures.size, networkCalls: 0, reportContract: ['correct', 'retrievalFailures', 'unusableResponses', 'medianElapsedMs', 'p95ElapsedMs', 'totalCostUsd'], humanReview: 'required-before-recommendation', status: 'ready-for-separately-authorized-live-run' }, null, 2))
