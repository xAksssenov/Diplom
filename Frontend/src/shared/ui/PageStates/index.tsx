import { Alert, Badge, Button, Card, Group, Skeleton, Stack, Text, ThemeIcon, Title } from '@mantine/core'

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
    <Card
      withBorder
      radius="md"
      p="lg"
      style={{
        background:
          'linear-gradient(145deg, rgba(255,255,255,0.9) 0%, rgba(167,139,250,0.16) 100%)',
      }}
    >
      <Stack gap="sm">
        <Group gap="sm" align="center">
          <ThemeIcon radius="xl" color="grape" size={30}>
            i
          </ThemeIcon>
          <Title order={3}>{title}</Title>
        </Group>
        <Text c="dimmed">{description}</Text>
        <Badge variant="light" color="grape" w="fit-content">
          Пока здесь пусто
        </Badge>
      </Stack>
    </Card>
  )
}
