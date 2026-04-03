import { Container, Stack } from '@mantine/core'
import { Route, Routes } from 'react-router-dom'
import { Breadcrumbs } from './components/Breadcrumbs'
import { FallbackCard } from './components/FallbackCard'
import { Footer } from './components/Footer'
import { Header } from './components/Header'
import { AboutPage } from './pages/AboutPage'
import { MealPlanDetailPage } from './pages/MealPlanDetailPage'
import { MealPlansPage } from './pages/MealPlansPage'
import { PlannerPage } from './pages/PlannerPage'
import { ProfilePage } from './pages/ProfilePage'
import { RecipeDetailPage } from './pages/RecipeDetailPage'
import { RecipesPage } from './pages/RecipesPage'
import { ReviewsPage } from './pages/ReviewsPage'
import { SettingsPage } from './pages/SettingsPage'

function App() {
  return (
    <Container size="xl" py="md">
      <Stack gap="md" mih="100vh">
        <Header />
        <Breadcrumbs />
        <main>
          <Routes>
            <Route path="/" element={<AboutPage />} />
            <Route path="/recipes" element={<RecipesPage />} />
            <Route path="/recipes/:recipeId" element={<RecipeDetailPage />} />
            <Route path="/meal-plans" element={<MealPlansPage />} />
            <Route path="/meal-plans/:planId" element={<MealPlanDetailPage />} />
            <Route path="/reviews" element={<ReviewsPage />} />
            <Route path="/planner" element={<PlannerPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="*" element={<FallbackCard message="Страница не найдена." />} />
          </Routes>
        </main>
        <Footer />
      </Stack>
    </Container>
  )
}

export default App
