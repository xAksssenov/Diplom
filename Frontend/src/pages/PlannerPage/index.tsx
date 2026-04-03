import { useEffect, useMemo, useState } from 'react'
import {
  Alert,
  Button,
  Card,
  Grid,
  NumberInput,
  SimpleGrid,
  Stack,
  Text,
  Title,
} from '@mantine/core'
import { useUnit } from 'effector-react'
import { useNavigate } from 'react-router-dom'
import { fetchRecipes, submitPlannerToBackend } from '../../shared/api/foodApi'
import { $authStatus } from '../../features/auth/model'
import {
  $daysCount,
  $plannerError,
  $plannerSubmitMessage,
  $slotsMap,
  $snacksCount,
  daysCountChanged,
  plannerErrorSet,
  plannerMessagesReset,
  plannerSubmitMessageSet,
  recipeAssignedToSlot,
  slotCleared,
  snacksCountChanged,
  slotsSwapped,
} from '../../features/planner/model'
import { appendModerationStatus } from '../../lib/moderationStorage'
import { PageError, PageLoader } from '../../shared/ui/PageStates'
import type { Recipe } from '../../types/domain'
import './styles.css'

type MealSlotType = 'breakfast' | 'lunch' | 'dinner' | `snack-${number}`

const slotLabels: Record<string, string> = {
  breakfast: 'Завтрак',
  lunch: 'Обед',
  dinner: 'Ужин',
}

function getSlotLabel(slot: MealSlotType) {
  if (slot.startsWith('snack-')) {
    return `Перекус ${slot.replace('snack-', '')}`
  }
  return slotLabels[slot]
}

function getTodayDate() {
  const date = new Date()
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = String(date.getFullYear())
  return `${day}.${month}.${year}`
}

