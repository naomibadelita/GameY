import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './Auth'
import './index.css'
import App from './App.tsx'
import Login from './Login'
import ProtectedRoute from './ProtectedRoute'
import Leaderboard from './leaderboard/presentation/leaderboard'
import MainMenu from './MainMenu'
import BoardSize from './BoardSize'
import StatisticsPage from './statistics/presentation/StatisticsPage.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/menu"
            element={
              <ProtectedRoute>
                <MainMenu />
              </ProtectedRoute>
            }
          />
          <Route
            path="/board-size"
            element={
              <ProtectedRoute>
                <BoardSize />
              </ProtectedRoute>
            }
          />
          <Route
            path="/game"
            element={
              <ProtectedRoute>
                <App />
              </ProtectedRoute>
            }
          />
          <Route
            path="/leaderboard"
            element={
              <ProtectedRoute>
                <Leaderboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/statistics"
            element={
              <ProtectedRoute>
                <StatisticsPage />
              </ProtectedRoute>
            }
          />
          <Route path="/" element={<Navigate to="/menu" />} />
        </Routes>
      </AuthProvider>
    </Router>
  </StrictMode>,
)
