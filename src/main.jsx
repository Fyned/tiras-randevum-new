import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { AuthProvider } from './context/AuthContext'
import { NotificationProvider } from './context/NotificationContext' // <-- EKLENDİ

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <NotificationProvider> {/* <-- Auth'un içine, App'in dışına */}
        <App />
      </NotificationProvider>
    </AuthProvider>
  </React.StrictMode>,
)