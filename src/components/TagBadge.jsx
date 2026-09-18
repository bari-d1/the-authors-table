const COLOR_CLASSES = {
  olive: 'bg-tag-olive/15 text-tag-olive',
  slate: 'bg-tag-slate/15 text-tag-slate',
  plum: 'bg-tag-plum/15 text-tag-plum',
}

function TagBadge({ color = 'olive', className = '', children, ...props }) {
  const colorClasses = COLOR_CLASSES[color] ?? COLOR_CLASSES.olive

  return (
    <span
      className={`inline-flex items-center rounded-pill px-3 py-1 font-body text-xs font-medium ${colorClasses} ${className}`}
      {...props}
    >
      {children}
    </span>
  )
}

export default TagBadge