export function PlannerPage() {
  const navigate = useNavigate()
  const [dragFrom, setDragFrom] = useState<string | null>(null)
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [recipesStatus, setRecipesStatus] = useState<'loading' | 'ready' | 'error'>('loading')

  const {
    daysCount,
    snacksCount,
    slotsMap,
    errorMessage,
    submitMessage,
    setDays,
    setSnacks,
    assignRecipe,
    swapSlots,
    clearSlot,
    setError,
    setSubmitMessage,
    resetMessages,
  } = useUnit({
    daysCount: $daysCount,
    snacksCount: $snacksCount,
    slotsMap: $slotsMap,
    errorMessage: $plannerError,
    submitMessage: $plannerSubmitMessage,
    setDays: daysCountChanged,
    setSnacks: snacksCountChanged,
    assignRecipe: recipeAssignedToSlot,
    swapSlots: slotsSwapped,
    clearSlot: slotCleared,
    setError: plannerErrorSet,
    setSubmitMessage: plannerSubmitMessageSet,
    resetMessages: plannerMessagesReset,
  })
  const authStatus = useUnit($authStatus)

  const slotTypes = useMemo(() => {
    const snackTypes = Array.from(
      { length: snacksCount },
      (_, index) => `snack-${index + 1}` as const,
    )
    return ['breakfast', 'lunch', 'dinner', ...snackTypes] as MealSlotType[]
  }, [snacksCount])

  const dayIndexes = useMemo(
    () => Array.from({ length: daysCount }, (_, index) => index + 1),
    [daysCount],
  )

  useEffect(() => {
    if (recipesStatus !== 'loading') {
      return
    }

    fetchRecipes()
      .then((data) => {
        setRecipes(data)
        setRecipesStatus('ready')
      })
      .catch(() => setRecipesStatus('error'))
  }, [recipesStatus])

  if (recipesStatus === 'loading') {
    return <PageLoader title="Загружаем рецепты для конструктора..." />
  }

  if (recipesStatus === 'error') {
    return (
      <PageError
        message="Не удалось загрузить каталог рецептов."
        onRetry={() => setRecipesStatus('loading')}
      />
    )
  }

  const onDropToSlot = (slotKey: string, payload: string) => {
    if (payload.startsWith('recipe:')) {
      assignRecipe({ slotKey, recipeId: payload.replace('recipe:', '') })
      return
    }

    if (payload.startsWith('slot:')) {
      swapSlots({ sourceSlot: payload.replace('slot:', ''), targetSlot: slotKey })
    }
  }

  const submitPlan = async () => {
    if (authStatus !== 'auth') {
      resetMessages()
      setError('Для отправки плана на модерацию войдите в аккаунт.')
      navigate('/auth')
      return
    }

    const requiredSlots = dayIndexes.flatMap((dayIndex) =>
      ['breakfast', 'lunch', 'dinner'].map((slot) => `${dayIndex}:${slot}`),
    )
    const missingRequired = requiredSlots.some((slotKey) => !slotsMap[slotKey])

    if (missingRequired) {
      setError('Заполните обязательно завтрак, обед и ужин для каждого дня.')
      setSubmitMessage('')
      return
    }

    const newStatusTitle =
      daysCount === 1
        ? 'Пользовательский план на 1 день'
        : `Пользовательский план на ${daysCount} дней`

    try {
      const backendPlanId = await submitPlannerToBackend({ daysCount, slotsMap })
      appendModerationStatus({
        id: `planner-${backendPlanId}`,
        type: 'План питания',
        title: `План #${backendPlanId}`,
        status: 'На ревью',
        updatedAt: getTodayDate(),
      })
      resetMessages()
      setSubmitMessage(
        `План #${backendPlanId} отправлен на модерацию. Статус доступен в личном кабинете.`,
      )
    } catch {
      appendModerationStatus({
        id: `planner-${Date.now()}`,
        type: 'План питания',
        title: newStatusTitle,
        status: 'На ревью',
        updatedAt: getTodayDate(),
      })
      resetMessages()
      setSubmitMessage(
        'План отправлен локально. Войдите в аккаунт, чтобы отправлять планы напрямую на сервер.',
      )
    }
  }

  return (
    <Stack gap="md">
      <Card withBorder radius="md" p="lg" style={{ background: 'var(--bg-surface)' }}>
        <Title order={1}>Конструктор плана питания</Title>
        <Text mt={6}>
          Выберите период планирования, добавьте перекусы и перетащите рецепты в календарь.
        </Text>
      </Card>

      <Grid gap="md" align="start">
        <Grid.Col span={{ base: 12, lg: 4 }}>
          <Card withBorder radius="md" p="lg" className="planner-controls">
          <Title order={3}>Параметры плана</Title>
          <Stack mt={10}>
            <NumberInput
              label="Количество дней"
              min={1}
              max={14}
              value={daysCount}
              onChange={(value: number | string) => {
                const next = typeof value === 'number' ? value : Number(value)
                setDays(Number.isNaN(next) ? 1 : Math.min(14, Math.max(1, next)))
              }}
            />
            <NumberInput
              label="Перекусов в день"
              min={0}
              max={4}
              value={snacksCount}
              onChange={(value: number | string) => {
                const next = typeof value === 'number' ? value : Number(value)
                setSnacks(Number.isNaN(next) ? 0 : Math.min(4, Math.max(0, next)))
              }}
            />
          </Stack>

          <Text className="planner-note">Обязательные приемы пищи: завтрак, обед, ужин.</Text>

          <Button mt={8} color="grape" onClick={submitPlan}>
            Отправить план на модерацию
          </Button>
          <Button
            mt={8}
            variant="light"
            color="grape"
            onClick={() => navigate('/profile')}
          >
            Открыть статусы в ЛК
          </Button>

            {errorMessage ? (
            <Alert mt={10} color="red" title="Проверьте заполнение плана">
              {errorMessage}
            </Alert>
          ) : null}
          {submitMessage ? (
            <Alert mt={10} color="green" title="Отправка выполнена">
              {submitMessage}
            </Alert>
          ) : null}
          </Card>
        </Grid.Col>

        <Grid.Col span={{ base: 12, lg: 8 }}>
        <Stack gap="md">
          <Card withBorder radius="md" p="lg" style={{ background: 'var(--bg-surface)' }}>
            <Title order={3}>Каталог рецептов</Title>
            <div className="planner-recipes">
              {recipes.map((recipe) => (
                <button
                  key={recipe.id}
                  className="planner-recipe"
                  type="button"
                  draggable
                  onDragStart={(event) => {
                    event.dataTransfer.setData('text/plain', `recipe:${recipe.id}`)
                  }}
                >
                  <strong>{recipe.title}</strong>
                  <span>{recipe.cookingTime}</span>
                  <span>{recipe.calories} ккал</span>
                </button>
              ))}
            </div>
          </Card>

          <Card withBorder radius="md" p="lg" style={{ background: 'var(--bg-surface)' }}>
            <Title order={3}>Календарь плана</Title>
            <div className="planner-calendar">
              {dayIndexes.map((dayIndex) => (
                <section key={dayIndex} className="planner-day-card">
                  <Title order={4}>День {dayIndex}</Title>
                  <SimpleGrid cols={{ base: 1, md: 2 }} spacing="sm" mt={8}>
                    {slotTypes.map((slotType) => {
                      const slotKey = `${dayIndex}:${slotType}`
                      const recipeId = slotsMap[slotKey]
                      const recipe = recipes.find((item) => item.id === recipeId)

                      return (
                        <div
                          key={slotKey}
                          className="planner-slot"
                          onDragOver={(event) => event.preventDefault()}
                          onDrop={(event) => {
                            const payload = event.dataTransfer.getData('text/plain')
                            onDropToSlot(slotKey, payload)
                          }}
                        >
                          <div className="planner-slot-head">
                            <span>{getSlotLabel(slotType)}</span>
                            {recipe ? (
                              <button
                                type="button"
                                className="planner-clear-btn"
                                onClick={() => clearSlot(slotKey)}
                              >
                                Очистить
                              </button>
                            ) : null}
                          </div>
                          {recipe ? (
                            <button
                              type="button"
                              className="planner-assigned"
                              draggable
                              onDragStart={(event) => {
                                const payload = `slot:${slotKey}`
                                setDragFrom(payload)
                                event.dataTransfer.setData('text/plain', payload)
                              }}
                              onDragEnd={() => setDragFrom(null)}
                            >
                              <strong>{recipe.title}</strong>
                              <span>
                                {recipe.calories} ккал - {recipe.cookingTime}
                              </span>
                            </button>
                          ) : (
                            <p className="planner-empty">
                              {dragFrom ? 'Отпустите рецепт сюда' : 'Перетащите рецепт'}
                            </p>
                          )}
                        </div>
                      )
                    })}
                  </SimpleGrid>
                </section>
              ))}
            </div>
          </Card>
        </Stack>
        </Grid.Col>
      </Grid>
    </Stack>
  )
}
