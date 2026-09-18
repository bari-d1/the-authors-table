// No longer a filled pill/chip - a small uppercase wide-tracked text
// label, closer to a running category label ("CATEGORY . TOPIC") than a
// badge chip. Renders its own leading marker so multi-word labels read as
// one tracked unit rather than a colored shape competing for attention.
function TagBadge({ className = '', children, ...props }) {
  return (
    <span className={`label-tracked text-[11px] text-teal ${className}`} {...props}>
      · {children}
    </span>
  )
}

export default TagBadge
