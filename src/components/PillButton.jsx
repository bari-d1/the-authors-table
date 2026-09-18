const VARIANT_CLASSES = {
  primary: 'bg-gold text-ink border border-gold hover:opacity-90',
  secondary: 'bg-transparent text-ink border border-ink hover:bg-ink/5',
}

function PillButton({ as: Component = 'button', variant = 'primary', className = '', ...props }) {
  const variantClasses = VARIANT_CLASSES[variant] ?? VARIANT_CLASSES.primary

  return (
    <Component
      className={`inline-flex items-center justify-center rounded-pill px-5 py-2 font-body text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:opacity-50 ${variantClasses} ${className}`}
      {...props}
    />
  )
}

export default PillButton
