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
import { useEffect, useState } from 'react'
import { useUnit } from 'effector-react'
import { useParams } from 'react-router-dom'
import { FallbackCard } from '../../components/FallbackCard'
import { $authStatus, $authUser } from '../../features/auth/model'
import {
  addFavorite,
  fetchRecipeById,
  fetchTargetReviews,
  fetchUserFavorites,
  removeFavorite,
  type TargetReview,
  upsertReview,
} from '../../shared/api/foodApi'
import { PageError, PageLoader } from '../../shared/ui/PageStates'
import type { Recipe } from '../../types/domain'

export function RecipeDetailPage() {
  const { recipeId } = useParams<{ recipeId: string }>()
  const [recipe, setRecipe] = useState<Recipe | null>(null)
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [activeImage, setActiveImage] = useState(0)
  const [reloadToken, setReloadToken] = useState(0)
  const [reviews, setReviews] = useState<TargetReview[]>([])
  const [favorite, setFavorite] = useState(false)
  const [reviewRating, setReviewRating] = useState(0)
  const [reviewComment, setReviewComment] = useState('')
  const [actionMessage, setActionMessage] = useState('')
  const [actionError, setActionError] = useState('')
  const [pendingFavorite, setPendingFavorite] = useState(false)
  const [pendingReview, setPendingReview] = useState(false)
  const { authStatus, authUser } = useUnit({
    authStatus: $authStatus,
    authUser: $authUser,
  })

  useEffect(() => {
    if (!recipeId) return

    Promise.all([fetchRecipeById(recipeId), fetchTargetReviews('recipe', recipeId)])
      .then(([data, reviewsData]) => {
        setRecipe(data)
        setReviews(reviewsData)
        setStatus('ready')
      })
      .catch(() => setStatus('error'))
  }, [recipeId, reloadToken])

  useEffect(() => {
    if (!recipeId || authStatus !== 'auth') return
    fetchUserFavorites()
      .then((items) => {
        setFavorite(
          items.some((item) => item.target_type === 'recipe' && String(item.target_id) === recipeId),
        )
      })
      .catch(() => {
        // no-op
      })
  }, [authStatus, recipeId])

  useEffect(() => {
    if (!authUser || !reviews.length) return
    const own = reviews.find((review) => review.userId === authUser.id)
    if (!own) return
    setReviewRating(own.rating)
    setReviewComment(own.comment)
  }, [authUser, reviews])

  if (!recipeId) {
    return <PageError message="Некорректный id рецепта." onRetry={() => {}} />
  }

  if (status === 'loading') {
    return <PageLoader title="Загружаем рецепт..." />
  }

  if (status === 'error') {
    return (
      <PageError
        message="Не удалось загрузить рецепт."
        onRetry={() => {
          setStatus('loading')
          setReloadToken((value) => value + 1)
        }}
      />
    )
  }

  if (!recipe) {
    return <FallbackCard message="Рецепт не найден." />
  }

  const averageRating = reviews.length
    ? Number((reviews.reduce((sum, item) => sum + item.rating, 0) / reviews.length).toFixed(1))
    : recipe.rating

  return (
    <Stack gap="md">
      <Card withBorder radius="md" p="lg" style={{ background: 'var(--bg-surface)' }}>
        <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
          <Stack gap="sm">
            <Card
              withBorder
              radius="md"
              p={0}
              style={{ minHeight: 280, background: recipe.images[activeImage] }}
            />
            <Group gap="xs">
              {recipe.images.map((imageColor, index) => (
                <Button
                  key={imageColor}
                  type="button"
                  onClick={() => setActiveImage(index)}
                  variant={index === activeImage ? 'filled' : 'light'}
                  color="grape"
                  style={{ background: imageColor, color: '#2c184f' }}
                >
                  {index + 1}
                </Button>
              ))}
            </Group>
          </Stack>

          <Stack gap="sm">
            <Title order={1}>{recipe.title}</Title>
            <Text>{recipe.subtitle}</Text>
            <Group gap="xs">
              <Badge color="grape" variant="light">
                {recipe.cookingTime}
              </Badge>
              <Badge color="grape" variant="light">
                ★ {recipe.rating}
              </Badge>
              <Badge color="grape" variant="light">
                {recipe.calories} ккал
              </Badge>
            </Group>
            <Group gap="xs">
              {recipe.tags.map((tag) => (
                <Badge key={tag} variant="dot" color="violet">
                  {tag}
                </Badge>
              ))}
            </Group>
            <Group gap="xs">
              <Button
                color="grape"
                loading={pendingFavorite}
                onClick={async () => {
                  if (authStatus !== 'auth') {
                    setActionError('Авторизуйтесь, чтобы добавить рецепт в избранное.')
                    return
                  }
                  setActionError('')
                  setActionMessage('')
                  setPendingFavorite(true)
                  try {
                    if (favorite) {
                      await removeFavorite('recipe', recipe.id)
                      setFavorite(false)
                      setActionMessage('Рецепт удален из избранного.')
                    } else {
                      await addFavorite('recipe', recipe.id)
                      setFavorite(true)
                      setActionMessage('Рецепт добавлен в избранное.')
                    }
                  } catch {
                    setActionError('Не удалось обновить избранное.')
                  } finally {
                    setPendingFavorite(false)
                  }
                }}
              >
                {favorite ? 'Убрать из избранного' : 'В избранное'}
              </Button>
              <Button color="grape" variant="outline" onClick={() => window.print()}>
                Напечатать
              </Button>
            </Group>
            {actionMessage ? <Alert color="green">{actionMessage}</Alert> : null}
            {actionError ? <Alert color="red">{actionError}</Alert> : null}
          </Stack>
        </SimpleGrid>
      </Card>

      <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
        <Card withBorder radius="md" p="lg" style={{ background: 'var(--bg-surface)' }}>
          <Stack gap="xs">
            <Title order={3}>Пищевая ценность</Title>
            <Badge color="grape" variant="light" w="fit-content">
              Калории: {recipe.calories}
            </Badge>
            <Badge color="grape" variant="light" w="fit-content">
              Белки: {recipe.nutrition.protein} г
            </Badge>
            <Badge color="grape" variant="light" w="fit-content">
              Жиры: {recipe.nutrition.fat} г
            </Badge>
            <Badge color="grape" variant="light" w="fit-content">
              Углеводы: {recipe.nutrition.carbs} г
            </Badge>
          </Stack>
        </Card>

        <Card withBorder radius="md" p="lg" style={{ background: 'var(--bg-surface)' }}>
          <Stack gap="sm">
            <Title order={3}>Отзывы и оценки</Title>
            <Text>Средняя оценка: {averageRating} / 5</Text>
            <Rating value={reviewRating} onChange={setReviewRating} color="grape" />
            <Textarea
              placeholder="Оставьте комментарий к рецепту"
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
                  return
                }
                if (!reviewRating) {
                  setActionError('Поставьте оценку от 1 до 5.')
                  return
                }
                setActionError('')
                setPendingReview(true)
                try {
                  await upsertReview({
                    targetType: 'recipe',
                    targetId: recipe.id,
                    userId: authUser.id,
                    rating: reviewRating,
                    comment: reviewComment,
                  })
                  const updated = await fetchTargetReviews('recipe', recipe.id)
                  setReviews(updated)
                  setActionMessage('Отзыв сохранен.')
                } catch {
                  setActionError('Не удалось сохранить отзыв.')
                } finally {
                  setPendingReview(false)
                }
              }}
            >
              Сохранить отзыв
            </Button>
            <Stack gap={8}>
              {reviews.map((item) => (
                <Card key={item.id} withBorder radius="md" p="sm">
                  <Text size="sm">Пользователь #{item.userId}</Text>
                  <Text size="sm">{item.comment || 'Без комментария'}</Text>
                  <Badge mt={6} color="violet" variant="light" w="fit-content">
                    ★ {item.rating}
                  </Badge>
                </Card>
              ))}
              {!reviews.length ? (
                <Text size="sm" c="dimmed">
                  Пока нет отзывов для этого рецепта.
                </Text>
              ) : null}
            </Stack>
          </Stack>
        </Card>
      </SimpleGrid>

      <Card withBorder radius="md" p="lg" style={{ background: 'var(--bg-surface)' }}>
        <Accordion defaultValue="ingredients" variant="separated">
          <Accordion.Item value="ingredients">
            <Accordion.Control>Ингредиенты</Accordion.Control>
            <Accordion.Panel>
              <Stack gap={6}>
                {recipe.ingredients.map((ingredient) => (
                  <Text key={ingredient} size="sm">
                    - {ingredient}
                  </Text>
                ))}
              </Stack>
            </Accordion.Panel>
          </Accordion.Item>
          <Accordion.Item value="steps">
            <Accordion.Control>Процесс приготовления</Accordion.Control>
            <Accordion.Panel>
              <Stack gap={6}>
                {recipe.steps.map((step, index) => (
                  <Text key={step} size="sm">
                    {index + 1}. {step}
                  </Text>
                ))}
              </Stack>
            </Accordion.Panel>
          </Accordion.Item>
        </Accordion>
      </Card>
    </Stack>
  )
}
