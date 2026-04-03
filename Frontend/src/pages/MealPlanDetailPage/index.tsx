import {
  Accordion,
  Badge,
  Button,
  Card,
  Group,
  SimpleGrid,
  Stack,
  Text,
  Title,
} from '@mantine/core'
import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { FallbackCard } from '../../components/FallbackCard'
import { MealInfo } from '../../components/MealInfo'
import { fetchMealPlanById, fetchPlanReviews } from '../../shared/api/foodApi'
import { PageError, PageLoader } from '../../shared/ui/PageStates'
import type { MealPlan, PlanReview } from '../../types/domain'

export function MealPlanDetailPage() {
  const { planId } = useParams<{ planId: string }>()
  const [plan, setPlan] = useState<MealPlan | null>(null)
  const [reviews, setReviews] = useState<PlanReview[]>([])
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [reloadToken, setReloadToken] = useState(0)

  useEffect(() => {
    if (!planId) return

    Promise.all([fetchMealPlanById(planId), fetchPlanReviews()])
      .then(([planData, reviewsData]) => {
        setPlan(planData)
        setReviews(reviewsData)
        setStatus('ready')
      })
      .catch(() => setStatus('error'))
  }, [planId, reloadToken])

  const filteredReviews = useMemo(
    () => reviews.filter((review) => review.planId === (planId ?? '')),
    [reviews, planId],
  )

  if (!planId) {
    return <PageError message="Некорректный id плана." onRetry={() => {}} />
  }

  if (status === 'loading') {
    return <PageLoader title="Загружаем план питания..." />
  }

  if (status === 'error') {
    return (
      <PageError
        message="Не удалось загрузить план питания."
        onRetry={() => {
          setStatus('loading')
          setReloadToken((value) => value + 1)
        }}
      />
    )
  }

  if (!plan) {
    return <FallbackCard message="План питания не найден." />
  }

  return (
    <Stack gap="md">
      <Card withBorder radius="md" p="lg" style={{ background: 'var(--bg-surface)' }}>
        <Stack gap="sm">
          <Title order={1}>{plan.title}</Title>
          <Text>{plan.description}</Text>
          <Group gap="xs">
            <Badge color="grape" variant="light">
              Оценок: {plan.reviewsCount}
            </Badge>
            <Badge color="grape" variant="light">
              ★ {plan.rating}
            </Badge>
            <Badge color="grape" variant="light">
              {plan.calories} ккал
            </Badge>
            <Badge color="grape" variant="light">
              Б/Ж/У: {plan.protein}/{plan.fat}/{plan.carbs}
            </Badge>
          </Group>
          <Group gap="xs">
            <Button color="grape">Оценить план</Button>
            <Button color="grape" variant="light">
              Комментарий
            </Button>
            <Button color="grape" variant="outline">
              В избранное
            </Button>
          </Group>
        </Stack>
      </Card>

      {plan.days.map((day) => (
        <Card
          withBorder
          radius="md"
          p="lg"
          key={day.day}
          style={{ background: 'var(--bg-surface)' }}
        >
          <Stack gap="sm">
            <Title order={3}>День {day.day}</Title>
            <Accordion defaultValue="breakfast" variant="separated">
              <Accordion.Item value="breakfast">
                <Accordion.Control>Завтрак</Accordion.Control>
                <Accordion.Panel>
                  <MealInfo meal={day.meals.breakfast} />
                </Accordion.Panel>
              </Accordion.Item>
              <Accordion.Item value="lunch">
                <Accordion.Control>Обед</Accordion.Control>
                <Accordion.Panel>
                  <MealInfo meal={day.meals.lunch} />
                </Accordion.Panel>
              </Accordion.Item>
              <Accordion.Item value="dinner">
                <Accordion.Control>Ужин</Accordion.Control>
                <Accordion.Panel>
                  <MealInfo meal={day.meals.dinner} />
                </Accordion.Panel>
              </Accordion.Item>
              <Accordion.Item value="snacks">
                <Accordion.Control>Перекусы ({day.meals.snacks.length})</Accordion.Control>
                <Accordion.Panel>
                  <Stack gap="xs">
                    {day.meals.snacks.map((snack) => (
                      <MealInfo key={snack.title} meal={snack} />
                    ))}
                  </Stack>
                </Accordion.Panel>
              </Accordion.Item>
            </Accordion>
          </Stack>
        </Card>
      ))}

      <Card withBorder radius="md" p="lg" style={{ background: 'var(--bg-surface)' }}>
        <Stack gap="sm">
          <Title order={3}>Отзывы и оценки по плану</Title>
          <SimpleGrid cols={{ base: 1, md: 2 }} spacing="sm">
            {filteredReviews.map((review) => (
                <Card key={review.id} withBorder radius="md" p="sm">
                  <Stack gap={6}>
                    <Text size="sm">
                      <strong>{review.author}:</strong> {review.comment}
                    </Text>
                    <Badge color="violet" variant="light" w="fit-content">
                      ★ {review.rating}
                    </Badge>
                  </Stack>
                </Card>
              ))}
          </SimpleGrid>
        </Stack>
      </Card>
    </Stack>
  )
}
