import { useEffect, useState } from 'react'
import { Breadcrumbs } from './components/Breadcrumbs'
import { FallbackCard } from './components/FallbackCard'
import { Footer } from './components/Footer'
import { Header } from './components/Header'
import { mealPlans, recipes } from './data/mockData'
import { AboutPage } from './pages/AboutPage'
import { MealPlanDetailPage } from './pages/MealPlanDetailPage'
import { MealPlansPage } from './pages/MealPlansPage'
import { ProfilePage } from './pages/ProfilePage'
import { RecipeDetailPage } from './pages/RecipeDetailPage'
import { RecipesPage } from './pages/RecipesPage'
import { ReviewsPage } from './pages/ReviewsPage'
import { SettingsPage } from './pages/SettingsPage'
import { getRouteMeta, normalizePath } from './router'

function App() {
  const [currentPath, setCurrentPath] = useState<string>(
    normalizePath(window.location.pathname),
  )

  useEffect(() => {
    const onPopState = () => setCurrentPath(normalizePath(window.location.pathname))
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])

  const navigate = (path: string) => {
    const nextPath = normalizePath(path)
    if (nextPath === currentPath) {
      return
    }

    window.history.pushState({}, '', nextPath)
    setCurrentPath(nextPath)
  }

  return (
    <div className="app-shell">
      <Header currentPath={currentPath} onNavigate={navigate} />
      <Breadcrumbs currentPath={currentPath} onNavigate={navigate} />
      <main className="page-content">{renderPage(currentPath, navigate)}</main>
      <Footer />
    </div>
  )
}

function renderPage(currentPath: string, onNavigate: (path: string) => void) {
  const routeMeta = getRouteMeta(currentPath)

  if (routeMeta.page === 'recipe-detail') {
    const recipe = recipes.find((item) => item.id === routeMeta.recipeId)
    return recipe ? (
      <RecipeDetailPage key={recipe.id} recipe={recipe} />
    ) : (
      <FallbackCard message="Рецепт не найден." />
    )
  }

  if (routeMeta.page === 'plan-detail') {
    const plan = mealPlans.find((item) => item.id === routeMeta.planId)
    return plan ? (
      <MealPlanDetailPage plan={plan} onNavigate={onNavigate} />
    ) : (
      <FallbackCard message="План питания не найден." />
    )
  }

  switch (routeMeta.page) {
    case '/recipes':
      return <RecipesPage onNavigate={onNavigate} />
    case '/meal-plans':
      return <MealPlansPage onNavigate={onNavigate} />
    case '/reviews':
      return <ReviewsPage onNavigate={onNavigate} />
    case '/profile':
      return <ProfilePage />
    case '/settings':
      return <SettingsPage />
    default:
      return <AboutPage onNavigate={onNavigate} />
  }
}

export default App
