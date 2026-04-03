import { Link, useLocation } from 'react-router-dom'
import { getBreadcrumbSegments } from '../../router'
import './styles.css'

export function Breadcrumbs() {
  const location = useLocation()
  const segments = getBreadcrumbSegments(location.pathname)

  return (
    <div className="breadcrumbs">
      <Link to="/" className="breadcrumbs__link">
        Главная
      </Link>
      {segments.map((segment) => (
        <span key={segment.path}>
          {' / '}
          <Link to={segment.path} className="breadcrumbs__link">
            {segment.label}
          </Link>
        </span>
      ))}
    </div>
  )
}
