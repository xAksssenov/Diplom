import type {
  MealPlan,
  ModerationStatusItem,
  PlanDay,
  PlanMeal,
  PlanReview,
  Recipe,
} from '../../types/domain'
import { toApiError } from './errors'

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL?.replace(/\/+$/, '') || 'http://localhost:8000/api'

function getCookie(name: string) {
  const cookieString = `; ${document.cookie}`
  const parts = cookieString.split(`; ${name}=`)
  if (parts.length === 2) {
    return parts.pop()?.split(';').shift() ?? ''
  }
  return ''
}

async function ensureCsrfCookie() {
  if (getCookie('csrftoken')) {
    return
  }
  await fetch(`${API_BASE_URL}/health/`, { credentials: 'include' })
}

type BackendRecipeIngredient = {
  ingredient_name: string
  quantity: string
  unit: string
}

type BackendRecipe = {
  id: number
  title: string
  description: string
  cooking_time: number
  instructions: string
  nutrition_calories: string
  nutrition_protein: string
  nutrition_fat: string
  nutrition_carbs: string
  tags: number[]
  recipe_ingredients: BackendRecipeIngredient[]
}

type BackendMealPlanItem = {
  day_number: number
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack'
  recipe: number
}

type BackendMealPlan = {
  id: number
  plan_type: 'personal' | 'fitness' | 'therapeutic'
  start_date: string
  end_date: string
  total_calories: string
  status: 'draft' | 'pending' | 'approved' | 'rejected'
  items: BackendMealPlanItem[]
}

type BackendReview = {
  id: number
  user: number
  target_type: 'recipe' | 'meal_plan'
  target_id: number
  rating: number
  comment: string
  is_approved: boolean
}

async function apiGet<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    credentials: 'include',
  })

  if (!response.ok) {
    throw await toApiError(response)
  }

  return (await response.json()) as T
}

async function apiPost<T>(path: string, body: unknown): Promise<T> {
  await ensureCsrfCookie()
  const csrfToken = getCookie('csrftoken')
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRFToken': csrfToken,
    },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    throw await toApiError(response)
  }

  return (await response.json()) as T
}

async function apiPatch<T>(path: string, body: unknown): Promise<T> {
  await ensureCsrfCookie()
  const csrfToken = getCookie('csrftoken')
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'PATCH',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRFToken': csrfToken,
    },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    throw await toApiError(response)
  }

  return (await response.json()) as T
}

async function apiDelete(path: string): Promise<void> {
  await ensureCsrfCookie()
  const csrfToken = getCookie('csrftoken')
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'DELETE',
    credentials: 'include',
    headers: {
      'X-CSRFToken': csrfToken,
    },
  })

  if (!response.ok && response.status !== 204) {
    throw await toApiError(response)
  }
}

function parseNumber(value: string | number | null | undefined) {
  const numeric = Number(value ?? 0)
  return Number.isFinite(numeric) ? numeric : 0
}

function paletteById(id: number): string[] {
  const palettes = [
    ['#d7c4ff', '#c5b0ff', '#b39cff', '#a28bff'],
    ['#d9d4ff', '#cbc2ff', '#b8abff', '#a596ff'],
    ['#e4d8ff', '#d4c5ff', '#c5b3ff', '#b59fff'],
  ]
  return palettes[id % palettes.length]
}

function toUiRecipe(recipe: BackendRecipe, ratingMap: Record<number, number>): Recipe {
  const steps = recipe.instructions
    ? recipe.instructions
        .split(/\n+/)
        .map((item) => item.trim())
        .filter(Boolean)
    : ['Шаги приготовления будут добавлены позже.']

  const ingredients =
    recipe.recipe_ingredients?.map(
      (item) => `${item.ingredient_name} - ${item.quantity} ${item.unit}`,
    ) ?? []

  return {
    id: String(recipe.id),
    title: recipe.title,
    subtitle: recipe.description || 'Описание рецепта',
    cookingTime: `${parseNumber(recipe.cooking_time)} мин`,
    rating: ratingMap[recipe.id] ?? 0,
    calories: parseNumber(recipe.nutrition_calories),
    tags:
      recipe.tags?.length > 0
        ? recipe.tags.map((tagId) => `Тег #${tagId}`)
        : ['Без тега'],
    images: paletteById(recipe.id),
    nutrition: {
      protein: parseNumber(recipe.nutrition_protein),
      fat: parseNumber(recipe.nutrition_fat),
      carbs: parseNumber(recipe.nutrition_carbs),
    },
    ingredients: ingredients.length ? ingredients : ['Ингредиенты пока не указаны'],
    steps,
  }
}

