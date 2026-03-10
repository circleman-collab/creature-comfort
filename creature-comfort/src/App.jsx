import { useState, useEffect } from 'react'
import { useStore, computeHealthGain } from './hooks/useStore'
import { HEALTH, TIMING } from './constants'
import { makeJournalEntry } from './data/journal'
import Onboarding from './screens/Onboarding'
import Home from './screens/Home'
import Intentions from './screens/Intentions'
import Stats from './screens/Stats'
import Journal from './screens/Journal'
import CravingSurf from './screens/CravingSurf'
import BottomNav from './components/BottomNav'
import './App.css'

// Milestone definitions: key, minimum days elapsed, stage the entry is written for
const MILESTONES = [
  { key: 'day_1',  days: 1,  stage: 1, trigger: 'day_1_first_moments' },
  { key: 'week_1', days: 7,  stage: 2, trigger: 'milestone_week_1' },
  { key: 'week_2', days: 14, stage: 3, trigger: 'milestone_week_2' },
  { key: 'week_3', days: 21, stage: 4, trigger: 'milestone_3_weeks' },
  { key: 'month_1',days: 30, stage: 5, trigger: 'milestone_30_days' },
]

export default function App() {
  const [state, update, reset] = useStore()
  const [tab, setTab] = useState('home')
  const [surfing, setSurfing] = useState(false)

  // Passive health regen, stage evolution detection, and milestone journaling
  useEffect(() => {
    function tick() {
      update(prev => {
        const gains = computeHealthGain(prev)
        const triggered = new Set(prev.journalTriggered || [])
        const newEntries = []

        // Evolution: stage advanced this tick → write evolution journal entry
        if (gains.stage > prev.stage) {
          const key = `evolution_${gains.stage}`
          if (!triggered.has(key)) {
            triggered.add(key)
            const entry = makeJournalEntry(gains.stage, 'evolution_moment')
            if (entry) newEntries.push(entry)
          }
        }

        // Milestones: check days elapsed from journey start
        if (prev.startedAt) {
          const daysIn = (Date.now() - prev.startedAt) / 86400000
          MILESTONES.forEach(({ key, days, stage, trigger }) => {
            if (daysIn >= days && !triggered.has(key)) {
              triggered.add(key)
              const entry = makeJournalEntry(stage, trigger)
              if (entry) newEntries.push(entry)
            }
          })
        }

        const hasChanges =
          gains.health !== prev.health ||
          gains.stage !== prev.stage ||
          newEntries.length > 0

        if (!hasChanges) return prev

        return {
          ...prev,
          ...gains,
          journalEntries: [...(prev.journalEntries || []), ...newEntries],
          journalTriggered: [...triggered],
        }
      })
    }

    tick()
    const id = setInterval(tick, TIMING.HEALTH_TICK)
    return () => clearInterval(id)
  }, [update])

  if (!state.onboarded) {
    return (
      <Onboarding
        onComplete={({ creatureName, intentionBig, quitMode }) => {
          update({
            onboarded: true,
            creatureName,
            intentionBig,
            quitMode,
            startedAt: Date.now(),
            stage: 1,
            health: HEALTH.INITIAL,
          })
        }}
      />
    )
  }

  return (
    <div className="app-shell">
      {surfing && (
        <CravingSurf
          state={state}
          update={update}
          onClose={() => setSurfing(false)}
        />
      )}

      <div className="app-content">
        {tab === 'home' && (
          <Home
            state={state}
            update={update}
            onCravingSurf={() => setSurfing(true)}
          />
        )}
        {tab === 'intentions' && (
          <Intentions state={state} update={update} />
        )}
        {tab === 'journal' && (
          <Journal state={state} update={update} />
        )}
        {tab === 'stats' && (
          <Stats state={state} update={update} onReset={reset} />
        )}
      </div>

      <div className="device-nav-area">
        <BottomNav active={tab} onChange={setTab} />
      </div>
    </div>
  )
}
