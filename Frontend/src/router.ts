import { mealPlans, recipes } from './data/mockData'
import type { MainRoute } from './types/domain'

export function normalizePath(pathname: string): string {
  const cleanedPath = pathname.replace(/\/+$/, '') || '/'
  const staticPaths: MainRoute[] = [
    '/',
    '/recipes',
    '/meal-plans',
    '/reviews',
    '/planner',
    '/profile',
    '/settings',
  ]

  if (staticPaths.includes(cleanedPath as MainRoute)) {
    return cleanedPath
  }

  if (/^\/recipes\/[a-z0-9-]+$/i.test(cleanedPath)) {
    return cleanedPath
  }

  if (/^\/meal-plans\/[a-z0-9-]+$/i.test(cleanedPath)) {
    return cleanedPath
  }

  return '/'
}

export function getRouteMeta(path: string) {
  if (path.startsWith('/recipes/')) {
    const recipeId = path.split('/')[2]
    return { page: 'recipe-detail', recipeId } as const
  }

  if (path.startsWith('/meal-plans/')) {
    const planId = path.split('/')[2]
    return { page: 'plan-detail', planId } as const
  }

  return { page: path } as const
}

export function getBreadcrumbSegments(currentPath: string) {
  const routeMeta = getRouteMeta(currentPath)
  const staticLabels: Record<string, string> = {
    recipes: 'Рецепты',
    'meal-plans': 'Планы питания',
    reviews: 'Оценки и отзывы',
    planner: 'Конструктор',
    profile: 'Профиль',
    settings: 'Настройки',
  }

  if (routeMeta.page === 'recipe-detail') {
    const recipe = recipes.find((item) => item.id === routeMeta.recipeId)
    return [
      { path: '/recipes', label: 'Рецепты' },
      { path: currentPath, label: recipe?.title ?? 'Рецепт' },
    ]
  }

  if (routeMeta.page === 'plan-detail') {
    const plan = mealPlans.find((item) => item.id === routeMeta.planId)
    return [
      { path: '/meal-plans', label: 'Планы питания' },
      { path: currentPath, label: plan?.title ?? 'План питания' },
    ]
  }

  return currentPath
    .split('/')
    .filter(Boolean)
    .map((segment, index, parts) => ({
      path: `/${parts.slice(0, index + 1).join('/')}`,
      label: staticLabels[segment] ?? segment,
    }))
}
