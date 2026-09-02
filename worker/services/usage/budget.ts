import type { BudgetStatus } from '../../../src/domain/usage.js'

export function evaluateBudget(rawBudget: string | undefined, cost: number | undefined): BudgetStatus {
  if (!rawBudget?.trim()) return { state: 'not_configured' }
  const budgetUsd = Number(rawBudget)
  if (!Number.isFinite(budgetUsd) || budgetUsd <= 0) return { state: 'unavailable', hint: 'Monthly budget configuration is invalid.' }
  if (cost === undefined || !Number.isFinite(cost)) return { state: 'unavailable', hint: 'A known OpenAI cost is required to evaluate this budget.' }
  const percent = Math.round((cost / budgetUsd) * 1000) / 10
  return { state: cost > budgetUsd ? 'exceeded' : percent >= 80 ? 'warning' : 'on_track', budgetUsd, spentUsd: cost, percent, warningThresholdPercent: 80 }
}
