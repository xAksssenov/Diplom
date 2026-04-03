import { PreviewCard } from '../components/PreviewCard'
import { textKeys } from '../shared/config/texts'

type AboutPageProps = {
  onNavigate: (path: string) => void
}

export function AboutPage({ onNavigate }: AboutPageProps) {
  return (
    <section>
      <div className="glass-card">
        <h1>Планируйте питание под свои цели</h1>
        <p>
          FoodPlanner объединяет рецепты, планы питания и отзывы в одном месте.
          Выберите готовый план или соберите свой.
        </p>
        <button
          type="button"
          className="cta-link"
          onClick={() => onNavigate('/meal-plans')}
        >
          {textKeys.cta.planner}
        </button>
      </div>

      <div className="cards-grid">
        <PreviewCard
          title="Рецепты"
          description="Подборки по тегам, калорийности и диетическим предпочтениям."
          linkPath="/recipes"
          onNavigate={onNavigate}
        />
        <PreviewCard
          title="Планы питания"
          description="Планы на день, неделю или месяц с детальным расписанием."
          linkPath="/meal-plans"
          onNavigate={onNavigate}
        />
        <PreviewCard
          title="Оценки и отзывы"
          description="Просматривайте отзывы пользователей и переходите к планам."
          linkPath="/reviews"
          onNavigate={onNavigate}
        />
      </div>
    </section>
  )
}
