import { Alert, Button, Card, PasswordInput, Stack, Tabs, TextInput, Title } from '@mantine/core'
import { useUnit } from 'effector-react'
import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import {
  $authError,
  $authStatus,
  authErrorCleared,
  loginFx,
  loginSubmitted,
  registerFx,
  registerSubmitted,
} from '../../features/auth/model'
import { pushError, pushSuccess } from '../../shared/model/notifications'

export function AuthPage() {
  const {
    authStatus,
    authError,
    loginPending,
    registerPending,
    submitLogin,
    submitRegister,
    clearError,
  } = useUnit({
    authStatus: $authStatus,
    authError: $authError,
    loginPending: loginFx.pending,
    registerPending: registerFx.pending,
    submitLogin: loginSubmitted,
    submitRegister: registerSubmitted,
    clearError: authErrorCleared,
  })

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [healthGoals, setHealthGoals] = useState('')

  useEffect(() => {
    if (authError) {
      pushError(authError, 'Ошибка авторизации')
    }
  }, [authError])

  useEffect(() => {
    if (authStatus === 'auth') {
      pushSuccess('Вы успешно авторизованы.', 'Сессия активна')
    }
  }, [authStatus])

  if (authStatus === 'auth') {
    return <Navigate to="/profile" replace />
  }

  return (
    <Card withBorder radius="md" p="lg" style={{ background: 'var(--bg-surface)' }}>
      <Stack gap="md">
        <Title order={1}>Авторизация</Title>
        {authError ? <Alert color="red">{authError}</Alert> : null}
        <Tabs defaultValue="login">
          <Tabs.List>
            <Tabs.Tab value="login">Вход</Tabs.Tab>
            <Tabs.Tab value="register">Регистрация</Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="login" pt="sm">
            <Stack gap="sm">
              <TextInput
                label="Email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.currentTarget.value)}
              />
              <PasswordInput
                label="Пароль"
                value={password}
                onChange={(event) => setPassword(event.currentTarget.value)}
              />
              <Button
                loading={loginPending}
                onClick={() => {
                  clearError()
                  submitLogin({ email, password })
                }}
                color="grape"
              >
                Войти
              </Button>
            </Stack>
          </Tabs.Panel>

          <Tabs.Panel value="register" pt="sm">
            <Stack gap="sm">
              <TextInput
                label="Имя"
                value={name}
                onChange={(event) => setName(event.currentTarget.value)}
              />
              <TextInput
                label="Email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.currentTarget.value)}
              />
              <PasswordInput
                label="Пароль"
                value={password}
                onChange={(event) => setPassword(event.currentTarget.value)}
              />
              <TextInput
                label="Цели по здоровью"
                value={healthGoals}
                onChange={(event) => setHealthGoals(event.currentTarget.value)}
              />
              <Button
                loading={registerPending}
                onClick={() => {
                  clearError()
                  submitRegister({
                    email,
                    name,
                    password,
                    health_goals: healthGoals,
                  })
                }}
                color="grape"
              >
                Зарегистрироваться
              </Button>
            </Stack>
          </Tabs.Panel>
        </Tabs>
      </Stack>
    </Card>
  )
}
