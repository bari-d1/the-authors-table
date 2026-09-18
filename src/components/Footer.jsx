// Small, minimal outline icons, hand-written rather than pulling in an
// icon library for five static glyphs.
function InstagramIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-4 w-4">
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4.2" />
      <circle cx="17.2" cy="6.8" r="0.9" fill="currentColor" stroke="none" />
    </svg>
  )
}

function LinkedInIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-4 w-4">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <line x1="7.5" y1="10" x2="7.5" y2="17" />
      <circle cx="7.5" cy="6.8" r="0.9" fill="currentColor" stroke="none" />
      <path d="M11.5 17v-4.2a2.3 2.3 0 0 1 4.6 0V17" />
      <line x1="11.5" y1="10" x2="11.5" y2="17" />
    </svg>
  )
}

function MailIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-4 w-4">
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m4 7 8 6 8-6" />
    </svg>
  )
}

function FacebookIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-4 w-4">
      <circle cx="12" cy="12" r="9" />
      <path d="M14 8.5h-1.5A2 2 0 0 0 10.5 10.5V12M9 12h5.5M12.5 12V19" />
    </svg>
  )
}

function YouTubeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-4 w-4">
      <rect x="3" y="6" width="18" height="12" rx="3" />
      <path d="M10.5 9.5v5l4.5-2.5z" fill="currentColor" stroke="none" />
    </svg>
  )
}

// Real profile URLs for Instagram/LinkedIn/Facebook/YouTube aren't known
// yet - not guessing them, so those four are icons only for now (no href)
// until the real links are supplied. Email is the one destination this
// site already has and knows is correct.
const SOCIAL_LINKS = [
  { label: 'Instagram', href: null, Icon: InstagramIcon },
  { label: 'LinkedIn', href: null, Icon: LinkedInIcon },
  { label: 'Email', href: 'mailto:info@joshuakomolafe.com', Icon: MailIcon },
  { label: 'Facebook', href: null, Icon: FacebookIcon },
  { label: 'YouTube', href: null, Icon: YouTubeIcon },
]

function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="bg-black">
      <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-center gap-3 px-6 pt-10">
        {SOCIAL_LINKS.map(({ label, href, Icon }) =>
          href ? (
            <a
              key={label}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={label}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-white/20 text-white/80 transition-colors hover:border-white/40 hover:text-white"
            >
              <Icon />
            </a>
          ) : (
            <span
              key={label}
              aria-label={label}
              title={`${label} link coming soon`}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-white/20 text-white/40"
            >
              <Icon />
            </span>
          ),
        )}
      </div>

      <div className="mx-auto flex max-w-3xl flex-col items-center gap-6 px-6 py-10 text-center">
        {/* Not linked yet - real destinations for these (on the main site,
            presumably) aren't confirmed, so this is the visual only for
            now rather than a link to somewhere unconfirmed. */}
        <div className="label-tracked flex gap-6 text-xs text-white/80">
          <span className="underline decoration-white/30 underline-offset-4">Services</span>
          <span className="underline decoration-white/30 underline-offset-4">Privacy Policy</span>
        </div>

        <p className="font-body text-sm text-white/50">
          Joshua Komolafe &middot; Wilsons Park, Monsall Road, Manchester, England, M40 8WN, United
          Kingdom &middot; info@joshuakomolafe.com
        </p>

        <p className="font-body text-sm text-white/40">Joshua T. Komolafe &copy; {year}</p>
      </div>
    </footer>
  )
}

export default Footer
