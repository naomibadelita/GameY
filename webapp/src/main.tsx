import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './Auth'
import './index.css'
import App from './App.tsx'
import Login from './Login'
import ProtectedRoute from './ProtectedRoute'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/game"
            element={
              <ProtectedRoute>
                <App />
              </ProtectedRoute>
            }
          />
          <Route path="/" element={<Navigate to="/game" />} />
        </Routes>
      </AuthProvider>
    </Router>
  </StrictMode>,
)
