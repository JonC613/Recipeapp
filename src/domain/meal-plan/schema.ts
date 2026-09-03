export const grocerySections = ['produce', 'meat_seafood', 'dairy', 'pantry', 'frozen', 'other'] as const
export type GrocerySection = typeof grocerySections[number]

export interface PlannedDinner {
  dayIndex: number
  recipe: { id: string; title: string }
}

export interface GroceryListItem {
  id: string
  displayText: string
  section: GrocerySection
  checked: boolean
  custom: boolean
  occurrenceCount: number
  contributorTitles: string[]
}

export interface MealPlanWeek {
  weekStart: string
  planRevision: number
  groceryGeneratedRevision?: number
  groceryListStale: boolean
  dinners: PlannedDinner[]
  groceryItems: GroceryListItem[]
}

export function normalizeWeekStart(value: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new Error('week must use YYYY-MM-DD')
  const date = new Date(`${value}T12:00:00`)
  if (Number.isNaN(date.valueOf()) || date.getFullYear() !== Number(value.slice(0, 4)) || date.getMonth() + 1 !== Number(value.slice(5, 7)) || date.getDate() !== Number(value.slice(8, 10))) throw new Error('week must be a valid date')
  if (date.getDay() !== 0) throw new Error('week must begin on Sunday')
  return value
}

export function validDayIndex(value: string): number {
  const index = Number(value)
  if (!Number.isInteger(index) || index < 0 || index > 6) throw new Error('day must be between 0 and 6')
  return index
}

export function normalizedIngredientKey(value: string): string | undefined {
  const normalized = value.trim().replace(/\s+/g, ' ').toLocaleLowerCase()
  return normalized || undefined
}

const sectionTerms: Array<[GrocerySection, RegExp]> = [
  ['frozen', /\b(frozen|ice cream)\b/i],
  ['meat_seafood', /\b(beef|chicken|turkey|pork|bacon|sausage|ham|lamb|shrimp|fish|salmon|tuna|crab|meatballs)\b/i],
  ['dairy', /\b(milk|cream|butter|cheese|yogurt|sour cream|parmesan|mozzarella|feta|egg|eggs)\b/i],
  ['produce', /\b(apples?|avocado|bananas?|berries|broccoli|carrots?|celery|corn|cucumbers?|garlic|ginger|jalapeñ?os?|lemons?|limes?|mushrooms?|onions?|peppers?|potatoes|spinach|tomatoes|zucchini|lettuce|kale|cilantro|parsley|basil|rosemary|fruit|vegetables?)\b/i],
  ['pantry', /\b(flour|sugar|salt|pepper|oil|vinegar|rice|pasta|spaghetti|bean|beans|broth|stock|sauce|tomato paste|bread|tortilla|oat|nuts?|spice|seasoning|can)\b/i],
]

export function classifyGroceryItem(value: string): GrocerySection {
  return sectionTerms.find(([, matcher]) => matcher.test(value))?.[0] ?? 'other'
}
