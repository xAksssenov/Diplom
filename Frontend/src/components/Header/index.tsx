import { Autocomplete, Box, Burger, Button, Drawer, Group, Paper, Stack, Title } from '@mantine/core'
import { useUnit } from 'effector-react'
import { useEffect, useMemo, useState } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { $authStatus, $authUser, logoutRequested } from '../../features/auth/model'
import { fetchMealPlansPage, fetchRecipesPage } from '../../shared/api/foodApi'
import { textKeys } from '../../shared/config/texts'
import type { MainRoute } from '../../types/domain'
import './styles.css'

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
  { value: 'route-home', label: textKeys.appName, path: '/' },
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
  const [mobileMenuOpened, setMobileMenuOpened] = useState(false)
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
      transition: 'transform .16s ease, background .16s ease',
      '&:hover': {
        background: 'rgba(167, 139, 250, 0.45)',
        transform: 'translateY(-1px)',
      },
    },
  } as const

  useEffect(() => {
    Promise.all([fetchRecipesPage({ limit: 40, offset: 0 }), fetchMealPlansPage({ limit: 40, offset: 0 })])
      .then(([recipesPage, plansPage]) => {
        const recipes = recipesPage.items
        const plans = plansPage.items
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
            className="header-anim-btn"
            styles={{
              root: {
                color: 'white',
                '&:hover': {
                  background: 'rgba(167, 139, 250, 0.32)',
                  transform: 'translateY(-1px)',
                },
                transition: 'transform .16s ease, background .16s ease',
              },
            }}
          >
            <Title order={4} c="white" tt="lowercase">
              {textKeys.appName}
            </Title>
          </Button>
          <Group gap={6} wrap="wrap" visibleFrom="md">
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
                  className={`header-anim-btn ${isActive ? 'header-anim-btn-active' : ''}`}
                  styles={{
                    root: {
                      background: isActive ? 'rgba(167, 139, 250, 0.6)' : 'rgba(255, 255, 255, 0.14)',
                      color: 'white',
                      '&:hover': {
                        background: isActive ? 'rgba(167, 139, 250, 0.72)' : 'rgba(167, 139, 250, 0.45)',
                        transform: 'translateY(-1px)',
                      },
                      transition: 'transform .16s ease, background .16s ease',
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

        <Box style={{ minWidth: 220, flex: 1, maxWidth: 420 }} visibleFrom="md">
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

        <Group align="center" gap="xs" wrap="wrap" visibleFrom="md">
          <Button
            color="grape"
            variant={location.pathname === '/planner' ? 'filled' : 'light'}
            onClick={() => navigate('/planner')}
            className="header-anim-btn"
            styles={{
              root: {
                '&:hover': {
                  background: 'rgba(167, 139, 250, 0.88)',
                  transform: 'translateY(-1px)',
                },
                transition: 'transform .16s ease, background .16s ease',
              },
            }}
          >
            Конструктор
          </Button>
          {authStatus === 'auth' ? (
            <>
              <Button
                component={NavLink}
                to="/profile"
                variant="subtle"
                c="white"
                className="header-anim-btn"
                styles={navButtonStyles}
              >
                {authUser?.name ?? textKeys.nav.profile}
              </Button>
              <Button
                variant="outline"
                color="grape"
                className="header-anim-btn header-outline-anim-btn"
                styles={{
                  root: {
                    color: 'white',
                    borderColor: 'rgba(255, 255, 255, 0.55)',
                    '&:hover': {
                      background: 'rgba(167, 139, 250, 0.38)',
                      borderColor: 'rgba(255, 255, 255, 0.85)',
                      transform: 'translateY(-1px)',
                    },
                    transition: 'transform .16s ease, background .16s ease, border-color .16s ease',
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
            <Button
              component={NavLink}
              to="/auth"
              variant="subtle"
              c="white"
              className="header-anim-btn"
              styles={navButtonStyles}
            >
              Войти
            </Button>
          )}
        </Group>
        <Burger
          hiddenFrom="md"
          opened={mobileMenuOpened}
          onClick={() => setMobileMenuOpened((value) => !value)}
          color="white"
          aria-label="Открыть меню"
        />
      </Group>
      <Drawer
        hiddenFrom="md"
        opened={mobileMenuOpened}
        onClose={() => setMobileMenuOpened(false)}
        title="Навигация"
        position="right"
      >
        <Stack gap="sm">
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
              setMobileMenuOpened(false)
            }}
          />
          {mainNavItems.map((item) => (
            <Button
              key={item.path}
              component={NavLink}
              to={item.path}
              onClick={() => setMobileMenuOpened(false)}
              color="grape"
              variant={location.pathname === item.path ? 'filled' : 'light'}
            >
              {item.label}
            </Button>
          ))}
          <Button
            color="grape"
            variant={location.pathname === '/planner' ? 'filled' : 'light'}
            onClick={() => {
              navigate('/planner')
              setMobileMenuOpened(false)
            }}
          >
            Конструктор
          </Button>
          {authStatus === 'auth' ? (
            <>
              <Button
                component={NavLink}
                to="/profile"
                variant="light"
                color="grape"
                onClick={() => setMobileMenuOpened(false)}
              >
                {authUser?.name ?? textKeys.nav.profile}
              </Button>
              <Button
                variant="outline"
                color="grape"
                onClick={() => {
                  logout()
                  navigate('/auth')
                  setMobileMenuOpened(false)
                }}
              >
                Выйти
              </Button>
            </>
          ) : (
            <Button
              component={NavLink}
              to="/auth"
              variant="light"
              color="grape"
              onClick={() => setMobileMenuOpened(false)}
            >
              Войти
            </Button>
          )}
        </Stack>
      </Drawer>
    </Paper>
  )
}
