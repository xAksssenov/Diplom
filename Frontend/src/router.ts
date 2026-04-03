import { mealPlans, recipes } from './data/mockData'

export function getBreadcrumbSegments(currentPath: string) {
  const cleanedPath = currentPath.replace(/\/+$/, '') || '/'
  const staticLabels: Record<string, string> = {
    recipes: 'Рецепты',
    'meal-plans': 'Планы питания',
    reviews: 'Оценки и отзывы',
    planner: 'Конструктор',
    profile: 'Профиль',
    settings: 'Настройки',
  }

  if (/^\/recipes\/[a-z0-9-]+$/i.test(cleanedPath)) {
    const recipeId = cleanedPath.split('/')[2]
    const recipe = recipes.find((item) => item.id === recipeId)
    return [
      { path: '/recipes', label: 'Рецепты' },
      { path: cleanedPath, label: recipe?.title ?? 'Рецепт' },
    ]
  }

  if (/^\/meal-plans\/[a-z0-9-]+$/i.test(cleanedPath)) {
    const planId = cleanedPath.split('/')[2]
    const plan = mealPlans.find((item) => item.id === planId)
    return [
      { path: '/meal-plans', label: 'Планы питания' },
      { path: cleanedPath, label: plan?.title ?? 'План питания' },
    ]
  }

  return cleanedPath
    .split('/')
    .filter(Boolean)
    .map((segment, index, parts) => ({
      path: `/${parts.slice(0, index + 1).join('/')}`,
      label: staticLabels[segment] ?? segment,
    }))
}
