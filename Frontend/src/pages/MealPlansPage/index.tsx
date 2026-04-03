import { Badge, Button, Card, Grid, Group, Paper, SimpleGrid, Stack, Text, Title } from '@mantine/core'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { FilterGroup } from '../../components/FilterGroup'
import { fetchMealPlans } from '../../shared/api/foodApi'
import { PageEmpty, PageError, PageLoader } from '../../shared/ui/PageStates'
import type { MealPlan } from '../../types/domain'

export function MealPlansPage() {
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [mealPlans, setMealPlans] = useState<MealPlan[]>([])

  useEffect(() => {
    if (status !== 'loading') {
      return
    }

    const timeoutId = window.setTimeout(() => {
      fetchMealPlans()
        .then((data) => {
          setMealPlans(data)
          setStatus('ready')
        })
        .catch(() => setStatus('error'))
    }, 550)

    return () => window.clearTimeout(timeoutId)
  }, [status])

  if (status === 'loading') {
    return <PageLoader title="Загружаем планы питания..." />
  }

  if (status === 'error') {
    return (
      <PageError
        message="Не удалось получить планы питания."
        onRetry={() => setStatus('loading')}
      />
    )
  }

  if (!mealPlans.length) {
    return (
      <PageEmpty
        title="Планов пока нет"
        description="Сформируйте первый план или вернитесь позже."
      />
    )
  }

  return (
    <Grid gap="md" align="start">
      <Grid.Col span={{ base: 12, md: 4, lg: 3 }}>
        <Paper withBorder radius="md" p="md" style={{ background: 'var(--bg-surface)' }}>
        <Title order={3}>Фильтры планов</Title>
        <FilterGroup title="Тип плана" values={['На день', 'На неделю', 'На месяц']} />
        <FilterGroup title="Цель" values={['Похудение', 'Поддержание веса', 'Набор массы']} />
        <FilterGroup
          title="Диетические предпочтения"
          values={['Веганское', 'Без глютена', 'Без лактозы']}
        />
        <FilterGroup title="Калорийность" values={['1200-1600', '1600-2200', '2200+']} />
        </Paper>
      </Grid.Col>

      <Grid.Col span={{ base: 12, md: 8, lg: 9 }}>
      <Stack gap="md">
        <Card withBorder radius="md" padding="lg" style={{ background: 'var(--bg-surface)' }}>
          <Stack gap="xs">
            <Title order={1}>Планы питания</Title>
            <Text>Подбор планов с детальной разбивкой по дням и приемам пищи.</Text>
          </Stack>
        </Card>

        <SimpleGrid cols={{ base: 1, sm: 2, xl: 3 }} spacing="md">
          {mealPlans.map((plan) => (
            <Card
              withBorder
              radius="md"
              padding="lg"
              key={plan.id}
              style={{ background: 'var(--bg-surface)' }}
            >
              <Stack gap="xs">
                <Title order={3}>{plan.title}</Title>
                <Text>{plan.description}</Text>
                <Group gap="xs">
                  <Badge variant="light" color="grape">
                    {plan.planType}
                  </Badge>
                  <Badge variant="light" color="grape">
                    {plan.goal}
                  </Badge>
                  <Badge variant="light" color="grape">
                    {plan.calories} ккал
                  </Badge>
                </Group>
                <Group gap="xs">
                  <Badge variant="dot" color="violet">
                    ★ {plan.rating}
                  </Badge>
                  <Badge variant="dot" color="violet">
                    {plan.reviewsCount} оценок
                  </Badge>
                  <Badge variant="dot" color="violet">
                    {plan.diet}
                  </Badge>
                </Group>
                <Button component={Link} to={`/meal-plans/${plan.id}`} color="grape">
                  Открыть план
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
