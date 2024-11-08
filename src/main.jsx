import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { LoadingProvider } from './components/LoadingProvider';

import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
      <LoadingProvider>
          <App />
      </LoadingProvider>
  </StrictMode>,
)
