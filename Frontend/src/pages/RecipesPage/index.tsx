import { Badge, Box, Button, Card, Grid, Group, Paper, SimpleGrid, Stack, Text, Title } from '@mantine/core'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { FilterGroup } from '../../components/FilterGroup'
import { fetchRecipes } from '../../shared/api/foodApi'
import { PageEmpty, PageError, PageLoader } from '../../shared/ui/PageStates'
import type { Recipe } from '../../types/domain'

export function RecipesPage() {
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [recipes, setRecipes] = useState<Recipe[]>([])

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
        .catch(() => setStatus('error'))
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
        <Title order={3}>Фильтры рецептов</Title>
        <FilterGroup title="Тип блюда" values={['Завтрак', 'Обед', 'Ужин', 'Перекус']} />
        <FilterGroup
          title="Диета"
          values={['Веганское', 'Вегетарианское', 'Без глютена', 'Без лактозы']}
        />
        <FilterGroup title="Время приготовления" values={['до 15 мин', '15-30 мин', '30-60 мин']} />
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
          {recipes.map((recipe) => (
            <Card
              withBorder
              radius="md"
              padding="lg"
              key={recipe.id}
              style={{ background: 'var(--bg-surface)' }}
            >
              <Box
                h={170}
                mb={12}
                style={{ borderRadius: 12, background: recipe.images[0] }}
              />
              <Stack gap="xs">
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
                    <Badge key={tag} variant="dot" color="violet">
                    {tag}
                    </Badge>
                ))}
                </Group>
                <Button component={Link} to={`/recipes/${recipe.id}`} color="grape">
                  Открыть рецепт
                </Button>
              </Stack>
            </Card>
          ))}
        </SimpleGrid>
      </Stack>
      </Grid.Col>
    </Grid>
  )
}
