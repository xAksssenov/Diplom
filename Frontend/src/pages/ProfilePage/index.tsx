import {
  Avatar,
  Badge,
  Card,
  Group,
  SimpleGrid,
  Stack,
  Switch,
  Tabs,
  Text,
  Title,
} from '@mantine/core'
import { useUnit } from 'effector-react'
import {
  $emailNotifications,
  $favoriteMealPlans,
  $favoriteRecipes,
  $favoriteTab,
  $favoriteTags,
  $moderationStatuses,
  $profileVisibility,
  emailNotificationsToggled,
  favoriteTabChanged,
  favoriteTagToggled,
  profileVisibilityToggled,
} from '../../features/profile/model'

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
    favoriteTab,
    favoriteTags,
    emailNotifications,
    profileVisibility,
    favoriteMealPlans,
    favoriteRecipes,
    moderationStatuses,
    setFavoriteTab,
    toggleTag,
    toggleEmailNotifications,
    toggleProfileVisibility,
  } = useUnit({
    favoriteTab: $favoriteTab,
    favoriteTags: $favoriteTags,
    emailNotifications: $emailNotifications,
    profileVisibility: $profileVisibility,
    favoriteMealPlans: $favoriteMealPlans,
    favoriteRecipes: $favoriteRecipes,
    moderationStatuses: $moderationStatuses,
    setFavoriteTab: favoriteTabChanged,
    toggleTag: favoriteTagToggled,
    toggleEmailNotifications: emailNotificationsToggled,
    toggleProfileVisibility: profileVisibilityToggled,
  })

  return (
    <Stack gap="md">
      <Card withBorder radius="md" p="lg" style={{ background: 'var(--bg-surface)' }}>
        <Group align="center" gap="md">
          <Avatar size={78} radius="xl" color="grape">
            AK
          </Avatar>
          <Stack gap={4}>
            <Title order={1}>Алексей К.</Title>
            <Text>Email: ak@example.com</Text>
            <Text>Цель: Поддержание веса</Text>
            <Text>Рост/вес: 181 см / 78 кг</Text>
          </Stack>
        </Group>
      </Card>

      <Card withBorder radius="md" p="lg" style={{ background: 'var(--bg-surface)' }}>
        <Stack gap="sm">
          <Title order={3}>Особенности здоровья</Title>
          <Group gap="xs">
            <Badge variant="light" color="grape">
              Непереносимость лактозы
            </Badge>
            <Badge variant="light" color="grape">
              Чувствительность к глютену
            </Badge>
            <Badge variant="light" color="grape">
              Норма соли под контролем
            </Badge>
          </Group>
        </Stack>
      </Card>

      <Card withBorder radius="md" p="lg" style={{ background: 'var(--bg-surface)' }}>
        <Stack gap="sm">
          <Title order={3}>Любимые теги</Title>
          <Text>Быстрый выбор персональных предпочтений:</Text>
          <Group gap="xs">
          {availableTags.map((tag) => {
            const active = favoriteTags.includes(tag)
            return (
              <Badge
                key={tag}
                variant={active ? 'filled' : 'light'}
                color="grape"
                style={{ cursor: 'pointer' }}
                onClick={() => toggleTag(tag)}
              >
                {tag}
              </Badge>
            )
          })}
          </Group>
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
        </Stack>
      </Card>

      <Card withBorder radius="md" p="lg" style={{ background: 'var(--bg-surface)' }}>
        <Stack gap="sm">
          <Title order={3}>Базовые настройки аккаунта</Title>
          <Switch
            checked={emailNotifications}
            onChange={() => toggleEmailNotifications()}
            label="Email-уведомления о модерации"
            color="grape"
          />
          <Switch
            checked={profileVisibility}
            onChange={() => toggleProfileVisibility()}
            label="Публичность профиля"
            color="grape"
          />
        </Stack>
      </Card>
    </Stack>
  )
}
