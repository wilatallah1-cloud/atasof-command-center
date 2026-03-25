import { useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { DataProvider, useData } from './context/DataContext'
import NavBar from './components/NavBar'
import ChatPanel from './components/ChatPanel'
import Dashboard from './pages/Dashboard'
import Outreach from './pages/Outreach'
import Clients from './pages/Clients'
import AISaas from './pages/AISaas'
import Coaching from './pages/Coaching'
import YouTube from './pages/YouTube'
import Ideas from './pages/Ideas'

function AppContent() {
  const { data } = useData()
  const [chatOpen, setChatOpen] = useState(false)

  if (!data) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: 13 }}>
        Loading...
      </div>
    )
  }

  return (
    <div className="app-layout">
      <NavBar onBriefClaude={() => setChatOpen(true)} />
      <div className="page-content">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/outreach" element={<Outreach />} />
          <Route path="/clients" element={<Clients />} />
          <Route path="/ai-saas" element={<AISaas />} />
          <Route path="/coaching" element={<Coaching />} />
          <Route path="/youtube" element={<YouTube />} />
          <Route path="/ideas" element={<Ideas />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
      <ChatPanel open={chatOpen} onClose={() => setChatOpen(false)} />
    </div>
  )
}

export default function App() {
  return (
    <DataProvider>
      <AppContent />
    </DataProvider>
  )
}
