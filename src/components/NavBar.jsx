import { NavLink, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const links = [
  { to: '/', label: 'Dashboard' },
  { to: '/tasks', label: 'Tasks' },
  { to: '/outreach', label: 'Outreach' },
  { to: '/clients', label: 'Clients' },
  { to: '/ai-app', label: 'AI App' },
  { to: '/coaching', label: 'Coaching' },
  { to: '/content', label: 'Content' },
  { to: '/ideas', label: 'Ideas' },
]

export default function NavBar() {
  const [userEmail, setUserEmail] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)
  const location = useLocation()

  useEffect(() => {
    setMenuOpen(false)
  }, [location.pathname])

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user?.email) setUserEmail(session.user.email.split('@')[0])
    })
  }, [])

  async function handleLogout() {
    await supabase.auth.signOut()
  }

  return (
    <header className={`topbar${menuOpen ? ' menu-open' : ''}`}>
      <div className="topbar-row">
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
        <button className="topbar-hamburger" onClick={() => setMenuOpen(o => !o)} aria-label="Menu">
          <span /><span /><span />
        </button>
      </div>
      <nav className="topbar-mobile-nav">
        {links.map(l => (
          <NavLink
            key={l.to}
            to={l.to}
            end={l.to === '/'}
            className={({ isActive }) => `mobile-nav-link${isActive ? ' active' : ''}`}
          >
            {l.label}
          </NavLink>
        ))}
        <div className="mobile-nav-footer">
          {userEmail && <span className="topbar-user">{userEmail}</span>}
          <button className="btn btn-ghost" style={{ fontSize: 12, padding: '4px 10px' }} onClick={handleLogout}>
            Logout
          </button>
        </div>
      </nav>
    </header>
  )
}