function buildRatingMap(reviews: BackendReview[], targetType: 'recipe' | 'meal_plan') {
  const grouped = reviews.filter((review) => review.target_type === targetType)
  const sumMap: Record<number, number> = {}
  const countMap: Record<number, number> = {}

  grouped.forEach((review) => {
    sumMap[review.target_id] = (sumMap[review.target_id] ?? 0) + review.rating
    countMap[review.target_id] = (countMap[review.target_id] ?? 0) + 1
  })

  const ratingMap: Record<number, number> = {}
  Object.keys(sumMap).forEach((targetId) => {
    const id = Number(targetId)
    ratingMap[id] = Number((sumMap[id] / countMap[id]).toFixed(1))
  })

  return { ratingMap, countMap }
}

function resolvePlanType(value: BackendMealPlan['plan_type']): MealPlan['planType'] {
  if (value === 'fitness') {
    return 'На неделю'
  }
  if (value === 'therapeutic') {
    return 'На месяц'
  }
  return 'На день'
}

function toMealsByDay(
  items: BackendMealPlanItem[],
  recipesById: Record<number, Recipe>,
): PlanDay[] {
  const grouped: Record<number, BackendMealPlanItem[]> = {}
  items.forEach((item) => {
    grouped[item.day_number] = grouped[item.day_number] ?? []
    grouped[item.day_number].push(item)
  })

  return Object.entries(grouped)
    .map(([dayNumber, dayItems]) => {
      const toMeal = (item?: BackendMealPlanItem): PlanMeal => {
        const recipe = item ? recipesById[item.recipe] : undefined
        return {
          title: recipe?.title ?? 'Блюдо не найдено',
          recipeId: recipe?.id ?? '',
          calories: recipe?.calories ?? 0,
          ingredients: recipe?.ingredients?.slice(0, 3).join(', ') ?? 'Нет данных',
        }
      }

      const breakfast = dayItems.find((item) => item.meal_type === 'breakfast')
      const lunch = dayItems.find((item) => item.meal_type === 'lunch')
      const dinner = dayItems.find((item) => item.meal_type === 'dinner')
      const snacks = dayItems.filter((item) => item.meal_type === 'snack')

      return {
        day: Number(dayNumber),
        meals: {
          breakfast: toMeal(breakfast),
          lunch: toMeal(lunch),
          dinner: toMeal(dinner),
          snacks: snacks.map((item) => toMeal(item)),
        },
      }
    })
    .sort((a, b) => a.day - b.day)
}

function toUiMealPlan(
  plan: BackendMealPlan,
  recipesById: Record<number, Recipe>,
  ratingMap: Record<number, number>,
  countMap: Record<number, number>,
): MealPlan {
  return {
    id: String(plan.id),
    title: `План #${plan.id}`,
    planType: resolvePlanType(plan.plan_type),
    goal: plan.plan_type === 'fitness' ? 'Поддержание веса' : 'Индивидуальная цель',
    diet: 'Сбалансированное',
    calories: parseNumber(plan.total_calories),
    protein: 0,
    fat: 0,
    carbs: 0,
    rating: ratingMap[plan.id] ?? 0,
    reviewsCount: countMap[plan.id] ?? 0,
    description: `Период: ${plan.start_date} - ${plan.end_date}`,
    days: toMealsByDay(plan.items ?? [], recipesById),
  }
}

