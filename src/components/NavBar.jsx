import { NavLink } from 'react-router-dom'

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
    </header>
  )
}
