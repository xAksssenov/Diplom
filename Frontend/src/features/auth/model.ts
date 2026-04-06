import { createEffect, createEvent, createStore, sample } from 'effector'
import {
  type AuthUser,
  type LoginPayload,
  type RegisterPayload,
  type UpdateMePayload,
  getMe,
  login,
  logout,
  register,
  updateMe,
} from '../../shared/api/authApi'

type AuthStatus = 'checking' | 'guest' | 'auth'

export const checkSessionRequested = createEvent()
export const loginSubmitted = createEvent<LoginPayload>()
export const registerSubmitted = createEvent<RegisterPayload>()
export const logoutRequested = createEvent()
export const authErrorCleared = createEvent()
export const profileUpdateSubmitted = createEvent<UpdateMePayload>()

export const checkSessionFx = createEffect(async () => getMe())
export const loginFx = createEffect(async (payload: LoginPayload) => login(payload))
export const registerFx = createEffect(async (payload: RegisterPayload) => register(payload))
export const logoutFx = createEffect(async () => logout())
export const updateProfileFx = createEffect(async (payload: UpdateMePayload) => updateMe(payload))

export const $authUser = createStore<AuthUser | null>(null)
  .on(checkSessionFx.doneData, (_, user) => user)
  .on(loginFx.doneData, (_, user) => user)
  .on(registerFx.doneData, (_, user) => user)
  .on(logoutFx.done, () => null)
  .on(updateProfileFx.doneData, (_, user) => user)
  .on(checkSessionFx.fail, () => null)
  .on(loginFx.fail, () => null)
  .on(registerFx.fail, () => null)

export const $authStatus = createStore<AuthStatus>('checking')
  .on(checkSessionFx.done, () => 'auth')
  .on(checkSessionFx.fail, () => 'guest')
  .on(loginFx.done, () => 'auth')
  .on(loginFx.fail, () => 'guest')
  .on(registerFx.done, () => 'auth')
  .on(registerFx.fail, () => 'guest')
  .on(logoutFx.done, () => 'guest')

export const $authError = createStore<string | null>(null)
  .on(loginFx.failData, (_, error) => error.message || 'Ошибка входа')
  .on(registerFx.failData, (_, error) => error.message || 'Ошибка регистрации')
  .on(checkSessionFx.failData, () => null)
  .on(loginFx.done, () => null)
  .on(registerFx.done, () => null)
  .on(authErrorCleared, () => null)

sample({ clock: checkSessionRequested, target: checkSessionFx })
sample({ clock: loginSubmitted, target: loginFx })
sample({ clock: registerSubmitted, target: registerFx })
sample({ clock: logoutRequested, target: logoutFx })
sample({ clock: profileUpdateSubmitted, target: updateProfileFx })
