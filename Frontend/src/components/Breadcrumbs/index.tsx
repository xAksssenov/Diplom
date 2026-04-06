import { Breadcrumbs as MantineBreadcrumbs, Paper } from '@mantine/core'
import { Link, useLocation } from 'react-router-dom'
import { getBreadcrumbSegments } from '../../router'
import './styles.css'

export function Breadcrumbs() {
  const location = useLocation()
  if (location.pathname === '/') {
    return null
  }
  const segments = getBreadcrumbSegments(location.pathname)

  return (
    <Paper withBorder radius="md" p="sm" style={{ background: 'var(--bg-surface)' }}>
      <MantineBreadcrumbs
        separator="/"
        separatorMargin="xs"
        styles={{ separator: { color: '#7c3aed' } }}
      >
        <Link to="/" className="app-breadcrumb-link">
          Главная
        </Link>
        {segments.map((segment) => (
          <Link key={segment.path} to={segment.path} className="app-breadcrumb-link">
            {segment.label}
          </Link>
        ))}
      </MantineBreadcrumbs>
    </Paper>
  )
}
