# FoodPlanner

Веб-приложение для планирования питания с учетом предпочтений пользователя, фильтрацией контента и конструктором персональных планов.

## Технологии

- **Frontend:** React, TypeScript, Vite, Effector, Mantine
- **Backend:** Django, Django REST Framework
- **База данных:** PostgreSQL (локально может использоваться SQLite)

## Структура проекта

- `Frontend/` - клиентская часть
- `Backend/` - серверная часть и API
- `PROJECT_CHECKLIST.md` - чеклист задач и прогресса

## Возможности

- Каталог рецептов и планов питания с серверной фильтрацией и пагинацией
- Глобальный поиск по ресурсам платформы
- Конструктор плана питания (drag-and-drop, индивидуальные перекусы по дням)
- Оценки, отзывы, избранное и личный кабинет
- Списки покупок по рецептам и планам с сохранением в профиль
- Уведомления об ошибках и успешных действиях

## Быстрый старт

### 1) Frontend

```bash
cd Frontend
npm install
npm run dev
```

### 2) Backend

```bash
cd Backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

## Демо-данные

Для наполнения проекта тестовым контентом:

```bash
cd Backend
./venv/bin/python manage.py seed_demo_data --reset
```

## Статусы и план работ

- Актуальный прогресс: `PROJECT_CHECKLIST.md`
- Основные доработки ведутся итеративно с одновременной интеграцией frontend и backend
