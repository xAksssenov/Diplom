import { useState } from 'react'
import { textKeys } from '../shared/config/texts'
import type { MainRoute } from '../types/domain'

const mainNavItems: { path: MainRoute; label: string }[] = [
  { path: '/', label: textKeys.nav.about },
  { path: '/recipes', label: textKeys.nav.recipes },
  { path: '/meal-plans', label: textKeys.nav.mealPlans },
  { path: '/reviews', label: textKeys.nav.reviews },
]

type HeaderProps = {
  currentPath: string
  onNavigate: (path: string) => void
}

export function Header({ currentPath, onNavigate }: HeaderProps) {
  const [searchValue, setSearchValue] = useState('')

  return (
    <header className="header">
      <div className="header__left">
        <button className="brand" type="button" onClick={() => onNavigate('/')}>
          {textKeys.appName}
        </button>
        <nav className="nav-links">
          {mainNavItems.map((item) => (
            <button
              key={item.path}
              type="button"
              className={`nav-link ${currentPath.startsWith(item.path) && item.path !== '/' ? 'nav-link--active' : ''} ${currentPath === '/' && item.path === '/' ? 'nav-link--active' : ''}`}
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
