import { Box, Button, Group, Paper, TextInput, Title } from '@mantine/core'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
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

  return (
    <Paper
      mt={16}
      p="md"
      radius="md"
      withBorder
      style={{ background: 'var(--bg-header)', color: 'var(--text-on-header)' }}
    >
      <Group justify="space-between" align="center" wrap="wrap" gap="md">
        <Group align="center" gap="md">
          <Button variant="subtle" c="white" onClick={() => navigate('/')}>
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
                  color={isActive ? 'grape' : 'gray'}
                  c="white"
                >
                  {item.label}
                </Button>
              )}
            </NavLink>
          ))}
          </Group>
        </Group>

        <Box style={{ minWidth: 250, flex: 1, maxWidth: 360 }}>
          <TextInput
            placeholder="Поиск по странице"
            aria-label="Поиск по странице"
            radius="md"
          />
        </Box>

        <Group align="center" gap="xs">
          <Button
            color="grape"
            variant={location.pathname === '/planner' ? 'filled' : 'light'}
            onClick={() => navigate('/planner')}
          >
            Конструктор
          </Button>
          <Button component={NavLink} to="/profile" variant="subtle" c="white">
            {textKeys.nav.profile}
          </Button>
          <Button component={NavLink} to="/settings" variant="subtle" c="white">
            {textKeys.nav.settings}
          </Button>
        </Group>
      </Group>
    </Paper>
  )
}
