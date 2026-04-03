import { FilterGroup } from '../components/FilterGroup'
import { recipes } from '../data/mockData'

type RecipesPageProps = {
  onNavigate: (path: string) => void
}

export function RecipesPage({ onNavigate }: RecipesPageProps) {
  return (
    <section className="split-layout">
      <aside className="glass-card filters-panel">
        <h2>Фильтры рецептов</h2>
        <FilterGroup title="Тип блюда" values={['Завтрак', 'Обед', 'Ужин', 'Перекус']} />
        <FilterGroup
          title="Диета"
          values={['Веганское', 'Вегетарианское', 'Без глютена', 'Без лактозы']}
        />
        <FilterGroup title="Время приготовления" values={['до 15 мин', '15-30 мин', '30-60 мин']} />
      </aside>

      <div className="content-stack">
        <div className="glass-card">
          <h1>Рецепты</h1>
          <p>Коллекция рецептов с фото, тегами и базовой пищевой ценностью.</p>
        </div>

        <div className="cards-grid">
          {recipes.map((recipe) => (
            <article className="glass-card recipe-card" key={recipe.id}>
              <div className="recipe-card__photo" style={{ background: recipe.images[0] }} />
              <h2>{recipe.title}</h2>
              <p>{recipe.subtitle}</p>
              <div className="meta-row">
                <span>{recipe.cookingTime}</span>
                <span>{recipe.calories} ккал</span>
                <span>★ {recipe.rating}</span>
              </div>
              <div className="tag-row">
                {recipe.tags.map((tag) => (
                  <span key={tag} className="tag-pill">
                    {tag}
                  </span>
                ))}
              </div>
              <button
                type="button"
                className="text-link"
                onClick={() => onNavigate(`/recipes/${recipe.id}`)}
              >
                Открыть рецепт
              </button>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
