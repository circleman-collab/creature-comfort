// ── Storage ───────────────────────────────────────────────
export const STORAGE_KEY = 'cc_v1'

// ── Event types ───────────────────────────────────────────
export const EVENT = {
  USED: 'used',
  RESISTED: 'resisted',
  CRAVING_SURFED: 'craving_surfed',
}

// ── Health ────────────────────────────────────────────────
export const HEALTH = {
  INITIAL: 60,          // health set on stage transition or onboarding complete
  MAX: 100,
  WILT_THRESHOLD: 40,   // below this → wilt visuals
  MIN_AFTER_WILT: 20,   // floor for first slip within grace window
  PASSIVE_GAIN: 0.5,    // per health tick
  RESISTED_GAIN: 3,     // logging a resisted craving
  SURF_GAIN: 5,         // completing a craving surf
  SLIP_WILT_LOSS: 25,   // first slip within grace window
  SLIP_DEMOTE_LOSS: 45, // second slip within grace window (stage demotion risk)
  STAGE_RESET: 60,      // health when stage is demoted
}

// ── Stage progression ─────────────────────────────────────
// Hours of clean time required to reach each stage (indexed by stage - 1)
export const STAGE_THRESHOLDS_HOURS = [0, 72, 168, 336, 720]
export const STAGE_NAMES = ['', 'Seedling', 'Sprout', 'Wanderer', 'Blossoming', 'Radiant']

// ── Timing (milliseconds) ─────────────────────────────────
export const TIMING = {
  GRACE_WINDOW: 3 * 60 * 60 * 1000,   // 3 hours — close slips trigger demotion
  HEALTH_TICK: 5 * 60 * 1000,          // 5 minutes — passive health regen interval
  INTENTION_INTERVAL: 8 * 60 * 1000,   // 8 minutes — how often intention whisper appears
  INTENTION_DISPLAY: 6000,             // 6 seconds — how long intention whisper is visible
  REACT_ANIMATION: 1200,               // 1.2 seconds — button reaction flash duration
  SAVE_DEBOUNCE: 1000,                 // 1 second — localStorage write debounce
}

// ── Quit modes ────────────────────────────────────────────
export const QUIT_MODE = {
  VAPING: 'vaping',
  ALL: 'all',
  TRANSITION: 'transition',
}
