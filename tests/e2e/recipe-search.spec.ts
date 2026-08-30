import { expect, test } from '@playwright/test'

const recipes = [
  { id: 'chicken', title: 'Smoky Chicken Tacos', favorite: true, category: 'Dinner', tag: 'Weeknight', ingredient: 'tortillas', cuisine: 'Mexican' },
  { id: 'bean', title: 'Garden Pasta', favorite: false, category: 'Lunch', tag: 'Vegetarian', ingredient: 'cannellini', cuisine: 'Italian' },
  { id: 'corn', title: 'Skillet Corn', favorite: false, category: 'Side', tag: 'Blackstone', ingredient: 'corn', cuisine: 'American' },
]

test('searches saved recipe fields, filters, clears, and opens a result', async ({ page }) => {
  await page.route('**/api/health', (route) => route.fulfill({ json: { status: 'ok' } }))
  await page.route('**/api/recipes**', (route) => {
    const url = new URL(route.request().url())
    const q = url.searchParams.get('q')?.toLowerCase()
    const favorite = url.searchParams.get('favorite')
    const result = recipes.filter((recipe) => (!q || [recipe.title, recipe.tag, recipe.ingredient, recipe.cuisine, recipe.category].some((value) => value.toLowerCase().includes(q))) && (!favorite || String(recipe.favorite) === favorite) && ['tag', 'ingredient', 'cuisine', 'category'].every((key) => !url.searchParams.get(key) || recipe[key as 'tag' | 'ingredient' | 'cuisine' | 'category'].toLowerCase().includes(url.searchParams.get(key)!.toLowerCase())))
    return route.fulfill({ json: result })
  })
  await page.goto('/')
  const search = page.getByRole('searchbox', { name: 'Search recipes' })
  await search.fill('blackstone')
  await expect(page.getByRole('link', { name: 'Skillet Corn' })).toBeVisible()
  await search.fill('not-found')
  await expect(page.getByText('No recipes match your search or filters.')).toBeVisible()
  await page.getByRole('button', { name: 'Clear search and filters' }).click()
  await page.getByText('Filter recipes').click()
  for (const [label, value, title] of [['Tag', 'blackstone', 'Skillet Corn'], ['Ingredient', 'cannellini', 'Garden Pasta'], ['Cuisine', 'mexican', 'Smoky Chicken Tacos'], ['Category', 'lunch', 'Garden Pasta']] as const) {
    await page.getByRole('textbox', { name: label }).fill(value)
    await expect(page.getByRole('link', { name: title })).toBeVisible()
    await page.getByRole('button', { name: 'Clear search and filters' }).click()
  }
  await page.getByRole('checkbox', { name: 'Favorites only' }).check()
  await expect(page.getByRole('link', { name: 'Smoky Chicken Tacos' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Garden Pasta' })).toHaveCount(0)
  await page.getByRole('button', { name: 'Clear search and filters' }).click()
  await page.getByRole('link', { name: 'Garden Pasta' }).click()
  await expect(page).toHaveURL('/recipes/bean')
  await expect(page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).resolves.toBe(true)
})
