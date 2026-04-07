import {
  Accordion,
  Alert,
  Badge,
  Button,
  Card,
  Checkbox,
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
  fetchShoppingListByTarget,
  fetchTargetReviews,
  fetchUserFavorites,
  removeFavorite,
  saveShoppingListForTarget,
  type ShoppingChecklistItem,
  type TargetReview,
  upsertReview,
} from '../../shared/api/foodApi'
import { pushApiError, pushError, pushSuccess } from '../../shared/model/notifications'
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
  const [shoppingSyncPending, setShoppingSyncPending] = useState(false)
  const [ingredientChecks, setIngredientChecks] = useState<ShoppingChecklistItem[]>([])
  const [lastSavedSignature, setLastSavedSignature] = useState('')
  const [hasSavedShoppingList, setHasSavedShoppingList] = useState(false)
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
        const parsed = data.ingredients.map((line) => {
          const [namePart, restPart] = line.split(' - ')
          const cleanedName = namePart?.trim() || line.trim()
          const quantityMatch = (restPart || '').match(/^([\d.,]+)\s*(.*)$/)
          const quantity = quantityMatch ? Number((quantityMatch[1] || '1').replace(',', '.')) : 1
          const unit = quantityMatch?.[2]?.trim() || 'шт'
          return {
            ingredientName: cleanedName,
            quantity: Number.isFinite(quantity) && quantity > 0 ? quantity : 1,
            unit,
            hasIngredient: false,
          }
        })
        setIngredientChecks(parsed)
        setStatus('ready')
      })
      .catch((error) => {
        setStatus('error')
        pushApiError(error, 'Не удалось загрузить рецепт.')
      })
  }, [recipeId, reloadToken])

  useEffect(() => {
    if (!recipeId || authStatus !== 'auth') return
    fetchUserFavorites()
      .then((items) => {
        setFavorite(
          items.some((item) => item.target_type === 'recipe' && String(item.target_id) === recipeId),
        )
      })
      .catch((error) => {
        pushApiError(error, 'Не удалось проверить избранное.')
      })
  }, [authStatus, recipeId])

  useEffect(() => {
    if (!recipeId || authStatus !== 'auth' || !ingredientChecks.length) return
    fetchShoppingListByTarget('recipe', recipeId)
      .then((list) => {
        if (!list) {
          setHasSavedShoppingList(false)
          setLastSavedSignature(currentSignature)
          return
        }
        setHasSavedShoppingList(true)
        const missing = new Set(list.items.map((item) => item.ingredientName.toLowerCase()))
        setIngredientChecks((prev) => {
          const next = prev.map((item) => ({
            ...item,
            hasIngredient: !missing.has(item.ingredientName.toLowerCase()),
          }))
          const nextSignature = JSON.stringify(
            next
              .map((item) => ({
                name: item.ingredientName.toLowerCase(),
                quantity: Number(item.quantity || 0),
                unit: (item.unit || '').toLowerCase(),
                hasIngredient: item.hasIngredient,
              }))
              .sort((a, b) => `${a.name}:${a.unit}`.localeCompare(`${b.name}:${b.unit}`)),
          )
          setLastSavedSignature(nextSignature)
          return next
        })
      })
      .catch(() => {
        // silent: local state is still usable
      })
  }, [authStatus, ingredientChecks.length, recipeId])

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
  const missingItems = ingredientChecks.filter((item) => !item.hasIngredient)
  const currentSignature = JSON.stringify(
    ingredientChecks
      .map((item) => ({
        name: item.ingredientName.toLowerCase(),
        quantity: Number(item.quantity || 0),
        unit: (item.unit || '').toLowerCase(),
        hasIngredient: item.hasIngredient,
      }))
      .sort((a, b) => `${a.name}:${a.unit}`.localeCompare(`${b.name}:${b.unit}`)),
  )
  const shoppingListText = missingItems.length
    ? missingItems
        .map((item, index) => `${index + 1}. ${item.ingredientName} - ${item.quantity} ${item.unit}`)
        .join('\n')
    : 'Все ингредиенты уже есть.'

  const syncShoppingList = async (nextItems: ShoppingChecklistItem[], showToast = false) => {
    if (!recipeId || authStatus !== 'auth') return
    const nextSignature = JSON.stringify(
      nextItems
        .map((item) => ({
          name: item.ingredientName.toLowerCase(),
          quantity: Number(item.quantity || 0),
          unit: (item.unit || '').toLowerCase(),
          hasIngredient: item.hasIngredient,
        }))
        .sort((a, b) => `${a.name}:${a.unit}`.localeCompare(`${b.name}:${b.unit}`)),
    )
    if (nextSignature === lastSavedSignature) return
    setShoppingSyncPending(true)
    try {
      await saveShoppingListForTarget({
        targetType: 'recipe',
        targetId: recipeId,
        title: `Покупки для рецепта: ${recipe.title}`,
        items: nextItems,
      })
      setHasSavedShoppingList(true)
      setLastSavedSignature(nextSignature)
      if (showToast) {
        pushSuccess('Список покупок сохранен в профиль.')
      }
    } catch (error) {
      pushApiError(error, 'Не удалось сохранить список покупок.')
    } finally {
      setShoppingSyncPending(false)
    }
  }

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
                    pushError('Авторизуйтесь, чтобы добавить рецепт в избранное.')
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
                    targetType: 'recipe',
                    targetId: recipe.id,
                    userId: authUser.id,
                    rating: reviewRating,
                    comment: reviewComment,
                  })
                  const updated = await fetchTargetReviews('recipe', recipe.id)
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
            <Accordion.Control>
              Ингредиенты - сформируйте свой список покупок из ингредиентов этого блюда
            </Accordion.Control>
            <Accordion.Panel>
              <Stack gap="sm">
                {hasSavedShoppingList ? (
                  <Text size="sm" c="dimmed">
                    Вы уже добавляли список ингредиентов в свой профиль.
                  </Text>
                ) : null}
                <Group gap="xs">
                  <Button
                    size="xs"
                    color="grape"
                    variant="light"
                    loading={shoppingSyncPending}
                    disabled={
                      authStatus !== 'auth' ||
                      shoppingSyncPending ||
                      (hasSavedShoppingList && currentSignature === lastSavedSignature)
                    }
                    onClick={() => syncShoppingList(ingredientChecks, true)}
                  >
                    {hasSavedShoppingList ? 'Отредактировать список покупок' : 'Сохранить в профиль'}
                  </Button>
                  <Button
                    size="xs"
                    color="grape"
                    variant="outline"
                    onClick={() => {
                      const blob = new Blob([shoppingListText], { type: 'text/plain;charset=utf-8' })
                      const link = document.createElement('a')
                      link.href = URL.createObjectURL(blob)
                      link.download = `shopping-recipe-${recipe.id}.txt`
                      link.click()
                      URL.revokeObjectURL(link.href)
                    }}
                  >
                    Скачать список
                  </Button>
                  <Button
                    size="xs"
                    color="grape"
                    variant="subtle"
                    onClick={() => window.print()}
                  >
                    Напечатать
                  </Button>
                </Group>
                <Stack gap={6}>
                  {ingredientChecks.map((ingredient) => (
                    <Checkbox
                      key={`${ingredient.ingredientName}-${ingredient.unit}`}
                      checked={ingredient.hasIngredient}
                      label={`${ingredient.ingredientName} - ${ingredient.quantity} ${ingredient.unit}`}
                      onChange={(event) => {
                        const next = ingredientChecks.map((item) =>
                          item.ingredientName === ingredient.ingredientName && item.unit === ingredient.unit
                            ? { ...item, hasIngredient: event.currentTarget.checked }
                            : item,
                        )
                        setIngredientChecks(next)
                      }}
                    />
                  ))}
                  {!ingredientChecks.length ? (
                    <Text size="sm" c="dimmed">
                      Ингредиенты не указаны.
                    </Text>
                  ) : null}
                </Stack>
                {missingItems.length ? (
                  <Alert color="yellow">
                    Не хватает ингредиентов: {missingItems.map((item) => item.ingredientName).join(', ')}
                  </Alert>
                ) : (
                  <Alert color="green">Все ингредиенты отмечены как доступные.</Alert>
                )}
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
