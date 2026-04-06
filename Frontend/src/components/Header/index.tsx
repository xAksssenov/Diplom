import { Autocomplete, Box, Button, Group, Paper, Title } from '@mantine/core'
import { useUnit } from 'effector-react'
import { useEffect, useMemo, useState } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { $authStatus, $authUser, logoutRequested } from '../../features/auth/model'
import { fetchMealPlans, fetchRecipes } from '../../shared/api/foodApi'
import { textKeys } from '../../shared/config/texts'
import type { MainRoute } from '../../types/domain'

const mainNavItems: { path: MainRoute; label: string }[] = [
  { path: '/recipes', label: textKeys.nav.recipes },
  { path: '/meal-plans', label: textKeys.nav.mealPlans },
  { path: '/reviews', label: textKeys.nav.reviews },
]

type SearchOption = {
  value: string
  label: string
  path: string
}

const staticSearchOptions: SearchOption[] = [
  { value: 'route-home', label: 'О нас', path: '/' },
  { value: 'route-recipes', label: 'Рецепты', path: '/recipes' },
  { value: 'route-meal-plans', label: 'Планы питания', path: '/meal-plans' },
  { value: 'route-reviews', label: 'Оценки и отзывы', path: '/reviews' },
  { value: 'route-planner', label: 'Конструктор', path: '/planner' },
  { value: 'route-profile', label: 'Профиль', path: '/profile' },
]

export function Header() {
  const navigate = useNavigate()
  const location = useLocation()
  const [searchValue, setSearchValue] = useState('')
  const [searchOptions, setSearchOptions] = useState<SearchOption[]>(staticSearchOptions)
  const { authStatus, authUser, logout } = useUnit({
    authStatus: $authStatus,
    authUser: $authUser,
    logout: logoutRequested,
  })
  const searchData = useMemo(
    () => searchOptions.map((item) => ({ value: item.value, label: item.label })),
    [searchOptions],
  )
  const navButtonStyles = {
    root: {
      background: 'rgba(255, 255, 255, 0.14)',
      color: 'white',
      '&:hover': {
        background: 'rgba(167, 139, 250, 0.45)',
      },
    },
  } as const

  useEffect(() => {
    Promise.all([fetchRecipes(), fetchMealPlans()])
      .then(([recipes, plans]) => {
        const recipeItems = recipes.slice(0, 40).map((recipe) => ({
          value: `recipe-${recipe.id}`,
          label: `Рецепт: ${recipe.title}`,
          path: `/recipes/${recipe.id}`,
        }))
        const planItems = plans.slice(0, 40).map((plan) => ({
          value: `plan-${plan.id}`,
          label: `План: ${plan.title}`,
          path: `/meal-plans/${plan.id}`,
        }))
        const merged = [...staticSearchOptions, ...recipeItems, ...planItems]
        const deduped = merged.filter(
          (item, index, array) => array.findIndex((candidate) => candidate.value === item.value) === index,
        )
        setSearchOptions(deduped)
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
      <Group justify="space-between" align="center" wrap="wrap" gap="md">
        <Group align="center" gap="md" wrap="wrap">
          <Button
            variant="subtle"
            c="white"
            onClick={() => navigate('/')}
            styles={{
              root: {
                color: 'white',
                '&:hover': {
                  background: 'rgba(167, 139, 250, 0.32)',
                },
              },
            }}
          >
            <Title order={4} c="white" tt="lowercase">
              {textKeys.appName}
            </Title>
          </Button>
          <Group gap={6} wrap="wrap">
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
                      '&:hover': {
                        background: isActive ? 'rgba(167, 139, 250, 0.72)' : 'rgba(167, 139, 250, 0.45)',
                      },
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

        <Box style={{ minWidth: 220, flex: 1, maxWidth: 420 }}>
          <Autocomplete
            placeholder="Глобальный поиск по сайту"
            aria-label="Глобальный поиск по сайту"
            radius="md"
            value={searchValue}
            onChange={setSearchValue}
            data={searchData}
            limit={8}
            onOptionSubmit={(value) => {
              const target = searchOptions.find((item) => item.value === value)
              if (!target) return
              navigate(target.path)
              setSearchValue('')
            }}
          />
        </Box>

        <Group align="center" gap="xs" wrap="wrap">
          <Button
            color="grape"
            variant={location.pathname === '/planner' ? 'filled' : 'light'}
            onClick={() => navigate('/planner')}
            styles={{
              root: {
                '&:hover': {
                  background: 'rgba(167, 139, 250, 0.88)',
                },
              },
            }}
          >
            Конструктор
          </Button>
          {authStatus === 'auth' ? (
            <>
              <Button component={NavLink} to="/profile" variant="subtle" c="white" styles={navButtonStyles}>
                {authUser?.name ?? textKeys.nav.profile}
              </Button>
              <Button
                variant="outline"
                color="grape"
                styles={{
                  root: {
                    color: 'white',
                    borderColor: 'rgba(255, 255, 255, 0.55)',
                    '&:hover': {
                      background: 'rgba(167, 139, 250, 0.38)',
                      borderColor: 'rgba(255, 255, 255, 0.85)',
                    },
                  },
                }}
                onClick={() => {
                  logout()
                  navigate('/auth')
                }}
              >
                Выйти
              </Button>
            </>
          ) : (
            <Button component={NavLink} to="/auth" variant="subtle" c="white" styles={navButtonStyles}>
              Войти
            </Button>
          )}
        </Group>
      </Group>
    </Paper>
  )
}
