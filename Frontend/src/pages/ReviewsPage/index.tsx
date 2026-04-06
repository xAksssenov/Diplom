import { Badge, Button, Card, Group, SimpleGrid, Stack, Text, Title } from '@mantine/core'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchPlanReviewsPage } from '../../shared/api/foodApi'
import { pushApiError } from '../../shared/model/notifications'
import { PageEmpty, PageError, PageLoader } from '../../shared/ui/PageStates'
import type { PlanReview } from '../../types/domain'

export function ReviewsPage() {
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [planReviews, setPlanReviews] = useState<PlanReview[]>([])
  const [nextOffset, setNextOffset] = useState<number | null>(0)
  const [total, setTotal] = useState(0)
  const [loadingMore, setLoadingMore] = useState(false)

  useEffect(() => {
    if (status !== 'loading') {
      return
    }

    const timeoutId = window.setTimeout(() => {
      fetchPlanReviewsPage({ limit: 24, offset: 0 })
        .then((data) => {
          setPlanReviews(data.items)
          setTotal(data.total)
          setNextOffset(data.nextOffset)
          setStatus('ready')
        })
        .catch((error) => {
          setStatus('error')
          pushApiError(error, 'Сервис отзывов временно недоступен.')
        })
    }, 450)

    return () => window.clearTimeout(timeoutId)
  }, [status])

  if (status === 'loading') {
    return <PageLoader title="Загружаем отзывы..." />
  }

  if (status === 'error') {
    return (
      <PageError
        message="Сервис отзывов временно недоступен."
        onRetry={() => setStatus('loading')}
      />
    )
  }

  if (!planReviews.length) {
    return (
      <PageEmpty
        title="Отзывов пока нет"
        description="Будьте первым, кто оценит план питания."
      />
    )
  }

  return (
    <Stack gap="md">
      <Card withBorder radius="md" p="lg" style={{ background: 'var(--bg-surface)' }}>
        <Stack gap="xs">
          <Title order={1}>Оценки и отзывы</Title>
          <Text>Отзывы на планы питания с быстрым переходом к деталям.</Text>
          <Text size="sm" c="dimmed">
            Показано: {planReviews.length} из {total}
          </Text>
        </Stack>
      </Card>
      <SimpleGrid cols={{ base: 1, md: 2, xl: 3 }} spacing="md">
        {planReviews.map((review) => (
          <Card
            key={review.id}
            withBorder
            radius="md"
            p="lg"
            style={{ background: 'var(--bg-surface)' }}
          >
            <Stack gap="xs">
              <Title order={3}>{review.planTitle}</Title>
              <Text>{review.comment}</Text>
              <Group gap="xs">
                <Badge variant="light" color="grape">
                  {review.author}
                </Badge>
                <Badge variant="light" color="grape">
                  ★ {review.rating}
                </Badge>
              </Group>
              <Button component={Link} to={`/meal-plans/${review.planId}`} color="grape">
                Перейти к плану
              </Button>
            </Stack>
          </Card>
        ))}
      </SimpleGrid>
      {nextOffset !== null ? (
        <Button
          variant="light"
          color="grape"
          loading={loadingMore}
          onClick={async () => {
            setLoadingMore(true)
            try {
              const next = await fetchPlanReviewsPage({ limit: 24, offset: nextOffset })
              setPlanReviews((prev) => [...prev, ...next.items])
              setTotal(next.total)
              setNextOffset(next.nextOffset)
            } catch (error) {
              pushApiError(error, 'Не удалось подгрузить отзывы.')
            } finally {
              setLoadingMore(false)
            }
          }}
        >
          Показать еще
        </Button>
      ) : null}
    </Stack>
  )
}
