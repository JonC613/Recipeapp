export const completeMeal = {
  idMeal: '52772', strMeal: 'Teriyaki Chicken Casserole', strCategory: 'Chicken', strArea: 'Japanese',
  strMealThumb: 'https://www.themealdb.com/images/media/meals/wvpsxx1468256321.jpg',
  strInstructions: 'Preheat oven.\nBake until cooked through.', strTags: 'Meat,Casserole',
  strSource: 'https://www.bbcgoodfood.com/recipes/teriyaki-chicken-casserole',
  strIngredient1: 'soy sauce', strMeasure1: '3/4 cup', strIngredient2: 'chicken', strMeasure2: '1 lb',
}

export const browseResponse = { meals: [{ idMeal: '52772', strMeal: 'Teriyaki Chicken Casserole', strMealThumb: 'https://example.test/chicken.jpg' }] }
export const categoryResponse = { categories: [{ strCategory: 'Chicken' }, { strCategory: 'Seafood' }] }
export const areaResponse = { meals: [{ strArea: 'Japanese' }, { strArea: 'Canadian' }] }
export const emptyResponse = { meals: null }
export const malformedResponse = { meals: [{ idMeal: 42 }] }
