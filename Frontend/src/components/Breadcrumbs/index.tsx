import { Breadcrumbs as MantineBreadcrumbs, Paper } from '@mantine/core'
import { Link, useLocation } from 'react-router-dom'
import { getBreadcrumbSegments } from '../../router'

export function Breadcrumbs() {
  const location = useLocation()
  const segments = getBreadcrumbSegments(location.pathname)

  return (
    <Paper withBorder radius="md" p="sm" style={{ background: 'var(--bg-surface)' }}>
      <MantineBreadcrumbs separator="/" separatorMargin="xs">
        <Link to="/">Главная</Link>
        {segments.map((segment) => (
          <Link key={segment.path} to={segment.path}>
            {segment.label}
          </Link>
        ))}
      </MantineBreadcrumbs>
    </Paper>
  )
}
