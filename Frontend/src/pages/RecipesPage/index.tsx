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
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchRecipes } from '../../shared/api/foodApi'
import { pushApiError } from '../../shared/model/notifications'
import { PageEmpty, PageError, PageLoader } from '../../shared/ui/PageStates'
import type { Recipe } from '../../types/domain'

export function RecipesPage() {
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [selectedCaloriesRange, setSelectedCaloriesRange] = useState<[number, number]>([100, 1200])
  const [selectedTimeRange, setSelectedTimeRange] = useState<[number, number]>([5, 120])
  const [minRating, setMinRating] = useState<string>('0')

  useEffect(() => {
    if (status !== 'loading') {
      return
    }

    const timeoutId = window.setTimeout(() => {
      fetchRecipes()
        .then((data) => {
          setRecipes(data)
          setStatus('ready')
        })
        .catch((error) => {
          setStatus('error')
          pushApiError(error, 'Не удалось загрузить рецепты.')
        })
    }, 500)

    return () => window.clearTimeout(timeoutId)
  }, [status])

  if (status === 'loading') {
    return <PageLoader title="Загружаем рецепты..." />
  }

  if (status === 'error') {
    return (
      <PageError
        message="Проверьте подключение и попробуйте еще раз."
        onRetry={() => setStatus('loading')}
      />
    )
  }

  const allTags = useMemo(
    () => Array.from(new Set(recipes.flatMap((recipe) => recipe.tags))),
    [recipes],
  )
  const filteredRecipes = useMemo(() => {
    const min = Number(minRating || '0')
    return recipes.filter((recipe) => {
      const recipeTime = Number(recipe.cookingTime.replace(/[^\d]/g, '') || '0')
      const byTags = !selectedTags.length || selectedTags.every((tag) => recipe.tags.includes(tag))
      const byCalories =
        recipe.calories >= selectedCaloriesRange[0] && recipe.calories <= selectedCaloriesRange[1]
      const byTime = recipeTime >= selectedTimeRange[0] && recipeTime <= selectedTimeRange[1]
      const byRating = recipe.rating >= min
      return byTags && byCalories && byTime && byRating
    })
  }, [minRating, recipes, selectedCaloriesRange, selectedTags, selectedTimeRange])

  if (!recipes.length) {
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
                  {allTags.map((tag) => (
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
          </Stack>
        </Card>

        <SimpleGrid cols={{ base: 1, sm: 2, xl: 3 }} spacing="md">
          {filteredRecipes.map((recipe) => (
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
        {!filteredRecipes.length ? (
          <PageEmpty
            title="Нет рецептов по выбранным фильтрам"
            description="Измените диапазоны или снимите часть тегов."
          />
        ) : null}
      </Stack>
      </Grid.Col>
    </Grid>
  )
}
