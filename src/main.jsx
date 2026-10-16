import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { syncColors } from './services/catalog/colorsApi'
import { syncNavigation } from './services/catalog/navigationApi'
import { syncProducts } from './services/catalog/products/productSync'
import { syncSettings } from './services/content/settingsApi'

// Every product read resolves its colours synchronously from the local mirror,
// so pull the server's list once up front. The first paint uses the last list
// this browser saw; if the server's differs, pages re-render when it lands.
syncColors()
// The menu is also what catalogue URLs resolve against; see syncNavigation.
syncNavigation()
// The catalogue: storefront reads wait on this, and the dashboard's overview,
// reports and stock maths read the mirror it fills.
syncProducts()
// Shipping zones, VAT and the storefront copy, which a dozen places read synchronously.
syncSettings()

/* Application Entry Point: Renders the root App component into the DOM */
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
