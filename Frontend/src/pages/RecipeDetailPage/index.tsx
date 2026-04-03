import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { FallbackCard } from '../../components/FallbackCard'
import { recipes } from '../../data/mockData'
import './styles.css'

export function RecipeDetailPage() {
  const { recipeId } = useParams<{ recipeId: string }>()
  const recipe = recipes.find((item) => item.id === recipeId)
  const [activeImage, setActiveImage] = useState(0)

  if (!recipe) {
    return <FallbackCard message="Рецепт не найден." />
  }

  return (
    <section className="content-stack">
      <div className="glass-card details-top">
        <div className="recipe-gallery">
          <div
            className="recipe-gallery__main"
            style={{ background: recipe.images[activeImage] }}
          />
          <div className="recipe-gallery__thumbs">
            {recipe.images.map((imageColor, index) => (
              <button
                key={imageColor}
                className={`thumb ${index === activeImage ? 'thumb--active' : ''}`}
                style={{ background: imageColor }}
                type="button"
                onClick={() => setActiveImage(index)}
              />
            ))}
          </div>
        </div>

        <div className="recipe-info">
          <h1>{recipe.title}</h1>
          <p>{recipe.subtitle}</p>
          <div className="meta-row">
            <span>{recipe.cookingTime}</span>
            <span>★ {recipe.rating}</span>
            <span>{recipe.calories} ккал</span>
          </div>
          <div className="tag-row">
            {recipe.tags.map((tag) => (
              <span key={tag} className="tag-pill">
                {tag}
              </span>
            ))}
          </div>
          <div className="action-row">
            <button type="button" className="text-link">
              В избранное
            </button>
            <button type="button" className="text-link" onClick={() => window.print()}>
              Напечатать
            </button>
          </div>
        </div>
      </div>

      <div className="details-grid">
        <article className="glass-card">
          <h2>Пищевая ценность</h2>
          <div className="nutrition-grid">
            <span>Калории: {recipe.calories}</span>
            <span>Белки: {recipe.nutrition.protein} г</span>
            <span>Жиры: {recipe.nutrition.fat} г</span>
            <span>Углеводы: {recipe.nutrition.carbs} г</span>
          </div>
        </article>

        <article className="glass-card">
          <h2>Отзывы и оценки</h2>
          <p>Средняя оценка: {recipe.rating} / 5</p>
          <button type="button" className="text-link">
            Оставить отзыв
          </button>
        </article>
      </div>

      <details className="glass-card collapsible" open>
        <summary>Ингредиенты</summary>
        <ul>
          {recipe.ingredients.map((ingredient) => (
            <li key={ingredient}>{ingredient}</li>
          ))}
        </ul>
      </details>

      <details className="glass-card collapsible" open>
        <summary>Процесс приготовления</summary>
        <ol>
          {recipe.steps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      </details>
    </section>
  )
}
