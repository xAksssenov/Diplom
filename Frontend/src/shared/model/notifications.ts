import { createEvent, createStore } from 'effector'
import { getApiErrorText } from '../api/errors'

export type AppNotification = {
  id: string
  title: string
  message: string
  color: 'green' | 'red' | 'grape'
}

export const notificationPushed = createEvent<AppNotification>()
export const notificationRemoved = createEvent<string>()

export const $notifications = createStore<AppNotification[]>([])
  .on(notificationPushed, (notifications, payload) => [payload, ...notifications].slice(0, 5))
  .on(notificationRemoved, (notifications, id) =>
    notifications.filter((notification) => notification.id !== id),
  )

function scheduleRemoveById(id: string, timeoutMs: number) {
  window.setTimeout(() => {
    notificationRemoved(id)
  }, timeoutMs)
}

export function pushSuccess(message: string, title = 'Успешно') {
  const id = `notice-${Date.now()}-${Math.random().toString(16).slice(2)}`
  notificationPushed({ id, title, message, color: 'green' })
  scheduleRemoveById(id, 3500)
}

export function pushError(message: string, title = 'Ошибка') {
  const id = `notice-${Date.now()}-${Math.random().toString(16).slice(2)}`
  notificationPushed({ id, title, message, color: 'red' })
  scheduleRemoveById(id, 5000)
}

export function pushApiError(error: unknown, fallback?: string) {
  pushError(getApiErrorText(error, fallback))
}
