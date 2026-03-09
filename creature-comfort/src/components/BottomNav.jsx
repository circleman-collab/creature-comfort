import { memo } from 'react'
import './BottomNav.css'

const TABS = [
  { id: 'home',       label: 'Home',  icon: '🌱' },
  { id: 'intentions', label: 'Why',   icon: '✦' },
  { id: 'stats',      label: 'Stats', icon: '◈' },
]

// memo: skip re-render unless the active tab changes
const BottomNav = memo(function BottomNav({ active, onChange }) {
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
})

export default BottomNav
