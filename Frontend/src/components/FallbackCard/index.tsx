import './styles.css'

type FallbackCardProps = {
  message: string
}

export function FallbackCard({ message }: FallbackCardProps) {
  return (
    <section className="glass-card fallback-card">
      <h1>Раздел недоступен</h1>
      <p>{message}</p>
    </section>
  )
}
