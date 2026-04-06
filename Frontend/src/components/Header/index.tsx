import { Autocomplete, Box, Button, Group, Paper, Title } from '@mantine/core'
import { useUnit } from 'effector-react'
import { useEffect, useMemo, useState } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { $authStatus, $authUser, logoutRequested } from '../../features/auth/model'
import { fetchMealPlans, fetchRecipes } from '../../shared/api/foodApi'
import { textKeys } from '../../shared/config/texts'
import type { MainRoute } from '../../types/domain'

const mainNavItems: { path: MainRoute; label: string }[] = [
  { path: '/', label: textKeys.nav.about },
  { path: '/recipes', label: textKeys.nav.recipes },
  { path: '/meal-plans', label: textKeys.nav.mealPlans },
  { path: '/reviews', label: textKeys.nav.reviews },
]

export function Header() {
  const navigate = useNavigate()
  const location = useLocation()
  const [searchValue, setSearchValue] = useState('')
  const [searchOptions, setSearchOptions] = useState<{ label: string; path: string }[]>([
    { label: 'О нас', path: '/' },
    { label: 'Рецепты', path: '/recipes' },
    { label: 'Планы питания', path: '/meal-plans' },
    { label: 'Оценки и отзывы', path: '/reviews' },
    { label: 'Конструктор', path: '/planner' },
    { label: 'Профиль', path: '/profile' },
  ])
  const { authStatus, authUser, logout } = useUnit({
    authStatus: $authStatus,
    authUser: $authUser,
    logout: logoutRequested,
  })
  const searchData = useMemo(() => searchOptions.map((item) => item.label), [searchOptions])

  useEffect(() => {
    Promise.all([fetchRecipes(), fetchMealPlans()])
      .then(([recipes, plans]) => {
        const recipeItems = recipes.slice(0, 40).map((recipe) => ({
          label: `Рецепт: ${recipe.title}`,
          path: `/recipes/${recipe.id}`,
        }))
        const planItems = plans.slice(0, 40).map((plan) => ({
          label: `План: ${plan.title}`,
          path: `/meal-plans/${plan.id}`,
        }))
        setSearchOptions((baseItems) => [...baseItems, ...recipeItems, ...planItems])
      })
      .catch(() => {
        // No-op: header remains usable with static route search.
      })
  }, [])

  return (
    <Paper
      mt={16}
      p="md"
      radius="md"
      withBorder
      style={{ background: 'var(--bg-header)', color: 'var(--text-on-header)' }}
    >
      <Group justify="space-between" align="center" wrap="nowrap" gap="md">
        <Group align="center" gap="md" wrap="nowrap">
          <Button variant="subtle" c="white" onClick={() => navigate('/')}>
            <Title order={4} c="white" tt="lowercase">
              {textKeys.appName}
            </Title>
          </Button>
          <Group gap={6} wrap="nowrap">
          {mainNavItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
            >
              {({ isActive }) => (
                <Button
                  size="compact-sm"
                  variant={isActive ? 'filled' : 'subtle'}
                  color="grape"
                  c="white"
                  styles={{
                    root: {
                      background: isActive ? 'rgba(167, 139, 250, 0.6)' : 'rgba(255, 255, 255, 0.14)',
                      color: 'white',
                    },
                  }}
                >
                  {item.label}
                </Button>
              )}
            </NavLink>
          ))}
          </Group>
        </Group>

        <Box style={{ minWidth: 250, flex: 1, maxWidth: 420 }}>
          <Autocomplete
            placeholder="Глобальный поиск по сайту"
            aria-label="Глобальный поиск по сайту"
            radius="md"
            value={searchValue}
            onChange={setSearchValue}
            data={searchData}
            limit={8}
            onOptionSubmit={(value) => {
              const target = searchOptions.find((item) => item.label === value)
              if (!target) return
              navigate(target.path)
              setSearchValue('')
            }}
          />
        </Box>

        <Group align="center" gap="xs" wrap="nowrap">
          <Button
            color="grape"
            variant={location.pathname === '/planner' ? 'filled' : 'light'}
            onClick={() => navigate('/planner')}
          >
            Конструктор
          </Button>
          {authStatus === 'auth' ? (
            <>
              <Button component={NavLink} to="/profile" variant="subtle" c="white">
                {authUser?.name ?? textKeys.nav.profile}
              </Button>
              <Button
                variant="outline"
                color="grape"
                onClick={() => {
                  logout()
                  navigate('/auth')
                }}
              >
                Выйти
              </Button>
            </>
          ) : (
            <Button component={NavLink} to="/auth" variant="subtle" c="white">
              Войти
            </Button>
          )}
        </Group>
      </Group>
    </Paper>
  )
}
