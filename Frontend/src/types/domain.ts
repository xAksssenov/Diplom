export type MainRoute =
  | '/'
  | '/recipes'
  | '/meal-plans'
  | '/reviews'
  | '/planner'
  | '/profile'
  | '/settings'

export type Recipe = {
  id: string
  title: string
  subtitle: string
  cookingTime: string
  rating: number
  calories: number
  tags: string[]
  images: string[]
  nutrition: { protein: number; fat: number; carbs: number }
  ingredients: string[]
  steps: string[]
}

export type PlanMeal = {
  title: string
  recipeId: string
  calories: number
  ingredients: string
}

export type PlanDay = {
  day: number
  meals: {
    breakfast: PlanMeal
    lunch: PlanMeal
    dinner: PlanMeal
    snacks: PlanMeal[]
  }
}

export type MealPlan = {
  id: string
  title: string
  planType: 'На день' | 'На неделю' | 'На месяц'
  goal: string
  diet: string
  calories: number
  protein: number
  fat: number
  carbs: number
  rating: number
  reviewsCount: number
  description: string
  days: PlanDay[]
}

export type PlanReview = {
  id: string
  author: string
  planId: string
  planTitle: string
  rating: number
  comment: string
}

export type ModerationStatusItem = {
  id: string
  type: 'План питания' | 'Рецепт' | 'Отзыв'
  title: string
  status: 'На ревью' | 'Одобрено' | 'Отклонено (нужны правки)'
  updatedAt: string
}
