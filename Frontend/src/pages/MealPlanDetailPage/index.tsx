import {
  Accordion,
  Alert,
  Badge,
  Button,
  Card,
  Group,
  Rating,
  SimpleGrid,
  Stack,
  Text,
  Textarea,
  Title,
} from '@mantine/core'
import { useEffect, useMemo, useState } from 'react'
import { useUnit } from 'effector-react'
import { useParams } from 'react-router-dom'
import { FallbackCard } from '../../components/FallbackCard'
import { $authStatus, $authUser } from '../../features/auth/model'
import { MealInfo } from '../../components/MealInfo'
import {
  addFavorite,
  fetchMealPlanById,
  fetchTargetReviews,
  fetchUserFavorites,
  removeFavorite,
  type TargetReview,
  upsertReview,
} from '../../shared/api/foodApi'
import { pushApiError, pushError, pushSuccess } from '../../shared/model/notifications'
import { PageError, PageLoader } from '../../shared/ui/PageStates'
import type { MealPlan } from '../../types/domain'

export function MealPlanDetailPage() {
  const { planId } = useParams<{ planId: string }>()
  const [plan, setPlan] = useState<MealPlan | null>(null)
  const [reviews, setReviews] = useState<TargetReview[]>([])
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [reloadToken, setReloadToken] = useState(0)
  const [favorite, setFavorite] = useState(false)
  const [reviewRating, setReviewRating] = useState(0)
  const [reviewComment, setReviewComment] = useState('')
  const [pendingFavorite, setPendingFavorite] = useState(false)
  const [pendingReview, setPendingReview] = useState(false)
  const [actionMessage, setActionMessage] = useState('')
  const [actionError, setActionError] = useState('')
  const { authStatus, authUser } = useUnit({
    authStatus: $authStatus,
    authUser: $authUser,
  })

  useEffect(() => {
    if (!planId) return

    Promise.all([fetchMealPlanById(planId), fetchTargetReviews('meal_plan', planId)])
      .then(([planData, reviewsData]) => {
        setPlan(planData)
        setReviews(reviewsData)
        setStatus('ready')
      })
      .catch((error) => {
        setStatus('error')
        pushApiError(error, 'Не удалось загрузить план питания.')
      })
  }, [planId, reloadToken])

  useEffect(() => {
    if (!planId || authStatus !== 'auth') return
    fetchUserFavorites()
      .then((items) => {
        setFavorite(
          items.some(
            (item) => item.target_type === 'meal_plan' && String(item.target_id) === String(planId),
          ),
        )
      })
      .catch((error) => {
        pushApiError(error, 'Не удалось проверить избранное.')
      })
  }, [authStatus, planId])

  const filteredReviews = useMemo(
    () => reviews.filter((review) => review.targetId === (planId ?? '')),
    [reviews, planId],
  )

  useEffect(() => {
    if (!authUser || !filteredReviews.length) return
    const own = filteredReviews.find((review) => review.userId === authUser.id)
    if (!own) return
    setReviewRating(own.rating)
    setReviewComment(own.comment)
  }, [authUser, filteredReviews])

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

  const averageRating = filteredReviews.length
    ? Number(
        (filteredReviews.reduce((sum, review) => sum + review.rating, 0) / filteredReviews.length).toFixed(
          1,
        ),
      )
    : plan.rating

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
            <Button color="grape" variant="light">
              Средний рейтинг: {averageRating}
            </Button>
            <Button
              color="grape"
              variant="outline"
              loading={pendingFavorite}
              onClick={async () => {
                if (authStatus !== 'auth') {
                  setActionError('Авторизуйтесь, чтобы добавить план в избранное.')
                  pushError('Авторизуйтесь, чтобы добавить план в избранное.')
                  return
                }
                setActionError('')
                setActionMessage('')
                setPendingFavorite(true)
                try {
                  if (favorite) {
                    await removeFavorite('meal_plan', plan.id)
                    setFavorite(false)
                    setActionMessage('План удален из избранного.')
                  } else {
                    await addFavorite('meal_plan', plan.id)
                    setFavorite(true)
                    setActionMessage('План добавлен в избранное.')
                  }
                } catch (error) {
                  setActionError('Не удалось обновить избранное.')
                  pushApiError(error, 'Не удалось обновить избранное.')
                } finally {
                  setPendingFavorite(false)
                }
              }}
            >
              {favorite ? 'Убрать из избранного' : 'В избранное'}
            </Button>
          </Group>
          {actionMessage ? <Alert color="green">{actionMessage}</Alert> : null}
          {actionError ? <Alert color="red">{actionError}</Alert> : null}
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
          <Rating value={reviewRating} onChange={setReviewRating} color="grape" />
          <Textarea
            placeholder="Оставьте комментарий к плану питания"
            value={reviewComment}
            onChange={(event) => setReviewComment(event.currentTarget.value)}
            minRows={2}
          />
          <Button
            color="grape"
            variant="light"
            w="fit-content"
            loading={pendingReview}
            onClick={async () => {
              if (authStatus !== 'auth' || !authUser) {
                setActionError('Авторизуйтесь, чтобы оставлять отзывы.')
                pushError('Авторизуйтесь, чтобы оставлять отзывы.')
                return
              }
              if (!reviewRating) {
                setActionError('Поставьте оценку от 1 до 5.')
                pushError('Поставьте оценку от 1 до 5.')
                return
              }
              setActionError('')
              setPendingReview(true)
              try {
                await upsertReview({
                  targetType: 'meal_plan',
                  targetId: plan.id,
                  userId: authUser.id,
                  rating: reviewRating,
                  comment: reviewComment,
                })
                const updated = await fetchTargetReviews('meal_plan', plan.id)
                setReviews(updated)
                setActionMessage('Отзыв сохранен.')
                pushSuccess('Отзыв сохранен.')
              } catch (error) {
                setActionError('Не удалось сохранить отзыв.')
                pushApiError(error, 'Не удалось сохранить отзыв.')
              } finally {
                setPendingReview(false)
              }
            }}
          >
            Сохранить отзыв
          </Button>
          <SimpleGrid cols={{ base: 1, md: 2 }} spacing="sm">
            {filteredReviews.map((review) => (
                <Card key={review.id} withBorder radius="md" p="sm">
                  <Stack gap={6}>
                    <Text size="sm">
                      <strong>Пользователь #{review.userId}:</strong> {review.comment || 'Без комментария'}
                    </Text>
                    <Badge color="violet" variant="light" w="fit-content">
                      ★ {review.rating}
                    </Badge>
                  </Stack>
                </Card>
              ))}
          </SimpleGrid>
          {!filteredReviews.length ? (
            <Text size="sm" c="dimmed">
              Пока нет отзывов для этого плана.
            </Text>
          ) : null}
        </Stack>
      </Card>
    </Stack>
  )
}
