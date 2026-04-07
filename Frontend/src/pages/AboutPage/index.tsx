import { Badge, Box, Button, Card, Grid, Group, SimpleGrid, Stack, Text, Title } from '@mantine/core'
import { Link } from 'react-router-dom'
import { PreviewCard } from '../../components/PreviewCard'
import { textKeys } from '../../shared/config/texts'

export function AboutPage() {
  const sections = [
    {
      badge: 'Планирование без хаоса',
      title: 'Соберите питание под свой ритм',
      text: 'Выбирайте блюда по целям и ограничениям, добавляйте их в план и сразу видьте итоговую структуру дня.',
      note: 'Подходит для персонального рациона и для семьи.',
    },
    {
      badge: 'Умный подбор',
      title: 'Фильтры и поиск помогают найти нужное быстрее',
      text: 'Используйте калорийность, время приготовления, теги и рейтинг. Списки подгружаются постепенно и не перегружают интерфейс.',
      note: 'Серверная фильтрация и серверный поиск дают точные результаты.',
    },
    {
      badge: 'Контроль качества',
      title: 'Планы и рецепты проходят модерацию',
      text: 'Каждый материал можно отправить на проверку, а статусы отслеживать в личном кабинете. Это повышает доверие к контенту.',
      note: 'Автор видит изменения статуса и может быстро внести правки.',
    },
  ]

  return (
    <Stack gap="md">
      <Card withBorder radius="md" padding="lg" style={{ background: 'var(--bg-surface)' }}>
        <Stack gap="md">
          <Group justify="space-between">
            <Stack gap="sm" maw={680}>
              <Badge color="grape" variant="light" w="fit-content">
                Персональный помощник по питанию
              </Badge>
              <Title order={1}>Планируйте питание под свои цели</Title>
              <Text>
                FoodPlanner объединяет рецепты, планы питания и отзывы в одном месте. Выберите
                готовый план, адаптируйте его под себя или соберите полностью персональный сценарий.
              </Text>
              <Text c="dimmed" size="sm">
                Делайте рацион системным: от быстрых подборок до собственного плана с сохранением
                в личном кабинете.
              </Text>
              <Group>
                <Button component={Link} to="/meal-plans" color="grape" w="fit-content">
                  {textKeys.cta.planner}
                </Button>
                <Button component={Link} to="/planner" variant="light" color="grape" w="fit-content">
                  Собрать свой план
                </Button>
              </Group>
            </Stack>
            <Box
              miw={250}
              h={180}
              style={{
                borderRadius: 14,
                border: '1px dashed var(--border-soft)',
                background:
                  'linear-gradient(135deg, rgba(167,139,250,0.25) 0%, rgba(255,255,255,0.65) 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#5b2a8a',
                fontWeight: 600,
              }}
            />
          </Group>
        </Stack>
      </Card>

      {sections.map((section, index) => {
        const imageFirst = index % 2 === 0
        return (
          <Card
            key={section.title}
            withBorder
            radius="md"
            padding="lg"
            style={{ background: 'var(--bg-surface)' }}
          >
            <Grid align="center" gap="md">
              <Grid.Col span={{ base: 12, md: 6 }} order={{ base: 1, md: imageFirst ? 1 : 2 }}>
                <Box
                  h={220}
                  style={{
                    borderRadius: 14,
                    border: '1px dashed var(--border-soft)',
                    background:
                      'linear-gradient(145deg, rgba(255,255,255,0.76) 0%, rgba(167,139,250,0.22) 100%)',
                  }}
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, md: 6 }} order={{ base: 2, md: imageFirst ? 2 : 1 }}>
                <Stack gap="sm">
                  <Badge color="grape" variant="light" w="fit-content">
                    {section.badge}
                  </Badge>
                  <Title order={3}>{section.title}</Title>
                  <Text>{section.text}</Text>
                  <Text size="sm" c="dimmed">
                    {section.note}
                  </Text>
                </Stack>
              </Grid.Col>
            </Grid>
          </Card>
        )
      })}

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
