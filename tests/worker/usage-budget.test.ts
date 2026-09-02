import { expect, test } from 'vitest'
import { evaluateBudget } from '../../worker/services/usage/budget.js'

test('evaluates configured USD budget states without treating unknown spend as healthy', () => {
  expect(evaluateBudget(undefined, 0)).toEqual({ state: 'not_configured' })
  expect(evaluateBudget('invalid', 1)).toMatchObject({ state: 'unavailable' })
  expect(evaluateBudget('10', undefined)).toMatchObject({ state: 'unavailable' })
  expect(evaluateBudget('10', 7.99)).toMatchObject({ state: 'on_track', percent: 79.9 })
  expect(evaluateBudget('10', 8)).toMatchObject({ state: 'warning', percent: 80 })
  expect(evaluateBudget('10', 10.01)).toMatchObject({ state: 'exceeded' })
})