export async function fetchReviewsRaw() {
  return apiGet<BackendReview[]>('/interactions/reviews/')
}

export async function fetchRecipes() {
  const [recipesResponse, reviews] = await Promise.all([
    apiGet<BackendRecipe[]>('/recipes/'),
    fetchReviewsRaw(),
  ])
  const { ratingMap } = buildRatingMap(reviews, 'recipe')
  return recipesResponse.map((item) => toUiRecipe(item, ratingMap))
}

export async function fetchRecipeById(id: string) {
  const [recipe, reviews] = await Promise.all([
    apiGet<BackendRecipe>(`/recipes/${id}/`),
    fetchReviewsRaw(),
  ])
  const { ratingMap } = buildRatingMap(reviews, 'recipe')
  return toUiRecipe(recipe, ratingMap)
}

export async function fetchMealPlans() {
  const [plans, recipesList, reviews] = await Promise.all([
    apiGet<BackendMealPlan[]>('/meal-plans/'),
    fetchRecipes(),
    fetchReviewsRaw(),
  ])
  const recipesById = Object.fromEntries(recipesList.map((recipe) => [Number(recipe.id), recipe]))
  const { ratingMap, countMap } = buildRatingMap(reviews, 'meal_plan')
  return plans.map((plan) => toUiMealPlan(plan, recipesById, ratingMap, countMap))
}

export async function fetchMealPlanById(id: string) {
  const [plan, recipesList, reviews] = await Promise.all([
    apiGet<BackendMealPlan>(`/meal-plans/${id}/`),
    fetchRecipes(),
    fetchReviewsRaw(),
  ])
  const recipesById = Object.fromEntries(recipesList.map((recipe) => [Number(recipe.id), recipe]))
  const { ratingMap, countMap } = buildRatingMap(reviews, 'meal_plan')
  return toUiMealPlan(plan, recipesById, ratingMap, countMap)
}

export async function fetchPlanReviews() {
  const [reviews, plans] = await Promise.all([
    fetchReviewsRaw(),
    apiGet<BackendMealPlan[]>('/meal-plans/'),
  ])
  const plansById = Object.fromEntries(plans.map((plan) => [plan.id, `План #${plan.id}`]))

  return reviews
    .filter((review) => review.target_type === 'meal_plan')
    .map(
      (review): PlanReview => ({
        id: String(review.id),
        author: `Пользователь #${review.user}`,
        planId: String(review.target_id),
        planTitle: plansById[review.target_id] ?? `План #${review.target_id}`,
        rating: review.rating,
        comment: review.comment || 'Без комментария',
      }),
    )
}

type SubmitPlannerPayload = {
  daysCount: number
  slotsMap: Record<string, string>
}

export async function submitPlannerToBackend(payload: SubmitPlannerPayload) {
  const items = Object.entries(payload.slotsMap)
    .filter(([, recipeId]) => Boolean(recipeId))
    .map(([slotKey, recipeId]) => {
      const [dayNumberRaw, mealTypeRaw] = slotKey.split(':')
      const mealType = mealTypeRaw.startsWith('snack') ? 'snack' : mealTypeRaw
      return {
        day_number: Number(dayNumberRaw),
        meal_type: mealType,
        recipe: Number(recipeId),
        servings: 1,
      }
    })

  const startDate = new Date()
  const endDate = new Date()
  endDate.setDate(startDate.getDate() + Math.max(0, payload.daysCount - 1))
  const toIsoDate = (value: Date) => value.toISOString().slice(0, 10)

  const createdPlan = await apiPost<{ id: number }>('/meal-plans/', {
    plan_type: payload.daysCount > 7 ? 'therapeutic' : payload.daysCount > 1 ? 'fitness' : 'personal',
    start_date: toIsoDate(startDate),
    end_date: toIsoDate(endDate),
    total_calories: 1800,
    items,
  })

  await apiPost(`/meal-plans/${createdPlan.id}/submit_for_moderation/`, {})
  return createdPlan.id
}

type BackendFavorite = {
  id: number
  target_type: 'recipe' | 'meal_plan'
  target_id: number
}

