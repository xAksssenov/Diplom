import { useMemo, useState } from 'react'
import { useUnit } from 'effector-react'
import { useNavigate } from 'react-router-dom'
import { recipes } from '../../data/mockData'
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

  const onDropToSlot = (slotKey: string, payload: string) => {
    if (payload.startsWith('recipe:')) {
      assignRecipe({ slotKey, recipeId: payload.replace('recipe:', '') })
      return
    }

    if (payload.startsWith('slot:')) {
      swapSlots({ sourceSlot: payload.replace('slot:', ''), targetSlot: slotKey })
    }
  }

  const submitPlan = () => {
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

    appendModerationStatus({
      id: `planner-${Date.now()}`,
      type: 'План питания',
      title: newStatusTitle,
      status: 'На ревью',
      updatedAt: getTodayDate(),
    })

    resetMessages()
    setSubmitMessage('План отправлен на модерацию. Статус доступен в личном кабинете.')
  }

  return (
    <section className="content-stack">
      <article className="glass-card">
        <h1>Конструктор плана питания</h1>
        <p>
          Выберите период планирования, добавьте перекусы и перетащите рецепты в календарь.
        </p>
      </article>

      <section className="split-layout planner-layout">
        <aside className="glass-card planner-controls">
          <h2>Параметры плана</h2>
          <label className="planner-label">
            <span>Количество дней</span>
            <input
              type="number"
              min={1}
              max={14}
              value={daysCount}
              onChange={(event) => {
                const value = Number(event.target.value)
                setDays(Number.isNaN(value) ? 1 : Math.min(14, Math.max(1, value)))
              }}
            />
          </label>
          <label className="planner-label">
            <span>Перекусов в день</span>
            <input
              type="number"
              min={0}
              max={4}
              value={snacksCount}
              onChange={(event) => {
                const value = Number(event.target.value)
                setSnacks(Number.isNaN(value) ? 0 : Math.min(4, Math.max(0, value)))
              }}
            />
          </label>

          <p className="planner-note">Обязательные приемы пищи: завтрак, обед, ужин.</p>

          <button type="button" className="text-link" onClick={submitPlan}>
            Отправить план на модерацию
          </button>
          <button type="button" className="text-link" onClick={() => navigate('/profile')}>
            Открыть статусы в ЛК
          </button>

          {errorMessage ? <p className="planner-error">{errorMessage}</p> : null}
          {submitMessage ? <p className="planner-success">{submitMessage}</p> : null}
        </aside>

        <div className="content-stack">
          <article className="glass-card">
            <h2>Каталог рецептов</h2>
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
          </article>

          <article className="glass-card">
            <h2>Календарь плана</h2>
            <div className="planner-calendar">
              {dayIndexes.map((dayIndex) => (
                <section key={dayIndex} className="planner-day-card">
                  <h3>День {dayIndex}</h3>
                  <div className="planner-slot-list">
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
                  </div>
                </section>
              ))}
            </div>
          </article>
        </div>
      </section>
    </section>
  )
}
