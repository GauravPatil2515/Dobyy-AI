import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './styles/main.css'
import './firebase.js'
import { AuthProvider } from './contexts/AuthContext.jsx'
import { SubscriptionProvider } from './contexts/SubscriptionContext.jsx'
import { OfflineProvider } from './contexts/OfflineContext.jsx'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <OfflineProvider>
      <AuthProvider>
        <SubscriptionProvider>
          <App />
        </SubscriptionProvider>
      </AuthProvider>
    </OfflineProvider>
  </React.StrictMode>
)
