import { Badge, Button, Card, Stack, Text, Title } from '@mantine/core'
import { Link } from 'react-router-dom'
import type { PlanMeal } from '../../types/domain'

type MealInfoProps = {
  meal: PlanMeal
}

export function MealInfo({ meal }: MealInfoProps) {
  return (
    <Card withBorder radius="md" p="sm" style={{ background: 'rgba(255,255,255,0.72)' }}>
      <Stack gap={6}>
        <Title order={5}>{meal.title}</Title>
        <Badge variant="light" color="grape" w="fit-content">
          {meal.calories} ккал
        </Badge>
        <Text size="sm">Ингредиенты: {meal.ingredients}</Text>
        <Button
          component={Link}
          to={`/recipes/${meal.recipeId}`}
          color="grape"
          variant="light"
          size="compact-sm"
          w="fit-content"
        >
          Открыть рецепт блюда
        </Button>
      </Stack>
    </Card>
  )
}
