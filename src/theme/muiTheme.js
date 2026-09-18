import { createTheme } from '@mui/material/styles'

// MUI stays scoped to exactly what it was always meant for here:
// structural/behavior-heavy components (the book/chapter dropdown
// selects) where a keyboard-accessible listbox isn't worth hand-building.
// Never Button/Card/Chip/AppBar - those are all bespoke components
// elsewhere. Themed to disappear into the editorial monochrome system:
// sharp corners, white surfaces, hairline borders, no shadow or blur,
// serif type - not Material's own look, and not the glass look from the
// direction this replaces either.
const tokens = {
  black: '#0f0f0f',
  white: '#ffffff',
  ink: '#1a1a1a',
  inkMuted: '#4a4a4a',
  teal: '#1f3b38',
  border: '#e5e5e5',
}

export const muiTheme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: tokens.black, contrastText: tokens.white },
    secondary: { main: tokens.teal, contrastText: tokens.white },
    text: { primary: tokens.ink, secondary: tokens.inkMuted },
    background: { default: tokens.white, paper: tokens.white },
    divider: tokens.border,
  },
  shape: {
    borderRadius: 3,
  },
  typography: {
    fontFamily: "'Source Serif 4', serif",
    button: { textTransform: 'uppercase', fontWeight: 500, letterSpacing: '0.12em' },
  },
  components: {
    MuiButtonBase: {
      defaultProps: { disableRipple: true },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundColor: tokens.white,
          backgroundImage: 'none',
          border: `1px solid ${tokens.border}`,
          boxShadow: 'none',
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          backgroundColor: tokens.white,
          borderRadius: 3,
          color: tokens.ink,
          fontFamily: "'Source Serif 4', serif",
          '& fieldset': { borderColor: tokens.border },
          '&:hover fieldset': { borderColor: tokens.inkMuted },
          '&.Mui-focused fieldset': { borderColor: tokens.black, borderWidth: 1 },
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        select: { fontFamily: "'Source Serif 4', serif" },
        icon: { color: tokens.inkMuted },
      },
    },
    MuiMenuItem: {
      styleOverrides: {
        root: {
          fontFamily: "'Source Serif 4', serif",
          color: tokens.ink,
          '&.Mui-selected': { backgroundColor: 'rgba(15, 15, 15, 0.06)' },
          '&.Mui-selected:hover': { backgroundColor: 'rgba(15, 15, 15, 0.1)' },
          '&:hover': { backgroundColor: 'rgba(15, 15, 15, 0.04)' },
        },
      },
    },
    MuiFormHelperText: {
      styleOverrides: {
        root: { fontFamily: "'Source Serif 4', serif", color: tokens.inkMuted },
      },
    },
    MuiDialogTitle: {
      styleOverrides: {
        root: { fontFamily: "'Cormorant Garamond', serif", fontWeight: 600, color: tokens.ink },
      },
    },
    MuiDialogContent: {
      styleOverrides: {
        root: { fontFamily: "'Source Serif 4', serif", color: tokens.inkMuted },
      },
    },
  },
})
