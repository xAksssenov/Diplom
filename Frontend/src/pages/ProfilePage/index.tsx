import {
  Alert,
  Avatar,
  Badge,
  Button,
  Card,
  Group,
  MultiSelect,
  SimpleGrid,
  Stack,
  Switch,
  Tabs,
  TextInput,
  Text,
  Textarea,
  Title,
} from '@mantine/core'
import { useUnit } from 'effector-react'
import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import {
  $authStatus,
  $authUser,
  updateProfileFx,
} from '../../features/auth/model'
import {
  fetchFavoriteMealPlans,
  fetchFavoriteRecipes,
  fetchModerationStatuses,
} from '../../shared/api/foodApi'
import type { MealPlan, ModerationStatusItem, Recipe } from '../../types/domain'

const availableTags = [
  'Завтрак',
  'Быстро',
  'Без глютена',
  'Вегетарианское',
  'Высокобелковое',
  'Детское',
  'Без лактозы',
]

export function ProfilePage() {
  const {
    authStatus,
    authUser,
    updateProfile,
    profileUpdatePending,
  } = useUnit({
    authStatus: $authStatus,
    authUser: $authUser,
    updateProfile: updateProfileFx,
    profileUpdatePending: updateProfileFx.pending,
  })
  const [favoriteTab, setFavoriteTab] = useState<'mealPlans' | 'recipes'>('mealPlans')
  const [favoriteMealPlans, setFavoriteMealPlans] = useState<MealPlan[]>([])
  const [favoriteRecipes, setFavoriteRecipes] = useState<Recipe[]>([])
  const [moderationStatuses, setModerationStatuses] = useState<ModerationStatusItem[]>([])
  const [name, setName] = useState(authUser?.name ?? '')
  const [avatarUrl, setAvatarUrl] = useState(authUser?.avatar_url ?? '')
  const [healthGoals, setHealthGoals] = useState(authUser?.health_goals ?? '')
  const [favoriteTags, setFavoriteTags] = useState<string[]>(authUser?.favorite_tags ?? [])
  const [healthFeatures, setHealthFeatures] = useState<string[]>(authUser?.health_features ?? [])
  const [emailNotifications, setEmailNotifications] = useState(
    authUser?.email_notifications ?? true,
  )
  const [profileVisibility, setProfileVisibility] = useState(
    authUser?.profile_visibility ?? false,
  )
  const [saveMessage, setSaveMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    setName(authUser?.name ?? '')
    setAvatarUrl(authUser?.avatar_url ?? '')
    setHealthGoals(authUser?.health_goals ?? '')
    setFavoriteTags(authUser?.favorite_tags ?? [])
    setHealthFeatures(authUser?.health_features ?? [])
    setEmailNotifications(authUser?.email_notifications ?? true)
    setProfileVisibility(authUser?.profile_visibility ?? false)
  }, [authUser])

  useEffect(() => {
    if (authStatus !== 'auth') return
    Promise.all([fetchFavoriteMealPlans(), fetchFavoriteRecipes(), fetchModerationStatuses()])
      .then(([plans, recipes, statuses]) => {
        setFavoriteMealPlans(plans)
        setFavoriteRecipes(recipes)
        setModerationStatuses(statuses)
      })
      .catch(() => {
        setErrorMessage('Не удалось загрузить избранное и статусы модерации.')
      })
  }, [authStatus])

  if (authStatus !== 'auth') {
    return <Navigate to="/auth" replace />
  }

  return (
    <Stack gap="md">
      <Card withBorder radius="md" p="lg" style={{ background: 'var(--bg-surface)' }}>
        <Group align="center" gap="md">
          <Avatar size={78} radius="xl" color="grape" src={avatarUrl || undefined}>
            {avatarUrl ? undefined : (name?.slice(0, 2).toUpperCase() || 'U')}
          </Avatar>
          <Stack gap={4}>
            <Title order={1}>{name || 'Пользователь'}</Title>
            <Text>Email: {authUser?.email ?? 'unknown@example.com'}</Text>
            <Text>Цель: {healthGoals || 'Не указана'}</Text>
          </Stack>
        </Group>
        {avatarUrl ? (
          <Text mt={8} size="sm" c="dimmed">
            Фото профиля добавлено
          </Text>
        ) : (
          <Text mt={8} size="sm" c="dimmed">
            Zero-state: фото не задано, добавьте URL ниже
          </Text>
        )}
      </Card>

      <Card withBorder radius="md" p="lg" style={{ background: 'var(--bg-surface)' }}>
        <Stack gap="sm">
          <Title order={3}>Профиль и особенности здоровья</Title>
          <TextInput label="Имя" value={name} onChange={(event) => setName(event.currentTarget.value)} />
          <TextInput
            label="URL фото профиля"
            value={avatarUrl}
            placeholder="https://..."
            onChange={(event) => setAvatarUrl(event.currentTarget.value)}
          />
          <Textarea
            label="Цели по здоровью"
            value={healthGoals}
            onChange={(event) => setHealthGoals(event.currentTarget.value)}
            minRows={2}
          />
          <MultiSelect
            label="Особенности здоровья"
            data={[
              'Непереносимость лактозы',
              'Чувствительность к глютену',
              'Снижение соли',
              'Повышенный белок',
              'Низкоуглеводный режим',
            ]}
            value={healthFeatures}
            onChange={setHealthFeatures}
            placeholder="Выберите особенности"
          />
          {!healthFeatures.length ? (
            <Text size="sm" c="dimmed">
              Zero-state: особенности не выбраны.
            </Text>
          ) : null}
        </Stack>
      </Card>

      <Card withBorder radius="md" p="lg" style={{ background: 'var(--bg-surface)' }}>
        <Stack gap="sm">
          <Title order={3}>Любимые теги</Title>
          <MultiSelect
            data={availableTags}
            value={favoriteTags}
            onChange={setFavoriteTags}
            placeholder="Выберите теги"
          />
          {!favoriteTags.length ? (
            <Text size="sm" c="dimmed">
              Zero-state: любимые теги не выбраны.
            </Text>
          ) : null}
        </Stack>
      </Card>

      <Card withBorder radius="md" p="lg" style={{ background: 'var(--bg-surface)' }}>
        <Stack gap="sm">
          <Title order={3}>Избранное</Title>
          <Tabs
            value={favoriteTab}
            onChange={(value) => setFavoriteTab((value ?? 'mealPlans') as 'mealPlans' | 'recipes')}
          >
            <Tabs.List>
              <Tabs.Tab value="mealPlans">Планы питания</Tabs.Tab>
              <Tabs.Tab value="recipes">Рецепты</Tabs.Tab>
            </Tabs.List>

            <Tabs.Panel value="mealPlans" pt="sm">
              <SimpleGrid cols={{ base: 1, md: 2 }} spacing="sm">
                {favoriteMealPlans.map((plan) => (
                  <Card key={plan.id} withBorder radius="md" p="sm">
                    <Stack gap={6}>
                      <Title order={5}>{plan.title}</Title>
                      <Text size="sm">{plan.planType}</Text>
                      <Group gap="xs">
                        <Badge variant="light" color="grape">
                          {plan.calories} ккал
                        </Badge>
                        <Badge variant="light" color="grape">
                          ★ {plan.rating}
                        </Badge>
                      </Group>
                    </Stack>
                  </Card>
                ))}
              </SimpleGrid>
              {!favoriteMealPlans.length ? (
                <Text size="sm" c="dimmed">
                  Zero-state: в избранном нет планов питания.
                </Text>
              ) : null}
            </Tabs.Panel>

            <Tabs.Panel value="recipes" pt="sm">
              <SimpleGrid cols={{ base: 1, md: 2 }} spacing="sm">
                {favoriteRecipes.map((recipe) => (
                  <Card key={recipe.id} withBorder radius="md" p="sm">
                    <Stack gap={6}>
                      <Title order={5}>{recipe.title}</Title>
                      <Text size="sm">{recipe.subtitle}</Text>
                      <Group gap="xs">
                        <Badge variant="light" color="grape">
                          {recipe.cookingTime}
                        </Badge>
                        <Badge variant="light" color="grape">
                          ★ {recipe.rating}
                        </Badge>
                      </Group>
                    </Stack>
                  </Card>
                ))}
              </SimpleGrid>
              {!favoriteRecipes.length ? (
                <Text size="sm" c="dimmed">
                  Zero-state: в избранном нет рецептов.
                </Text>
              ) : null}
            </Tabs.Panel>
          </Tabs>
        </Stack>
      </Card>

      <Card withBorder radius="md" p="lg" style={{ background: 'var(--bg-surface)' }}>
        <Stack gap="sm">
          <Title order={3}>Статусы модерации</Title>
          {moderationStatuses.map((statusItem) => (
            <Card key={statusItem.id} withBorder radius="md" p="sm">
              <Stack gap={6}>
                <Text size="sm">
                <strong>{statusItem.type}:</strong> {statusItem.title}
                </Text>
                <Group gap="xs">
                  <Badge
                    color={
                      statusItem.status === 'Одобрено'
                        ? 'green'
                        : statusItem.status === 'На ревью'
                          ? 'yellow'
                          : 'red'
                    }
                    variant="light"
                  >
                    {statusItem.status}
                  </Badge>
                  <Badge color="gray" variant="light">
                    Обновлено: {statusItem.updatedAt}
                  </Badge>
                </Group>
              </Stack>
            </Card>
          ))}
          {!moderationStatuses.length ? (
            <Text size="sm" c="dimmed">
              Zero-state: пока нет событий модерации.
            </Text>
          ) : null}
        </Stack>
      </Card>

      <Card withBorder radius="md" p="lg" style={{ background: 'var(--bg-surface)' }}>
        <Stack gap="sm">
          <Title order={3}>Базовые настройки аккаунта</Title>
          <Switch
            checked={emailNotifications}
            onChange={() => setEmailNotifications((value) => !value)}
            label="Email-уведомления о модерации"
            color="grape"
          />
          <Switch
            checked={profileVisibility}
            onChange={() => setProfileVisibility((value) => !value)}
            label="Публичность профиля"
            color="grape"
          />
          <Button
            color="grape"
            loading={profileUpdatePending}
            onClick={async () => {
              setErrorMessage('')
              setSaveMessage('')
              try {
                await updateProfile({
                  name,
                  avatar_url: avatarUrl,
                  health_goals: healthGoals,
                  health_features: healthFeatures,
                  favorite_tags: favoriteTags,
                  email_notifications: emailNotifications,
                  profile_visibility: profileVisibility,
                })
                setSaveMessage('Профиль обновлен.')
              } catch {
                setErrorMessage('Не удалось сохранить профиль.')
              }
            }}
          >
            Сохранить профиль
          </Button>
          {saveMessage ? <Alert color="green">{saveMessage}</Alert> : null}
          {errorMessage ? <Alert color="red">{errorMessage}</Alert> : null}
        </Stack>
      </Card>
    </Stack>
  )
}
