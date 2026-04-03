type PreviewCardProps = {
  title: string
  description: string
  linkPath: string
  onNavigate: (path: string) => void
}

export function PreviewCard({
  title,
  description,
  linkPath,
  onNavigate,
}: PreviewCardProps) {
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
