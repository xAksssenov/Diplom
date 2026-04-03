import { useMemo, useState } from 'react'
import { recipes } from '../data/mockData'
import { appendModerationStatus } from '../lib/moderationStorage'

type PlannerPageProps = {
  onNavigate: (path: string) => void
}

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

export function PlannerPage({ onNavigate }: PlannerPageProps) {
  const [daysCount, setDaysCount] = useState(3)
  const [snacksCount, setSnacksCount] = useState(1)
  const [dragFrom, setDragFrom] = useState<string | null>(null)
  const [slotsMap, setSlotsMap] = useState<Record<string, string>>({})
  const [submitMessage, setSubmitMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

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
      const recipeId = payload.replace('recipe:', '')
      setSlotsMap((current) => ({ ...current, [slotKey]: recipeId }))
      return
    }

    if (payload.startsWith('slot:')) {
      const sourceSlot = payload.replace('slot:', '')
      setSlotsMap((current) => {
        const sourceRecipe = current[sourceSlot]
        if (!sourceRecipe) {
          return current
        }
        return {
          ...current,
          [sourceSlot]: current[slotKey] ?? '',
          [slotKey]: sourceRecipe,
        }
      })
    }
  }

  const removeSlot = (slotKey: string) => {
    setSlotsMap((current) => {
      const next = { ...current }
      delete next[slotKey]
      return next
    })
  }

  const submitPlan = () => {
    const requiredSlots = dayIndexes.flatMap((dayIndex) =>
      ['breakfast', 'lunch', 'dinner'].map((slot) => `${dayIndex}:${slot}`),
    )
    const missingRequired = requiredSlots.some((slotKey) => !slotsMap[slotKey])

    if (missingRequired) {
      setErrorMessage('Заполните обязательно завтрак, обед и ужин для каждого дня.')
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

    setErrorMessage('')
    setSubmitMessage(
      'План отправлен на модерацию. Статус доступен в личном кабинете.',
    )
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
                setDaysCount(Number.isNaN(value) ? 1 : Math.min(14, Math.max(1, value)))
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
                setSnacksCount(Number.isNaN(value) ? 0 : Math.min(4, Math.max(0, value)))
              }}
            />
          </label>

          <p className="planner-note">Обязательные приемы пищи: завтрак, обед, ужин.</p>

          <button type="button" className="text-link" onClick={submitPlan}>
            Отправить план на модерацию
          </button>
          <button type="button" className="text-link" onClick={() => onNavigate('/profile')}>
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
                                onClick={() => removeSlot(slotKey)}
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
