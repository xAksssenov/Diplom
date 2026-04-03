# Frontend Architecture (FSD)

## Стек
- React + TypeScript
- Effector / Effector React
- React Router

## Слои (план)
- `app` - инициализация приложения, провайдеры, глобальные стили
- `pages` - экраны роутов
- `widgets` - крупные UI-блоки (header, footer, layouts)
- `features` - пользовательские сценарии (фильтры, избранное, отзывы)
- `entities` - доменные сущности (recipe, mealPlan, review, user)
- `shared` - переиспользуемые UI-компоненты, утилиты, конфиги, api

## Правила
- Импорты только сверху вниз по слоям.
- UI-тексты хранить через ключи/словари, не захардкоживать большие блоки.
- Логику состояния выносить в Effector-модели (`events`, `stores`, `effects`).
