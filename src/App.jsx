import { Routes, Route, Navigate } from 'react-router-dom'
import { DataProvider, useData } from './context/DataContext'
import AuthGate from './components/AuthGate'
import NavBar from './components/NavBar'
import Dashboard from './pages/Dashboard'
import Outreach from './pages/Outreach'
import Clients from './pages/Clients'
import AIApp from './pages/AIApp'
import Coaching from './pages/Coaching'
import ContentCreation from './pages/ContentCreation'
import Ideas from './pages/Ideas'

function AppContent() {
  const { data } = useData()

  if (!data) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: 13 }}>
        Loading...
      </div>
    )
  }

  return (
    <div className="app-layout">
      <NavBar />
      <div className="page-content">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/outreach" element={<Outreach />} />
          <Route path="/clients" element={<Clients />} />
          <Route path="/ai-app" element={<AIApp />} />
          <Route path="/coaching" element={<Coaching />} />
          <Route path="/content" element={<ContentCreation />} />
          <Route path="/ideas" element={<Ideas />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <AuthGate>
      <DataProvider>
        <AppContent />
      </DataProvider>
    </AuthGate>
  )
}
