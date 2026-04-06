import {
  Badge,
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
import { fetchMealPlans } from '../../shared/api/foodApi'
import { pushApiError } from '../../shared/model/notifications'
import { PageEmpty, PageError, PageLoader } from '../../shared/ui/PageStates'
import type { MealPlan } from '../../types/domain'

export function MealPlansPage() {
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [mealPlans, setMealPlans] = useState<MealPlan[]>([])
  const [selectedPlanTypes, setSelectedPlanTypes] = useState<string[]>([])
  const [selectedGoals, setSelectedGoals] = useState<string[]>([])
  const [selectedDiets, setSelectedDiets] = useState<string[]>([])
  const [caloriesRange, setCaloriesRange] = useState<[number, number]>([1200, 3200])
  const [minRating, setMinRating] = useState<string>('0')

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
        .catch((error) => {
          setStatus('error')
          pushApiError(error, 'Не удалось получить планы питания.')
        })
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

  const availablePlanTypes = useMemo(
    () => Array.from(new Set(mealPlans.map((plan) => plan.planType))),
    [mealPlans],
  )
  const availableGoals = useMemo(
    () => Array.from(new Set(mealPlans.map((plan) => plan.goal))),
    [mealPlans],
  )
  const availableDiets = useMemo(
    () => Array.from(new Set(mealPlans.map((plan) => plan.diet))),
    [mealPlans],
  )
  const filteredPlans = useMemo(() => {
    const min = Number(minRating || '0')
    return mealPlans.filter((plan) => {
      const byType = !selectedPlanTypes.length || selectedPlanTypes.includes(plan.planType)
      const byGoal = !selectedGoals.length || selectedGoals.includes(plan.goal)
      const byDiet = !selectedDiets.length || selectedDiets.includes(plan.diet)
      const byCalories = plan.calories >= caloriesRange[0] && plan.calories <= caloriesRange[1]
      const byRating = plan.rating >= min
      return byType && byGoal && byDiet && byCalories && byRating
    })
  }, [caloriesRange, mealPlans, minRating, selectedDiets, selectedGoals, selectedPlanTypes])

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
          <Stack gap="md">
            <Title order={3}>Фильтры планов</Title>
            <Stack gap={6}>
              <Text fw={600}>Тип плана</Text>
              <Chip.Group multiple value={selectedPlanTypes} onChange={setSelectedPlanTypes}>
                <Group gap="xs">
                  {availablePlanTypes.map((value) => (
                    <Chip key={value} value={value} color="grape" variant="light">
                      {value}
                    </Chip>
                  ))}
                </Group>
              </Chip.Group>
            </Stack>
            <Stack gap={6}>
              <Text fw={600}>Цель</Text>
              <Chip.Group multiple value={selectedGoals} onChange={setSelectedGoals}>
                <Group gap="xs">
                  {availableGoals.map((value) => (
                    <Chip key={value} value={value} color="grape" variant="light">
                      {value}
                    </Chip>
                  ))}
                </Group>
              </Chip.Group>
            </Stack>
            <Stack gap={6}>
              <Text fw={600}>Диета</Text>
              <Chip.Group multiple value={selectedDiets} onChange={setSelectedDiets}>
                <Group gap="xs">
                  {availableDiets.map((value) => (
                    <Chip key={value} value={value} color="grape" variant="light">
                      {value}
                    </Chip>
                  ))}
                </Group>
              </Chip.Group>
            </Stack>
            <Stack gap={6}>
              <Text fw={600}>Калорийность</Text>
              <RangeSlider
                min={800}
                max={4500}
                step={50}
                value={caloriesRange}
                onChange={(value) => setCaloriesRange(value as [number, number])}
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
            <Title order={1}>Планы питания</Title>
            <Text>Подбор планов с детальной разбивкой по дням и приемам пищи.</Text>
          </Stack>
        </Card>

        <SimpleGrid cols={{ base: 1, sm: 2, xl: 3 }} spacing="md">
          {filteredPlans.map((plan) => (
            <Card
              withBorder
              radius="md"
              padding="lg"
              key={plan.id}
              style={{ background: 'var(--bg-surface)', minHeight: 300, display: 'flex' }}
            >
              <Stack gap="xs" style={{ flex: 1 }}>
                <Title order={3}>{plan.title}</Title>
                <Text>{plan.description}</Text>
                <Group gap="xs">
                  <Badge variant="light" color="grape">
                    {plan.planType}
                  </Badge>
                  <Badge
                    variant={selectedGoals.includes(plan.goal) ? 'filled' : 'light'}
                    color="grape"
                    style={{ cursor: 'pointer' }}
                    onClick={() =>
                      setSelectedGoals((prev) =>
                        prev.includes(plan.goal)
                          ? prev.filter((item) => item !== plan.goal)
                          : [...prev, plan.goal],
                      )
                    }
                  >
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
                  <Badge
                    variant={selectedDiets.includes(plan.diet) ? 'filled' : 'dot'}
                    color="violet"
                    style={{ cursor: 'pointer' }}
                    onClick={() =>
                      setSelectedDiets((prev) =>
                        prev.includes(plan.diet)
                          ? prev.filter((item) => item !== plan.diet)
                          : [...prev, plan.diet],
                      )
                    }
                  >
                    {plan.diet}
                  </Badge>
                </Group>
                <Button
                  component={Link}
                  to={`/meal-plans/${plan.id}`}
                  color="grape"
                  mt="auto"
                  fullWidth
                >
                  Открыть план
                </Button>
              </Stack>
            </Card>
          ))}
        </SimpleGrid>
        {!filteredPlans.length ? (
          <PageEmpty
            title="Нет планов по выбранным фильтрам"
            description="Измените параметры фильтрации или очистите часть критериев."
          />
        ) : null}
      </Stack>
      </Grid.Col>
    </Grid>
  )
}
