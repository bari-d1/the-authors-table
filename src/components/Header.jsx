import { Link } from 'react-router-dom'

function Header() {
  return (
    <header className="border-b border-border bg-surface">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4">
        <Link to="/" className="font-display text-lg font-bold text-ink">
          The Author&apos;s Table
        </Link>
        <nav>
          <Link to="/" className="font-body text-sm text-ink-muted hover:text-ink">
            Gallery
          </Link>
        </nav>
      </div>
    </header>
  )
}

export default Header
