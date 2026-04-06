import { Badge, Box, Button, Card, Group, List, SimpleGrid, Stack, Text, ThemeIcon, Title } from '@mantine/core'
import { Link } from 'react-router-dom'
import { PreviewCard } from '../../components/PreviewCard'
import { textKeys } from '../../shared/config/texts'

export function AboutPage() {
  return (
    <Stack gap="md">
      <Card withBorder radius="md" padding="lg" style={{ background: 'var(--bg-surface)' }}>
        <Stack gap="md">
          <Group justify="space-between" align="flex-start">
            <Stack gap="sm" maw={680}>
              <Badge color="grape" variant="light" w="fit-content">
                Персональный помощник по питанию
              </Badge>
              <Title order={1}>Планируйте питание под свои цели</Title>
              <Text>
                FoodPlanner объединяет рецепты, планы питания и отзывы в одном месте. Выберите
                готовый план, адаптируйте его под себя или соберите полностью персональный сценарий.
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
            >
              Placeholder: Hero image
            </Box>
          </Group>
        </Stack>
      </Card>

      <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
        <Card withBorder radius="md" padding="lg" style={{ background: 'var(--bg-surface)' }}>
          <Stack gap="sm">
            <Title order={3}>Почему FoodPlanner</Title>
            <List
              spacing="xs"
              icon={
                <ThemeIcon size={20} radius="xl" color="grape">
                  ✓
                </ThemeIcon>
              }
            >
              <List.Item>Подбор планов по целям: снижение веса, поддержание, набор массы.</List.Item>
              <List.Item>Гибкие фильтры: калории, время, диета, пользовательские теги.</List.Item>
              <List.Item>Конструктор с drag-and-drop и отправкой на модерацию.</List.Item>
              <List.Item>Избранное, персональные особенности и история статусов в профиле.</List.Item>
            </List>
          </Stack>
        </Card>

        <Card withBorder radius="md" padding="lg" style={{ background: 'var(--bg-surface)' }}>
          <Stack gap="sm">
            <Title order={3}>Сценарии использования</Title>
            <Text>Подходит как для новичков, так и для тех, кто ведет питание системно.</Text>
            <Group gap="xs">
              <Badge variant="light" color="grape">
                План на неделю
              </Badge>
              <Badge variant="light" color="grape">
                Быстрые рецепты
              </Badge>
              <Badge variant="light" color="grape">
                Диетические ограничения
              </Badge>
            </Group>
            <Box
              h={120}
              style={{
                borderRadius: 12,
                border: '1px dashed var(--border-soft)',
                background:
                  'linear-gradient(145deg, rgba(255,255,255,0.78) 0%, rgba(167,139,250,0.2) 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#5b2a8a',
                fontWeight: 600,
              }}
            >
              Placeholder: Lifestyle image
            </Box>
          </Stack>
        </Card>
      </SimpleGrid>

      <SimpleGrid cols={{ base: 1, lg: 3 }} spacing="md">
        <Card withBorder radius="md" padding="lg" style={{ background: 'var(--bg-surface)' }}>
          <Title order={4}>Контентный блок</Title>
          <Text mt={8}>Тут можно разместить кейс или onboarding-инструкцию для новых пользователей.</Text>
        </Card>
        <Card withBorder radius="md" padding="lg" style={{ background: 'var(--bg-surface)' }}>
          <Title order={4}>Контентный блок</Title>
          <Text mt={8}>Подходит для рассказа о модерации, ролях и прозрачности качества рецептов.</Text>
        </Card>
        <Card withBorder radius="md" padding="lg" style={{ background: 'var(--bg-surface)' }}>
          <Title order={4}>Контентный блок</Title>
          <Text mt={8}>Можно добавить партнерские материалы или полезные советы по рациону.</Text>
        </Card>
      </SimpleGrid>

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
