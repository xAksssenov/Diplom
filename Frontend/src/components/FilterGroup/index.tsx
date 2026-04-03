import './styles.css'

type FilterGroupProps = {
  title: string
  values: string[]
}

export function FilterGroup({ title, values }: FilterGroupProps) {
  return (
    <div className="filter-group">
      <h3>{title}</h3>
      <div className="tag-row">
        {values.map((value) => (
          <button key={value} type="button" className="tag-pill">
            {value}
          </button>
        ))}
      </div>
    </div>
  )
}
