import { useEffect, useMemo, useState } from 'react'
import { textKeys } from './shared/config/texts'

type RoutePath =
  | '/'
  | '/recipes'
  | '/meal-plans'
  | '/reviews'
  | '/profile'
  | '/settings'

const navItems = [
  { path: '/' as RoutePath, label: textKeys.nav.about },
  { path: '/recipes' as RoutePath, label: textKeys.nav.recipes },
  { path: '/meal-plans' as RoutePath, label: textKeys.nav.mealPlans },
  { path: '/reviews' as RoutePath, label: textKeys.nav.reviews },
]

function App() {
  const [currentPath, setCurrentPath] = useState<RoutePath>(
    normalizePath(window.location.pathname),
  )

  useEffect(() => {
    const onPopState = () => {
      setCurrentPath(normalizePath(window.location.pathname))
    }

    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])

  const navigate = (path: RoutePath) => {
    if (currentPath === path) {
      return
    }

    window.history.pushState({}, '', path)
    setCurrentPath(path)
  }

  return (
    <div className="app-shell">
      <Header currentPath={currentPath} onNavigate={navigate} />
      <Breadcrumbs currentPath={currentPath} onNavigate={navigate} />
      <main className="page-content">{renderPage(currentPath, navigate)}</main>
      <Footer />
    </div>
  )
}

function normalizePath(pathname: string): RoutePath {
  const available: RoutePath[] = [
    '/',
    '/recipes',
    '/meal-plans',
    '/reviews',
    '/profile',
    '/settings',
  ]

  return available.includes(pathname as RoutePath)
    ? (pathname as RoutePath)
    : '/'
}

function renderPage(currentPath: RoutePath, onNavigate: (path: RoutePath) => void) {
  switch (currentPath) {
    case '/recipes':
      return <RecipesPage />
    case '/meal-plans':
      return <MealPlansPage />
    case '/reviews':
      return <ReviewsPage />
    case '/profile':
      return <ProfilePage />
    case '/settings':
      return <SettingsPage />
    default:
      return <AboutPage onNavigate={onNavigate} />
  }
}

type HeaderProps = {
  currentPath: RoutePath
  onNavigate: (path: RoutePath) => void
}

function Header({ currentPath, onNavigate }: HeaderProps) {
  const [searchValue, setSearchValue] = useState('')

  return (
    <header className="header">
      <div className="header__left">
        <button className="brand" type="button" onClick={() => onNavigate('/')}>
          {textKeys.appName}
        </button>
        <nav className="nav-links">
          {navItems.map((item) => (
            <button
              key={item.path}
              type="button"
              className={`nav-link ${currentPath === item.path ? 'nav-link--active' : ''}`}
              onClick={() => onNavigate(item.path)}
            >
              {item.label}
            </button>
          ))}
        </nav>
      </div>

      <div className="header__search">
        <input
          value={searchValue}
          onChange={(event) => setSearchValue(event.target.value)}
          placeholder="Поиск по странице"
          aria-label="Поиск по странице"
        />
      </div>

      <div className="header__right">
        <button
          type="button"
          className={`nav-link ${currentPath === '/profile' ? 'nav-link--active' : ''}`}
          onClick={() => onNavigate('/profile')}
        >
          {textKeys.nav.profile}
        </button>
        <button
          type="button"
          className={`nav-link ${currentPath === '/settings' ? 'nav-link--active' : ''}`}
          onClick={() => onNavigate('/settings')}
        >
          {textKeys.nav.settings}
        </button>
      </div>
    </header>
  )
}

type BreadcrumbsProps = {
  currentPath: RoutePath
  onNavigate: (path: RoutePath) => void
}

