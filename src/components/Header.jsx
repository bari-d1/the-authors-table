import { Link } from 'react-router-dom'
import logo from '../assets/joshua-komolafe-logo.webp'

function Header() {
  return (
    <header className="bg-black">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-5">
        <Link to="/" className="label-tracked text-sm text-white">
          The Author&apos;s Table
        </Link>
        <nav className="flex items-center gap-6">
          <Link to="/" className="label-tracked text-xs text-white/80 hover:text-white">
            Gallery
          </Link>
          <Link to="/search" className="label-tracked text-xs text-white/80 hover:text-white">
            Search
          </Link>
          <a
            href="https://joshuakomolafe.com"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Visit Joshua Komolafe's main site"
            className="opacity-80 transition-opacity hover:opacity-100"
          >
            <img src={logo} alt="Joshua Komolafe" className="h-6 w-auto sm:h-7" />
          </a>
        </nav>
      </div>
    </header>
  )
}

export default Header
