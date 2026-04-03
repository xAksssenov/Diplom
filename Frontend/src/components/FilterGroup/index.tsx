import { Badge, Group, Stack, Text } from '@mantine/core'

type FilterGroupProps = {
  title: string
  values: string[]
}

export function FilterGroup({ title, values }: FilterGroupProps) {
  return (
    <Stack gap={8}>
      <Text fw={600}>{title}</Text>
      <Group gap="xs">
        {values.map((value) => (
          <Badge key={value} variant="light" color="grape" radius="xl" size="lg">
            {value}
          </Badge>
        ))}
      </Group>
    </Stack>
  )
}
