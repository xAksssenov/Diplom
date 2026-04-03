import { Link } from 'react-router-dom'
import { PreviewCard } from '../../components/PreviewCard'
import { textKeys } from '../../shared/config/texts'
import './styles.css'

export function AboutPage() {
  return (
    <section>
      <div className="glass-card">
        <h1>Планируйте питание под свои цели</h1>
        <p>
          FoodPlanner объединяет рецепты, планы питания и отзывы в одном месте.
          Выберите готовый план или соберите свой.
        </p>
        <Link to="/meal-plans" className="cta-link">
          {textKeys.cta.planner}
        </Link>
      </div>

      <div className="cards-grid">
        <PreviewCard
          title="Рецепты"
          description="Подборки по тегам, калорийности и диетическим предпочтениям."
          linkPath="/recipes"
        />
        <PreviewCard
          title="Планы питания"
          description="Планы на день, неделю или месяц с детальным расписанием."
          linkPath="/meal-plans"
        />
        <PreviewCard
          title="Оценки и отзывы"
          description="Просматривайте отзывы пользователей и переходите к планам."
          linkPath="/reviews"
        />
      </div>
    </section>
  )
}
