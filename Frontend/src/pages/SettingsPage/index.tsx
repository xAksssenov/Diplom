import { Card, Stack, Text, Title } from '@mantine/core'

export function SettingsPage() {
  return (
    <Card withBorder radius="md" p="lg" style={{ background: 'var(--bg-surface)' }}>
      <Stack gap="xs">
        <Title order={1}>Настройки</Title>
        <Text>Каркас раздела базовых настроек аккаунта.</Text>
      </Stack>
    </Card>
  )
}
