import { useMemo, useState } from 'react'
import { mealPlans, recipes } from '../data/mockData'
import { getModerationStatuses } from '../lib/moderationStorage'
import type { ModerationStatusItem } from '../types/domain'

type FavoritesTab = 'mealPlans' | 'recipes'

const availableTags = [
  'Завтрак',
  'Быстро',
  'Без глютена',
  'Вегетарианское',
  'Высокобелковое',
  'Детское',
  'Без лактозы',
]

const moderationStatuses: ModerationStatusItem[] = [
  {
    id: 's1',
    type: 'План питания',
    title: 'Фит-неделя для поддержания формы',
    status: 'На ревью',
    updatedAt: '03.04.2026',
  },
  {
    id: 's2',
    type: 'Отзыв',
    title: 'Комментарий к плану "День для мягкого дефицита"',
    status: 'Одобрено',
    updatedAt: '02.04.2026',
  },
  {
    id: 's3',
    type: 'Рецепт',
    title: 'Протеиновый боул на завтрак',
    status: 'Отклонено (нужны правки)',
    updatedAt: '01.04.2026',
  },
]

export function ProfilePage() {
  const [favoriteTab, setFavoriteTab] = useState<FavoritesTab>('mealPlans')
  const [favoriteTags, setFavoriteTags] = useState<string[]>([
    'Завтрак',
    'Без глютена',
    'Высокобелковое',
  ])
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [profileVisibility, setProfileVisibility] = useState(false)

  const favoriteMealPlans = useMemo(() => mealPlans.slice(0, 2), [])
  const favoriteRecipes = useMemo(() => recipes.slice(0, 2), [])
  const recentModerationStatuses = useMemo(
    () => [...getModerationStatuses(), ...moderationStatuses],
    [],
  )

  const toggleTag = (tag: string) => {
    setFavoriteTags((currentTags) =>
      currentTags.includes(tag)
        ? currentTags.filter((currentTag) => currentTag !== tag)
        : [...currentTags, tag],
    )
  }

  return (
    <section className="content-stack">
      <article className="glass-card profile-head">
        <div className="profile-avatar" aria-hidden>
          AK
        </div>
        <div className="profile-main-info">
          <h1>Алексей К.</h1>
          <p>Email: ak@example.com</p>
          <p>Цель: Поддержание веса</p>
          <p>Рост/вес: 181 см / 78 кг</p>
        </div>
      </article>

      <article className="glass-card">
        <h2>Особенности здоровья</h2>
        <div className="tag-row">
          <span className="tag-pill">Непереносимость лактозы</span>
          <span className="tag-pill">Чувствительность к глютену</span>
          <span className="tag-pill">Норма соли под контролем</span>
        </div>
      </article>

      <article className="glass-card">
        <h2>Любимые теги</h2>
        <p>Быстрый выбор персональных предпочтений:</p>
        <div className="tag-row">
          {availableTags.map((tag) => {
            const active = favoriteTags.includes(tag)
            return (
              <button
                key={tag}
                type="button"
                className={`tag-pill ${active ? 'tag-pill--active' : ''}`}
                onClick={() => toggleTag(tag)}
              >
                {tag}
              </button>
            )
          })}
        </div>
      </article>

      <article className="glass-card">
        <h2>Избранное</h2>
        <div className="profile-tabs">
          <button
            type="button"
            className={`profile-tab ${favoriteTab === 'mealPlans' ? 'profile-tab--active' : ''}`}
            onClick={() => setFavoriteTab('mealPlans')}
          >
            Планы питания
          </button>
          <button
            type="button"
            className={`profile-tab ${favoriteTab === 'recipes' ? 'profile-tab--active' : ''}`}
            onClick={() => setFavoriteTab('recipes')}
          >
            Рецепты
          </button>
        </div>

        <div className="cards-grid">
          {favoriteTab === 'mealPlans' &&
            favoriteMealPlans.map((plan) => (
              <article key={plan.id} className="glass-card compact-card">
                <h3>{plan.title}</h3>
                <p>{plan.planType}</p>
                <div className="meta-row">
                  <span>{plan.calories} ккал</span>
                  <span>★ {plan.rating}</span>
                </div>
              </article>
            ))}

          {favoriteTab === 'recipes' &&
            favoriteRecipes.map((recipe) => (
              <article key={recipe.id} className="glass-card compact-card">
                <h3>{recipe.title}</h3>
                <p>{recipe.subtitle}</p>
                <div className="meta-row">
                  <span>{recipe.cookingTime}</span>
                  <span>★ {recipe.rating}</span>
                </div>
              </article>
            ))}
        </div>
      </article>

      <article className="glass-card">
        <h2>Статусы модерации</h2>
        <div className="status-list">
          {recentModerationStatuses.map((statusItem) => (
            <div key={statusItem.id} className="status-row">
              <p>
                <strong>{statusItem.type}:</strong> {statusItem.title}
              </p>
              <div className="meta-row">
                <span>{statusItem.status}</span>
                <span>Обновлено: {statusItem.updatedAt}</span>
              </div>
            </div>
          ))}
        </div>
      </article>

      <article className="glass-card">
        <h2>Базовые настройки аккаунта</h2>
        <div className="settings-list">
          <label className="settings-row">
            <span>Email-уведомления о модерации</span>
            <input
              type="checkbox"
              checked={emailNotifications}
              onChange={() => setEmailNotifications((state) => !state)}
            />
          </label>
          <label className="settings-row">
            <span>Публичность профиля</span>
            <input
              type="checkbox"
              checked={profileVisibility}
              onChange={() => setProfileVisibility((state) => !state)}
            />
          </label>
        </div>
      </article>
    </section>
  )
}
