import { toApiError } from './errors'

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL?.replace(/\/+$/, '') || 'http://localhost:8000/api'

type BackendRole = {
  id: number
  name: 'user' | 'moderator' | 'admin'
}

export type AuthUser = {
  id: number
  email: string
  name: string
  avatar_url: string
  health_goals: string
  preferred_diet: string
  health_features: string[]
  favorite_tags: string[]
  email_notifications: boolean
  profile_visibility: boolean
  role: BackendRole | null
}

export type RegisterPayload = {
  email: string
  name: string
  password: string
  avatar_url?: string
  health_goals?: string
  preferred_diet?: string
  health_features?: string[]
  favorite_tags?: string[]
  email_notifications?: boolean
  profile_visibility?: boolean
}

export type LoginPayload = {
  email: string
  password: string
}

export type UpdateMePayload = Partial<
  Pick<
    AuthUser,
    | 'name'
    | 'avatar_url'
    | 'health_goals'
    | 'preferred_diet'
    | 'health_features'
    | 'favorite_tags'
    | 'email_notifications'
    | 'profile_visibility'
  >
>

function getCookie(name: string) {
  const cookieString = `; ${document.cookie}`
  const parts = cookieString.split(`; ${name}=`)
  if (parts.length === 2) {
    return parts.pop()?.split(';').shift() ?? ''
  }
  return ''
}

export async function ensureCsrfCookie() {
  if (getCookie('csrftoken')) {
    return
  }
  await fetch(`${API_BASE_URL}/health/`, { credentials: 'include' })
}

async function apiRequest<T>(path: string, method: 'GET' | 'POST' | 'PATCH', body?: unknown) {
  if (method !== 'GET') {
    await ensureCsrfCookie()
  }
  const csrfToken = getCookie('csrftoken')

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    credentials: 'include',
    headers:
      method === 'GET'
        ? undefined
        : {
            'Content-Type': 'application/json',
            'X-CSRFToken': csrfToken,
          },
    body: body ? JSON.stringify(body) : undefined,
  })

  if (!response.ok) {
    throw await toApiError(response)
  }

  if (response.status === 204) {
    return undefined as T
  }

  return (await response.json()) as T
}

export function getMe() {
  return apiRequest<AuthUser>('/users/me/', 'GET')
}

export function login(payload: LoginPayload) {
  return apiRequest<AuthUser>('/users/login/', 'POST', payload)
}

export function register(payload: RegisterPayload) {
  return apiRequest<AuthUser>('/users/register/', 'POST', payload)
}

export function logout() {
  return apiRequest<void>('/users/logout/', 'POST', {})
}

export function updateMe(payload: UpdateMePayload) {
  return apiRequest<AuthUser>('/users/me/', 'PATCH', payload)
}
