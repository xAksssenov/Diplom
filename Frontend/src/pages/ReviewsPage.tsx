import { planReviews } from '../data/mockData'

type ReviewsPageProps = {
  onNavigate: (path: string) => void
}

export function ReviewsPage({ onNavigate }: ReviewsPageProps) {
  return (
    <section className="content-stack">
      <div className="glass-card">
        <h1>Оценки и отзывы</h1>
        <p>Отзывы на планы питания с быстрым переходом к деталям.</p>
      </div>
      <div className="cards-grid">
        {planReviews.map((review) => (
          <article key={review.id} className="glass-card review-card">
            <h2>{review.planTitle}</h2>
            <p>{review.comment}</p>
            <div className="meta-row">
              <span>{review.author}</span>
              <span>★ {review.rating}</span>
            </div>
            <button
              type="button"
              className="text-link"
              onClick={() => onNavigate(`/meal-plans/${review.planId}`)}
            >
              Перейти к плану
            </button>
          </article>
        ))}
      </div>
    </section>
  )
}
