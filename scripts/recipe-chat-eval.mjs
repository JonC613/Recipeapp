#!/usr/bin/env node
// Offline-only readiness check for the Recipe Chat model comparison. This script deliberately has no
// network or credential access; a paid run needs separate owner approval and an explicit runner.
const cases = [
  ['title-exact', 'Find Garlic Shrimp', 'answer'], ['ingredient', 'Which recipes use shrimp?', 'answer'],
  ['two-ingredients', 'chicken and mushrooms', 'answer'], ['exclude', 'chicken without mushrooms', 'answer'],
  ['time-strict', 'under 30 minutes', 'answer'], ['time-inclusive', '30 minutes or less', 'answer'],
  ['unknown-time', 'Which of those is quickest?', 'clarification'], ['no-match', 'recipes with dragonfruit', 'no_match'],
  ['ambiguous', 'something fast', 'clarification'], ['cuisine', 'Greek chicken', 'answer'],
  ['category', 'dinner recipes', 'answer'], ['favorite', 'my favorite shrimp recipes', 'answer'],
  ['instruction', 'recipes that grill chicken', 'answer'], ['notes', 'recipes with blackstone notes', 'answer'],
  ['follow-up', 'Which of those is quickest?', 'answer'], ['follow-up-missing', 'Which of those?', 'clarification'],
  ['excluded-case', 'no Mushrooms', 'answer'], ['time-fallback', 'under 45 minutes', 'answer'],
  ['scope', 'make me a new recipe', 'clarification'], ['source-gap', 'find a vegan recipe', 'no_match'],
]
if (cases.length !== 20 || new Set(cases.map(([id]) => id)).size !== 20) throw new Error('Evaluation dataset must contain exactly 20 unique cases.')
const categories = new Set(cases.map(([id]) => id))
for (const required of ['title-exact', 'ingredient', 'exclude', 'time-strict', 'no-match', 'ambiguous', 'follow-up']) if (!categories.has(required)) throw new Error(`Missing required case: ${required}`)
console.log(JSON.stringify({ mode: 'offline-dry-run', cases: cases.length, networkCalls: 0, status: 'ready-for-separately-authorized-live-run' }, null, 2))
