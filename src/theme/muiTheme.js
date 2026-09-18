import { createTheme } from '@mui/material/styles'

// MUI is scoped to structural/behavior-heavy components only (dropdown
// selects, modals/dialogs, form validation states) - never Button, Card,
// Chip, or AppBar for anything visually prominent, since MUI's default
// Material look is itself a recognizable aesthetic that would undercut the
// bespoke goal as much as an unstyled template would. Everything here
// exists to make the components MUI is actually used for read as glass
// surfaces belonging to this site, not "a MUI component wearing a costume."
//
// TODO: built against the site's *current* tokens (index.css) as a
// placeholder - the task that asked for this theme referenced "new color
// tokens below" that weren't actually included in that message. Swap the
// hex values here for the real palette once it exists; the structural
// overrides (no ripple, no elevation shadow, frosted glass surfaces on
// Select/Menu/Dialog/inputs) should hold regardless of the final palette.
const tokens = {
  paper: '#f6f2e9',
  surface: '#fdfbf6',
  ink: '#1b1815',
  inkMuted: '#6b6357',
  gold: '#a9762f',
  border: '#e5dfd0',
}

const glassSurfaceSx = {
  backgroundColor: 'rgba(253, 251, 246, 0.72)',
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  border: `1px solid ${tokens.border}`,
  boxShadow: '0 8px 32px rgba(27, 24, 21, 0.12)',
  backgroundImage: 'none', // kills MUI's default elevation overlay gradient
}

export const muiTheme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: tokens.gold, contrastText: tokens.ink },
    text: { primary: tokens.ink, secondary: tokens.inkMuted },
    background: { default: tokens.paper, paper: tokens.surface },
    divider: tokens.border,
  },
  shape: {
    borderRadius: 16,
  },
  typography: {
    fontFamily: 'Inter, sans-serif',
    button: { textTransform: 'none', fontWeight: 500 },
  },
  components: {
    // Global: no Material ripple anywhere, it's one of the most
    // recognizably-Material interaction cues.
    MuiButtonBase: {
      defaultProps: { disableRipple: true },
    },
    // Base surface used by Menu, Dialog, Popover, etc. - frosted glass
    // instead of a flat white card with a default elevation shadow.
    MuiPaper: {
      styleOverrides: {
        root: {
          ...glassSurfaceSx,
        },
      },
    },
    MuiMenu: {
      styleOverrides: {
        paper: glassSurfaceSx,
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          ...glassSurfaceSx,
          borderRadius: 24,
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          backgroundColor: tokens.paper,
          borderRadius: 12,
          '& fieldset': { borderColor: tokens.border },
          '&:hover fieldset': { borderColor: tokens.inkMuted },
          '&.Mui-focused fieldset': { borderColor: tokens.gold, borderWidth: 1 },
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        select: { fontFamily: 'Inter, sans-serif' },
      },
    },
    MuiMenuItem: {
      styleOverrides: {
        root: {
          fontFamily: 'Inter, sans-serif',
          '&.Mui-selected': { backgroundColor: 'rgba(169, 118, 47, 0.15)' },
          '&.Mui-selected:hover': { backgroundColor: 'rgba(169, 118, 47, 0.22)' },
        },
      },
    },
    MuiFormHelperText: {
      styleOverrides: {
        root: { fontFamily: 'Inter, sans-serif' },
      },
    },
  },
})
