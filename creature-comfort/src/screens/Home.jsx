import { useState, useEffect } from 'react'
import CreatureCanvas from '../components/CreatureCanvas'
import { getMsSinceLastUse, formatDuration, computeHealthAfterUse } from '../hooks/useStore'
import './Home.css'

export default function Home({ state, update, onCravingSurf }) {
  const [elapsed, setElapsed] = useState(0)
  const [showIntention, setShowIntention] = useState(false)
  const [reacting, setReacting] = useState(false)

  // Live timer
  useEffect(() => {
    const id = setInterval(() => {
      setElapsed(getMsSinceLastUse(state.events))
    }, 1000)
    setElapsed(getMsSinceLastUse(state.events))
    return () => clearInterval(id)
  }, [state.events])

  // Randomly surface intention
  useEffect(() => {
    const id = setInterval(() => {
      setShowIntention(true)
      setTimeout(() => setShowIntention(false), 6000)
    }, 8 * 60 * 1000) // every 8 min
    return () => clearInterval(id)
  }, [])

  function logUse() {
    setReacting(true)
    setTimeout(() => setReacting(false), 1200)

    const now = Date.now()
    const healthDelta = computeHealthAfterUse(state)
    const newEvent = { id: now, type: 'used', ts: now }

    update(prev => ({
      ...prev,
      events: [...prev.events, newEvent],
      ...healthDelta,
      startedAt: prev.startedAt || now,
    }))
  }

  function logResisted() {
    const now = Date.now()
    update(prev => ({
      ...prev,
      events: [...prev.events, { id: now, type: 'resisted', ts: now }],
      health: Math.min(prev.health + 3, 100),
      startedAt: prev.startedAt || now,
    }))
  }

  const daysSinceStart = state.startedAt
    ? Math.floor((Date.now() - state.startedAt) / 86400000)
    : 0

  // Pick an intention to show
  const intentions = [state.intentionBig, ...(state.intentions || []).map(i => i.text)]
  const currentIntention = intentions[Math.floor(Date.now() / 1000 / 60 / 8) % intentions.length]

  const stageNames = ['', 'Seedling', 'Sprout', 'Wanderer', 'Blossoming', 'Radiant']

  return (
    <div className="home">
      {/* Header */}
      <div className="home-header">
        <div className="home-creature-name">{state.creatureName}</div>
        <div className="home-stage-label">{stageNames[state.stage]}</div>
      </div>

      {/* Canvas */}
      <div className="home-canvas-wrap">
        <CreatureCanvas stage={state.stage} health={state.health} reacting={reacting} />
        {/* Health bar */}
        <div className="health-bar-wrap">
          <div className="health-bar">
            <div
              className="health-bar-fill"
              style={{
                width: `${state.health}%`,
                background: state.health > 60 ? 'var(--accent)' :
                            state.health > 30 ? 'var(--gold)' : 'var(--red)'
              }}
            />
          </div>
        </div>
      </div>

      {/* Intention whisper */}
      <div className={`intention-whisper ${showIntention ? 'visible' : ''}`}>
        <span className="prose">"{currentIntention}"</span>
      </div>

      {/* Timer */}
      <div className="home-timer">
        <div className="timer-label">clean for</div>
        <div className="timer-value">{formatDuration(elapsed)}</div>
        <div className="timer-sub">
          {daysSinceStart > 0 ? `day ${daysSinceStart + 1} of your journey` : 'your journey begins now'}
        </div>
      </div>

      {/* Actions */}
      <div className="home-actions">
        <button className="btn-craving" onClick={onCravingSurf}>
          <span className="btn-craving-main">I'm craving</span>
          <span className="btn-craving-sub prose">surf it with {state.creatureName}</span>
        </button>

        <div className="home-actions-row">
          <button className="btn-used" onClick={logUse}>
            <span>I used</span>
          </button>
          <button className="btn-resisted" onClick={logResisted}>
            <span>Resisted</span>
          </button>
        </div>
      </div>
    </div>
  )
}
