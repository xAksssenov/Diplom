import { Container, Stack } from '@mantine/core'
import { useUnit } from 'effector-react'
import { useEffect } from 'react'
import { Route, Routes, useLocation } from 'react-router-dom'
import { Breadcrumbs } from './components/Breadcrumbs'
import { FallbackCard } from './components/FallbackCard'
import { Footer } from './components/Footer'
import { Header } from './components/Header'
import { checkSessionRequested } from './features/auth/model'
import { AboutPage } from './pages/AboutPage'
import { AuthPage } from './pages/AuthPage'
import { MealPlanDetailPage } from './pages/MealPlanDetailPage'
import { MealPlansPage } from './pages/MealPlansPage'
import { PlannerPage } from './pages/PlannerPage'
import { ProfilePage } from './pages/ProfilePage'
import { RecipeDetailPage } from './pages/RecipeDetailPage'
import { RecipesPage } from './pages/RecipesPage'
import { ReviewsPage } from './pages/ReviewsPage'
import { AssistantWidget } from './shared/ui/AssistantWidget'
import { AppNotifications } from './shared/ui/AppNotifications'

function App() {
  const checkSession = useUnit(checkSessionRequested)
  const location = useLocation()

  useEffect(() => {
    checkSession()
  }, [checkSession])

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
  }, [location.pathname])

  return (
    <Container size="xl" py="md">
      <Stack gap="md" mih="100vh">
        <AppNotifications />
        <AssistantWidget />
        <Header />
        <Breadcrumbs />
        <main>
          <Routes>
            <Route path="/" element={<AboutPage />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/recipes" element={<RecipesPage />} />
            <Route path="/recipes/:recipeId" element={<RecipeDetailPage />} />
            <Route path="/meal-plans" element={<MealPlansPage />} />
            <Route path="/meal-plans/:planId" element={<MealPlanDetailPage />} />
            <Route path="/reviews" element={<ReviewsPage />} />
            <Route path="/planner" element={<PlannerPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="*" element={<FallbackCard message="Страница не найдена." />} />
          </Routes>
        </main>
        <Footer />
      </Stack>
    </Container>
  )
}

export default App
