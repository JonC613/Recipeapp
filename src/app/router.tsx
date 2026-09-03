import { createBrowserRouter } from 'react-router'
import { AppShell } from './AppShell'
import { RecipeLibraryPage } from '../pages/RecipeLibraryPage'
import { RecipeEditorPage } from '../pages/RecipeEditorPage'
import { RecipeDetailPage } from '../pages/RecipeDetailPage'
import { CookingModePage } from '../pages/CookingModePage'
import { RecipeImportPage } from '../pages/RecipeImportPage'
import { RecipeImportResultPage } from '../pages/RecipeImportResultPage'
import { RecipeImportReviewPage } from '../pages/RecipeImportReviewPage'
import { MealDbBrowsePage } from '../pages/MealDbBrowsePage'
import { NotFoundPage } from '../pages/NotFoundPage'
import { RouteErrorPage } from '../pages/RouteErrorPage'
import { UsageDashboardPage } from '../pages/UsageDashboardPage'
import { MealPlanPage } from '../pages/MealPlanPage'

export const router = createBrowserRouter([{ path: '/', Component: AppShell, errorElement: <RouteErrorPage />, children: [
  { index: true, Component: RecipeLibraryPage }, { path: 'meal-plan', Component: MealPlanPage }, { path: 'recipes/new', Component: RecipeEditorPage }, { path: 'recipes/import', Component: RecipeImportPage }, { path: 'recipes/mealdb', Component: MealDbBrowsePage }, { path: 'admin/usage', Component: UsageDashboardPage }, { path: 'imports/:importId/review', Component: RecipeImportReviewPage }, { path: 'imports/:importId', Component: RecipeImportResultPage }, { path: 'recipes/:recipeId/edit', Component: RecipeEditorPage }, { path: 'recipes/:recipeId/cook', Component: CookingModePage }, { path: 'recipes/:recipeId', Component: RecipeDetailPage }, { path: '*', Component: NotFoundPage },
] }])
