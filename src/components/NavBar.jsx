import { NavLink } from 'react-router-dom'

const links = [
  { to: '/', label: 'Dashboard' },
  { to: '/outreach', label: 'Outreach' },
  { to: '/clients', label: 'Clients' },
  { to: '/ai-saas', label: 'AI Content SaaS' },
  { to: '/coaching', label: 'Coaching' },
  { to: '/youtube', label: 'YouTube' },
  { to: '/ideas', label: 'Ideas' },
]

export default function NavBar({ onBriefClaude }) {
  return (
    <header className="topbar">
      <div className="topbar-brand">ATASOF AI COMMAND CENTER</div>
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
      <button className="brief-btn" onClick={onBriefClaude}>
        Brief Claude
      </button>
    </header>
  )
}
