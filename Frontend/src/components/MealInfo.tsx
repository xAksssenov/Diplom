import type { PlanMeal } from '../types/domain'

type MealInfoProps = {
  meal: PlanMeal
  onNavigate: (path: string) => void
}

export function MealInfo({ meal, onNavigate }: MealInfoProps) {
  return (
    <div className="meal-item">
      <p>
        <strong>{meal.title}</strong>
      </p>
      <p>Калорийность: {meal.calories} ккал</p>
      <p>Ингредиенты: {meal.ingredients}</p>
      <button
        type="button"
        className="text-link"
        onClick={() => onNavigate(`/recipes/${meal.recipeId}`)}
      >
        Открыть рецепт блюда
      </button>
    </div>
  )
}
