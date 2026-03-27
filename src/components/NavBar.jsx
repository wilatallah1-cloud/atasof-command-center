import { NavLink } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const links = [
  { to: '/', label: 'Dashboard' },
  { to: '/outreach', label: 'Outreach' },
  { to: '/clients', label: 'Clients' },
  { to: '/ai-saas', label: 'AI SaaS' },
  { to: '/coaching', label: 'Coaching' },
  { to: '/youtube', label: 'YouTube' },
  { to: '/ideas', label: 'Ideas' },
]

export default function NavBar() {
  const [userEmail, setUserEmail] = useState('')

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user?.email) setUserEmail(session.user.email.split('@')[0])
    })
  }, [])

  async function handleLogout() {
    await supabase.auth.signOut()
  }

  return (
    <header className="topbar">
      <div className="topbar-brand">ATASOF AI</div>
      <nav className="topbar-nav">
        {links.map(l => (
          <NavLink
            key={l.to}
            to={l.to}
            end={l.to === '/'}
            className={({ isActive }) => `nav-pill${isActive ? ' active' : ''}`}
          >
            {l.label}
          </NavLink>
        ))}
      </nav>
      <div className="topbar-right">
        {userEmail && <span className="topbar-user">{userEmail}</span>}
        <button className="btn btn-ghost" style={{ fontSize: 12, padding: '4px 10px' }} onClick={handleLogout}>
          Logout
        </button>
      </div>
    </header>
  )
}
