import { Button, Group, Paper, Text } from '@mantine/core'
import { textKeys } from '../../shared/config/texts'

export function Footer() {
  return (
    <Paper
      mt="auto"
      withBorder
      radius="md"
      p="md"
      style={{ background: 'var(--bg-surface)' }}
    >
      <Group justify="space-between" align="center" wrap="wrap">
        <Text>{textKeys.footer.copy}</Text>
        <Group gap="xs">
        {textKeys.footer.links.map((linkName) => (
          <Button key={linkName} type="button" variant="light" color="grape">
            {linkName}
          </Button>
        ))}
        </Group>
      </Group>
    </Paper>
  )
}
