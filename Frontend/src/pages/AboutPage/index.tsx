import { Button, Card, SimpleGrid, Stack, Text, Title } from '@mantine/core'
import { Link } from 'react-router-dom'
import { PreviewCard } from '../../components/PreviewCard'
import { textKeys } from '../../shared/config/texts'

export function AboutPage() {
  return (
    <Stack gap="md">
      <Card withBorder radius="md" padding="lg" style={{ background: 'var(--bg-surface)' }}>
        <Stack gap="sm">
          <Title order={1}>Планируйте питание под свои цели</Title>
          <Text>
          FoodPlanner объединяет рецепты, планы питания и отзывы в одном месте.
          Выберите готовый план или соберите свой.
          </Text>
          <Button component={Link} to="/meal-plans" color="grape" w="fit-content">
            {textKeys.cta.planner}
          </Button>
        </Stack>
      </Card>

      <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md">
        <PreviewCard
          title="Рецепты"
          description="Подборки по тегам, калорийности и диетическим предпочтениям."
          linkPath="/recipes"
        />
        <PreviewCard
          title="Планы питания"
          description="Планы на день, неделю или месяц с детальным расписанием."
          linkPath="/meal-plans"
        />
        <PreviewCard
          title="Оценки и отзывы"
          description="Просматривайте отзывы пользователей и переходите к планам."
          linkPath="/reviews"
        />
      </SimpleGrid>
    </Stack>
  )
}
