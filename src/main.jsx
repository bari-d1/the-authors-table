import { ThemeProvider } from '@mui/material/styles'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import { muiTheme } from './theme/muiTheme.js'

// No <CssBaseline /> here deliberately: it injects Material's own global
// reset, which would fight index.css's Tailwind-based one rather than
// complement it. MUI is used for specific components only, not as the
// site's base styling layer.
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <ThemeProvider theme={muiTheme}>
        <App />
      </ThemeProvider>
    </BrowserRouter>
  </StrictMode>,
)
