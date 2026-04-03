import { Link } from 'react-router-dom'
import './styles.css'

type PreviewCardProps = {
  title: string
  description: string
  linkPath: string
}

export function PreviewCard({ title, description, linkPath }: PreviewCardProps) {
  return (
    <article className="glass-card">
      <h2>{title}</h2>
      <p>{description}</p>
      <Link to={linkPath} className="text-link">
        Смотреть все
      </Link>
    </article>
  )
}
