import {
  Accordion,
  Badge,
  Button,
  Card,
  Group,
  SimpleGrid,
  Stack,
  Text,
  Title,
} from '@mantine/core'
import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { FallbackCard } from '../../components/FallbackCard'
import { recipes } from '../../data/mockData'

export function RecipeDetailPage() {
  const { recipeId } = useParams<{ recipeId: string }>()
  const recipe = recipes.find((item) => item.id === recipeId)
  const [activeImage, setActiveImage] = useState(0)

  if (!recipe) {
    return <FallbackCard message="Рецепт не найден." />
  }

  return (
    <Stack gap="md">
      <Card withBorder radius="md" p="lg" style={{ background: 'var(--bg-surface)' }}>
        <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
          <Stack gap="sm">
            <Card
              withBorder
              radius="md"
              p={0}
              style={{ minHeight: 280, background: recipe.images[activeImage] }}
            />
            <Group gap="xs">
              {recipe.images.map((imageColor, index) => (
                <Button
                  key={imageColor}
                  type="button"
                  onClick={() => setActiveImage(index)}
                  variant={index === activeImage ? 'filled' : 'light'}
                  color="grape"
                  style={{ background: imageColor, color: '#2c184f' }}
                >
                  {index + 1}
                </Button>
              ))}
            </Group>
          </Stack>

          <Stack gap="sm">
            <Title order={1}>{recipe.title}</Title>
            <Text>{recipe.subtitle}</Text>
            <Group gap="xs">
              <Badge color="grape" variant="light">
                {recipe.cookingTime}
              </Badge>
              <Badge color="grape" variant="light">
                ★ {recipe.rating}
              </Badge>
              <Badge color="grape" variant="light">
                {recipe.calories} ккал
              </Badge>
            </Group>
            <Group gap="xs">
              {recipe.tags.map((tag) => (
                <Badge key={tag} variant="dot" color="violet">
                  {tag}
                </Badge>
              ))}
            </Group>
            <Group gap="xs">
              <Button color="grape">В избранное</Button>
              <Button color="grape" variant="outline" onClick={() => window.print()}>
                Напечатать
              </Button>
            </Group>
          </Stack>
        </SimpleGrid>
      </Card>

      <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
        <Card withBorder radius="md" p="lg" style={{ background: 'var(--bg-surface)' }}>
          <Stack gap="xs">
            <Title order={3}>Пищевая ценность</Title>
            <Badge color="grape" variant="light" w="fit-content">
              Калории: {recipe.calories}
            </Badge>
            <Badge color="grape" variant="light" w="fit-content">
              Белки: {recipe.nutrition.protein} г
            </Badge>
            <Badge color="grape" variant="light" w="fit-content">
              Жиры: {recipe.nutrition.fat} г
            </Badge>
            <Badge color="grape" variant="light" w="fit-content">
              Углеводы: {recipe.nutrition.carbs} г
            </Badge>
          </Stack>
        </Card>

        <Card withBorder radius="md" p="lg" style={{ background: 'var(--bg-surface)' }}>
          <Stack gap="sm">
            <Title order={3}>Отзывы и оценки</Title>
            <Text>Средняя оценка: {recipe.rating} / 5</Text>
            <Button color="grape" variant="light" w="fit-content">
              Оставить отзыв
            </Button>
          </Stack>
        </Card>
      </SimpleGrid>

      <Card withBorder radius="md" p="lg" style={{ background: 'var(--bg-surface)' }}>
        <Accordion defaultValue="ingredients" variant="separated">
          <Accordion.Item value="ingredients">
            <Accordion.Control>Ингредиенты</Accordion.Control>
            <Accordion.Panel>
              <Stack gap={6}>
                {recipe.ingredients.map((ingredient) => (
                  <Text key={ingredient} size="sm">
                    - {ingredient}
                  </Text>
                ))}
              </Stack>
            </Accordion.Panel>
          </Accordion.Item>
          <Accordion.Item value="steps">
            <Accordion.Control>Процесс приготовления</Accordion.Control>
            <Accordion.Panel>
              <Stack gap={6}>
                {recipe.steps.map((step, index) => (
                  <Text key={step} size="sm">
                    {index + 1}. {step}
                  </Text>
                ))}
              </Stack>
            </Accordion.Panel>
          </Accordion.Item>
        </Accordion>
      </Card>
    </Stack>
  )
}
