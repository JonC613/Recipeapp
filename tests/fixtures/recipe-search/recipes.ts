export const recipeSearchFixtures = {
  title: { title: 'Smoky Chicken Tacos', ingredients: [{ originalText: '8 corn tortillas' }], tags: ['Weeknight'], cuisine: 'Mexican', category: 'Dinner' },
  ingredient: { title: 'Garden Pasta', ingredients: [{ originalText: '1 cup cannellini beans' }], tags: ['Vegetarian'], cuisine: 'Italian', category: 'Lunch' },
  tag: { title: 'Skillet Corn', ingredients: [{ originalText: '2 ears corn' }], tags: ['Blackstone'], cuisine: 'American', category: 'Side' },
  cuisine: { title: 'Coconut Curry', ingredients: [{ originalText: '1 can coconut milk' }], tags: ['Comfort'], cuisine: 'Thai', category: 'Dinner' },
  category: { title: 'Berry Crisp', ingredients: [{ originalText: '2 cups berries' }], tags: ['Sweet'], cuisine: 'American', category: 'Dessert' },
} as const
