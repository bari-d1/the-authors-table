// Despite the name (kept so every import site doesn't need touching),
// this is no longer a pill: solid rectangular button, sharp-ish corners,
// white uppercase wide-tracked label text - matching the label-font
// treatment used for nav/section labels across the rest of the site.
// primary: black fill. secondary: teal fill, for use on light/white
// surfaces where a second solid color is needed alongside primary.
const VARIANT_CLASSES = {
  primary: 'bg-black text-white hover:opacity-90',
  secondary: 'bg-teal text-white hover:opacity-90',
}

function PillButton({ as: Component = 'button', variant = 'primary', className = '', ...props }) {
  const variantClasses = VARIANT_CLASSES[variant] ?? VARIANT_CLASSES.primary

  return (
    <Component
      className={`label-tracked inline-flex items-center justify-center rounded-sharp px-5 py-2.5 text-xs font-medium transition-opacity disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:opacity-50 ${variantClasses} ${className}`}
      {...props}
    />
  )
}

export default PillButton
