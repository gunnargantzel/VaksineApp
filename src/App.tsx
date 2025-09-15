import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useMsal } from '@azure/msal-react'
import { Spinner } from '@fluentui/react-components'
import Layout from './components/Layout/Layout'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import PatientSearchPage from './pages/PatientSearchPage'
import VaccinationPage from './pages/VaccinationPage'
import AdminPage from './pages/AdminPage'
import { useAuth } from './hooks/useAuth'
import { useUserRoles } from './hooks/useUserRoles'
import './App.css'

function App() {
  const { instance, accounts } = useMsal()
  const { user, loading: authLoading } = useAuth()
  const { roles, loading: rolesLoading } = useUserRoles()

  // Show loading spinner while authentication is in progress
  if (authLoading || rolesLoading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
        <Spinner size="large" label="Laster..." />
      </div>
    )
  }

  // If not authenticated, show login page
  if (!user || accounts.length === 0) {
    return <LoginPage />
  }

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/patients" element={<PatientSearchPage />} />
        <Route path="/vaccination" element={<VaccinationPage />} />
        {roles.includes('Admin') && (
          <Route path="/admin" element={<AdminPage />} />
        )}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Layout>
  )
}

export default App
