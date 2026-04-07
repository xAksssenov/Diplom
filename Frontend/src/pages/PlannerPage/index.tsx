import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Badge,
  Alert,
  Button,
  Card,
  Grid,
  Group,
  NumberInput,
  ScrollArea,
  Stack,
  Text,
  TextInput,
  Title,
} from '@mantine/core'
import { useUnit } from 'effector-react'
import { useNavigate } from 'react-router-dom'
import { fetchRecipesPage, submitPlannerToBackend } from '../../shared/api/foodApi'
import { $authStatus, $authUser } from '../../features/auth/model'
import {
  $daysCount,
  $plannerError,
  $plannerSubmitMessage,
  $slotsMap,
  daysCountChanged,
  plannerErrorSet,
  plannerMessagesReset,
  plannerSubmitMessageSet,
  recipeAssignedToSlot,
  slotCleared,
  slotsSwapped,
} from '../../features/planner/model'
import { appendModerationStatus } from '../../lib/moderationStorage'
import { pushApiError, pushError, pushSuccess } from '../../shared/model/notifications'
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
  const prevDaysCountRef = useRef<number>(3)
  const [dragFrom, setDragFrom] = useState<string | null>(null)
  const [activeDropSlot, setActiveDropSlot] = useState<string | null>(null)
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [recipeSearch, setRecipeSearch] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [profileTagsApplied, setProfileTagsApplied] = useState(false)
  const [daySnackCounts, setDaySnackCounts] = useState<Record<number, number>>({})
  const [recipesNextOffset, setRecipesNextOffset] = useState<number | null>(0)
  const [recipesLoadingMore, setRecipesLoadingMore] = useState(false)
  const [recipesStatus, setRecipesStatus] = useState<'loading' | 'ready' | 'error'>('loading')

  const {
    daysCount,
    slotsMap,
    errorMessage,
    submitMessage,
    setDays,
    assignRecipe,
    swapSlots,
    clearSlot,
    setError,
    setSubmitMessage,
    resetMessages,
  } = useUnit({
    daysCount: $daysCount,
    slotsMap: $slotsMap,
    errorMessage: $plannerError,
    submitMessage: $plannerSubmitMessage,
    setDays: daysCountChanged,
    assignRecipe: recipeAssignedToSlot,
    swapSlots: slotsSwapped,
    clearSlot: slotCleared,
    setError: plannerErrorSet,
    setSubmitMessage: plannerSubmitMessageSet,
    resetMessages: plannerMessagesReset,
  })
  const { authStatus, authUser } = useUnit({
    authStatus: $authStatus,
    authUser: $authUser,
  })
  const allTags = useMemo(
    () => Array.from(new Set(recipes.flatMap((recipe) => recipe.tags))),
    [recipes],
  )
  const orderedTags = useMemo(() => {
    return [...allTags].sort((a, b) => {
      const aSelected = selectedTags.includes(a) ? 0 : 1
      const bSelected = selectedTags.includes(b) ? 0 : 1
      if (aSelected !== bSelected) return aSelected - bSelected
      return a.localeCompare(b)
    })
  }, [allTags, selectedTags])

  const dayIndexes = useMemo(
    () => Array.from({ length: daysCount }, (_, index) => index + 1),
    [daysCount],
  )
  const filteredRecipes = useMemo(() => {
    const query = recipeSearch.trim().toLowerCase()
    return recipes.filter((recipe) => {
      const text = `${recipe.title} ${recipe.subtitle} ${recipe.tags.join(' ')}`.toLowerCase()
      const matchesText = !query || text.includes(query)
      const matchesTags = !selectedTags.length || selectedTags.some((tag) => recipe.tags.includes(tag))
      return matchesText && matchesTags
    })
  }, [recipeSearch, recipes, selectedTags])

  const getSlotTypesForDay = (dayIndex: number): MealSlotType[] => {
    const snacks = daySnackCounts[dayIndex] ?? 0
    const snackTypes = Array.from({ length: snacks }, (_, index) => `snack-${index + 1}` as const)
    return ['breakfast', 'lunch', 'dinner', ...snackTypes]
  }

  useEffect(() => {
    setDaySnackCounts((prev) => {
      const next: Record<number, number> = {}
      dayIndexes.forEach((dayIndex) => {
        next[dayIndex] = prev[dayIndex] ?? 0
      })
      return next
    })
  }, [dayIndexes])

  useEffect(() => {
    if (profileTagsApplied || !allTags.length) return
    const preferences = [...(authUser?.favorite_tags ?? []), ...(authUser?.health_features ?? [])].map((item) =>
      item.toLowerCase(),
    )
    if (!preferences.length) {
      setProfileTagsApplied(true)
      return
    }
    const preset = allTags.filter((tag) =>
      preferences.some((pref) => tag.toLowerCase().includes(pref) || pref.includes(tag.toLowerCase())),
    )
    setSelectedTags(preset)
    setProfileTagsApplied(true)
  }, [allTags, authUser?.favorite_tags, authUser?.health_features, profileTagsApplied])

  useEffect(() => {
    const prevDays = prevDaysCountRef.current
    if (daysCount < prevDays) {
      Object.keys(slotsMap).forEach((slotKey) => {
        const [dayRaw] = slotKey.split(':')
        const dayNumber = Number(dayRaw)
        if (dayNumber > daysCount) {
          clearSlot(slotKey)
        }
      })
    }
    prevDaysCountRef.current = daysCount
  }, [clearSlot, daysCount, slotsMap])

  useEffect(() => {
    if (recipesStatus !== 'loading') {
      return
    }

    fetchRecipesPage({ limit: 36, offset: 0 })
      .then((data) => {
        setRecipes(data.items)
        setRecipesNextOffset(data.nextOffset)
        setRecipesStatus('ready')
      })
      .catch((error) => {
        setRecipesStatus('error')
        pushApiError(error, 'Не удалось загрузить рецепты для конструктора.')
      })
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
    setActiveDropSlot(null)
    if (payload.startsWith('recipe:')) {
      assignRecipe({ slotKey, recipeId: payload.replace('recipe:', '') })
      return
    }

    if (payload.startsWith('slot:')) {
      swapSlots({ sourceSlot: payload.replace('slot:', ''), targetSlot: slotKey })
    }
  }

  const clearDay = (dayIndex: number) => {
    getSlotTypesForDay(dayIndex).forEach((slotType) => {
      clearSlot(`${dayIndex}:${slotType}`)
    })
  }

  const clearAll = () => {
    dayIndexes.forEach((dayIndex) => clearDay(dayIndex))
  }

  const resetPlannerAfterSubmit = () => {
    clearAll()
    setDays(3)
    setDaySnackCounts({})
    setRecipeSearch('')
    setSelectedTags([])
  }

  const updateDaySnacks = (dayIndex: number, delta: number) => {
    setDaySnackCounts((prev) => {
      const current = prev[dayIndex] ?? 0
      const nextCount = Math.min(4, Math.max(0, current + delta))
      if (nextCount < current) {
        for (let snackIndex = current; snackIndex > nextCount; snackIndex -= 1) {
          clearSlot(`${dayIndex}:snack-${snackIndex}`)
        }
      }
      return {
        ...prev,
        [dayIndex]: nextCount,
      }
    })
  }

  const submitPlan = async () => {
    if (authStatus !== 'auth') {
      resetMessages()
      setError('Для отправки плана на модерацию войдите в аккаунт.')
      pushError('Для отправки плана на модерацию войдите в аккаунт.')
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
      pushError('Заполните завтрак, обед и ужин для каждого дня.')
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
      pushSuccess(`План #${backendPlanId} отправлен на модерацию.`)
      resetPlannerAfterSubmit()
    } catch (error) {
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
      pushApiError(error, 'Сервер недоступен, план сохранен локально.')
    }
  }

  return (
    <Stack gap="md">
      <Card withBorder radius="md" p="lg" style={{ background: 'var(--bg-surface)' }}>
        <Title order={1}>Конструктор плана питания</Title>
        <Text mt={6}>
          Выберите период планирования, настройте перекусы по дням и перетащите рецепты в календарь.
        </Text>
      </Card>

      <Card withBorder radius="md" p="lg" style={{ background: 'var(--bg-surface)' }}>
        <Group gap="md" align="end" wrap="wrap">
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
          <Button color="grape" onClick={submitPlan}>
            Отправить план на модерацию
          </Button>
          <Button variant="light" color="grape" onClick={() => navigate('/profile')}>
            Открыть статусы в ЛК
          </Button>
          <Button variant="light" color="red" onClick={clearAll}>
            Очистить весь план
          </Button>
        </Group>
      </Card>

      <Grid gap="md" align="start">
        <Grid.Col span={{ base: 12, lg: 4 }}>
          <Card withBorder radius="md" p="lg" className="planner-controls planner-panel-card">
            <Title order={4}>Каталог рецептов</Title>
            <Text size="sm" c="dimmed">
              Перетащите рецепт в слот календаря справа. Перекусы настраиваются отдельно для каждого дня.
            </Text>
            <TextInput
              mt={8}
              placeholder="Поиск по каталогу рецептов"
              value={recipeSearch}
              onChange={(event) => setRecipeSearch(event.currentTarget.value)}
            />
            <ScrollArea type="auto" mt={8}>
              <div className="planner-tags-row">
                {orderedTags.map((tag) => (
                  <Badge
                    key={tag}
                    color="grape"
                    variant={selectedTags.includes(tag) ? 'filled' : 'light'}
                    className="planner-tag-chip"
                    onClick={() =>
                      setSelectedTags((prev) =>
                        prev.includes(tag) ? prev.filter((value) => value !== tag) : [...prev, tag],
                      )
                    }
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            </ScrollArea>
            <ScrollArea mt={8} className="planner-panel-scroll">
              <div className="planner-recipes">
                {filteredRecipes.map((recipe) => (
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
                    <div className="planner-recipe-tags">
                      {recipe.tags.slice(0, 2).map((tag) => (
                        <Badge key={tag} variant="light" size="xs" color="grape">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </button>
                ))}
                {!filteredRecipes.length ? (
                  <Text size="sm" c="dimmed">
                    По текущему запросу рецепты не найдены.
                  </Text>
                ) : null}
              </div>
              {recipesNextOffset !== null ? (
                <Button
                  mt={10}
                  variant="light"
                  color="grape"
                  fullWidth
                  loading={recipesLoadingMore}
                  onClick={async () => {
                    setRecipesLoadingMore(true)
                    try {
                      const next = await fetchRecipesPage({ limit: 36, offset: recipesNextOffset })
                      setRecipes((prev) => [...prev, ...next.items])
                      setRecipesNextOffset(next.nextOffset)
                    } catch (error) {
                      pushApiError(error, 'Не удалось подгрузить рецепты.')
                    } finally {
                      setRecipesLoadingMore(false)
                    }
                  }}
                >
                  Подгрузить еще рецепты
                </Button>
              ) : null}
            </ScrollArea>
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
          <Card
            withBorder
            radius="md"
            p="lg"
            className="planner-panel-card"
            style={{ background: 'var(--bg-surface)' }}
          >
            <Title order={3}>Вертикальный календарь плана</Title>
            <Text size="sm" c="dimmed" mt={4}>
              Нечетные и четные дни визуально разделены. Для каждого дня можно задать свое количество перекусов.
            </Text>
            <ScrollArea mt={10} className="planner-panel-scroll">
              <div className="planner-calendar">
                {dayIndexes.map((dayIndex) => (
                  <section
                    key={dayIndex}
                    className={`planner-day-card ${dayIndex % 2 === 0 ? 'planner-day-even' : 'planner-day-odd'}`}
                  >
                    <div className="planner-day-head">
                      <Title order={4}>День {dayIndex}</Title>
                      <Group gap={6}>
                        <Button
                          size="compact-xs"
                          variant="light"
                          color="grape"
                          onClick={() => updateDaySnacks(dayIndex, 1)}
                          disabled={(daySnackCounts[dayIndex] ?? 0) >= 4}
                        >
                          + Перекус
                        </Button>
                        <Button
                          size="compact-xs"
                          variant="light"
                          color="grape"
                          onClick={() => updateDaySnacks(dayIndex, -1)}
                          disabled={(daySnackCounts[dayIndex] ?? 0) <= 0}
                        >
                          - Перекус
                        </Button>
                        <Button
                          size="compact-xs"
                          variant="subtle"
                          color="red"
                          onClick={() => clearDay(dayIndex)}
                        >
                          Очистить день
                        </Button>
                      </Group>
                    </div>
                    <Text size="xs" c="dimmed" mt={4}>
                      Перекусов в этом дне: {daySnackCounts[dayIndex] ?? 0}
                    </Text>
                    <Stack gap="sm" mt={8}>
                      {getSlotTypesForDay(dayIndex).map((slotType) => {
                        const slotKey = `${dayIndex}:${slotType}`
                        const recipeId = slotsMap[slotKey]
                        const recipe = recipes.find((item) => item.id === recipeId)
                        const isDropActive = activeDropSlot === slotKey

                        return (
                          <div
                            key={slotKey}
                            className={`planner-slot ${isDropActive ? 'planner-slot-active' : ''}`}
                            onDragOver={(event) => {
                              event.preventDefault()
                              setActiveDropSlot(slotKey)
                            }}
                            onDragLeave={() => setActiveDropSlot((prev) => (prev === slotKey ? null : prev))}
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
                                onDragEnd={() => {
                                  setDragFrom(null)
                                  setActiveDropSlot(null)
                                }}
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
                    </Stack>
                  </section>
                ))}
              </div>
            </ScrollArea>
          </Card>
          </Stack>
        </Grid.Col>
      </Grid>
    </Stack>
  )
}
