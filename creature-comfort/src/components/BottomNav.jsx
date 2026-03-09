import './BottomNav.css'

const TABS = [
  { id: 'home',       label: 'Home',       icon: '🌱' },
  { id: 'intentions', label: 'Why',        icon: '✦' },
  { id: 'stats',      label: 'Stats',      icon: '◈' },
]

export default function BottomNav({ active, onChange }) {
  return (
    <nav className="bottom-nav">
      {TABS.map(tab => (
        <button
          key={tab.id}
          className={`bnav-btn ${active === tab.id ? 'active' : ''}`}
          onClick={() => onChange(tab.id)}
        >
          <span className="bnav-icon">{tab.icon}</span>
          <span className="bnav-label">{tab.label}</span>
        </button>
      ))}
    </nav>
  )
}
