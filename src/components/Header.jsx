import { Link } from 'react-router-dom'

function Header() {
  return (
    <header className="bg-black">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-5">
        <Link to="/" className="label-tracked text-sm text-white">
          The Author&apos;s Table
        </Link>
        <nav>
          <Link to="/" className="label-tracked text-xs text-white/80 hover:text-white">
            Gallery
          </Link>
        </nav>
      </div>
    </header>
  )
}

export default Header
