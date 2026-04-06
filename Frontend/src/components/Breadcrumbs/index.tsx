import { Breadcrumbs as MantineBreadcrumbs, Paper } from '@mantine/core'
import { Link, useLocation } from 'react-router-dom'
import { getBreadcrumbSegments } from '../../router'

export function Breadcrumbs() {
  const location = useLocation()
  if (location.pathname === '/') {
    return null
  }
  const segments = getBreadcrumbSegments(location.pathname)

  return (
    <Paper withBorder radius="md" p="sm" style={{ background: 'var(--bg-surface)' }}>
      <MantineBreadcrumbs separator="/" separatorMargin="xs">
        <Link to="/" style={{ color: 'var(--text-primary)', textDecoration: 'none' }}>
          Главная
        </Link>
        {segments.map((segment) => (
          <Link
            key={segment.path}
            to={segment.path}
            style={{ color: 'var(--text-primary)', textDecoration: 'none' }}
          >
            {segment.label}
          </Link>
        ))}
      </MantineBreadcrumbs>
    </Paper>
  )
}
