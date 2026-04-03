import { Button, Card, Stack, Text, Title } from '@mantine/core'
import { Link } from 'react-router-dom'

type PreviewCardProps = {
  title: string
  description: string
  linkPath: string
}

export function PreviewCard({ title, description, linkPath }: PreviewCardProps) {
  return (
    <Card withBorder radius="md" padding="lg" style={{ background: 'var(--bg-surface)' }}>
      <Stack gap="sm">
        <Title order={3}>{title}</Title>
        <Text>{description}</Text>
        <Button component={Link} to={linkPath} color="grape" variant="light">
          Смотреть все
        </Button>
      </Stack>
    </Card>
  )
}
