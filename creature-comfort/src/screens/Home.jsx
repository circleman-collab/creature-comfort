import { useState, useEffect, useRef } from 'react'
import CreatureCanvas from '../components/CreatureCanvas'
import { getMsSinceLastUse, formatDuration, computeHealthAfterUse } from '../hooks/useStore'
import { EVENT, HEALTH, TIMING, STAGE_NAMES, HONESTY_REWARD_CHANCE } from '../constants'
import { IDLE_BUBBLES, makeJournalEntry } from '../data/journal'
import './Home.css'

// IDLE_BUBBLES imported from journal.js — single source of truth
const SPEECH_BY_STAGE = IDLE_BUBBLES

// ── Honesty reward — shown instead of penalty, 1 in 4 ────
const HONESTY_MESSAGES = [
  `thank you for telling me.`,
  `honesty takes courage.`,
  `i still see you.`,
  `we keep going.`,
  `that's the bravest thing you can do.`,
]

// ── "I lied" response — warm, no shame ───────────────────
const I_LIED_MESSAGES = [
  `it's okay. log removed.`,
  `no shame. corrected.`,
  `honesty helps us both.`,
  `i appreciate you coming back.`,
]

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)] }

export default function Home({ state, update, onCravingSurf }) {
  const [elapsed, setElapsed] = useState(0)
  const [showIntention, setShowIntention] = useState(false)
  const [reacting, setReacting] = useState(false)
  const [bubbleMsg, setBubbleMsg] = useState(null)
  const [creatureMsg, setCreatureMsg] = useState(null)
  const [debugMode, setDebugMode] = useState(false)
  const [stageJustAdvanced, setStageJustAdvanced] = useState(false)
  const prevStageRef = useRef(state.stage)
  const creatureMsgTimerRef = useRef(null)
  const tapCountRef = useRef(0)
  const tapTimerRef = useRef(null)

  // Detect stage advance for bonus bird in environment
  useEffect(() => {
    if (state.stage > prevStageRef.current) {
      setStageJustAdvanced(true)
      setTimeout(() => setStageJustAdvanced(false), 8000)
    }
    prevStageRef.current = state.stage
  }, [state.stage])

  function handleNameTap() {
    tapCountRef.current++
    clearTimeout(tapTimerRef.current)
    if (tapCountRef.current >= 5) {
      tapCountRef.current = 0
      setDebugMode(prev => !prev)
    } else {
      tapTimerRef.current = setTimeout(() => { tapCountRef.current = 0 }, 1500)
    }
  }

  // Live timer
  useEffect(() => {
    const id = setInterval(() => {
      setElapsed(getMsSinceLastUse(state.events))
    }, 1000)
    setElapsed(getMsSinceLastUse(state.events))
    return () => clearInterval(id)
  }, [state.events])

  // Intention whisper — only show when no creature message is active
  useEffect(() => {
    const id = setInterval(() => {
      if (!creatureMsg) {
        setShowIntention(true)
        setTimeout(() => setShowIntention(false), TIMING.INTENTION_DISPLAY)
      }
    }, TIMING.INTENTION_INTERVAL)
    return () => clearInterval(id)
  }, [creatureMsg])

  // Speech bubbles — occasional, stage-aware
  useEffect(() => {
    let scheduleTimer
    let dismissTimer

    function schedule() {
      const delay = TIMING.BUBBLE_MIN_INTERVAL + Math.random() * TIMING.BUBBLE_JITTER
      scheduleTimer = setTimeout(() => {
        const msgs = SPEECH_BY_STAGE[state.stage] || []
        if (msgs.length > 0) {
          setBubbleMsg(pick(msgs))
          dismissTimer = setTimeout(() => setBubbleMsg(null), TIMING.BUBBLE_DISMISS)
        }
        schedule()
      }, delay)
    }

    const initTimer = setTimeout(schedule, TIMING.BUBBLE_INITIAL_DELAY)
    return () => {
      clearTimeout(initTimer)
      clearTimeout(scheduleTimer)
      clearTimeout(dismissTimer)
    }
  }, [state.stage])

  function showCreatureMsg(msg) {
    clearTimeout(creatureMsgTimerRef.current)
    setCreatureMsg(msg)
    setShowIntention(false)
    creatureMsgTimerRef.current = setTimeout(() => setCreatureMsg(null), TIMING.CREATURE_MSG_DISPLAY)
  }

  function logUse() {
    const now = Date.now()
    const isHonestyReward = Math.random() < HONESTY_REWARD_CHANCE
    const newEvent = { id: now, type: EVENT.USED, ts: now }

    if (isHonestyReward) {
      update(prev => {
        const { health, stage, consecutiveSlips, lastSlipTs } = computeHealthAfterUse(prev)
        const triggered = new Set(prev.journalTriggered || [])
        const newEntries = []
        const slipKey = `${prev.stage}_event_slip`
        if (!triggered.has(slipKey)) {
          triggered.add(slipKey)
          const entry = makeJournalEntry(prev.stage, 'event_slip')
          if (entry) newEntries.push(entry)
        }
        return {
          ...prev,
          events: [...prev.events, newEvent],
          consecutiveSlips,
          lastSlipTs,
          startedAt: prev.startedAt || now,
          journalEntries: [...(prev.journalEntries || []), ...newEntries],
          journalTriggered: [...triggered],
        }
      })
      showCreatureMsg(pick(HONESTY_MESSAGES))
    } else {
      setReacting(true)
      setTimeout(() => setReacting(false), TIMING.REACT_ANIMATION)
      update(prev => {
        const healthDelta = computeHealthAfterUse(prev)
        const triggered = new Set(prev.journalTriggered || [])
        const newEntries = []
        const slipKey = `${prev.stage}_event_slip`
        if (!triggered.has(slipKey)) {
          triggered.add(slipKey)
          const entry = makeJournalEntry(prev.stage, 'event_slip')
          if (entry) newEntries.push(entry)
        }
        const wiltKey = `${prev.stage}_wilt`
        if (prev.health >= HEALTH.WILT_THRESHOLD && healthDelta.health < HEALTH.WILT_THRESHOLD && !triggered.has(wiltKey)) {
          triggered.add(wiltKey)
          const wiltEntry = makeJournalEntry(prev.stage, 'wilt')
          if (wiltEntry) newEntries.push(wiltEntry)
        }
        return {
          ...prev,
          events: [...prev.events, newEvent],
          ...healthDelta,
          startedAt: prev.startedAt || now,
          journalEntries: [...(prev.journalEntries || []), ...newEntries],
          journalTriggered: [...triggered],
        }
      })
    }
  }

  function logResisted() {
    const now = Date.now()
    update(prev => {
      const triggered = new Set(prev.journalTriggered || [])
      const newEntries = []
      const resistKey = `${prev.stage}_event_resist`
      if (!triggered.has(resistKey)) {
        triggered.add(resistKey)
        const entry = makeJournalEntry(prev.stage, 'event_resist')
        if (entry) newEntries.push(entry)
      }
      return {
        ...prev,
        events: [...prev.events, { id: now, type: EVENT.RESISTED, ts: now }],
        health: Math.min(prev.health + HEALTH.RESISTED_GAIN, HEALTH.MAX),
        startedAt: prev.startedAt || now,
        journalEntries: [...(prev.journalEntries || []), ...newEntries],
        journalTriggered: [...triggered],
      }
    })
  }

  // Walk back the most recent resisted log — no extra punishment.
  // Guard with a sync check first so the creature message only fires if there's something to remove.
  function undoLastResisted() {
    const hasResisted = state.events.some(
      e => e.type === EVENT.RESISTED || e.type === EVENT.CRAVING_SURFED
    )
    if (!hasResisted) return

    update(prev => {
      const reversedIdx = [...prev.events].reverse().findIndex(
        e => e.type === EVENT.RESISTED || e.type === EVENT.CRAVING_SURFED
      )
      if (reversedIdx === -1) return prev
      const idx = prev.events.length - 1 - reversedIdx
      const removed = prev.events[idx]
      const gain = removed.type === EVENT.CRAVING_SURFED ? HEALTH.SURF_GAIN : HEALTH.RESISTED_GAIN
      return {
        ...prev,
        events: prev.events.filter((_, i) => i !== idx),
        health: Math.max(prev.health - gain, 0),
      }
    })
    showCreatureMsg(pick(I_LIED_MESSAGES))
  }

  const daysSinceStart = state.startedAt
    ? Math.floor((Date.now() - state.startedAt) / 86400000)
    : 0

  const intentions = [state.intentionBig, ...(state.intentions || []).map(i => i.text)]
  const currentIntention = intentions[Math.floor(Date.now() / 1000 / 60 / 8) % intentions.length]

  return (
    <div className="home">
      {/* Header */}
      <div className="home-header">
        <div className="home-creature-name" onClick={handleNameTap}>{state.creatureName}</div>
        <div className="home-stage-label">{STAGE_NAMES[state.stage]}</div>
      </div>

      {/* Screen area — bezel + porthole */}
      <div className="device-screen-area">
        <div className="home-canvas-wrap">
          <div className={`creature-bubble ${bubbleMsg ? 'visible' : ''}`}>
            {bubbleMsg}
          </div>
          <div className="porthole-glass">
            <CreatureCanvas stage={state.stage} health={state.health} stageJustAdvanced={stageJustAdvanced} />
          </div>
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
      </div>

      {/* Controls area — device body below the screen */}
      <div className="device-controls-area">

      {/* Intention whisper / creature message — shared slot */}
      <div className={`intention-whisper ${(showIntention && !creatureMsg) ? 'visible' : ''}`}>
        <span className="prose">"{currentIntention}"</span>
      </div>
      <div className={`creature-msg ${creatureMsg ? 'visible' : ''}`}>
        <span className="prose">{creatureMsg}</span>
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
            <span className="btn-friction">only if you actually didn't</span>
          </button>
        </div>

        <button className="btn-lied" onClick={undoLastResisted}>
          I lied about resisting
        </button>
      </div>

      {/* Debug panel — activated by tapping the creature name 5× */}
      {debugMode && (
        <div className="debug-panel">
          <div className="debug-header">
            <span>DEBUG</span>
            <button className="debug-close" onClick={() => setDebugMode(false)}>✕</button>
          </div>

          <div className="debug-row">
            <span className="debug-label">Stage</span>
            <div className="debug-controls">
              <button onClick={() => update(p => ({ ...p, stage: Math.max(1, p.stage - 1) }))}>←</button>
              <span className="debug-val">{state.stage} / 5</span>
              <button onClick={() => update(p => ({ ...p, stage: Math.min(5, p.stage + 1) }))}>→</button>
            </div>
          </div>

          <div className="debug-row">
            <span className="debug-label">Health</span>
            <div className="debug-controls">
              <button onClick={() => update(p => ({ ...p, health: Math.max(0, p.health - 10) }))}>←</button>
              <span className="debug-val">{Math.round(state.health)}</span>
              <button onClick={() => update(p => ({ ...p, health: Math.min(100, p.health + 10) }))}>→</button>
            </div>
          </div>

          <div className="debug-row">
            <span className="debug-label">Journey</span>
            <div className="debug-controls">
              <button onClick={() => update(p => ({ ...p, startedAt: (p.startedAt || Date.now()) - 86400000 }))}>-1d</button>
              <span className="debug-val">{daysSinceStart}d in</span>
              <button onClick={() => update(p => ({ ...p, startedAt: Math.min((p.startedAt || Date.now()) + 86400000, Date.now()) }))}>+1d</button>
            </div>
          </div>

          <div className="debug-actions">
            <button className="debug-btn" onClick={() => {
              const msgs = SPEECH_BY_STAGE[state.stage] || []
              if (msgs.length > 0) {
                setBubbleMsg(pick(msgs))
                setTimeout(() => setBubbleMsg(null), TIMING.BUBBLE_DISMISS)
              }
            }}>bubble</button>
            <button className="debug-btn" onClick={() => update(p => ({ ...p, health: 30 }))}>wilt</button>
            <button className="debug-btn" onClick={() => update(p => ({ ...p, health: 100 }))}>full hp</button>
          </div>
        </div>
      )}
      </div>{/* end device-controls-area */}
    </div>
  )
}
