import { createEvent, createStore } from 'effector'
import { mealPlans, recipes } from '../../data/mockData'
import { getModerationStatuses } from '../../lib/moderationStorage'
import type { ModerationStatusItem } from '../../types/domain'

export type FavoritesTab = 'mealPlans' | 'recipes'

const fallbackModerationStatuses: ModerationStatusItem[] = [
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

export const favoriteTabChanged = createEvent<FavoritesTab>()
export const favoriteTagToggled = createEvent<string>()
export const emailNotificationsToggled = createEvent()
export const profileVisibilityToggled = createEvent()

export const $favoriteTab = createStore<FavoritesTab>('mealPlans').on(
  favoriteTabChanged,
  (_, tab) => tab,
)

export const $favoriteTags = createStore<string[]>([
  'Завтрак',
  'Без глютена',
  'Высокобелковое',
]).on(favoriteTagToggled, (tags, tag) =>
  tags.includes(tag) ? tags.filter((value) => value !== tag) : [...tags, tag],
)

export const $emailNotifications = createStore(true).on(
  emailNotificationsToggled,
  (value) => !value,
)

export const $profileVisibility = createStore(false).on(
  profileVisibilityToggled,
  (value) => !value,
)

export const $favoriteMealPlans = createStore(mealPlans.slice(0, 2))
export const $favoriteRecipes = createStore(recipes.slice(0, 2))
export const $moderationStatuses = createStore<ModerationStatusItem[]>([
  ...getModerationStatuses(),
  ...fallbackModerationStatuses,
])
