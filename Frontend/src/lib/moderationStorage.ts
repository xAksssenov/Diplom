import type { ModerationStatusItem } from '../types/domain'

const storageKey = 'foodplanner:moderation-statuses'

export function getModerationStatuses(): ModerationStatusItem[] {
  const rawValue = localStorage.getItem(storageKey)
  if (!rawValue) {
    return []
  }

  try {
    const parsed = JSON.parse(rawValue) as ModerationStatusItem[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function appendModerationStatus(status: ModerationStatusItem) {
  const currentStatuses = getModerationStatuses()
  const nextStatuses = [status, ...currentStatuses].slice(0, 20)
  localStorage.setItem(storageKey, JSON.stringify(nextStatuses))
}
