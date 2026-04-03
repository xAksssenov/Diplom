import { textKeys } from '../../shared/config/texts'
import './styles.css'

export function Footer() {
  return (
    <footer className="footer">
      <p>{textKeys.footer.copy}</p>
      <div className="footer__links">
        {textKeys.footer.links.map((linkName) => (
          <button key={linkName} type="button">
            {linkName}
          </button>
        ))}
      </div>
    </footer>
  )
}
