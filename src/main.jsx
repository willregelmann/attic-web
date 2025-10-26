console.log('main.jsx is loading');

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import '@fortawesome/fontawesome-free/css/all.min.css'
import App from './App.jsx'

console.log('About to render React app');

const rootElement = document.getElementById('root');
console.log('Root element:', rootElement);

if (rootElement) {
  createRoot(rootElement).render(
    <StrictMode>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </StrictMode>,
  )
  console.log('React app rendered');
} else {
  console.error('Root element not found!');
}
