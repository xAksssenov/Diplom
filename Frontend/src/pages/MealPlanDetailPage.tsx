import { MealInfo } from '../components/MealInfo'
import { planReviews } from '../data/mockData'
import type { MealPlan } from '../types/domain'

type MealPlanDetailPageProps = {
  plan: MealPlan
  onNavigate: (path: string) => void
}

export function MealPlanDetailPage({ plan, onNavigate }: MealPlanDetailPageProps) {
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
            <MealInfo meal={day.meals.breakfast} onNavigate={onNavigate} />
          </details>

          <details className="collapsible">
            <summary>Обед</summary>
            <MealInfo meal={day.meals.lunch} onNavigate={onNavigate} />
          </details>

          <details className="collapsible">
            <summary>Ужин</summary>
            <MealInfo meal={day.meals.dinner} onNavigate={onNavigate} />
          </details>

          <details className="collapsible">
            <summary>Перекусы ({day.meals.snacks.length})</summary>
            {day.meals.snacks.map((snack) => (
              <MealInfo key={snack.title} meal={snack} onNavigate={onNavigate} />
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
