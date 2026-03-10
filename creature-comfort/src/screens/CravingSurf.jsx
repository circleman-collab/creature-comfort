import { useState, useEffect, useRef } from 'react'
import CreatureCanvas from '../components/CreatureCanvas'
import { EVENT, HEALTH } from '../constants'
import { makeJournalEntry } from '../data/journal'
import './CravingSurf.css'

const TOTAL = 90 // seconds
const PHASES = [
  { label: 'breathe in',  duration: 4, scale: 1.08 },
  { label: 'hold',        duration: 4, scale: 1.08 },
  { label: 'breathe out', duration: 6, scale: 1.0 },
  { label: 'hold',        duration: 2, scale: 1.0 },
]

export default function CravingSurf({ state, update, onClose }) {
  const [secondsLeft, setSecondsLeft] = useState(TOTAL)
  const [phase, setPhase] = useState(0)
  const [phaseTime, setPhaseTime] = useState(0)
  const [done, setDone] = useState(false)
  const [intention] = useState(() => {
    const all = [state.intentionBig, ...(state.intentions || []).map(i => i.text)]
    return all[Math.floor(Math.random() * all.length)]
  })

  const intervalRef = useRef(null)

  useEffect(() => {
    if (done) return
    intervalRef.current = setInterval(() => {
      setSecondsLeft(s => {
        if (s <= 1) {
          clearInterval(intervalRef.current)
          setDone(true)
          return 0
        }
        return s - 1
      })
      setPhaseTime(t => {
        const cycleLen = PHASES[phase].duration
        if (t + 1 >= cycleLen) {
          setPhase(p => (p + 1) % PHASES.length)
          return 0
        }
        return t + 1
      })
    }, 1000)
    return () => clearInterval(intervalRef.current)
  }, [done, phase])

  function handleSurfed() {
    const now = Date.now()
    update(prev => {
      const triggered = new Set(prev.journalTriggered || [])
      const newEntries = []
      const surfKey = `${prev.stage}_event_craving_surf`
      if (!triggered.has(surfKey)) {
        triggered.add(surfKey)
        const entry = makeJournalEntry(prev.stage, 'event_craving_surf')
        if (entry) newEntries.push(entry)
      }
      return {
        ...prev,
        events: [...prev.events, { id: now, type: EVENT.CRAVING_SURFED, ts: now }],
        health: Math.min(prev.health + HEALTH.SURF_GAIN, HEALTH.MAX),
        journalEntries: [...(prev.journalEntries || []), ...newEntries],
        journalTriggered: [...triggered],
      }
    })
    onClose()
  }

  function handleUsed() {
    onClose() // Home will handle the use log
  }

  const progress = (TOTAL - secondsLeft) / TOTAL
  const circumference = 2 * Math.PI * 44
  const offset = circumference * (1 - progress)
  const currentPhase = PHASES[phase]

  // Creature slightly stressed during craving, but with us
  const surfHealth = done
    ? Math.min(state.health + 10, HEALTH.MAX)
    : Math.max(state.health - 10, HEALTH.MIN_AFTER_WILT)

  return (
    <div className="craving-surf">
      <button className="surf-close" onClick={onClose}>✕</button>

      <div className="surf-header">
        <div className="surf-title pixel">this will pass</div>
        <div className="surf-subtitle prose">stay with {state.creatureName}</div>
      </div>

      {!done ? (
        <>
          <div className="device-screen-area">
            <div className="porthole-glass">
              <CreatureCanvas stage={state.stage} health={surfHealth} />
            </div>
          </div>

          <div className="surf-ring-wrap">
            <svg width="112" height="112" viewBox="0 0 112 112">
              <circle cx="56" cy="56" r="44" fill="none" stroke="var(--border)" strokeWidth="2"/>
              <circle
                cx="56" cy="56" r="44"
                fill="none"
                stroke="var(--accent-dim)"
                strokeWidth="2"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                transform="rotate(-90 56 56)"
                style={{ transition: 'stroke-dashoffset 1s linear' }}
              />
            </svg>
            <div className="surf-ring-inner">
              <div className="surf-seconds pixel">{secondsLeft}</div>
              <div className="surf-phase-label prose">{currentPhase.label}</div>
            </div>
          </div>

          <div className="surf-intention prose">"{intention}"</div>
        </>
      ) : (
        <div className="surf-done">
          <div className="device-screen-area">
            <div className="porthole-glass">
              <CreatureCanvas stage={state.stage} health={Math.min(state.health + 10, HEALTH.MAX)} />
            </div>
          </div>
          <div className="surf-done-title pixel">You made it.</div>
          <div className="surf-done-body prose">
            {state.creatureName} felt that too. The craving peaked and passed — just like it always does.
          </div>
          <div className="surf-done-intention prose">"{intention}"</div>
        </div>
      )}

      <div className="surf-actions">
        {done ? (
          <button className="btn-pixel accent" onClick={handleSurfed}>
            I didn't use ↑ {state.creatureName} grows
          </button>
        ) : (
          <>
            <button className="btn-pixel accent" onClick={handleSurfed}>
              Craving passed — I'm good
            </button>
            <button className="btn-pixel danger" style={{marginTop: 8}} onClick={handleUsed}>
              I used anyway
            </button>
          </>
        )}
      </div>
    </div>
  )
}
