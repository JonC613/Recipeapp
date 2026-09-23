import { expect, test } from 'vitest'
import { scaledIngredientText, selectedServings } from '../../src/domain/recipe/servings'

test('scales common leading quantities without changing package sizes or unparsed text', () => {
  expect(scaledIngredientText('½ cup milk', 4, 6)).toBe('3/4 cup milk')
  expect(scaledIngredientText('1½ cups flour', 4, 8)).toBe('3 cups flour')
  expect(scaledIngredientText('1 (14 oz) can tomatoes', 4, 8)).toBe('2 (14 oz) can tomatoes')
  expect(scaledIngredientText('2% milk', 4, 8)).toBe('2% milk')
  expect(scaledIngredientText('about 2 cups broth', 4, 8)).toBe('about 2 cups broth')
  expect(scaledIngredientText('1 cup rice', undefined, 8)).toBe('1 cup rice')
})

test('only accepts bounded whole serving selections', () => {
  expect(selectedServings('6', 4)).toBe(6)
  expect(selectedServings('0', 4)).toBe(4)
  expect(selectedServings('101', 4)).toBe(4)
  expect(selectedServings('4.5', 4)).toBe(4)
  expect(selectedServings('6', undefined)).toBeUndefined()
})
