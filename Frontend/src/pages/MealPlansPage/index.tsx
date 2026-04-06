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
import { useUnit } from 'effector-react'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { $authUser } from '../../features/auth/model'
import { fetchMealPlansPage } from '../../shared/api/foodApi'
import { pushApiError } from '../../shared/model/notifications'
import { PageEmpty, PageError, PageLoader } from '../../shared/ui/PageStates'
import type { MealPlan } from '../../types/domain'

type PlanTypeApi = 'personal' | 'fitness' | 'therapeutic'

const planTypeMeta: Array<{ api: PlanTypeApi; label: string; goal: string; diet: string }> = [
  { api: 'personal', label: 'На день', goal: 'Поддержание веса', diet: 'Сбалансированное' },
  { api: 'fitness', label: 'На неделю', goal: 'Набор массы', diet: 'Высокобелковое' },
  { api: 'therapeutic', label: 'На месяц', goal: 'Поддержание здоровья', diet: 'Без глютена' },
]

function intersectPlanTypes(...sets: Array<Set<PlanTypeApi> | null>): PlanTypeApi[] {
  const activeSets = sets.filter(Boolean) as Set<PlanTypeApi>[]
  if (!activeSets.length) {
    return planTypeMeta.map((item) => item.api)
  }
  return planTypeMeta
    .map((item) => item.api)
    .filter((type) => activeSets.every((set) => set.has(type)))
}

export function MealPlansPage() {
  const authUser = useUnit($authUser)
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [reloadToken, setReloadToken] = useState(0)
  const [mealPlans, setMealPlans] = useState<MealPlan[]>([])
  const [total, setTotal] = useState(0)
  const [nextOffset, setNextOffset] = useState<number | null>(0)
  const [loadingMore, setLoadingMore] = useState(false)
  const [profilePresetApplied, setProfilePresetApplied] = useState(false)
  const [selectedPlanTypes, setSelectedPlanTypes] = useState<string[]>([])
  const [selectedGoals, setSelectedGoals] = useState<string[]>([])
  const [selectedDiets, setSelectedDiets] = useState<string[]>([])
  const [caloriesRange, setCaloriesRange] = useState<[number, number]>([1200, 3200])
  const [minRating, setMinRating] = useState<string>('0')

  const availablePlanTypes = useMemo(() => planTypeMeta.map((item) => item.label), [])
  const availableGoals = useMemo(() => planTypeMeta.map((item) => item.goal), [])
  const availableDiets = useMemo(() => planTypeMeta.map((item) => item.diet), [])

  useEffect(() => {
    if (profilePresetApplied) return
    const prefs = [...(authUser?.favorite_tags ?? []), ...(authUser?.health_features ?? [])].map((item) =>
      item.toLowerCase(),
    )
    const diets = availableDiets.filter((diet) =>
      prefs.some((pref) => diet.toLowerCase().includes(pref) || pref.includes(diet.toLowerCase())),
    )
    const goals = availableGoals.filter((goal) =>
      prefs.some((pref) => goal.toLowerCase().includes(pref) || pref.includes(goal.toLowerCase())),
    )
    const preferredDiet = authUser?.preferred_diet
    const dietsWithPreferred =
      preferredDiet && availableDiets.includes(preferredDiet)
        ? Array.from(new Set([...diets, preferredDiet]))
        : diets
    setSelectedDiets(dietsWithPreferred)
    setSelectedGoals(goals)
    setProfilePresetApplied(true)
  }, [
    authUser?.favorite_tags,
    authUser?.health_features,
    authUser?.preferred_diet,
    availableDiets,
    availableGoals,
    profilePresetApplied,
  ])

  const selectedByTypeSet = useMemo(() => {
    if (!selectedPlanTypes.length) return null
    return new Set(
      planTypeMeta.filter((item) => selectedPlanTypes.includes(item.label)).map((item) => item.api),
    )
  }, [selectedPlanTypes])
  const selectedByGoalSet = useMemo(() => {
    if (!selectedGoals.length) return null
    return new Set(
      planTypeMeta.filter((item) => selectedGoals.includes(item.goal)).map((item) => item.api),
    )
  }, [selectedGoals])
  const selectedByDietSet = useMemo(() => {
    if (!selectedDiets.length) return null
    return new Set(
      planTypeMeta.filter((item) => selectedDiets.includes(item.diet)).map((item) => item.api),
    )
  }, [selectedDiets])

  const resolvedPlanTypes = useMemo(
    () => intersectPlanTypes(selectedByTypeSet, selectedByGoalSet, selectedByDietSet),
    [selectedByDietSet, selectedByGoalSet, selectedByTypeSet],
  )
  const apiFilters = useMemo(() => {
    const min = Number(minRating || '0')
    const hasPlanTypeFilter = resolvedPlanTypes.length > 0 && resolvedPlanTypes.length < planTypeMeta.length
    return {
      planTypes: hasPlanTypeFilter ? resolvedPlanTypes : undefined,
      caloriesMin: caloriesRange[0],
      caloriesMax: caloriesRange[1],
      minRating: Number.isNaN(min) ? 0 : min,
    }
  }, [caloriesRange, minRating, resolvedPlanTypes])

  useEffect(() => {
    let cancelled = false
    setStatus('loading')
    const timeoutId = window.setTimeout(() => {
      fetchMealPlansPage({ limit: 9, offset: 0, filters: apiFilters })
        .then((data) => {
          if (cancelled) return
          setMealPlans(data.items)
          setTotal(data.total)
          setNextOffset(data.nextOffset)
          setStatus('ready')
        })
        .catch((error) => {
          if (cancelled) return
          setStatus('error')
          pushApiError(error, 'Не удалось получить планы питания.')
        })
    }, 250)
    return () => {
      cancelled = true
      window.clearTimeout(timeoutId)
    }
  }, [apiFilters, reloadToken])

  if (status === 'loading') {
    return <PageLoader title="Загружаем планы питания..." />
  }

  if (status === 'error') {
    return (
      <PageError
        message="Не удалось получить планы питания."
        onRetry={() => setReloadToken((value) => value + 1)}
      />
    )
  }

  const hasActiveFilters =
    selectedPlanTypes.length > 0 ||
    selectedGoals.length > 0 ||
    selectedDiets.length > 0 ||
    caloriesRange[0] !== 1200 ||
    caloriesRange[1] !== 3200 ||
    minRating !== '0'

  if (!mealPlans.length && !hasActiveFilters) {
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
              <Text size="sm" c="dimmed">
                Найдено по фильтрам: {total}
              </Text>
            </Stack>
          </Card>

          <SimpleGrid cols={{ base: 1, sm: 2, xl: 3 }} spacing="md">
            {mealPlans.map((plan) => (
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
                  <Text size="sm" c="dimmed">
                    Автор: {plan.author}
                  </Text>
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
          {!mealPlans.length ? (
            <PageEmpty
              title="Нет планов по выбранным фильтрам"
              description="Измените параметры фильтрации или очистите часть критериев."
            />
          ) : null}
          {nextOffset !== null && mealPlans.length > 0 ? (
            <Button
              variant="light"
              color="grape"
              loading={loadingMore}
              onClick={async () => {
                setLoadingMore(true)
                try {
                  const nextPage = await fetchMealPlansPage({
                    limit: 9,
                    offset: nextOffset,
                    filters: apiFilters,
                  })
                  setMealPlans((prev) => [...prev, ...nextPage.items])
                  setTotal(nextPage.total)
                  setNextOffset(nextPage.nextOffset)
                } catch (error) {
                  pushApiError(error, 'Не удалось подгрузить планы.')
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
