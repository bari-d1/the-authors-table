import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

// Standard shadcn/ui-layouts cn() helper: merges conditional class lists
// via clsx, then resolves conflicting Tailwind utility classes (e.g. two
// different `p-*` values) via tailwind-merge so the last one wins cleanly.
// Registry components (liquid-glass and anything pulled the same way later)
// expect this to exist at @/lib/utils.
export function cn(...inputs) {
  return twMerge(clsx(inputs))
}
