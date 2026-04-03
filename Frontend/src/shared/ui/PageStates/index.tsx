import { Alert, Button, Card, Skeleton, Stack, Text, Title } from '@mantine/core'

type PageLoaderProps = {
  title?: string
}

export function PageLoader({ title = 'Загружаем данные...' }: PageLoaderProps) {
  return (
    <Card withBorder radius="md" p="lg" style={{ background: 'var(--bg-surface)' }}>
      <Stack gap="md">
        <Title order={2}>{title}</Title>
        <Skeleton height={38} radius="md" />
        <Skeleton height={96} radius="md" />
        <Skeleton height={96} radius="md" />
      </Stack>
    </Card>
  )
}

type PageErrorProps = {
  message: string
  onRetry: () => void
}

export function PageError({ message, onRetry }: PageErrorProps) {
  return (
    <Card withBorder radius="md" p="lg" style={{ background: 'var(--bg-surface)' }}>
      <Stack gap="sm">
        <Alert color="red" title="Не удалось загрузить раздел">
          {message}
        </Alert>
        <Button variant="light" color="grape" onClick={onRetry}>
          Повторить
        </Button>
      </Stack>
    </Card>
  )
}

type PageEmptyProps = {
  title: string
  description: string
}

export function PageEmpty({ title, description }: PageEmptyProps) {
  return (
    <Card withBorder radius="md" p="lg" style={{ background: 'var(--bg-surface)' }}>
      <Stack gap="xs">
        <Title order={3}>{title}</Title>
        <Text c="dimmed">{description}</Text>
      </Stack>
    </Card>
  )
}
