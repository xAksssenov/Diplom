# FoodPlanner

Монорепозиторий проекта веб-приложения для планирования питания.

## Структура
- `Frontend/` - React + Effector + FSD (Vite + TypeScript)
- `Backend/` - Django + PostgreSQL (на следующем этапе переключим БД с SQLite)

## Быстрый запуск

### Frontend
1. Перейти в `Frontend/`
2. Установить зависимости: `npm install`
3. Запустить dev-сервер: `npm run dev`

### Backend
1. Перейти в `Backend/`
2. Создать и активировать venv (если нужно)
3. Установить Django и зависимости
4. Запустить сервер: `python manage.py runserver`

## Текущий прогресс
- План работ: `PROJECT_CHECKLIST.md`
- Реализован базовый UI-каркас `Header + Breadcrumbs + Footer`
- Подготовлен стартовый роутинг разделов
