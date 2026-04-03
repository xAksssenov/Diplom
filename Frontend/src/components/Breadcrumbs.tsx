import { useMemo } from 'react'
import { getBreadcrumbSegments } from '../router'

type BreadcrumbsProps = {
  currentPath: string
  onNavigate: (path: string) => void
}

export function Breadcrumbs({ currentPath, onNavigate }: BreadcrumbsProps) {
  const segments = useMemo(
    () => getBreadcrumbSegments(currentPath),
    [currentPath],
  )

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
            onClick={() => onNavigate(segment.path)}
          >
            {segment.label}
          </button>
        </span>
      ))}
    </div>
  )
}
