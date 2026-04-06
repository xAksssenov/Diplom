export class ApiError extends Error {
  status: number
  details: unknown

  constructor(status: number, message: string, details: unknown = null) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.details = details
  }
}

function stringifyDetails(payload: unknown) {
  if (!payload || typeof payload !== 'object') {
    return ''
  }
  const values = Object.values(payload as Record<string, unknown>)
    .flatMap((value) => (Array.isArray(value) ? value : [value]))
    .map((value) => String(value))
    .filter(Boolean)
  return values.length ? values.join(' ') : ''
}

export async function toApiError(response: Response) {
  let details: unknown = null
  try {
    details = await response.json()
  } catch {
    try {
      details = await response.text()
    } catch {
      details = null
    }
  }

  const detailsText = typeof details === 'string' ? details : stringifyDetails(details)
  const fallbackByStatus: Record<number, string> = {
    401: 'Сессия истекла. Выполните вход заново.',
    403: 'Недостаточно прав для выполнения действия.',
    422: 'Проверьте корректность введенных данных.',
    500: 'Ошибка сервера. Попробуйте чуть позже.',
  }

  const message =
    detailsText ||
    fallbackByStatus[response.status] ||
    `Ошибка запроса (${response.status}). Попробуйте снова.`
  return new ApiError(response.status, message, details)
}

export function getApiErrorText(error: unknown, fallback = 'Не удалось выполнить запрос.') {
  if (error instanceof ApiError) {
    return error.message
  }
  if (error instanceof Error && error.message) {
    return error.message
  }
  return fallback
}
