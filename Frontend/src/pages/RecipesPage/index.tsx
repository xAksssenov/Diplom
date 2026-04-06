import {
  Badge,
  Box,
  Button,
  Card,
  Chip,
  Grid,
  Group,
  Paper,
  RangeSlider,
  Select,
  SimpleGrid,
  Stack,
  Text,
  Title,
} from '@mantine/core'
import { useUnit } from 'effector-react'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { $authUser } from '../../features/auth/model'
import { fetchRecipeTagNames, fetchRecipesPage, type RecipeListFilters } from '../../shared/api/foodApi'
import { pushApiError } from '../../shared/model/notifications'
import { PageEmpty, PageError, PageLoader } from '../../shared/ui/PageStates'
import type { Recipe } from '../../types/domain'

export function RecipesPage() {
  const authUser = useUnit($authUser)
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [reloadToken, setReloadToken] = useState(0)
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [total, setTotal] = useState(0)
  const [nextOffset, setNextOffset] = useState<number | null>(0)
  const [loadingMore, setLoadingMore] = useState(false)
  const [profilePresetApplied, setProfilePresetApplied] = useState(false)
  const [availableTags, setAvailableTags] = useState<string[]>([])
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [selectedCaloriesRange, setSelectedCaloriesRange] = useState<[number, number]>([100, 1200])
  const [selectedTimeRange, setSelectedTimeRange] = useState<[number, number]>([5, 120])
  const [minRating, setMinRating] = useState<string>('0')

  useEffect(() => {
    fetchRecipeTagNames()
      .then((tags) => setAvailableTags(tags))
      .catch((error) => {
        pushApiError(error, 'Не удалось загрузить теги.')
      })
  }, [])

  useEffect(() => {
    if (profilePresetApplied || !availableTags.length) return
    const prefs = [...(authUser?.favorite_tags ?? []), ...(authUser?.health_features ?? [])].map((item) =>
      item.toLowerCase(),
    )
    if (!prefs.length) {
      setProfilePresetApplied(true)
      return
    }
    const presetTags = availableTags.filter((tag) =>
      prefs.some((pref) => tag.toLowerCase().includes(pref) || pref.includes(tag.toLowerCase())),
    )
    setSelectedTags(presetTags)
    setProfilePresetApplied(true)
  }, [authUser?.favorite_tags, authUser?.health_features, availableTags, profilePresetApplied])

  const recipeFilters = useMemo<RecipeListFilters>(
    () => ({
      tags: selectedTags,
      caloriesMin: selectedCaloriesRange[0],
      caloriesMax: selectedCaloriesRange[1],
      timeMin: selectedTimeRange[0],
      timeMax: selectedTimeRange[1],
      minRating: Number(minRating || '0') || 0,
    }),
    [minRating, selectedCaloriesRange, selectedTags, selectedTimeRange],
  )

  useEffect(() => {
    let cancelled = false
    setStatus('loading')
    const timeoutId = window.setTimeout(() => {
      fetchRecipesPage({ limit: 9, offset: 0, filters: recipeFilters })
        .then((data) => {
          if (cancelled) return
          setRecipes(data.items)
          setTotal(data.total)
          setNextOffset(data.nextOffset)
          setStatus('ready')
        })
        .catch((error) => {
          if (cancelled) return
          setStatus('error')
          pushApiError(error, 'Не удалось загрузить рецепты.')
        })
    }, 250)
    return () => {
      cancelled = true
      window.clearTimeout(timeoutId)
    }
  }, [recipeFilters, reloadToken])

  if (status === 'loading') {
    return <PageLoader title="Загружаем рецепты..." />
  }

  if (status === 'error') {
    return (
      <PageError
        message="Проверьте подключение и попробуйте еще раз."
        onRetry={() => setReloadToken((value) => value + 1)}
      />
    )
  }

  const hasActiveFilters =
    selectedTags.length > 0 ||
    selectedCaloriesRange[0] !== 100 ||
    selectedCaloriesRange[1] !== 1200 ||
    selectedTimeRange[0] !== 5 ||
    selectedTimeRange[1] !== 120 ||
    minRating !== '0'

  if (!recipes.length && !hasActiveFilters) {
    return (
      <PageEmpty
        title="Рецептов пока нет"
        description="Скоро здесь появятся подборки по категориям и тегам."
      />
    )
  }

  return (
    <Grid gap="md" align="start">
      <Grid.Col span={{ base: 12, md: 4, lg: 3 }}>
        <Paper withBorder radius="md" p="md" style={{ background: 'var(--bg-surface)' }}>
          <Stack gap="md">
            <Title order={3}>Фильтры рецептов</Title>
            <Stack gap={6}>
              <Text fw={600}>Теги</Text>
              <Chip.Group multiple value={selectedTags} onChange={setSelectedTags}>
                <Group gap="xs">
                  {availableTags.map((tag) => (
                    <Chip key={tag} value={tag} color="grape" variant="light">
                      {tag}
                    </Chip>
                  ))}
                </Group>
              </Chip.Group>
            </Stack>
            <Stack gap={6}>
              <Text fw={600}>Время приготовления</Text>
              <RangeSlider
                min={5}
                max={180}
                step={5}
                value={selectedTimeRange}
                onChange={(value) => setSelectedTimeRange(value as [number, number])}
                label={(value) => `${value} мин`}
                color="grape"
              />
            </Stack>
            <Stack gap={6}>
              <Text fw={600}>Калорийность</Text>
              <RangeSlider
                min={50}
                max={1500}
                step={25}
                value={selectedCaloriesRange}
                onChange={(value) => setSelectedCaloriesRange(value as [number, number])}
                label={(value) => `${value} ккал`}
                color="grape"
              />
            </Stack>
            <Select
              label="Минимальный рейтинг"
              value={minRating}
              onChange={(value) => setMinRating(value ?? '0')}
              data={[
                { value: '0', label: 'Любой' },
                { value: '3', label: 'от 3.0' },
                { value: '3.5', label: 'от 3.5' },
                { value: '4', label: 'от 4.0' },
                { value: '4.5', label: 'от 4.5' },
              ]}
            />
          </Stack>
        </Paper>
      </Grid.Col>

      <Grid.Col span={{ base: 12, md: 8, lg: 9 }}>
      <Stack gap="md">
        <Card withBorder radius="md" padding="lg" style={{ background: 'var(--bg-surface)' }}>
          <Stack gap="xs">
            <Title order={1}>Рецепты</Title>
            <Text>Коллекция рецептов с фото, тегами и базовой пищевой ценностью.</Text>
            <Text size="sm" c="dimmed">
              Найдено по фильтрам: {total}
            </Text>
          </Stack>
        </Card>

        <SimpleGrid cols={{ base: 1, sm: 2, xl: 3 }} spacing="md">
          {recipes.map((recipe) => (
            <Card
              withBorder
              radius="md"
              padding="lg"
              key={recipe.id}
              style={{ background: 'var(--bg-surface)', minHeight: 420, display: 'flex' }}
            >
              <Box
                h={170}
                mb={12}
                style={{ borderRadius: 12, background: recipe.images[0] }}
              />
              <Stack gap="xs" style={{ flex: 1 }}>
                <Title order={3}>{recipe.title}</Title>
                <Text>{recipe.subtitle}</Text>
                <Group gap="xs">
                  <Badge variant="light" color="grape">
                    {recipe.cookingTime}
                  </Badge>
                  <Badge variant="light" color="grape">
                    {recipe.calories} ккал
                  </Badge>
                  <Badge variant="light" color="grape">
                    ★ {recipe.rating}
                  </Badge>
                </Group>
                <Group gap="xs">
                {recipe.tags.map((tag) => (
                    <Badge
                      key={tag}
                      variant={selectedTags.includes(tag) ? 'filled' : 'dot'}
                      color="violet"
                      style={{ cursor: 'pointer' }}
                      onClick={() =>
                        setSelectedTags((prev) =>
                          prev.includes(tag) ? prev.filter((item) => item !== tag) : [...prev, tag],
                        )
                      }
                    >
                    {tag}
                    </Badge>
                ))}
                </Group>
                <Button
                  component={Link}
                  to={`/recipes/${recipe.id}`}
                  color="grape"
                  mt="auto"
                  fullWidth
                >
                  Открыть рецепт
                </Button>
              </Stack>
            </Card>
          ))}
        </SimpleGrid>
        {!recipes.length ? (
          <PageEmpty
            title="Нет рецептов по выбранным фильтрам"
            description="Измените диапазоны или снимите часть тегов."
          />
        ) : null}
        {nextOffset !== null && recipes.length > 0 ? (
          <Button
            variant="light"
            color="grape"
            loading={loadingMore}
            onClick={async () => {
              setLoadingMore(true)
              try {
                const nextPage = await fetchRecipesPage({
                  limit: 9,
                  offset: nextOffset,
                  filters: recipeFilters,
                })
                setRecipes((prev) => [...prev, ...nextPage.items])
                setTotal(nextPage.total)
                setNextOffset(nextPage.nextOffset)
              } catch (error) {
                pushApiError(error, 'Не удалось подгрузить рецепты.')
              } finally {
                setLoadingMore(false)
              }
            }}
          >
            Показать еще
          </Button>
        ) : null}
      </Stack>
      </Grid.Col>
    </Grid>
  )
}
