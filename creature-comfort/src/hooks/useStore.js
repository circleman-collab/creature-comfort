import { useState, useEffect, useCallback, useRef } from 'react'
import {
  STORAGE_KEY, EVENT, HEALTH, STAGE_THRESHOLDS_HOURS, TIMING,
} from '../constants'

const DEFAULT_STATE = {
  // Onboarding
  onboarded: false,
  creatureName: '',
  quitMode: 'vaping', // 'vaping' | 'all' | 'transition'
  intentionBig: '',
  intentions: [], // [{id, text, type:'weekly'|'daily', createdAt}]

  // Events
  events: [], // [{id, type:'used'|'resisted'|'craving_surfed', ts, note}]

  // Creature state
  stage: 1,          // 1–5
  health: 100,       // 0–100 within stage
  bestStreakMs: 0,
  consecutiveSlips: 0,
  lastSlipTs: null,

  // NewGame+
  ngPlusUnlocked: false,
  ngPlusActive: false,
  ngPlusEvents: [],

  // Meta
  startedAt: null,
}

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return { ...DEFAULT_STATE, ...JSON.parse(raw) }
  } catch (e) {}
  return { ...DEFAULT_STATE }
}

function save(state) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)) } catch (e) {}
}

export function useStore() {
  const [state, setState] = useState(load)
  const saveTimerRef = useRef(null)

  // Debounce localStorage writes — batch rapid changes into one write per second
  useEffect(() => {
    clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(() => save(state), TIMING.SAVE_DEBOUNCE)
    return () => clearTimeout(saveTimerRef.current)
  }, [state])

  const update = useCallback((patch) => {
    setState(prev => typeof patch === 'function' ? patch(prev) : { ...prev, ...patch })
  }, [])

  return [state, update]
}

// ── Pure helpers (no React) ──────────────────────────────

export function getLastUse(events) {
  for (let i = events.length - 1; i >= 0; i--) {
    if (events[i].type === EVENT.USED) return events[i]
  }
  return null
}

export function getMsSinceLastUse(events, now = Date.now()) {
  const last = getLastUse(events)
  if (!last) {
    const first = events[0]
    return first ? now - first.ts : 0
  }
  return now - last.ts
}

export function formatDuration(ms, compact = false) {
  if (ms < 0) ms = 0
  const s = Math.floor(ms / 1000)
  const m = Math.floor(s / 60)
  const h = Math.floor(m / 60)
  const d = Math.floor(h / 24)

  if (compact) {
    if (d > 0) return `${d}d ${h % 24}h`
    if (h > 0) return `${h}h ${m % 60}m`
    if (m > 0) return `${m}m`
    return `${s}s`
  }

  const hh = String(h).padStart(2, '0')
  const mm = String(m % 60).padStart(2, '0')
  const ss = String(s % 60).padStart(2, '0')
  return `${hh}:${mm}:${ss}`
}

export function sameDay(ts1, ts2) {
  const a = new Date(ts1), b = new Date(ts2)
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
}

export function getDaysSinceLastUse(events) {
  const last = getLastUse(events)
  if (!last) return 0
  return Math.floor((Date.now() - last.ts) / 86400000)
}

export function getTodayStats(events) {
  const now = Date.now()
  const today = events.filter(e => sameDay(e.ts, now))
  const uses = today.filter(e => e.type === EVENT.USED)
  const resisted = today.filter(e => e.type === EVENT.RESISTED || e.type === EVENT.CRAVING_SURFED)
  return { uses: uses.length, resisted: resisted.length, total: today.length }
}

export function getAllStats(events) {
  const uses = events.filter(e => e.type === EVENT.USED)
  const resisted = events.filter(e => e.type === EVENT.RESISTED || e.type === EVENT.CRAVING_SURFED)
  const surfed = events.filter(e => e.type === EVENT.CRAVING_SURFED)

  let longestGapMs = 0
  for (let i = 1; i < uses.length; i++) {
    const gap = uses[i].ts - uses[i - 1].ts
    if (gap > longestGapMs) longestGapMs = gap
  }

  return {
    totalUses: uses.length,
    totalResisted: resisted.length,
    totalSurfed: surfed.length,
    longestGapMs,
  }
}

// Compute health delta after a use event
export function computeHealthAfterUse(state) {
  const now = Date.now()
  const recentSlip = state.lastSlipTs && (now - state.lastSlipTs) < TIMING.GRACE_WINDOW
  const consecutive = recentSlip ? state.consecutiveSlips + 1 : 1

  let newHealth = state.health
  let newStage = state.stage
  let newConsecutive = consecutive

  if (consecutive === 1) {
    // Grace: wilt within stage
    newHealth = Math.max(state.health - HEALTH.SLIP_WILT_LOSS, HEALTH.MIN_AFTER_WILT)
  } else {
    // Two close slips: bigger hit, possible stage demotion
    newHealth = Math.max(state.health - HEALTH.SLIP_DEMOTE_LOSS, 0)
    if (newHealth === 0 && newStage > 1) {
      newStage = newStage - 1
      newHealth = HEALTH.STAGE_RESET
    }
  }

  return { health: newHealth, stage: newStage, consecutiveSlips: newConsecutive, lastSlipTs: now }
}

// Compute health gains over time (call periodically)
export function computeHealthGain(state) {
  const last = getLastUse(state.events)
  if (!last) return state

  const msSinceLast = Date.now() - last.ts
  const hoursClean = msSinceLast / 3600000

  const targetStage = STAGE_THRESHOLDS_HOURS.reduce(
    (s, t, i) => hoursClean >= t ? i + 1 : s,
    1
  )

  let newHealth = Math.min(state.health + (hoursClean > 0 ? HEALTH.PASSIVE_GAIN : 0), HEALTH.MAX)
  let newStage = state.stage

  if (targetStage > state.stage && newHealth >= HEALTH.MAX) {
    newStage = Math.min(targetStage, 5)
    newHealth = HEALTH.INITIAL
  }

  return { health: newHealth, stage: newStage }
}
