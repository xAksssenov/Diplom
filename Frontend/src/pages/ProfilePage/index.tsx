import {
  Accordion,
  Alert,
  Avatar,
  Badge,
  Button,
  Card,
  Group,
  MultiSelect,
  ScrollArea,
  SimpleGrid,
  Stack,
  Select,
  Switch,
  Tabs,
  TextInput,
  Text,
  Textarea,
  Title,
} from '@mantine/core'
import { useUnit } from 'effector-react'
import { useEffect, useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { getModerationStatuses as getLocalModerationStatuses } from '../../lib/moderationStorage'
import {
  $authStatus,
  $authUser,
  updateProfileFx,
} from '../../features/auth/model'
import {
  fetchFavoriteMealPlans,
  fetchFavoriteRecipes,
  fetchModerationQueue,
  fetchMyShoppingLists,
  fetchMyMealPlans,
  fetchMyRecipes,
  fetchModerationStatuses,
  moderateMealPlan,
  moderateRecipe,
  type ModerationQueueItem,
  type UserShoppingList,
} from '../../shared/api/foodApi'
import { pushApiError, pushSuccess } from '../../shared/model/notifications'
import { PageEmpty } from '../../shared/ui/PageStates'
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
  const navigate = useNavigate()
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
  const [ownTab, setOwnTab] = useState<'mealPlans' | 'recipes'>('mealPlans')
  const [favoriteMealPlans, setFavoriteMealPlans] = useState<MealPlan[]>([])
  const [favoriteRecipes, setFavoriteRecipes] = useState<Recipe[]>([])
  const [myMealPlans, setMyMealPlans] = useState<MealPlan[]>([])
  const [myRecipes, setMyRecipes] = useState<Recipe[]>([])
  const [shoppingLists, setShoppingLists] = useState<UserShoppingList[]>([])
  const [moderationStatuses, setModerationStatuses] = useState<ModerationStatusItem[]>([])
  const [moderationRecipes, setModerationRecipes] = useState<ModerationQueueItem[]>([])
  const [moderationMealPlans, setModerationMealPlans] = useState<ModerationQueueItem[]>([])
  const [moderationActionKey, setModerationActionKey] = useState<string | null>(null)
  const [name, setName] = useState(authUser?.name ?? '')
  const [avatarUrl, setAvatarUrl] = useState(authUser?.avatar_url ?? '')
  const [healthGoals, setHealthGoals] = useState(authUser?.health_goals ?? '')
  const [favoriteTags, setFavoriteTags] = useState<string[]>(authUser?.favorite_tags ?? [])
  const [preferredDiet, setPreferredDiet] = useState(authUser?.preferred_diet ?? '')
  const [healthFeatures, setHealthFeatures] = useState<string[]>(authUser?.health_features ?? [])
  const [emailNotifications, setEmailNotifications] = useState(
    authUser?.email_notifications ?? true,
  )
  const [profileVisibility, setProfileVisibility] = useState(
    authUser?.profile_visibility ?? false,
  )
  const [saveMessage, setSaveMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const roleName = authUser?.role?.name ?? 'user'
  const isStaffRole = roleName === 'moderator' || roleName === 'admin'
  const roleLabel = roleName === 'moderator' ? 'Модератор' : roleName === 'admin' ? 'Администратор' : ''

  useEffect(() => {
    setName(authUser?.name ?? '')
    setAvatarUrl(authUser?.avatar_url ?? '')
    setHealthGoals(authUser?.health_goals ?? '')
    setFavoriteTags(authUser?.favorite_tags ?? [])
    setPreferredDiet(authUser?.preferred_diet ?? '')
    setHealthFeatures(authUser?.health_features ?? [])
    setEmailNotifications(authUser?.email_notifications ?? true)
    setProfileVisibility(authUser?.profile_visibility ?? false)
  }, [authUser])

  useEffect(() => {
    if (authStatus !== 'auth' || !authUser?.id) return
    if (isStaffRole) {
      Promise.all([fetchModerationQueue()])
        .then(([queue]) => {
          setShoppingLists([])
          setModerationRecipes(queue.recipes)
          setModerationMealPlans(queue.mealPlans)
          setFavoriteMealPlans([])
          setFavoriteRecipes([])
          setMyMealPlans([])
          setMyRecipes([])
          setModerationStatuses([])
        })
        .catch((error) => {
          setErrorMessage('Не удалось загрузить профиль модератора.')
          pushApiError(error, 'Ошибка загрузки панели модератора.')
        })
      return
    }

    Promise.all([
      fetchFavoriteMealPlans(),
      fetchFavoriteRecipes(),
      fetchMyMealPlans(authUser.id),
      fetchMyRecipes(authUser.id),
      fetchMyShoppingLists(),
      fetchModerationStatuses(),
    ])
      .then(([plans, recipes, ownPlans, ownRecipes, userShoppingLists, statuses]) => {
        setFavoriteMealPlans(plans)
        setFavoriteRecipes(recipes)
        setMyMealPlans(ownPlans)
        setMyRecipes(ownRecipes)
        setShoppingLists(userShoppingLists)
        setModerationRecipes([])
        setModerationMealPlans([])

        const fromPlans: ModerationStatusItem[] = ownPlans
          .filter((plan) => plan.status !== 'draft')
          .map((plan) => ({
            id: `plan-${plan.id}`,
            type: 'План питания',
            title: plan.title,
            status:
              plan.status === 'approved'
                ? 'Одобрено'
                : plan.status === 'rejected'
                  ? 'Отклонено (нужны правки)'
                  : 'На ревью',
            updatedAt: new Date().toLocaleDateString('ru-RU'),
          }))

        const localStatuses = getLocalModerationStatuses()
        const merged = [...statuses, ...fromPlans, ...localStatuses]
        const unique = merged.filter(
          (item, index, array) => array.findIndex((candidate) => candidate.id === item.id) === index,
        )
        setModerationStatuses(unique)
      })
      .catch((error) => {
        setErrorMessage('Не удалось загрузить избранное и статусы модерации.')
        pushApiError(error, 'Ошибка загрузки профиля.')
      })
  }, [authStatus, authUser?.id, isStaffRole])

  const handleModerationDecision = async (
    item: ModerationQueueItem,
    decision: 'approved' | 'rejected',
  ) => {
    const actionKey = `${item.type}-${item.id}-${decision}`
    setModerationActionKey(actionKey)
    try {
      if (item.type === 'recipe') {
        await moderateRecipe(item.id, decision)
        setModerationRecipes((prev) => prev.filter((candidate) => candidate.id !== item.id))
      } else {
        await moderateMealPlan(item.id, decision)
        setModerationMealPlans((prev) => prev.filter((candidate) => candidate.id !== item.id))
      }
      pushSuccess(decision === 'approved' ? 'Заявка одобрена.' : 'Заявка отклонена.')
    } catch (error) {
      pushApiError(error, 'Не удалось изменить статус заявки.')
    } finally {
      setModerationActionKey(null)
    }
  }

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
            {roleLabel ? <Text>Роль: {roleLabel}</Text> : null}
            <Text>Цель: {healthGoals || 'Не указана'}</Text>
          </Stack>
        </Group>
        {avatarUrl ? (
          <Text mt={8} size="sm" c="dimmed">
            Фото профиля добавлено
          </Text>
        ) : (
          <Text mt={8} size="sm" c="dimmed">
            Фото профиля пока не задано. Добавьте URL ниже.
          </Text>
        )}
      </Card>

      {isStaffRole ? (
        <Card withBorder radius="md" p="lg" style={{ background: 'var(--bg-surface)' }}>
          <Stack gap="sm">
            <Title order={3}>Панель модератора</Title>
            <Text c="dimmed" size="sm">
              Заявки открываются по нажатию, внутри можно перейти на материал и принять решение.
            </Text>
            <Accordion variant="separated" radius="md">
              <Accordion.Item value="recipes">
                <Accordion.Control>
                  Рецепты на ревью ({moderationRecipes.length})
                </Accordion.Control>
                <Accordion.Panel>
                  <SimpleGrid cols={{ base: 1, md: 2, lg: 3 }} spacing="xs">
                    {moderationRecipes.map((item) => (
                      <Card
                        key={`recipe-${item.id}`}
                        withBorder
                        radius="md"
                        p="xs"
                        onClick={() => navigate(`/recipes/${item.id}`)}
                        style={{
                          cursor: 'pointer',
                          transition: 'transform 0.14s ease, box-shadow 0.14s ease',
                        }}
                      >
                        <Stack gap={6}>
                          <Group gap="xs" justify="space-between">
                            <Badge color="grape" variant="light" size="sm">
                              Рецепт
                            </Badge>
                            <Text size="xs" c="dimmed">
                              {item.submittedAt}
                            </Text>
                          </Group>
                          <Title order={6}>{item.title}</Title>
                          <Text size="xs" c="dimmed">
                            Автор: {item.author}
                          </Text>
                          <Group grow>
                            <Button
                              size="xs"
                              color="green"
                              variant="light"
                              loading={moderationActionKey === `recipe-${item.id}-approved`}
                              onClick={(event) => {
                                event.stopPropagation()
                                void handleModerationDecision(item, 'approved')
                              }}
                            >
                              Одобрить
                            </Button>
                            <Button
                              size="xs"
                              color="red"
                              variant="light"
                              loading={moderationActionKey === `recipe-${item.id}-rejected`}
                              onClick={(event) => {
                                event.stopPropagation()
                                void handleModerationDecision(item, 'rejected')
                              }}
                            >
                              Отклонить
                            </Button>
                          </Group>
                        </Stack>
                      </Card>
                    ))}
                  </SimpleGrid>
                  {!moderationRecipes.length ? (
                    <PageEmpty
                      title="Нет рецептов на модерации"
                      description="Новые рецепты появятся здесь, как только пользователи отправят их на ревью."
                    />
                  ) : null}
                </Accordion.Panel>
              </Accordion.Item>

              <Accordion.Item value="plans">
                <Accordion.Control>
                  Планы питания на ревью ({moderationMealPlans.length})
                </Accordion.Control>
                <Accordion.Panel>
                  <SimpleGrid cols={{ base: 1, md: 2, lg: 3 }} spacing="xs">
                    {moderationMealPlans.map((item) => (
                      <Card
                        key={`meal-plan-${item.id}`}
                        withBorder
                        radius="md"
                        p="xs"
                        onClick={() => navigate(`/meal-plans/${item.id}`)}
                        style={{
                          cursor: 'pointer',
                          transition: 'transform 0.14s ease, box-shadow 0.14s ease',
                        }}
                      >
                        <Stack gap={6}>
                          <Group gap="xs" justify="space-between">
                            <Badge color="blue" variant="light" size="sm">
                              План питания
                            </Badge>
                            <Text size="xs" c="dimmed">
                              {item.submittedAt}
                            </Text>
                          </Group>
                          <Title order={6}>{item.title}</Title>
                          <Text size="xs" c="dimmed">
                            Автор: {item.author}
                          </Text>
                          <Group grow>
                            <Button
                              size="xs"
                              color="green"
                              variant="light"
                              loading={moderationActionKey === `meal_plan-${item.id}-approved`}
                              onClick={(event) => {
                                event.stopPropagation()
                                void handleModerationDecision(item, 'approved')
                              }}
                            >
                              Одобрить
                            </Button>
                            <Button
                              size="xs"
                              color="red"
                              variant="light"
                              loading={moderationActionKey === `meal_plan-${item.id}-rejected`}
                              onClick={(event) => {
                                event.stopPropagation()
                                void handleModerationDecision(item, 'rejected')
                              }}
                            >
                              Отклонить
                            </Button>
                          </Group>
                        </Stack>
                      </Card>
                    ))}
                  </SimpleGrid>
                  {!moderationMealPlans.length ? (
                    <PageEmpty
                      title="Нет планов питания на модерации"
                      description="Новые планы появятся здесь, как только пользователи отправят их на ревью."
                    />
                  ) : null}
                </Accordion.Panel>
              </Accordion.Item>
            </Accordion>
          </Stack>
        </Card>
      ) : null}

      {!isStaffRole ? (
      <Card withBorder radius="md" p="lg" style={{ background: 'var(--bg-surface)' }}>
        <Stack gap="sm">
          <Title order={3}>Сохраненные списки покупок</Title>
          <ScrollArea type="auto" offsetScrollbars>
            <Group gap="sm" wrap="nowrap" align="stretch">
              {shoppingLists.map((list) => (
                <Card
                  key={list.id}
                  withBorder
                  radius="md"
                  p="sm"
                  style={{ minWidth: 400, maxWidth: 400, display: 'flex' }}
                >
                  <Stack gap={6} style={{ flex: 1 }}>
                  <Text size="sm">
                    <strong>{list.title}</strong>
                  </Text>
                  <Text size="xs" c="dimmed">
                    Источник: {list.targetType === 'recipe' ? 'Рецепт' : 'План питания'} #{list.targetId}
                  </Text>
                  <Text size="xs" c="dimmed">
                    Обновлено: {list.updatedAt}
                  </Text>
                  {list.items.length ? (
                    <Stack gap={4}>
                      {list.items.map((item) => (
                        <Text key={item.id} size="sm">
                          - {item.ingredientName} ({item.quantity} {item.unit})
                        </Text>
                      ))}
                    </Stack>
                  ) : (
                    <Text size="sm" c="dimmed">
                      Все ингредиенты отмечены как доступные.
                    </Text>
                  )}
                  {list.targetId ? (
                    <Button
                      size="xs"
                      variant="light"
                      color="grape"
                      component={Link}
                      mt="auto"
                      to={
                        list.targetType === 'recipe'
                          ? `/recipes/${list.targetId}`
                          : `/meal-plans/${list.targetId}`
                      }
                    >
                      Перейти к {list.targetType === 'recipe' ? 'рецепту' : 'плану'}
                    </Button>
                  ) : null}
                </Stack>
              </Card>
              ))}
            </Group>
          </ScrollArea>
          {!shoppingLists.length ? (
            <PageEmpty
              title="Списков покупок пока нет"
              description="Отметьте ингредиенты на странице рецепта или плана, и список появится здесь."
            />
          ) : null}
        </Stack>
      </Card>
      ) : null}

      {!isStaffRole ? (
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
          <Select
            label="Предпочитаемая диета"
            placeholder="Можно не выбирать"
            value={preferredDiet || null}
            clearable
            onChange={(value) => setPreferredDiet(value ?? '')}
            data={[
              'Сбалансированное',
              'Высокобелковое',
              'Без глютена',
              'Без лактозы',
              'Вегетарианское',
            ]}
          />
          {!healthFeatures.length ? (
            <Text size="sm" c="dimmed">
              Особенности здоровья пока не выбраны.
            </Text>
          ) : null}
        </Stack>
      </Card>
      ) : null}

      {!isStaffRole ? (
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
              Любимые теги пока не выбраны.
            </Text>
          ) : null}
        </Stack>
      </Card>
      ) : null}

      {!isStaffRole ? (
      <Card withBorder radius="md" p="lg" style={{ background: 'var(--bg-surface)' }}>
        <Stack gap="sm">
          <Title order={3}>Ваши материалы</Title>
          <Tabs value={ownTab} onChange={(value) => setOwnTab((value ?? 'mealPlans') as 'mealPlans' | 'recipes')}>
            <Tabs.List>
              <Tabs.Tab value="mealPlans">Ваши планы питания</Tabs.Tab>
              <Tabs.Tab value="recipes">Ваши рецепты</Tabs.Tab>
            </Tabs.List>
            <Tabs.Panel value="mealPlans" pt="sm">
              <SimpleGrid cols={{ base: 1, md: 2 }} spacing="sm">
                {myMealPlans.map((plan) => (
                  <Card
                    key={plan.id}
                    withBorder
                    radius="md"
                    p="sm"
                    component={Link}
                    to={`/meal-plans/${plan.id}`}
                    style={{ background: 'var(--bg-surface)', cursor: 'pointer' }}
                  >
                    <Stack gap={6}>
                      <Title order={5}>{plan.title}</Title>
                      <Text size="sm">Автор: {plan.author}</Text>
                      <Text size="sm">{plan.planType}</Text>
                    </Stack>
                  </Card>
                ))}
              </SimpleGrid>
              {!myMealPlans.length ? (
                <PageEmpty
                  title="У вас пока нет созданных планов"
                  description="Создайте первый план в конструкторе, и он появится в этом разделе."
                />
              ) : null}
            </Tabs.Panel>
            <Tabs.Panel value="recipes" pt="sm">
              <SimpleGrid cols={{ base: 1, md: 2 }} spacing="sm">
                {myRecipes.map((recipe) => (
                  <Card
                    key={recipe.id}
                    withBorder
                    radius="md"
                    p="sm"
                    component={Link}
                    to={`/recipes/${recipe.id}`}
                    style={{ background: 'var(--bg-surface)', cursor: 'pointer' }}
                  >
                    <Stack gap={6}>
                      <Title order={5}>{recipe.title}</Title>
                      <Text size="sm">Автор: {recipe.author}</Text>
                      <Text size="sm">{recipe.subtitle}</Text>
                    </Stack>
                  </Card>
                ))}
              </SimpleGrid>
              {!myRecipes.length ? (
                <PageEmpty
                  title="У вас пока нет созданных рецептов"
                  description="После создания рецептов они будут отображаться в этом разделе."
                />
              ) : null}
            </Tabs.Panel>
          </Tabs>
        </Stack>
      </Card>
      ) : null}

      {!isStaffRole ? (
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
                  <Card
                    key={plan.id}
                    withBorder
                    radius="md"
                    p="sm"
                    component={Link}
                    to={`/meal-plans/${plan.id}`}
                    style={{ background: 'var(--bg-surface)', cursor: 'pointer' }}
                  >
                    <Stack gap={6}>
                      <Title order={5}>{plan.title}</Title>
                      <Text size="sm">Автор: {plan.author}</Text>
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
                <PageEmpty
                  title="В избранном пока нет планов"
                  description="Добавляйте понравившиеся планы в избранное с детальной страницы."
                />
              ) : null}
            </Tabs.Panel>

            <Tabs.Panel value="recipes" pt="sm">
              <SimpleGrid cols={{ base: 1, md: 2 }} spacing="sm">
                {favoriteRecipes.map((recipe) => (
                  <Card
                    key={recipe.id}
                    withBorder
                    radius="md"
                    p="sm"
                    component={Link}
                    to={`/recipes/${recipe.id}`}
                    style={{ background: 'var(--bg-surface)', cursor: 'pointer' }}
                  >
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
                <PageEmpty
                  title="В избранном пока нет рецептов"
                  description="Добавляйте рецепты в избранное, чтобы быстро к ним возвращаться."
                />
              ) : null}
            </Tabs.Panel>
          </Tabs>
        </Stack>
      </Card>
      ) : null}

      {!isStaffRole ? (
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
            <PageEmpty
              title="Пока нет событий модерации"
              description="После отправки рецептов и планов статусы модерации появятся здесь."
            />
          ) : null}
        </Stack>
      </Card>
      ) : null}

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
                  preferred_diet: preferredDiet,
                  health_features: healthFeatures,
                  favorite_tags: favoriteTags,
                  email_notifications: emailNotifications,
                  profile_visibility: profileVisibility,
                })
                setSaveMessage('Профиль обновлен.')
              } catch (error) {
                setErrorMessage('Не удалось сохранить профиль.')
                pushApiError(error, 'Ошибка сохранения профиля.')
                return
              }
              pushSuccess('Профиль обновлен.')
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
