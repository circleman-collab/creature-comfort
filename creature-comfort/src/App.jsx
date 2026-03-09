import { useState, useEffect } from 'react'
import { useStore, computeHealthGain } from './hooks/useStore'
import { HEALTH, TIMING } from './constants'
import Onboarding from './screens/Onboarding'
import Home from './screens/Home'
import Intentions from './screens/Intentions'
import Stats from './screens/Stats'
import CravingSurf from './screens/CravingSurf'
import BottomNav from './components/BottomNav'
import './App.css'

export default function App() {
  const [state, update] = useStore()
  const [tab, setTab] = useState('home')
  const [surfing, setSurfing] = useState(false)

  // Passive health regeneration — check every 5 minutes
  useEffect(() => {
    function tick() {
      update(prev => {
        const gains = computeHealthGain(prev)
        if (gains.health === prev.health && gains.stage === prev.stage) return prev
        return { ...prev, ...gains }
      })
    }
    tick()
    const id = setInterval(tick, TIMING.HEALTH_TICK)
    return () => clearInterval(id)
  }, [update])

  // Onboarding
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
      {/* Craving surf overlay */}
      {surfing && (
        <CravingSurf
          state={state}
          update={update}
          onClose={() => setSurfing(false)}
        />
      )}

      {/* Main content */}
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
        {tab === 'stats' && (
          <Stats state={state} />
        )}
      </div>

      <BottomNav active={tab} onChange={setTab} />
    </div>
  )
}
