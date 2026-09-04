import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import './index.css'
import App from './App.jsx'
import { AppProvider } from './context/AppContext.jsx'

// Keep the installed app up to date without prompting — safe for a POS where
// there is no unsaved server state (everything is already in IndexedDB).
registerSW({ immediate: true })

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AppProvider>
      <App />
    </AppProvider>
  </StrictMode>,
)