function Breadcrumbs({ currentPath, onNavigate }: BreadcrumbsProps) {

  const segments = useMemo(() => {
    const labels: Record<string, string> = {
      recipes: textKeys.nav.recipes,
      'meal-plans': textKeys.nav.mealPlans,
      reviews: textKeys.nav.reviews,
      profile: textKeys.nav.profile,
      settings: textKeys.nav.settings,
    }

    return currentPath
      .split('/')
      .filter(Boolean)
      .map((segment, index, arr) => ({
        path: `/${arr.slice(0, index + 1).join('/')}`,
        label: labels[segment] ?? segment,
      }))
  }, [currentPath])

  return (
    <div className="breadcrumbs">
      <button type="button" className="breadcrumbs__link" onClick={() => onNavigate('/')}>
        Главная
      </button>
      {segments.map((segment) => (
        <span key={segment.path}>
          {' / '}
          <button
            type="button"
            className="breadcrumbs__link"
            onClick={() => onNavigate(segment.path as RoutePath)}
          >
            {segment.label}
          </button>
        </span>
      ))}
    </div>
  )
}

type AboutPageProps = {
  onNavigate: (path: RoutePath) => void
}

function AboutPage({ onNavigate }: AboutPageProps) {
  return (
    <section>
      <div className="glass-card">
        <h1>Планируйте питание под свои цели</h1>
        <p>
          FoodPlanner объединяет рецепты, планы питания и отзывы в одном месте.
          Выберите готовый план или соберите свой.
        </p>
        <button
          type="button"
          className="cta-link"
          onClick={() => onNavigate('/meal-plans')}
        >
          {textKeys.cta.planner}
        </button>
      </div>

      <div className="cards-grid">
        <PreviewCard
          title="Рецепты"
          description="Подборки по тегам, калорийности и диетическим предпочтениям."
          linkPath="/recipes"
          onNavigate={onNavigate}
        />
        <PreviewCard
          title="Планы питания"
          description="Планы на день, неделю или месяц с детальным расписанием."
          linkPath="/meal-plans"
          onNavigate={onNavigate}
        />
        <PreviewCard
          title="Оценки и отзывы"
          description="Просматривайте отзывы пользователей и переходите к планам."
          linkPath="/reviews"
          onNavigate={onNavigate}
        />
      </div>
    </section>
  )
}

function RecipesPage() {
  return (
    <section className="glass-card">
      <h1>Рецепты</h1>
      <p>Каркас раздела с фильтрами и карточками рецептов готов.</p>
    </section>
  )
}

function MealPlansPage() {
  return (
    <section className="glass-card">
      <h1>Планы питания</h1>
      <p>
        Каркас страницы готов: здесь будут фильтры слева и карточки планов
        справа.
      </p>
    </section>
  )
}

function ReviewsPage() {
  return (
    <section className="glass-card">
      <h1>Оценки и отзывы</h1>
      <p>Здесь будет список отзывов на планы питания с быстрыми переходами.</p>
    </section>
  )
}

function ProfilePage() {
  return (
    <section className="glass-card">
      <h1>Профиль</h1>
      <p>Каркас личного кабинета для аватара, тегов и статусов модерации.</p>
    </section>
  )
}

function SettingsPage() {
  return (
    <section className="glass-card">
      <h1>Настройки</h1>
      <p>Каркас раздела базовых настроек аккаунта.</p>
    </section>
  )
}

type PreviewCardProps = {
  title: string
  description: string
  linkPath: RoutePath
  onNavigate: (path: RoutePath) => void
}

function PreviewCard({ title, description, linkPath, onNavigate }: PreviewCardProps) {
  return (
    <article className="glass-card">
      <h2>{title}</h2>
      <p>{description}</p>
      <button type="button" className="text-link" onClick={() => onNavigate(linkPath)}>
        Смотреть все
      </button>
    </article>
  )
}

function Footer() {
  return (
    <footer className="footer">
      <p>{textKeys.footer.copy}</p>
      <div className="footer__links">
        {textKeys.footer.links.map((linkName) => (
          <button key={linkName} type="button">
            {linkName}
          </button>
        ))}
      </div>
    </footer>
  )
}

export default App
