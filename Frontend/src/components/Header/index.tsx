import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { textKeys } from '../../shared/config/texts'
import type { MainRoute } from '../../types/domain'
import './styles.css'

const mainNavItems: { path: MainRoute; label: string }[] = [
  { path: '/', label: textKeys.nav.about },
  { path: '/recipes', label: textKeys.nav.recipes },
  { path: '/meal-plans', label: textKeys.nav.mealPlans },
  { path: '/reviews', label: textKeys.nav.reviews },
]

export function Header() {
  const navigate = useNavigate()
  const location = useLocation()

  return (
    <header className="header">
      <div className="header__left">
        <button className="brand" type="button" onClick={() => navigate('/')}>
          {textKeys.appName}
        </button>
        <nav className="nav-links">
          {mainNavItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `nav-link ${isActive ? 'nav-link--active' : ''}`
              }
              end={item.path === '/'}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </div>

      <div className="header__search">
        <input placeholder="Поиск по странице" aria-label="Поиск по странице" />
      </div>

      <div className="header__right">
        <button
          type="button"
          className={`header-cta ${location.pathname === '/planner' ? 'header-cta--active' : ''}`}
          onClick={() => navigate('/planner')}
        >
          Конструктор
        </button>
        <NavLink to="/profile" className="nav-link">
          {textKeys.nav.profile}
        </NavLink>
        <NavLink to="/settings" className="nav-link">
          {textKeys.nav.settings}
        </NavLink>
      </div>
    </header>
  )
}
