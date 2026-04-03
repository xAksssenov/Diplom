import { useParams } from 'react-router-dom'
import { FallbackCard } from '../../components/FallbackCard'
import { MealInfo } from '../../components/MealInfo'
import { mealPlans, planReviews } from '../../data/mockData'
import './styles.css'

export function MealPlanDetailPage() {
  const { planId } = useParams<{ planId: string }>()
  const plan = mealPlans.find((item) => item.id === planId)

  if (!plan) {
    return <FallbackCard message="План питания не найден." />
  }

  return (
    <section className="content-stack">
      <article className="glass-card">
        <h1>{plan.title}</h1>
        <p>{plan.description}</p>
        <div className="meta-row">
          <span>Оценок: {plan.reviewsCount}</span>
          <span>★ {plan.rating}</span>
          <span>{plan.calories} ккал</span>
          <span>
            Б/Ж/У: {plan.protein}/{plan.fat}/{plan.carbs}
          </span>
        </div>
        <div className="action-row">
          <button type="button" className="text-link">
            Оценить план
          </button>
          <button type="button" className="text-link">
            Комментарий
          </button>
          <button type="button" className="text-link">
            В избранное
          </button>
        </div>
      </article>

      {plan.days.map((day) => (
        <article className="glass-card" key={day.day}>
          <h2>День {day.day}</h2>

          <details className="collapsible" open>
            <summary>Завтрак</summary>
            <MealInfo meal={day.meals.breakfast} />
          </details>

          <details className="collapsible">
            <summary>Обед</summary>
            <MealInfo meal={day.meals.lunch} />
          </details>

          <details className="collapsible">
            <summary>Ужин</summary>
            <MealInfo meal={day.meals.dinner} />
          </details>

          <details className="collapsible">
            <summary>Перекусы ({day.meals.snacks.length})</summary>
            {day.meals.snacks.map((snack) => (
              <MealInfo key={snack.title} meal={snack} />
            ))}
          </details>
        </article>
      ))}

      <article className="glass-card">
        <h2>Отзывы и оценки по плану</h2>
        {planReviews
          .filter((review) => review.planId === plan.id)
          .map((review) => (
            <div key={review.id} className="inline-review">
              <p>
                {review.author}: {review.comment}
              </p>
              <span>★ {review.rating}</span>
            </div>
          ))}
      </article>
    </section>
  )
}
