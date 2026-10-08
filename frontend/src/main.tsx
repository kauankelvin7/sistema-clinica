import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { registerAppUpdates } from './utils/appUpdates'

try {
  document.documentElement.dataset.density = localStorage.getItem('display_density') || 'comfortable'
  document.documentElement.dataset.transparency = localStorage.getItem('display_transparency') || 'normal'
} catch { /* Display preferences are optional. */ }
registerAppUpdates()
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode><App /></React.StrictMode>,
)
