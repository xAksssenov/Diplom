import { Link } from 'react-router-dom'
import { FilterGroup } from '../../components/FilterGroup'
import { mealPlans } from '../../data/mockData'
import './styles.css'

export function MealPlansPage() {
  return (
    <section className="split-layout">
      <aside className="glass-card filters-panel">
        <h2>Фильтры планов</h2>
        <FilterGroup title="Тип плана" values={['На день', 'На неделю', 'На месяц']} />
        <FilterGroup title="Цель" values={['Похудение', 'Поддержание веса', 'Набор массы']} />
        <FilterGroup
          title="Диетические предпочтения"
          values={['Веганское', 'Без глютена', 'Без лактозы']}
        />
        <FilterGroup title="Калорийность" values={['1200-1600', '1600-2200', '2200+']} />
      </aside>

      <div className="content-stack">
        <div className="glass-card">
          <h1>Планы питания</h1>
          <p>Подбор планов с детальной разбивкой по дням и приемам пищи.</p>
        </div>

        <div className="cards-grid">
          {mealPlans.map((plan) => (
            <article className="glass-card plan-card" key={plan.id}>
              <h2>{plan.title}</h2>
              <p>{plan.description}</p>
              <div className="meta-row">
                <span>{plan.planType}</span>
                <span>{plan.goal}</span>
                <span>{plan.calories} ккал</span>
              </div>
              <div className="meta-row">
                <span>★ {plan.rating}</span>
                <span>{plan.reviewsCount} оценок</span>
                <span>{plan.diet}</span>
              </div>
              <Link to={`/meal-plans/${plan.id}`} className="text-link">
                Открыть план
              </Link>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
