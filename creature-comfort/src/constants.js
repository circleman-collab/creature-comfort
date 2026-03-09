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
  MIN_AFTER_WILT: 25,   // floor after any slip
  PASSIVE_GAIN: 0.5,    // per health tick
  RESISTED_GAIN: 5,     // logging a resisted craving (up from 3 — gains outweigh losses)
  SURF_GAIN: 8,         // completing a craving surf (up from 5)
  SLIP_WILT_LOSS: 15,   // first slip (down from 25 — slower punishment)
  SLIP_DEMOTE_LOSS: 20, // second slip within grace window (no stage demotion — just health)
  STAGE_RESET: 60,      // health when advancing to a new stage
}

// ── Stage progression ─────────────────────────────────────
// Hours of clean time required to reach each stage (indexed by stage - 1)
export const STAGE_THRESHOLDS_HOURS = [0, 72, 168, 336, 720]
export const STAGE_NAMES = ['', 'Seedling', 'Sprout', 'Wanderer', 'Blossoming', 'Radiant']

// ── Timing (milliseconds) ─────────────────────────────────
export const TIMING = {
  GRACE_WINDOW: 3 * 60 * 60 * 1000,   // 3 hours — close slips get a bigger health hit
  HEALTH_TICK: 5 * 60 * 1000,          // 5 minutes — passive health regen interval
  INTENTION_INTERVAL: 8 * 60 * 1000,   // 8 minutes — how often intention whisper appears
  INTENTION_DISPLAY: 6000,             // 6 seconds — how long intention whisper is visible
  REACT_ANIMATION: 1200,               // 1.2 seconds — button reaction flash duration
  SAVE_DEBOUNCE: 1000,                 // 1 second — localStorage write debounce
  BUBBLE_DISMISS: 5000,                // 5 seconds — how long speech bubble stays visible
  BUBBLE_MIN_INTERVAL: 4 * 60 * 1000, // 4 minutes — minimum between speech bubbles
  BUBBLE_JITTER: 3 * 60 * 1000,       // up to 3 extra minutes of random delay
  BUBBLE_INITIAL_DELAY: 90 * 1000,    // 90 seconds — first bubble delay after mount
  CREATURE_MSG_DISPLAY: 4000,          // 4 seconds — honesty/lied message duration
}

// ── Quit modes ────────────────────────────────────────────
export const QUIT_MODE = {
  VAPING: 'vaping',
  ALL: 'all',
  TRANSITION: 'transition',
}

// ── Mechanics ─────────────────────────────────────────────
export const HONESTY_REWARD_CHANCE = 0.25 // 1 in 4 uses triggers warm response, no penalty
