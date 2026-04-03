import { Link } from 'react-router-dom'
import type { PlanMeal } from '../../types/domain'
import './styles.css'

type MealInfoProps = {
  meal: PlanMeal
}

export function MealInfo({ meal }: MealInfoProps) {
  return (
    <div className="meal-item">
      <p>
        <strong>{meal.title}</strong>
      </p>
      <p>Калорийность: {meal.calories} ккал</p>
      <p>Ингредиенты: {meal.ingredients}</p>
      <Link to={`/recipes/${meal.recipeId}`} className="text-link">
        Открыть рецепт блюда
      </Link>
    </div>
  )
}