export type TargetReview = {
  id: string
  userId: number
  targetType: 'recipe' | 'meal_plan'
  targetId: string
  rating: number
  comment: string
}

type BackendNotification = {
  id: number
  message: string
  event_type: string
  is_read: boolean
  created_at: string
}

export async function fetchUserFavorites() {
  return apiGet<BackendFavorite[]>('/interactions/favorites/')
}

export async function addFavorite(targetType: 'recipe' | 'meal_plan', targetId: string) {
  return apiPost<BackendFavorite>('/interactions/favorites/', {
    target_type: targetType,
    target_id: Number(targetId),
  })
}

export async function removeFavorite(targetType: 'recipe' | 'meal_plan', targetId: string) {
  const favorites = await fetchUserFavorites()
  const existing = favorites.find(
    (item) => item.target_type === targetType && String(item.target_id) === targetId,
  )
  if (!existing) return
  await apiDelete(`/interactions/favorites/${existing.id}/`)
}

export async function fetchFavoriteRecipes() {
  const [favorites, recipes] = await Promise.all([fetchUserFavorites(), fetchRecipes()])
  const ids = new Set(
    favorites.filter((item) => item.target_type === 'recipe').map((item) => String(item.target_id)),
  )
  return recipes.filter((recipe) => ids.has(recipe.id))
}

export async function fetchFavoriteMealPlans() {
  const [favorites, plans] = await Promise.all([fetchUserFavorites(), fetchMealPlans()])
  const ids = new Set(
    favorites
      .filter((item) => item.target_type === 'meal_plan')
      .map((item) => String(item.target_id)),
  )
  return plans.filter((plan) => ids.has(plan.id))
}

function mapNotificationToStatus(item: BackendNotification): ModerationStatusItem {
  const normalizedMessage = item.message.toLowerCase()
  const status: ModerationStatusItem['status'] =
    normalizedMessage.includes('approved') || normalizedMessage.includes('одобрен')
      ? 'Одобрено'
      : normalizedMessage.includes('rejected') || normalizedMessage.includes('отклонен')
        ? 'Отклонено (нужны правки)'
        : 'На ревью'
  const type: ModerationStatusItem['type'] =
    item.event_type.includes('RECIPE') || item.event_type.includes('recipe')
      ? 'Рецепт'
      : item.event_type.includes('REVIEW') || item.event_type.includes('review')
        ? 'Отзыв'
        : 'План питания'

  const updatedAt = new Date(item.created_at).toLocaleDateString('ru-RU')
  return {
    id: String(item.id),
    type,
    title: item.message,
    status,
    updatedAt,
  }
}

export async function fetchModerationStatuses() {
  const notifications = await apiGet<BackendNotification[]>('/notifications/')
  return notifications.map(mapNotificationToStatus)
}

export async function fetchTargetReviews(targetType: 'recipe' | 'meal_plan', targetId: string) {
  const reviews = await fetchReviewsRaw()
  return reviews
    .filter((review) => review.target_type === targetType && String(review.target_id) === targetId)
    .map(
      (review): TargetReview => ({
        id: String(review.id),
        userId: review.user,
        targetType: review.target_type,
        targetId: String(review.target_id),
        rating: review.rating,
        comment: review.comment || '',
      }),
    )
}

export async function upsertReview(payload: {
  targetType: 'recipe' | 'meal_plan'
  targetId: string
  userId: number
  rating: number
  comment: string
}) {
  const reviews = await fetchReviewsRaw()
  const existing = reviews.find(
    (item) =>
      item.user === payload.userId &&
      item.target_type === payload.targetType &&
      String(item.target_id) === payload.targetId,
  )
  if (existing) {
    return apiPatch(`/interactions/reviews/${existing.id}/`, {
      rating: payload.rating,
      comment: payload.comment,
    })
  }
  return apiPost('/interactions/reviews/', {
    target_type: payload.targetType,
    target_id: Number(payload.targetId),
    rating: payload.rating,
    comment: payload.comment,
  })
}
