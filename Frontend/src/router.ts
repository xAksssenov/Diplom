export function getBreadcrumbSegments(currentPath: string) {
  const cleanedPath = currentPath.replace(/\/+$/, '') || '/'
  const staticLabels: Record<string, string> = {
    auth: 'Авторизация',
    recipes: 'Рецепты',
    'meal-plans': 'Планы питания',
    reviews: 'Оценки и отзывы',
    planner: 'Конструктор',
    profile: 'Профиль',
    settings: 'Настройки',
  }

  if (/^\/recipes\/[a-z0-9-]+$/i.test(cleanedPath)) {
    const recipeId = cleanedPath.split('/')[2]
    return [
      { path: '/recipes', label: 'Рецепты' },
      { path: cleanedPath, label: `Рецепт #${recipeId}` },
    ]
  }

  if (/^\/meal-plans\/[a-z0-9-]+$/i.test(cleanedPath)) {
    const planId = cleanedPath.split('/')[2]
    return [
      { path: '/meal-plans', label: 'Планы питания' },
      { path: cleanedPath, label: `План #${planId}` },
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
