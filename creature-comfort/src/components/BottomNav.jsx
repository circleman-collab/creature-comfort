import { memo } from 'react'
import './BottomNav.css'

const TABS = [
  {
    id: 'home',
    label: 'Home',
    icon: (
      <svg viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
        {/* Soil */}
        <rect x="3" y="10" width="6" height="1" fill="currentColor" opacity="0.6"/>
        <rect x="2" y="11" width="8" height="1" fill="currentColor" opacity="0.6"/>
        {/* Stem */}
        <rect x="5" y="7" width="1" height="3" fill="currentColor"/>
        {/* Left leaf */}
        <rect x="3" y="6" width="2" height="1" fill="currentColor"/>
        {/* Right leaf */}
        <rect x="6" y="6" width="2" height="1" fill="currentColor"/>
        {/* Bud */}
        <rect x="4" y="4" width="3" height="2" fill="currentColor"/>
        <rect x="5" y="3" width="1" height="1" fill="currentColor"/>
      </svg>
    ),
  },
  {
    id: 'intentions',
    label: 'Why',
    icon: (
      <svg viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
        {/* Spark / diamond shape */}
        <rect x="5" y="1" width="2" height="1" fill="currentColor"/>
        <rect x="4" y="2" width="4" height="1" fill="currentColor"/>
        <rect x="3" y="3" width="6" height="2" fill="currentColor"/>
        <rect x="4" y="5" width="4" height="1" fill="currentColor"/>
        <rect x="5" y="6" width="2" height="1" fill="currentColor"/>
        {/* Bottom rays */}
        <rect x="5" y="8" width="2" height="1" fill="currentColor"/>
        <rect x="3" y="7" width="1" height="1" fill="currentColor"/>
        <rect x="8" y="7" width="1" height="1" fill="currentColor"/>
      </svg>
    ),
  },
  {
    id: 'journal',
    label: 'Journal',
    icon: (
      <svg viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
        {/* Book outline */}
        <rect x="2" y="1" width="8" height="10" fill="currentColor" opacity="0.3"/>
        <rect x="3" y="1" width="7" height="10" fill="currentColor" opacity="0.6"/>
        {/* Spine */}
        <rect x="2" y="1" width="1" height="10" fill="currentColor"/>
        {/* Lines */}
        <rect x="4" y="3" width="4" height="1" fill="currentColor"/>
        <rect x="4" y="5" width="4" height="1" fill="currentColor"/>
        <rect x="4" y="7" width="3" height="1" fill="currentColor"/>
      </svg>
    ),
  },
  {
    id: 'stats',
    label: 'Stats',
    icon: (
      <svg viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
        {/* Bar chart - 3 bars of increasing height */}
        <rect x="1" y="8" width="2" height="3" fill="currentColor"/>
        <rect x="5" y="5" width="2" height="6" fill="currentColor"/>
        <rect x="9" y="2" width="2" height="9" fill="currentColor"/>
        {/* Ground line */}
        <rect x="1" y="11" width="10" height="1" fill="currentColor"/>
      </svg>
    ),
  },
]

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
