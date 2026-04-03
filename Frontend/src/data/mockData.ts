import type { MealPlan, PlanReview, Recipe } from '../types/domain'

export const recipes: Recipe[] = [
  {
    id: 'protein-breakfast-bowl',
    title: 'Протеиновый боул на завтрак',
    subtitle: 'Быстрый завтрак с овсянкой, ягодами и йогуртом',
    cookingTime: '15 мин',
    rating: 4.8,
    calories: 420,
    tags: ['Завтрак', 'Высокобелковое', 'Без глютена'],
    images: ['#d7c4ff', '#c5b0ff', '#b39cff', '#a28bff'],
    nutrition: { protein: 27, fat: 11, carbs: 54 },
    ingredients: [
      'Овсяные хлопья - 60 г',
      'Греческий йогурт - 150 г',
      'Ягоды - 80 г',
      'Семена чиа - 10 г',
    ],
    steps: [
      'Сварить овсянку на воде или молоке до мягкости.',
      'Добавить йогурт и аккуратно перемешать.',
      'Сверху выложить ягоды и посыпать семенами чиа.',
    ],
  },
  {
    id: 'vegan-lentil-curry',
    title: 'Веган карри с чечевицей',
    subtitle: 'Насыщенный обед с растительным белком',
    cookingTime: '35 мин',
    rating: 4.7,
    calories: 510,
    tags: ['Веганское', 'Обед', 'Без лактозы'],
    images: ['#d9d4ff', '#cbc2ff', '#b8abff', '#a596ff'],
    nutrition: { protein: 24, fat: 15, carbs: 66 },
    ingredients: [
      'Чечевица - 120 г',
      'Кокосовое молоко - 200 мл',
      'Томаты в собственном соку - 160 г',
      'Карри паста - 1 ст. л.',
    ],
    steps: [
      'Обжарить специи и карри пасту на среднем огне.',
      'Добавить томаты, чечевицу и кокосовое молоко.',
      'Тушить 20-25 минут до мягкости чечевицы.',
    ],
  },
  {
    id: 'salmon-green-dinner',
    title: 'Лосось с зеленью и киноа',
    subtitle: 'Легкий ужин с омега-3 и сложными углеводами',
    cookingTime: '25 мин',
    rating: 4.9,
    calories: 530,
    tags: ['Ужин', 'ПП', 'Без глютена'],
    images: ['#e4d8ff', '#d4c5ff', '#c5b3ff', '#b59fff'],
    nutrition: { protein: 38, fat: 21, carbs: 42 },
    ingredients: [
      'Филе лосося - 180 г',
      'Киноа - 70 г',
      'Шпинат - 60 г',
      'Оливковое масло - 1 ч. л.',
    ],
    steps: [
      'Запечь лосось до готовности при 190 градусах.',
      'Отварить киноа и дать настояться 5 минут.',
      'Подать с зеленью и сбрызнуть маслом.',
    ],
  },
]

export const mealPlans: MealPlan[] = [
  {
    id: 'fit-week',
    title: 'Фит-неделя для поддержания формы',
    planType: 'На неделю',
    goal: 'Поддержание веса',
    diet: 'Сбалансированное',
    calories: 2100,
    protein: 125,
    fat: 75,
    carbs: 230,
    rating: 4.7,
    reviewsCount: 128,
    description:
      'План на 7 дней с акцентом на сбалансированные БЖУ и стабильную энергию.',
    days: [
      {
        day: 1,
        meals: {
          breakfast: {
            title: 'Протеиновый боул на завтрак',
            recipeId: 'protein-breakfast-bowl',
            calories: 420,
            ingredients: 'Овсянка, йогурт, ягоды, чиа',
          },
          lunch: {
            title: 'Веган карри с чечевицей',
            recipeId: 'vegan-lentil-curry',
            calories: 510,
            ingredients: 'Чечевица, томаты, специи',
          },
          dinner: {
            title: 'Лосось с зеленью и киноа',
            recipeId: 'salmon-green-dinner',
            calories: 530,
            ingredients: 'Лосось, киноа, шпинат',
          },
          snacks: [
            {
              title: 'Фруктовый смузи',
              recipeId: 'protein-breakfast-bowl',
              calories: 180,
              ingredients: 'Банан, ягоды, йогурт',
            },
          ],
        },
      },
      {
        day: 2,
        meals: {
          breakfast: {
            title: 'Омлет со шпинатом',
            recipeId: 'salmon-green-dinner',
            calories: 390,
            ingredients: 'Яйца, шпинат, сыр',
          },
          lunch: {
            title: 'Курица и булгур',
            recipeId: 'vegan-lentil-curry',
            calories: 560,
            ingredients: 'Курица, булгур, овощи',
          },
          dinner: {
            title: 'Филе трески и овощи',
            recipeId: 'salmon-green-dinner',
            calories: 470,
            ingredients: 'Треска, брокколи, масло',
          },
          snacks: [
            {
              title: 'Ореховый перекус',
              recipeId: 'protein-breakfast-bowl',
              calories: 210,
              ingredients: 'Миндаль, фундук, яблоко',
            },
          ],
        },
      },
    ],
  },
  {
    id: 'lean-cut-day',
    title: 'День для мягкого дефицита калорий',
    planType: 'На день',
    goal: 'Похудение',
    diet: 'Без лактозы',
    calories: 1650,
    protein: 115,
    fat: 58,
    carbs: 155,
    rating: 4.6,
    reviewsCount: 72,
    description: 'Короткий план на один день с умеренным дефицитом калорий.',
    days: [
      {
        day: 1,
        meals: {
          breakfast: {
            title: 'Овсянка с ягодами',
            recipeId: 'protein-breakfast-bowl',
            calories: 350,
            ingredients: 'Овсянка, ягоды, семена',
          },
          lunch: {
            title: 'Салат с индейкой',
            recipeId: 'salmon-green-dinner',
            calories: 480,
            ingredients: 'Индейка, листья салата, томаты',
          },
          dinner: {
            title: 'Тушеные овощи с тофу',
            recipeId: 'vegan-lentil-curry',
            calories: 430,
            ingredients: 'Тофу, цукини, морковь',
          },
          snacks: [
            {
              title: 'Йогурт с орехами',
              recipeId: 'protein-breakfast-bowl',
              calories: 190,
              ingredients: 'Йогурт, орехи',
            },
          ],
        },
      },
    ],
  },
]

export const planReviews: PlanReview[] = [
  {
    id: 'r1',
    author: 'Анна П.',
    planId: 'fit-week',
    planTitle: 'Фит-неделя для поддержания формы',
    rating: 5,
    comment: 'Понравилась структура по дням, удобно следить за рационом.',
  },
  {
    id: 'r2',
    author: 'Игорь Л.',
    planId: 'lean-cut-day',
    planTitle: 'День для мягкого дефицита калорий',
    rating: 4,
    comment: 'Хороший план на рабочий день, добавил больше перекусов.',
  },
]
