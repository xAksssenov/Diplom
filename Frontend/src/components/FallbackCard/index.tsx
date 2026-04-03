import { Card, Stack, Text, Title } from '@mantine/core'

type FallbackCardProps = {
  message: string
}

export function FallbackCard({ message }: FallbackCardProps) {
  return (
    <Card withBorder radius="md" p="lg" style={{ background: 'var(--bg-surface)' }}>
      <Stack gap="xs">
        <Title order={1}>Раздел недоступен</Title>
        <Text>{message}</Text>
      </Stack>
    </Card>
  )
}
