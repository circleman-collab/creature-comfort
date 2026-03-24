// Pixel art renderer for the creature and environment
// All drawing is done on a 64x64 logical canvas, scaled up

import { HEALTH } from '../constants'

export let SCALE = 3 // renders at 256x384 display
export function setScale(n) { SCALE = n }
export const W = 72
export const H = 62
export const PLANE_CYCLE = 9000
export const PLANE_ACTIVE = 800

// ~8 seconds at 60fps
export const TRANSITION_DURATION = 480

// Phase boundaries (as fractions of total duration)
const PHASE = {
  FLASH_START:  0.0,
  FLASH_PEAK:   0.15,
  OLD_FADE:     0.25,
  NEW_FADE_IN:  0.45,
  NEW_SOLID:    0.7,
  SETTLE:       1.0,
}

// Dissolve particle cache
let _cachedParticles = null
let _cachedParticleStage = null

// ── Palette ──────────────────────────────────────────────
export const C = {
  // Transparent
  _: null,
  // Greens
  g1: '#1a2e1c', g2: '#2a4a2c', g3: '#3a6e3c', g4: '#7ec850', g5: '#a8e870',
  // Browns / earth
  b1: '#1a120a', b2: '#2e1e10', b3: '#5c3a1e', b4: '#8c5a2c',
  // Sky / fog
  s1: '#0d1a0f', s2: '#111f13', s3: '#162a18', s4: '#1e3820',
  // Creature accent
  a1: '#c8a84b', a2: '#e8c86a', a3: '#fff8d0',
  // Eyes
  e1: '#000000', e2: '#ffffff', e3: '#7ec850',
  // Wilt / sick
  w1: '#2a2010', w2: '#4a3818', w3: '#8a6830',
  // Red / ember
  r1: '#6b2218', r2: '#c0452b', r3: '#e87c3e',
  // Firefly
  f1: '#c8ff80', f2: '#e8ffb0',
  // Stars
  star: '#c8d4e8',
}

function isSleeping(hour) {
  return hour >= 22 || hour <= 7
}

// ── Color lerp ────────────────────────────────────────────
function lerpColor(hexA, hexB, t) {
  if (t <= 0) return hexA
  if (t >= 1) return hexB
  const r1 = parseInt(hexA.slice(1,3), 16), r2 = parseInt(hexB.slice(1,3), 16)
  const g1 = parseInt(hexA.slice(3,5), 16), g2 = parseInt(hexB.slice(3,5), 16)
  const b1 = parseInt(hexA.slice(5,7), 16), b2 = parseInt(hexB.slice(5,7), 16)
  return `rgb(${Math.round(r1+(r2-r1)*t)},${Math.round(g1+(g2-g1)*t)},${Math.round(b1+(b2-b1)*t)})`
}

// ── Idle animation state ──────────────────────────────────
// Module-level state enables randomized Animal Crossing-style idle beats.
// State resets whenever tick < 10 (component remount / fresh start).
const _idle = {}

function _getIdle(stage, tick) {
  if (!_idle[stage] || tick < 10) {
    _idle[stage] = {
      nextAction:  80 + stage * 37,
      actionType:  null,
      actionStart: 0,
      actionEnd:   0,
      actionDir:   1,
      nextBlink:   120 + stage * 29,
      blinkEnd:    0,
      doubleBlink: false,
    }
  }
  return _idle[stage]
}

// Actions available per stage and their durations (ticks)
const _ACTIONS = {
  2: ['bob', 'look-left', 'look-right'],
  3: ['hop', 'look-left', 'look-right'],
  4: ['walk'],
  5: ['walk'],
}
const _ACTION_DUR = { bob: 30, 'look-left': 60, 'look-right': 60, hop: 48, walk: 180 }

// Advance idle scheduler once per frame. Returns { blink, action, t, dir }.
function _tickIdle(stage, tick, sleeping) {
  const s = _getIdle(stage, tick)

  if (sleeping) {
    s.actionType = null
    return { blink: true, action: null, t: 0, dir: 1 }
  }

  // Blink scheduler (independent from action scheduler)
  let blink = false
  if (tick >= s.nextBlink && tick >= s.blinkEnd) {
    s.doubleBlink = Math.random() < 0.2
    s.blinkEnd    = tick + (s.doubleBlink ? 12 : 5)
    s.nextBlink   = tick + 300 + Math.floor(Math.random() * 300)
  }
  if (tick < s.blinkEnd) {
    const bp = tick - (s.blinkEnd - (s.doubleBlink ? 12 : 5))
    blink = s.doubleBlink ? (bp < 4 || (bp >= 7 && bp < 11)) : true
  }

  // Action scheduler: end → quiet window → next action
  if (s.actionType && tick >= s.actionEnd) {
    s.actionType = null
    s.nextAction = tick + 300 + Math.floor(Math.random() * 500)
  }
  if (!s.actionType && tick >= s.nextAction) {
    const acts = _ACTIONS[stage] || []
    if (acts.length > 0) {
      s.actionType  = acts[Math.floor(Math.random() * acts.length)]
      s.actionStart = tick
      s.actionEnd   = tick + (_ACTION_DUR[s.actionType] || 60)
      if (s.actionType === 'walk') s.actionDir = Math.random() < 0.5 ? 1 : -1
    }
    // Always advance nextAction so this block doesn't fire every frame
    s.nextAction = tick + 999999
  }

  const t = s.actionType
    ? (tick - s.actionStart) / (s.actionEnd - s.actionStart)
    : 0

  return { blink, action: s.actionType, t, dir: s.actionDir }
}

// ── Sprite definitions (64x64 grid, each cell = 1px) ─────
// Sprites are arrays of [x, y, color] draw commands
// We define the creature at each stage + health states

function px(x, y, col) { return [x, y, col] }

// ── Stage 1: Seedling (just a sprout) ────────────────────
export function drawStage1(ctx, health, tick, hour = new Date().getHours(), wiltProgress = 0) {
  const wilt = wiltProgress >= 0.5
  const col  = lerpColor(C.g3, C.w3, wiltProgress)
  const col2 = lerpColor(C.g4, C.w2, wiltProgress)
  const soil = C.b3
  const sleeping = isSleeping(hour)

  // Stem lean: -1, 0, or 1 cycling every 120 ticks (no lean when wilting or sleeping)
  const leanX = wilt ? 0 : (sleeping ? 0 : (Math.floor(tick / 200) % 3) - 1)

  // Leaf rustle: tip pixels shift ±1 on x every 45 ticks (no rustle when wilting or sleeping)
  const rustle = wilt ? 0 : (sleeping ? 0 : (Math.floor(tick / 80) % 2 === 0 ? 0 : 1))

  // Soil mound (never leans)
  fill(ctx, [[28,46],[29,46],[30,46],[31,46],[32,46],[33,46],[34,46],[35,46],
             [27,47],[28,47],[29,47],[30,47],[31,47],[32,47],[33,47],[34,47],[35,47],[36,47],
             [27,48],[28,48],[29,48],[30,48],[31,48],[32,48],[33,48],[34,48],[35,48],[36,48]], soil)

  // Stem (leans with leanX)
  fill(ctx, [[31+leanX,42],[31+leanX,43],[31+leanX,44],[31+leanX,45]], col)

  // Leaves — crossfade between healthy (y=40-41) and drooped (y=42) positions
  if (wiltProgress < 0.65) {
    const a = Math.max(0, 1 - wiltProgress / 0.65)
    ctx.save(); ctx.globalAlpha = a
    fill(ctx, [[28+leanX,41],[29+leanX,41],[30+leanX,41]], col)
    fill(ctx, [[32+leanX,41],[33+leanX,41],[34+leanX,41]], col)
    fill(ctx, [[29+leanX-rustle,40],[30+leanX-rustle,40]], col2)
    fill(ctx, [[32+leanX+rustle,40],[33+leanX+rustle,40]], col2)
    ctx.restore()
  }
  if (wiltProgress > 0.35) {
    const a = Math.min(1, (wiltProgress - 0.35) / 0.65)
    ctx.save(); ctx.globalAlpha = a
    fill(ctx, [[28,42],[29,42],[30,42]], col)
    fill(ctx, [[32,42],[33,42],[34,42]], col)
    ctx.restore()
  }

  // Tiny bud (leans with leanX)
  const budBob = Math.floor(tick / 60) % 2 === 0 ? 0 : -1
  fill(ctx, [[30+leanX,39+budBob],[31+leanX,39+budBob],[32+leanX,39+budBob],
             [30+leanX,38+budBob],[31+leanX,38+budBob],[32+leanX,38+budBob]], wilt ? C.w3 : C.g4)
  dot(ctx, 31+leanX, 39+budBob, C.e1)
  if (sleeping && !wilt) drawZzz(ctx, 33, 36, tick)
}

// ── Stage 2: Sprout with eyes + root-feet ────────────────
export function drawStage2(ctx, health, tick, hour = new Date().getHours(), wiltProgress = 0) {
  const wilt = wiltProgress >= 0.5
  const sleeping = isSleeping(hour)
  const col  = lerpColor(C.g3, C.w3, wiltProgress)
  const col2 = lerpColor(C.g4, C.w2, wiltProgress)
  const idle = _tickIdle(2, tick, sleeping)
  const bob = !sleeping && idle.action === 'bob' && idle.t > 0.15 && idle.t < 0.85 ? -1 : 0
  const blink = idle.blink
  const planeActive = (tick % PLANE_CYCLE) <= PLANE_ACTIVE
  const planePos = planeActive ? Math.floor(((tick % PLANE_CYCLE) / PLANE_ACTIVE) * (W + 10)) - 5 : -1
  const lookDir = (planePos >= 0 && planePos <= W)
    ? (planePos < 36 ? 'left-up' : 'right-up')
    : idle.action === 'look-right' ? 'right'
    : idle.action === 'look-left'  ? 'left' : 'neutral'

  // Root feet
  fill(ctx, [[32,48],[33,48],[34,48]], C.b3)
  fill(ctx, [[37,48],[38,48],[39,48]], C.b3)
  fill(ctx, [[31,47],[32,47],[33,47]], C.b4)
  fill(ctx, [[38,47],[39,47],[40,47]], C.b4)

  // Body
  fill(ctx, [
    [33,45],[34,45],[35,45],[36,45],[37,45],[38,45],
    [32,44],[33,44],[34,44],[35,44],[36,44],[37,44],[38,44],[39,44],
    [32,43+bob],[33,43+bob],[34,43+bob],[35,43+bob],[36,43+bob],[37,43+bob],[38,43+bob],[39,43+bob],
    [33,42+bob],[34,42+bob],[35,42+bob],[36,42+bob],[37,42+bob],[38,42+bob],
  ], col)

  // Leaf crown
  fill(ctx, [
    [32,41+bob],[33,41+bob],[34,41+bob],[35,41+bob],[36,41+bob],[37,41+bob],[38,41+bob],[39,41+bob],
    [33,40+bob],[34,40+bob],[35,40+bob],[36,40+bob],[37,40+bob],[38,40+bob],
    [34,39+bob],[35,39+bob],[36,39+bob],[37,39+bob],
  ], col2)

  // Eyes
  const eyeY = 43 + bob
  if (blink) {
    // closed eyes — two separate bars with gap at x=36
    fill(ctx, [[34,eyeY],[35,eyeY]], C.e1)
    fill(ctx, [[37,eyeY],[38,eyeY]], C.e1)
  } else {
    dot(ctx, 34, eyeY, C.e1)
    dot(ctx, 37, eyeY, C.e1)
    // gleam shifts with look direction
    const gx = lookDir === 'right' || lookDir === 'right-up' ? 1 : lookDir === 'left' || lookDir === 'left-up' ? -1 : 0
    const gy = -1
    dot(ctx, 34+gx, eyeY+gy, C.e2)
    dot(ctx, 37+gx, eyeY+gy, C.e2)
  }

  // Frown fades in with wiltProgress
  if (wiltProgress > 0) {
    ctx.save(); ctx.globalAlpha = Math.min(1, wiltProgress * 1.5)
    fill(ctx, [[34,eyeY+1],[35,eyeY+1],[36,eyeY+1]], C.w2)
    ctx.restore()
  }
  if (sleeping && !wilt) drawZzz(ctx, 39, 37, tick)
}

// ── Stage 3: Leafy creature, can hop ─────────────────────
export function drawStage3(ctx, health, tick, hour = new Date().getHours(), startedAt = null, wiltProgress = 0) {
  const wilt = wiltProgress >= 0.5
  const sleeping = isSleeping(hour)
  let stageProgress = 0
  if (!sleeping) {
    const hoursElapsed = startedAt ? (Date.now() - startedAt) / 3600000 : 168
    stageProgress = Math.min(1, Math.max(0, (hoursElapsed - 168) / (336 - 168)))
  }
  const idle = _tickIdle(3, tick, sleeping)
  const col  = lerpColor(C.g3, C.w3, wiltProgress)
  const col2 = lerpColor(C.g4, C.w2, wiltProgress)
  const col3 = lerpColor(C.g5, C.w1, wiltProgress)
  const blink = idle.blink

  // Hop fires as a single 6-phase arc; creature stands still between hops
  let yOff = 0, legOff = 0, hop = -1
  if (!sleeping && !wilt && idle.action === 'hop') {
    hop = Math.min(5, Math.floor(idle.t * 6))
    const earlyY = [1, -3, -5, -3, 0, 1]
    const lateY  = [1, -1, -2, -1, 0, 1]
    yOff = Math.round(earlyY[hop] + (lateY[hop] - earlyY[hop]) * stageProgress)
    const legOffs = [0, -1, -2, -1, 0, 0]
    legOff = legOffs[hop]
  }

  const planeActive = (tick % PLANE_CYCLE) <= PLANE_ACTIVE
  const planePos = planeActive ? Math.floor(((tick % PLANE_CYCLE) / PLANE_ACTIVE) * (W + 10)) - 5 : -1
  const lookDir = (planePos >= 0 && planePos <= W)
    ? (planePos < 36 ? 'left-up' : 'right-up')
    : idle.action === 'look-right' ? 'right'
    : idle.action === 'look-left'  ? 'left' : 'neutral'

  const y = 42 + (wilt ? 0 : yOff)

  // Legs — tuck toward body during airborne phases
  fill(ctx, [[33,y+4+legOff],[34,y+4+legOff],[33,y+5+legOff],[34,y+5+legOff]], C.b4)
  fill(ctx, [[37,y+4+legOff],[38,y+4+legOff],[37,y+5+legOff],[38,y+5+legOff]], C.b4)

  // Body
  fill(ctx, [
    [31,y+1],[32,y+1],[33,y+1],[34,y+1],[35,y+1],[36,y+1],[37,y+1],[38,y+1],[39,y+1],[40,y+1],
    [31,y],[32,y],[33,y],[34,y],[35,y],[36,y],[37,y],[38,y],[39,y],[40,y],
    [32,y-1],[33,y-1],[34,y-1],[35,y-1],[36,y-1],[37,y-1],[38,y-1],[39,y-1],
    [33,y-2],[34,y-2],[35,y-2],[36,y-2],[37,y-2],[38,y-2],
  ], col)

  // Stretch row at peak — more exaggerated early in stage, subtler as creature matures
  if (!sleeping && !wilt && hop === 2 && stageProgress < 0.5) {
    fill(ctx, [[33,y-3],[34,y-3],[35,y-3],[36,y-3],[37,y-3],[38,y-3]], col)
  }

  // Leaf ears/crown
  fill(ctx, [
    [31,y-2],[32,y-2],[32,y-3],[33,y-3],[33,y-4],[34,y-4],  // left ear
    [37,y-4],[38,y-4],[38,y-3],[39,y-3],[39,y-2],[40,y-2],  // right ear
    [34,y-3],[35,y-3],[36,y-3],[37,y-3],                    // crown
    [34,y-4],[35,y-4],[36,y-4],[37,y-4],
  ], col2)
  // Ear and crown tips — bright top edge separates points from body mass
  fill(ctx, [[33,y-4],[34,y-4],[35,y-4],[36,y-4],[37,y-4],[38,y-4]], col3)

  // Highlights
  fill(ctx, [[34,y-1],[35,y-1],[36,y-1],[37,y-1]], col3)

  // Eyes
  if (blink) {
    // closed eyes — two separate bars with gap at x=36
    fill(ctx, [[34,y],[35,y]], C.e1)
    fill(ctx, [[37,y],[38,y]], C.e1)
  } else {
    dot(ctx, 34, y, C.e1)
    dot(ctx, 37, y, C.e1)
    const gx = lookDir === 'right' || lookDir === 'right-up' ? 1 : lookDir === 'left' || lookDir === 'left-up' ? -1 : 0
    const gy = -1
    dot(ctx, 34+gx, y+gy, C.e2)
    dot(ctx, 37+gx, y+gy, C.e2)
  }

  // Arms/leaf tendrils
  fill(ctx, [[29,y],[30,y],[29,y+1]], col2)
  fill(ctx, [[41,y],[42,y],[42,y+1]], col2)

  // Smile fades out, frown fades in — both use alpha so no pixel snaps at 0.5 threshold
  const smileAlpha = Math.max(0, 1 - wiltProgress * 1.5)
  const frownAlpha = Math.max(0, (wiltProgress - 0.3) / 0.7)
  if (smileAlpha > 0) {
    ctx.save(); ctx.globalAlpha = smileAlpha
    fill(ctx, [[34,y+1],[37,y+1]], col3)
    ctx.restore()
  }
  if (frownAlpha > 0) {
    ctx.save(); ctx.globalAlpha = frownAlpha
    fill(ctx, [[34,y+1],[35,y+1],[36,y+1]], C.w2)
    ctx.restore()
  }
  if (sleeping && !wilt) drawZzz(ctx, 41, 37, tick)
}

// ── Stage 4: Fur growing through leaves ──────────────────
export function drawStage4(ctx, health, tick, hour = new Date().getHours(), wiltProgress = 0) {
  const wilt = wiltProgress >= 0.5
  const sleeping = isSleeping(hour)
  const idle = _tickIdle(4, tick, sleeping)
  const breathe = sleeping ? 0 : (Math.floor(tick / 110) % 2 === 0 ? 0 : -1)
  const col  = lerpColor(C.g3, C.w3, wiltProgress)
  const fur  = lerpColor(C.b4, C.w2, wiltProgress)
  const leaf = lerpColor(C.g4, C.w2, wiltProgress)
  const glow = C.a1
  const blink = idle.blink
  const planeActive = (tick % PLANE_CYCLE) <= PLANE_ACTIVE
  const planePos = planeActive ? Math.floor(((tick % PLANE_CYCLE) / PLANE_ACTIVE) * (W + 10)) - 5 : -1

  // Walking is an idle action: creature takes a few steps and returns to center
  let xOff = 0, stride = 0, walkDir = 'neutral'
  if (!sleeping && idle.action === 'walk') {
    const walkT = idle.t < 0.5 ? idle.t * 2 : (1 - idle.t) * 2
    xOff   = Math.round(idle.dir * 6 * walkT)
    stride = Math.floor(tick / 18) % 2
    walkDir = idle.dir > 0 ? 'right' : 'left'
  }
  const lookDir = (planePos >= 0 && planePos <= W)
    ? (planePos < 36 ? 'left-up' : 'right-up')
    : walkDir

  const y = 38 + breathe

  ctx.save()
  ctx.translate(xOff * SCALE, 0)

  // Tail
  fill(ctx, [[40,y+6],[41,y+6],[42,y+5],[42,y+4],[41,y+3]], fur)

  // Legs — alternate lifting 1px while walking
  const leftLegOff  = stride === 1 ? -1 : 0
  const rightLegOff = stride === 0 ? -1 : 0
  fill(ctx, [[30,y+8+leftLegOff],[31,y+8+leftLegOff],[30,y+9+leftLegOff],[31,y+9+leftLegOff]], fur)
  fill(ctx, [[37,y+8+rightLegOff],[38,y+8+rightLegOff],[37,y+9+rightLegOff],[38,y+9+rightLegOff]], fur)

  // Body (fur base)
  const body = []
  for (let bx = 29; bx <= 39; bx++) for (let by = y+2; by <= y+7; by++) body.push([bx,by])
  fill(ctx, body, fur)

  // Leaf overlay on back
  fill(ctx, [
    [30,y+2],[31,y+2],[32,y+2],[33,y+2],[34,y+2],[35,y+2],[36,y+2],[37,y+2],[38,y+2],
    [31,y+1],[32,y+1],[33,y+1],[34,y+1],[35,y+1],[36,y+1],[37,y+1],
    [32,y],[33,y],[34,y],[35,y],[36,y],
  ], col)

  // Head
  fill(ctx, [
    [30,y+2],[31,y+2],[32,y+2],[33,y+2],[34,y+2],[35,y+2],[36,y+2],[37,y+2],
    [30,y+3],[31,y+3],[32,y+3],[33,y+3],[34,y+3],[35,y+3],[36,y+3],[37,y+3],
    [31,y+4],[32,y+4],[33,y+4],[34,y+4],[35,y+4],[36,y+4],
  ], fur)

  // Leaf ears
  fill(ctx, [[29,y+1],[30,y+1],[29,y],[30,y]], leaf)
  fill(ctx, [[38,y+1],[39,y+1],[38,y],[39,y]], leaf)

  // Arms — stubby leaf limbs extending from body sides, natural hang
  fill(ctx, [[27,y+5],[28,y+5],[27,y+6]], leaf)
  fill(ctx, [[40,y+5],[41,y+5],[41,y+6]], leaf)

  // Glowing eye
  if (blink) {
    // closed eyes — two separate bars with gap at x=34
    fill(ctx, [[32,y+3],[33,y+3]], C.e1)
    fill(ctx, [[35,y+3],[36,y+3]], C.e1)
  } else {
    dot(ctx, 32, y+3, C.e1)
    dot(ctx, 35, y+3, C.e1)
    const gx = lookDir === 'right' || lookDir === 'right-up' ? 1 : lookDir === 'left' || lookDir === 'left-up' ? -1 : 0
    const gy = lookDir === 'right-up' || lookDir === 'left-up' ? 1 : 2
    dot(ctx, 32+gx, y+gy, glow)
    dot(ctx, 35+gx, y+gy, glow)
  }

  if (!wilt) {
    // nose glint
    dot(ctx, 33, y+4, C.a2)
    dot(ctx, 34, y+4, C.a2)
  }
  if (sleeping && !wilt) drawZzz(ctx, 41, 35, tick)
  ctx.restore()
}

// ── Stage 5: Full animal, glowing, lush ──────────────────
export function drawStage5(ctx, health, tick, hour = new Date().getHours(), surfing = false) {
  const wilt = health < HEALTH.WILT_THRESHOLD
  const sleeping = isSleeping(hour)

  // ── Meditation state ───────────────────────────────────
  // Sleeping / surfing: always meditating. Idle: brief cycle every ~900 ticks.
  const MED_CYCLE = 900
  const MED_HOLD  = 250
  const MED_EASE  = 30
  const medPos = tick % MED_CYCLE
  let meditateProgress = 0
  if (sleeping || surfing) {
    meditateProgress = 1
  } else {
    const medStart = MED_CYCLE - MED_HOLD
    if (medPos >= medStart) {
      meditateProgress = Math.min(1, (medPos - medStart) / MED_EASE)
    } else if (medPos < MED_EASE) {
      meditateProgress = (MED_EASE - medPos) / MED_EASE
    }
  }
  const isMeditating = meditateProgress > 0

  // Float height eases up 4px during meditation; slow bob ±1px when fully in
  const floatLift = sleeping || surfing ? 4 : Math.round(meditateProgress * 4)
  const floatBob  = isMeditating ? Math.round(Math.sin(tick / 120)) : 0
  const breathe   = isMeditating ? 0 : Math.floor(tick / 130) % 2
  const y = 36 + breathe - floatLift + floatBob

  const fur   = C.g3
  const leaf  = C.g5
  const glow  = C.a2
  const gleam = C.a3
  const idle = _tickIdle(5, tick, sleeping)
  const blink = idle.blink
  const planeActive = (tick % PLANE_CYCLE) <= PLANE_ACTIVE
  const planePos = planeActive ? Math.floor(((tick % PLANE_CYCLE) / PLANE_ACTIVE) * (W + 10)) - 5 : -1

  // Walking is an idle action; eases to 0 as meditation deepens
  let rawXOff = 0, stride = 0, walkDir = 'neutral'
  if (!sleeping && !isMeditating && idle.action === 'walk') {
    const walkT = idle.t < 0.5 ? idle.t * 2 : (1 - idle.t) * 2
    rawXOff  = Math.round(idle.dir * 6 * walkT)
    stride   = Math.floor(tick / 18) % 2
    walkDir  = idle.dir > 0 ? 'right' : 'left'
  }
  const xOff = sleeping || surfing ? 0 : Math.round(rawXOff * (1 - meditateProgress))
  const lookDir = (planePos >= 0 && planePos <= W)
    ? (planePos < 36 ? 'left-up' : 'right-up')
    : (isMeditating ? 'neutral' : walkDir)

  // ── Aura — expands and brightens during meditation ─────
  const auraBoost  = sleeping || surfing ? 1 : meditateProgress
  const auraAlpha  = 0.18 + 0.08 * Math.sin(tick / 30) + 0.22 * auraBoost
  const auraRadius = 14 + Math.round(5 * auraBoost)
  ctx.save()
  const grad = ctx.createRadialGradient(
    (36 + xOff) * SCALE, (y + 4) * SCALE, 2 * SCALE,
    (36 + xOff) * SCALE, (y + 4) * SCALE, auraRadius * SCALE
  )
  grad.addColorStop(0, `rgba(160, 200, 120, ${auraAlpha})`)
  grad.addColorStop(1, 'rgba(160,200,120,0)')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, W * SCALE, H * SCALE)
  ctx.restore()

  ctx.save()
  ctx.translate(xOff * SCALE, 0)

  // Tail (bushy)
  fill(ctx, [
    [41,y+8],[42,y+8],[43,y+7],[44,y+6],[44,y+5],[43,y+4],[42,y+4],
    [42,y+7],[43,y+6],[43,y+5],
  ], leaf)

  if (!isMeditating) {
    // Walking legs
    const leftLegOff  = stride === 1 ? -1 : 0
    const rightLegOff = stride === 0 ? -1 : 0
    fill(ctx, [[30,y+10+leftLegOff],[31,y+10+leftLegOff],[30,y+11+leftLegOff],[31,y+11+leftLegOff]], fur)
    fill(ctx, [[38,y+10+rightLegOff],[39,y+10+rightLegOff],[38,y+11+rightLegOff],[39,y+11+rightLegOff]], fur)
  }

  // Body
  const body = []
  for (let bx = 29; bx <= 41; bx++) for (let by = y+4; by <= y+9; by++) body.push([bx,by])
  fill(ctx, body, fur)

  // Subtle edge during float: sides match body (invisible merge), bottom C.g2 shadow only
  if (isMeditating) {
    const sides = []
    for (let by = y+4; by <= y+9; by++) { sides.push([29,by]); sides.push([41,by]) }
    fill(ctx, sides, C.g3)
    const bottom = []
    for (let bx = 29; bx <= 41; bx++) bottom.push([bx,y+9])
    fill(ctx, bottom, C.g2)
  }

  // Meditation arms — C.g5 (lightest green) pops against both aura and body
  if (isMeditating) {
    fill(ctx, [[27,y+5],[26,y+4],[25,y+4]], C.g5)
    fill(ctx, [[42,y+5],[43,y+4],[44,y+4]], C.g5)
  }

  // Back leaves / mane
  fill(ctx, [
    [29,y+3],[30,y+3],[31,y+3],[32,y+3],[33,y+3],[34,y+3],[35,y+3],[36,y+3],[37,y+3],[38,y+3],[39,y+3],
    [30,y+2],[31,y+2],[32,y+2],[33,y+2],[34,y+2],[35,y+2],[36,y+2],[37,y+2],[38,y+2],
    [31,y+1],[32,y+1],[33,y+1],[34,y+1],[35,y+1],[36,y+1],[37,y+1],
    [33,y],[34,y],[35,y],[36,y],[37,y],
  ], leaf)

  // Head
  fill(ctx, [
    [30,y+3],[31,y+3],[32,y+3],[33,y+3],[34,y+3],[35,y+3],[36,y+3],[37,y+3],[38,y+3],[39,y+3],
    [30,y+4],[31,y+4],[32,y+4],[33,y+4],[34,y+4],[35,y+4],[36,y+4],[37,y+4],[38,y+4],[39,y+4],
    [31,y+5],[32,y+5],[33,y+5],[34,y+5],[35,y+5],[36,y+5],[37,y+5],[38,y+5],
  ], fur)

  // Glowing eyes — ease shut as meditation deepens (open → half → closed)
  const eyesClosed = isMeditating ? meditateProgress >= 0.6 : blink
  const eyesHalf   = isMeditating && meditateProgress >= 0.25 && meditateProgress < 0.6

  if (eyesClosed) {
    // closed eyes — soft dark green reads as "gently shut", not holes
    fill(ctx, [[33,y+4],[34,y+4]], C.g1)
    fill(ctx, [[36,y+4],[37,y+4]], C.g1)
  } else if (eyesHalf) {
    // heavy-lidded — open eye positions, no gleam
    dot(ctx, 33, y+4, C.e1)
    dot(ctx, 36, y+4, C.e1)
  } else {
    dot(ctx, 33, y+4, C.e1)
    dot(ctx, 36, y+4, C.e1)
    const gx = lookDir === 'right' || lookDir === 'right-up' ? 1 : lookDir === 'left' || lookDir === 'left-up' ? -1 : 0
    dot(ctx, 33+gx, y+3, glow)
    dot(ctx, 36+gx, y+3, glow)
    dot(ctx, 33+gx, y+2, gleam)
    dot(ctx, 36+gx, y+2, gleam)
    // Permanent upper gleam — keeps face readable regardless of look direction
    dot(ctx, 34, y+3, C.e2)
    dot(ctx, 37, y+3, C.e2)
  }

  // Nose
  fill(ctx, [[34,y+5],[35,y+5]], glow)

  // Smile
  fill(ctx, [[33,y+6],[34,y+6],[35,y+6],[36,y+6]], leaf)
  ctx.restore()
}

// ── Environment layers ────────────────────────────────────

// ── Daily weather — stable per calendar day, no API needed ──
// Returns 0=clear, 1=partly cloudy, 2=overcast, 3=rainy
function getDailyWeather() {
  const dateStr = new Date().toDateString()
  let hash = 0
  for (let i = 0; i < dateStr.length; i++) {
    hash = ((hash << 5) - hash) + dateStr.charCodeAt(i)
    hash |= 0
  }
  return Math.abs(hash) % 4
}

// ── Dawn fog — ground-level mist, hours 5–7 only ────────────
function drawDawnFog(ctx, hour) {
  if (hour < 5 || hour >= 8) return
  const alpha = hour < 6 ? 0.4 : hour < 7 ? 0.25 : 0.1
  ctx.save()
  ctx.globalAlpha = alpha
  ctx.fillStyle = '#c8d4c0'
  ctx.fillRect(0, 36 * SCALE, W * SCALE, 12 * SCALE)
  ctx.restore()
}

// ── Weather rain — lighter and cooler than wilt rain ────────
function drawWeatherRain(ctx, tick) {
  ctx.save()
  ctx.globalAlpha = 0.15
  ctx.fillStyle = '#8899aa'
  const streaks = [6, 13, 19, 26, 33, 39, 45, 52, 58, 64]
  streaks.forEach((sx, i) => {
    const yOff = (tick * 0.6 + i * 11) % 55
    const y = Math.floor(yOff)
    if (y < 46) ctx.fillRect(sx * SCALE, y * SCALE, SCALE, SCALE * 2)
  })
  ctx.restore()
}

// ── Plane ─────────────────────────────────────────────────
// Rare — cycles every PLANE_CYCLE ticks, visible for PLANE_ACTIVE of them
function drawPlane(ctx, tick) {
  const pos = tick % PLANE_CYCLE
  if (pos > PLANE_ACTIVE) return null

  const x = Math.floor((pos / PLANE_ACTIVE) * (W + 10)) - 5
  if (x < -6 || x > W) return null

  // Contrail: 15 pixels behind plane, fading smoothly.
  // Step directly in screen pixels (pos-based ticks move ~0.1px/tick — too slow to use).
  const smokeAlphas = [0.35, 0.30, 0.25, 0.21, 0.17, 0.14, 0.11, 0.09, 0.07, 0.05, 0.04, 0.03, 0.02, 0.01, 0.005]
  for (let i = 1; i <= 15; i++) {
    const smokeX = x - i
    if (smokeX >= 0 && smokeX < W) {
      ctx.save()
      ctx.globalAlpha = smokeAlphas[i - 1]
      ctx.fillStyle = '#c8d0d8'
      ctx.fillRect(smokeX * SCALE, 3 * SCALE, SCALE, SCALE)
      ctx.restore()
    }
  }

  // Fuselage — 7px body in grey, then red livery stripe overwrites 2px
  ctx.fillStyle = '#c8d0d8'
  for (let i = 0; i <= 6; i++) {
    if (x+i >= 0 && x+i < W) ctx.fillRect((x+i) * SCALE, 3 * SCALE, SCALE, SCALE)
  }
  // Tail fin
  if (x+1 >= 0 && x+1 < W) ctx.fillRect((x+1) * SCALE, 2 * SCALE, SCALE, SCALE)
  // Wings — 3px spread below fuselage
  if (x+2 >= 0 && x+2 < W) ctx.fillRect((x+2) * SCALE, 4 * SCALE, SCALE, SCALE)
  if (x+3 >= 0 && x+3 < W) ctx.fillRect((x+3) * SCALE, 4 * SCALE, SCALE, SCALE)
  if (x+4 >= 0 && x+4 < W) ctx.fillRect((x+4) * SCALE, 4 * SCALE, SCALE, SCALE)
  // Red livery stripe — 2px on fuselage
  ctx.fillStyle = '#cc3333'
  if (x+2 >= 0 && x+2 < W) ctx.fillRect((x+2) * SCALE, 3 * SCALE, SCALE, SCALE)
  if (x+3 >= 0 && x+3 < W) ctx.fillRect((x+3) * SCALE, 3 * SCALE, SCALE, SCALE)

  return x  // return x so creatures can watch it
}

// ── Small critter ─────────────────────────────────────────
// Stage 3+. Scurries across the horizon. Cycle 2400, visible 200.
function drawCritter(ctx, tick) {
  const CYCLE = 2400
  const ACTIVE = 200
  const pos = tick % CYCLE
  if (pos > ACTIVE) return

  const x = Math.floor((pos / ACTIVE) * (W + 6)) - 3
  if (x < 0 || x + 1 >= W) return

  // Alternate legs every 4 ticks
  const legPhase = Math.floor(tick / 4) % 2

  ctx.fillStyle = C.b4
  ctx.fillRect(x * SCALE, 46 * SCALE, SCALE, SCALE)
  ctx.fillRect((x+1) * SCALE, 46 * SCALE, SCALE, SCALE)
  // Legs
  const legX = legPhase === 0 ? x : x + 1
  ctx.fillRect(legX * SCALE, 47 * SCALE, SCALE, SCALE)
}

// ── Shooting star ─────────────────────────────────────────
// Night only (hour >= 21 || hour < 5). Cycle 2200, visible 40.
function drawShootingStar(ctx, tick, hour) {
  if (hour < 21 && hour >= 5) return

  const CYCLE = 2200
  const ACTIVE = 40
  const pos = tick % CYCLE
  if (pos > ACTIVE) return

  const progress = pos / ACTIVE
  const startX = 15
  const startY = 2
  const x = Math.floor(startX + progress * 25)
  const y = Math.floor(startY + progress * 5)

  if (x >= W || y >= 20) return

  ctx.save()
  ctx.fillStyle = '#e8f0f8'
  ctx.fillRect(x * SCALE, y * SCALE, SCALE, SCALE)
  // Trail — 4 fading pixels behind
  const trailAlphas = [0.6, 0.35, 0.15, 0.05]
  for (let t = 1; t <= 4; t++) {
    const tx = x - t
    const ty = y - Math.round(t * 5 / 25)
    if (tx >= 0) {
      ctx.globalAlpha = trailAlphas[t - 1]
      ctx.fillRect(tx * SCALE, ty * SCALE, SCALE, SCALE)
    }
  }
  ctx.restore()
}

function drawSunMoon(ctx, stage, fractHour, tick) {
  // Arc progress across the sky: 0.0 (left) to 1.0 (right)
  // Sun arcs from hour 6 to 20. Moon from hour 20 to 6 (next day).
  // fractHour is a continuous float (e.g. 14.5 = 2:30pm) for smooth arc movement.
  const isSun = fractHour >= 6 && fractHour < 20
  const isNight = fractHour >= 20 || fractHour < 6

  // x: arc across width, y: dips toward horizon at midpoint
  let progress, bodyY

  if (isSun) {
    progress = (fractHour - 6) / 14  // 0 at 6am, 1 at 8pm
    // Arc: highest at noon (progress=0.5), lowest at edges
    bodyY = Math.round(8 + 14 * Math.abs(progress - 0.5) * 2)
  } else {
    // Night: hour 20-24 maps 0→0.33, hour 0-6 maps 0.33→1
    const nightHour = fractHour >= 20 ? fractHour - 20 : fractHour + 4
    progress = nightHour / 10
    bodyY = Math.round(6 + 10 * Math.abs(progress - 0.5) * 2)
  }

  const bodyX = Math.round(4 + progress * (W - 8))

  ctx.save()

  if (isSun) {
    // Sun: solid pixel circle, warm gold
    const sunColor = stage >= 3 ? '#e8c86a' : '#c8a84b'
    ctx.fillStyle = sunColor
    // 3-radius pixel circle (7x7)
    const sunPixels = [
      [1,0],[2,0],[3,0],[4,0],[5,0],
      [0,1],[1,1],[2,1],[3,1],[4,1],[5,1],[6,1],
      [0,2],[1,2],[2,2],[3,2],[4,2],[5,2],[6,2],
      [0,3],[1,3],[2,3],[3,3],[4,3],[5,3],[6,3],
      [0,4],[1,4],[2,4],[3,4],[4,4],[5,4],[6,4],
      [0,5],[1,5],[2,5],[3,5],[4,5],[5,5],[6,5],
      [1,6],[2,6],[3,6],[4,6],[5,6],
    ]
    sunPixels.forEach(([dx, dy]) => {
      ctx.fillRect((bodyX + dx - 3) * SCALE, (bodyY + dy - 3) * SCALE, SCALE, SCALE)
    })
  } else {
    // Moon: real lunar phase
    const SYNODIC = 29.53058770576
    const epochDays = 10962.5125 // Jan 6, 2000 12:18 UTC in days since Unix epoch
    const age = ((Date.now() / 86400000 - epochDays) % SYNODIC + SYNODIC) % SYNODIC

    if (age >= 1.85 && age < 27.64) {
      const isWaxing = age <= 14.765
      const litFraction = isWaxing ? age / 14.765 : (SYNODIC - age) / (SYNODIC - 14.765)
      const litColumns = Math.round(litFraction * 7)
      const fullMoon = [
        [1,0],[2,0],[3,0],[4,0],[5,0],
        [0,1],[1,1],[2,1],[3,1],[4,1],[5,1],[6,1],
        [0,2],[1,2],[2,2],[3,2],[4,2],[5,2],[6,2],
        [0,3],[1,3],[2,3],[3,3],[4,3],[5,3],[6,3],
        [0,4],[1,4],[2,4],[3,4],[4,4],[5,4],[6,4],
        [0,5],[1,5],[2,5],[3,5],[4,5],[5,5],[6,5],
        [1,6],[2,6],[3,6],[4,6],[5,6],
      ]
      ctx.fillStyle = '#c8d4e0'
      fullMoon.forEach(([dx, dy]) => {
        const lit = isWaxing ? dx >= (7 - litColumns) : dx < litColumns
        if (lit) {
          ctx.fillRect((bodyX + dx - 3) * SCALE, (bodyY + dy - 3) * SCALE, SCALE, SCALE)
        }
      })
    }
  }

  ctx.restore()
}

function getSkyColors(stage, fractHour) {
  const times = {
    night:   ['#0a0c1a', '#0f1028'],
    dawn:    ['#1a1030', '#2e1a3a'],
    morning: ['#1a2848', '#2a4060'],
    day:     ['#1e3858', '#3a6070'],
    dusk:    ['#2a1828', '#3a2040'],
    evening: ['#140e22', '#1e1430'],
  }
  // Sequential periods with blend window of 0.75h before each boundary
  const periods = [
    [0,  5,  'night',   'dawn'],
    [5,  7,  'dawn',    'morning'],
    [7,  10, 'morning', 'day'],
    [10, 16, 'day',     'dusk'],
    [16, 19, 'dusk',    'evening'],
    [19, 22, 'evening', 'night'],
    [22, 24, 'night',   'dawn'],
  ]
  const BLEND = 0.75
  const [start, end, key, nextKey] = periods.find(([s, e]) => fractHour >= s && fractHour < e) || periods[0]
  const t = Math.max(0, 1 - (end - fractHour) / BLEND)
  const cur = times[key], nxt = times[nextKey]
  if (t <= 0) return cur
  return [lerpColor(cur[0], nxt[0], t), lerpColor(cur[1], nxt[1], t)]
}

export function drawEnvironment(ctx, stage, health, tick, inTransition = false, hour = new Date().getHours(), wiltProgress = 0) {
  const wilt = wiltProgress >= 0.5
  const now = new Date()
  const fractHour = hour + now.getMinutes() / 60
  const weather = getDailyWeather()

  // ── Sky gradient (time-of-day aware, blends between periods) ─
  const [skyTop, skyBot] = getSkyColors(stage, fractHour)
  const skyGrad = ctx.createLinearGradient(0, 0, 0, 48 * SCALE)
  skyGrad.addColorStop(0, skyTop)
  skyGrad.addColorStop(1, skyBot)
  ctx.fillStyle = skyGrad
  ctx.fillRect(0, 0, W * SCALE, 48 * SCALE)

  // Stars fade in hour 20→21, full 21→6, fade out 6→7
  if (wiltProgress < 0.5) {
    const starAlpha = fractHour >= 21 || fractHour < 6 ? 1
      : fractHour >= 20 ? fractHour - 20
      : fractHour < 7   ? Math.max(0, 1 - (fractHour - 6)) : 0
    if (starAlpha > 0) {
      ctx.save(); ctx.globalAlpha = starAlpha
      drawStars(ctx, tick)
      ctx.restore()
    }
  }
  if (weather < 2) drawSunMoon(ctx, stage, fractHour, tick)

  // ── Ground fill (below horizon) ───────────────────────
  ctx.fillStyle = '#221408'
  ctx.fillRect(0, 48 * SCALE, W * SCALE, (H - 48) * SCALE)

  // ── Clouds ─────────────────────────────────────────────
  if (wiltProgress < 0.5) {
    const cloudAlpha = [0.18, 0.24, 0.28, 0.34, 0.40][stage - 1]
    drawClouds(ctx, tick, cloudAlpha, inTransition, weather)
  }

  // ── Horizon line (sky meets earth) ────────────────────
  // Subtle lighter band at y=55 — the seam between worlds
  const horizonCol = lerpColor('#5a3418', '#2a1a0a', wiltProgress)
  fill(ctx, Array.from({length: W}, (_, x) => [x, 47]), horizonCol)

  // ── Ground surface ────────────────────────────────────
  const groundY = 48
  fill(ctx, Array.from({length: W}, (_, x) => [x, groundY]),   lerpColor('#4e2c14', C.b2, wiltProgress))
  fill(ctx, Array.from({length: W}, (_, x) => [x, groundY+1]), lerpColor('#341a0a', C.b1, wiltProgress))
  fill(ctx, Array.from({length: W}, (_, x) => [x, groundY+2]), '#221408')
  for (let dy = 3; dy <= H - groundY - 1; dy++) {
    fill(ctx, Array.from({length: W}, (_, x) => [x, groundY + dy]), '#221408')
  }

  // ── Grass tufts (stage 2+) ────────────────────────────
  if (stage >= 2) {
    const grassCol = lerpColor(C.g3, C.w3, wiltProgress)
    const tufts = [
      [3,47],[5,47],[8,47],[12,47],[15,47],[18,47],[21,47],[25,47],
      [44,47],[46,47],[50,47],[53,47],[55,47],[58,47],[62,47],[65,47],
    ]
    fill(ctx, tufts, grassCol)
    if (wiltProgress < 0.5) fill(ctx, [
      [4,46],[6,46],[9,46],[11,46],[13,46],[16,46],[19,46],[22,46],[26,46],
      [45,46],[47,46],[49,46],[51,46],[54,46],[56,46],[59,46],[63,46],[66,46],
    ], C.g4)
  }

  // ── Wildflowers (stage 3+) — two colors ───────────────
  if (stage >= 3 && wiltProgress < 0.5) {
    fill(ctx, [[7,46],[14,46],[20,46],[48,46],[55,46],[62,46]], C.a1)
    fill(ctx, [[7,45],[14,45],[20,45],[48,45],[55,45],[62,45]], C.a2)
    fill(ctx, [[10,46],[17,46],[51,46],[59,46]], C.f1)
    fill(ctx, [[10,45],[17,45],[51,45],[59,45]], C.f2)
  }

  // ── Trees (stage 3+) ──────────────────────────────────
  if (stage >= 3) {
    drawTree(ctx, 8,  26, wilt, stage, false, wiltProgress)
    drawTree(ctx, 52, 26, wilt, stage, false, wiltProgress)
  }

  // ── Background trees (stage 4+) ───────────────────────
  if (stage >= 4) {
    drawTree(ctx, 2,  30, wilt, stage, true, wiltProgress)
    drawTree(ctx, 58, 30, wilt, stage, true, wiltProgress)
  }

  // ── Fireflies (stage 5) ───────────────────────────────
  if (stage >= 5) {
    const ffPositions = [
      [15 + Math.floor(Math.sin(tick/40)*3), 35 + Math.floor(Math.cos(tick/50)*2)],
      [48 + Math.floor(Math.sin(tick/35+1)*3), 38 + Math.floor(Math.cos(tick/45+1)*2)],
      [22 + Math.floor(Math.sin(tick/55+2)*4), 42 + Math.floor(Math.cos(tick/40+2)*3)],
    ]
    ffPositions.forEach(([fx, fy]) => {
      const alpha = 0.5 + 0.5 * Math.sin(tick / 20)
      ctx.save()
      ctx.globalAlpha = alpha
      dot(ctx, fx, fy, C.f1)
      dot(ctx, fx, fy-1, C.f2)
      ctx.restore()
    })
  }

  // ── World events ──────────────────────────────────────
  const planeX = drawPlane(ctx, tick)
  if (stage >= 3 && wiltProgress < 0.5) drawCritter(ctx, tick)
  drawShootingStar(ctx, tick, hour)

  // ── Ambient: bird (stage 2+, no wilt) ────────────────
  if (stage >= 2 && wiltProgress < 0.5) {
    drawBird(ctx, tick, false)
    // Bonus bird during transitions
    if (inTransition) drawBird(ctx, tick + 180, true)
  }

  // ── Ambient: falling leaf (stage 3+, no wilt) ────────
  if (stage >= 3 && wiltProgress < 0.5) {
    drawLeaf(ctx, tick)
  }

  // ── Wilt: rain and overlay fade in with wiltProgress ──
  if (wiltProgress > 0) {
    drawRain(ctx, tick, 0.25 * wiltProgress)
    ctx.save()
    ctx.globalAlpha = 0.15 * wiltProgress
    ctx.fillStyle = '#4a3010'
    ctx.fillRect(0, 0, W * SCALE, H * SCALE)
    ctx.restore()
  }

  // ── Weather effects (non-wilt) ────────────────────────
  if (wiltProgress < 0.5) {
    if (weather === 3) drawWeatherRain(ctx, tick)
    if (weather >= 2) {
      ctx.save()
      ctx.globalAlpha = 0.2
      ctx.fillStyle = '#0a0c10'
      ctx.fillRect(0, 0, W * SCALE, 48 * SCALE)
      ctx.restore()
    }
    drawDawnFog(ctx, hour)
  }
}

// ── Clouds ────────────────────────────────────────────────
// Three clouds, each a cluster of pixel rects drifting at different speeds
function drawClouds(ctx, tick, alpha, inTransition, weather = 0) {
  ctx.save()
  const weatherAlpha = weather >= 2 ? alpha * 2 : alpha
  ctx.globalAlpha = inTransition ? Math.min(alpha * 1.8, 0.5) : weatherAlpha

  // Three color tiers for layered volume
  const C_BASE = '#9aa8b8'
  const C_MID  = '#c0ccd8'
  const C_TOP  = '#e0e8f0'

  // Each cloud: array of [dx, dy, colorTier] where tier 0=base, 1=mid, 2=top
  const clouds = [
    {
      shape: [
        // base
        [0,0,0],[1,0,0],[2,0,0],[3,0,0],[4,0,0],[5,0,0],[6,0,0],[7,0,0],
        // mid
        [1,-1,1],[2,-1,1],[3,-1,1],[4,-1,1],[5,-1,1],
        // top
        [2,-2,2],[3,-2,2],
      ],
      speed: 0.012, offset: 0, y: 8
    },
    {
      shape: [
        // base
        [0,0,0],[1,0,0],[2,0,0],[3,0,0],[4,0,0],[5,0,0],[6,0,0],[7,0,0],[8,0,0],[9,0,0],
        // mid
        [1,-1,1],[2,-1,1],[3,-1,1],[4,-1,1],[5,-1,1],[6,-1,1],[7,-1,1],
        // top - two bumps
        [2,-2,2],[3,-2,2],[4,-2,2],
        [5,-2,2],[6,-2,2],
        // peak of first bump
        [3,-3,2],[4,-3,2],
      ],
      speed: 0.007, offset: 25, y: 14
    },
    {
      shape: [
        // base
        [0,0,0],[1,0,0],[2,0,0],[3,0,0],[4,0,0],[5,0,0],
        // mid
        [1,-1,1],[2,-1,1],[3,-1,1],[4,-1,1],
        // top
        [2,-2,2],
      ],
      speed: 0.018, offset: 45, y: 6
    },
  ]

  if (weather >= 1) {
    clouds.push({
      shape: [
        // base
        [0,0,0],[1,0,0],[2,0,0],[3,0,0],[4,0,0],[5,0,0],[6,0,0],[7,0,0],[8,0,0],
        // mid
        [1,-1,1],[2,-1,1],[3,-1,1],[4,-1,1],[5,-1,1],[6,-1,1],[7,-1,1],
        // top
        [2,-2,2],[3,-2,2],[4,-2,2],[5,-2,2],[6,-2,2],
        [3,-3,2],[4,-3,2],[5,-3,2],
      ],
      speed: 0.009, offset: 60, y: 18
    })
  }

  const colorMap = [C_BASE, C_MID, C_TOP]

  clouds.forEach(({ shape, speed, offset, y }) => {
    const xBase = ((tick * speed + offset) % (W + 10)) - 6
    shape.forEach(([dx, dy, tier]) => {
      const px = Math.floor(xBase + dx)
      const py = y + dy
      if (px >= 0 && px < W) {
        ctx.fillStyle = colorMap[tier]
        ctx.fillRect(px * SCALE, py * SCALE, SCALE, SCALE)
      }
    })
  })

  ctx.restore()
}

// ── Bird ──────────────────────────────────────────────────
// Simple 3-pixel V silhouette crossing the upper sky
function drawBird(ctx, tick, offset = false) {
  const cycleLen = offset ? 380 : 520
  const startOffset = offset ? 200 : 0
  const pos = (tick + startOffset) % (cycleLen + W + 10)
  if (pos > cycleLen) return // bird is off-screen / resting

  // offset bird flies R→L; primary bird flies L→R
  const x = offset
    ? W + 5 - Math.floor((pos / cycleLen) * (W + 10))
    : Math.floor((pos / cycleLen) * (W + 10)) - 5
  const baseY = offset ? 12 : 8

  // Sine wobble — organic vertical drift; desync the two birds with different frequencies
  const yOff = Math.round(Math.sin(tick / (offset ? 22 : 28)) * 1.5)
  const y = baseY + yOff

  if (x < -4 || x > W) return

  // 0=wings up, 1=wings down, 2=glide — reads as: flap flap | glide | flap flap flap | glide | flap | glide
  const FLAP_SEQ = [0, 1, 0, 1, 2, 2, 2, 2, 0, 1, 0, 1, 0, 1, 2, 2, 2, 2, 0, 1, 2, 2, 2]
  const frame = FLAP_SEQ[Math.floor(tick / 10) % FLAP_SEQ.length]
  ctx.fillStyle = '#0a0e18'
  if (frame === 0) {
    // wings up (inverted V)
    ctx.fillRect((x)   * SCALE, (y-1) * SCALE, SCALE, SCALE)
    ctx.fillRect((x+1) * SCALE, (y)   * SCALE, SCALE, SCALE)
    ctx.fillRect((x+2) * SCALE, (y-1) * SCALE, SCALE, SCALE)
  } else if (frame === 1) {
    // wings down (V)
    ctx.fillRect((x)   * SCALE, (y+1) * SCALE, SCALE, SCALE)
    ctx.fillRect((x+1) * SCALE, (y)   * SCALE, SCALE, SCALE)
    ctx.fillRect((x+2) * SCALE, (y+1) * SCALE, SCALE, SCALE)
  } else {
    // glide: 5px spread wing with upturned tips — soaring silhouette, clearly larger than flap frames
    ctx.fillRect((x)   * SCALE, (y-1) * SCALE, SCALE, SCALE)
    ctx.fillRect((x+1) * SCALE, (y)   * SCALE, SCALE, SCALE)
    ctx.fillRect((x+2) * SCALE, (y)   * SCALE, SCALE, SCALE)
    ctx.fillRect((x+3) * SCALE, (y)   * SCALE, SCALE, SCALE)
    ctx.fillRect((x+4) * SCALE, (y-1) * SCALE, SCALE, SCALE)
  }
}

// ── Falling leaf ──────────────────────────────────────────
// Diagonal drift: right and down, slow
function drawLeaf(ctx, tick) {
  const cycleLen = 600
  const pos = tick % cycleLen
  const x = Math.floor((pos / cycleLen) * (W + 8)) - 4
  const y = Math.floor(10 + (pos / cycleLen) * 30)

  if (x < 0 || x >= W || y >= 55) return

  ctx.fillStyle = C.g4
  ctx.fillRect(x * SCALE, y * SCALE, SCALE, SCALE)
  // second pixel trails slightly behind
  if (x - 1 >= 0) {
    ctx.save()
    ctx.globalAlpha = 0.5
    ctx.fillRect((x - 1) * SCALE, (y - 1) * SCALE, SCALE, SCALE)
    ctx.restore()
  }
}

// ── Rain ──────────────────────────────────────────────────
// Short vertical streaks, randomized x, drifting downward
function drawRain(ctx, tick, alpha = 0.25) {
  ctx.save()
  ctx.globalAlpha = alpha
  ctx.fillStyle = '#6a8870'
  // Use stable pseudo-random x positions seeded per-streak
  const streaks = [4, 11, 17, 24, 31, 37, 43, 50, 57, 62]
  streaks.forEach((sx, i) => {
    const yOff = (tick * 0.8 + i * 9) % 60
    const y = Math.floor(yOff)
    if (y < 54) ctx.fillRect(sx * SCALE, y * SCALE, SCALE, SCALE * 2)
  })
  ctx.restore()
}

function drawStars(ctx, tick) {
  const positions = [
    [5,4,'steady'],[12,7,'pulse'],[19,3,'flicker'],[28,9,'steady'],
    [38,5,'pulse'],[47,11,'flicker'],[55,3,'steady'],[62,8,'pulse'],
    [8,15,'flicker'],[33,13,'steady'],[50,6,'pulse'],[66,12,'flicker'],
  ]
  positions.forEach(([x, y, type], i) => {
    if (type === 'steady') {
      dot(ctx, x, y, C.star)
    } else if (type === 'pulse') {
      const alpha = 0.4 + 0.6 * Math.sin(tick / (60 + i * 11))
      ctx.save()
      ctx.globalAlpha = alpha
      dot(ctx, x, y, C.star)
      ctx.restore()
    } else {
      // flicker
      const on = Math.floor(tick / (30 + i * 7)) % 3 !== 0
      if (on) dot(ctx, x, y, C.star)
    }
  })
}

function drawTree(ctx, x, baseY, wilt, stage, bg = false, wiltProgress = 0) {
  const trunk = C.b3
  const leaf  = lerpColor(stage >= 5 ? C.g4 : C.g3, C.w3, wiltProgress)
  const leaf2 = lerpColor(C.g5, C.w2, wiltProgress)
  const alpha = bg ? 0.5 : 1

  ctx.save()
  ctx.globalAlpha = alpha

  if (bg) {
    // Background tree — smooth dome: 2,4,6,8,8,8,6,4 px rows, 2px trunk to ground
    fill(ctx, [
      [x+1,baseY],[x+2,baseY],
      [x,baseY+1],[x+1,baseY+1],[x+2,baseY+1],[x+3,baseY+1],
      [x-1,baseY+2],[x,baseY+2],[x+1,baseY+2],[x+2,baseY+2],[x+3,baseY+2],[x+4,baseY+2],
      [x-2,baseY+3],[x-1,baseY+3],[x,baseY+3],[x+1,baseY+3],[x+2,baseY+3],[x+3,baseY+3],[x+4,baseY+3],[x+5,baseY+3],
      [x-2,baseY+4],[x-1,baseY+4],[x,baseY+4],[x+1,baseY+4],[x+2,baseY+4],[x+3,baseY+4],[x+4,baseY+4],[x+5,baseY+4],
      [x-2,baseY+5],[x-1,baseY+5],[x,baseY+5],[x+1,baseY+5],[x+2,baseY+5],[x+3,baseY+5],[x+4,baseY+5],[x+5,baseY+5],
      [x-1,baseY+6],[x,baseY+6],[x+1,baseY+6],[x+2,baseY+6],[x+3,baseY+6],[x+4,baseY+6],
      [x,baseY+7],[x+1,baseY+7],[x+2,baseY+7],[x+3,baseY+7],
    ], leaf)
    if (!wilt && stage >= 4) {
      fill(ctx, [[x+1,baseY+3],[x+2,baseY+3],[x+1,baseY+4],[x+2,baseY+4]], leaf2)
    }
    for (let r = 8; r <= 28; r++) {
      fill(ctx, [[x+1,baseY+r],[x+2,baseY+r]], trunk)
    }
  } else {
    // Foreground tree — smooth dome: 2,4,6,8,10,12,12,12,12,10 px rows, 3px trunk
    fill(ctx, [
      [x+1,baseY],[x+2,baseY],
      [x,baseY+1],[x+1,baseY+1],[x+2,baseY+1],[x+3,baseY+1],
      [x-1,baseY+2],[x,baseY+2],[x+1,baseY+2],[x+2,baseY+2],[x+3,baseY+2],[x+4,baseY+2],
      [x-2,baseY+3],[x-1,baseY+3],[x,baseY+3],[x+1,baseY+3],[x+2,baseY+3],[x+3,baseY+3],[x+4,baseY+3],[x+5,baseY+3],
      [x-3,baseY+4],[x-2,baseY+4],[x-1,baseY+4],[x,baseY+4],[x+1,baseY+4],[x+2,baseY+4],[x+3,baseY+4],[x+4,baseY+4],[x+5,baseY+4],[x+6,baseY+4],
      [x-4,baseY+5],[x-3,baseY+5],[x-2,baseY+5],[x-1,baseY+5],[x,baseY+5],[x+1,baseY+5],[x+2,baseY+5],[x+3,baseY+5],[x+4,baseY+5],[x+5,baseY+5],[x+6,baseY+5],[x+7,baseY+5],
      [x-4,baseY+6],[x-3,baseY+6],[x-2,baseY+6],[x-1,baseY+6],[x,baseY+6],[x+1,baseY+6],[x+2,baseY+6],[x+3,baseY+6],[x+4,baseY+6],[x+5,baseY+6],[x+6,baseY+6],[x+7,baseY+6],
      [x-4,baseY+7],[x-3,baseY+7],[x-2,baseY+7],[x-1,baseY+7],[x,baseY+7],[x+1,baseY+7],[x+2,baseY+7],[x+3,baseY+7],[x+4,baseY+7],[x+5,baseY+7],[x+6,baseY+7],[x+7,baseY+7],
      [x-4,baseY+8],[x-3,baseY+8],[x-2,baseY+8],[x-1,baseY+8],[x,baseY+8],[x+1,baseY+8],[x+2,baseY+8],[x+3,baseY+8],[x+4,baseY+8],[x+5,baseY+8],[x+6,baseY+8],[x+7,baseY+8],
      [x-3,baseY+9],[x-2,baseY+9],[x-1,baseY+9],[x,baseY+9],[x+1,baseY+9],[x+2,baseY+9],[x+3,baseY+9],[x+4,baseY+9],[x+5,baseY+9],[x+6,baseY+9],
    ], leaf)
    if (!wilt && stage >= 4) {
      fill(ctx, [
        [x,baseY+5],[x+1,baseY+5],[x+2,baseY+5],[x+3,baseY+5],
        [x,baseY+6],[x+1,baseY+6],[x+2,baseY+6],[x+3,baseY+6],
      ], leaf2)
    }
    for (let r = 10; r <= 35; r++) {
      fill(ctx, [[x,baseY+r],[x+1,baseY+r],[x+2,baseY+r]], trunk)
    }
  }

  ctx.restore()
}

function drawZzz(ctx, headX, headY, tick) {
  const phase = Math.floor(tick / 60) % 4
  if (phase === 3) return // gap phase — nothing drawn

  const rise = phase  // 0, 1, 2 pixels of upward offset
  const col = C.textDim || '#6b7c6b'

  // Z1 — full brightness
  const z1x = headX
  const z1y = headY - rise
  // Z shape: top row, middle diagonal pixel, bottom row
  dot(ctx, z1x,   z1y,   col)
  dot(ctx, z1x+1, z1y,   col)
  dot(ctx, z1x+2, z1y,   col)
  dot(ctx, z1x+1, z1y+1, col)
  dot(ctx, z1x,   z1y+2, col)
  dot(ctx, z1x+1, z1y+2, col)
  dot(ctx, z1x+2, z1y+2, col)

  // Z2 — smaller, offset up-right, only phases 1-2
  if (phase >= 1) {
    const z2x = headX + 2
    const z2y = headY - 3 - rise
    const col2 = phase === 2 ? (C.textMuted || '#4a5a4a') : col
    dot(ctx, z2x,   z2y,   col2)
    dot(ctx, z2x+1, z2y,   col2)
    dot(ctx, z2x,   z2y+1, col2)
    dot(ctx, z2x+1, z2y+1, col2)
  }
}

// ── Canvas helpers ────────────────────────────────────────

function fill(ctx, pixels, color) {
  if (!color) return
  ctx.fillStyle = color
  pixels.forEach(([x, y]) => {
    ctx.fillRect(x * SCALE, y * SCALE, SCALE, SCALE)
  })
}

function dot(ctx, x, y, color) {
  if (!color) return
  ctx.fillStyle = color
  ctx.fillRect(x * SCALE, y * SCALE, SCALE, SCALE)
}

// ── Transition system ─────────────────────────────────────

function drawCreatureStage(ctx, stage, health, tick, hour, startedAt, surfing = false, wiltProgress = 0) {
  const droop = Math.round(wiltProgress * 2)
  ctx.save()
  ctx.translate(0, droop * SCALE)
  switch (stage) {
    case 1: drawStage1(ctx, health, tick, hour, wiltProgress); break
    case 2: drawStage2(ctx, health, tick, hour, wiltProgress); break
    case 3: drawStage3(ctx, health, tick, hour, startedAt, wiltProgress); break
    case 4: drawStage4(ctx, health, tick, hour, wiltProgress); break
    case 5: drawStage5(ctx, health, tick, hour, surfing); break
  }
  ctx.restore()
}

function drawTransitionGlow(ctx, stage, alpha, tick) {
  if (alpha <= 0) return
  ctx.save()

  const centers = {
    1: [31, 42], 2: [35, 43], 3: [35, 42], 4: [34, 43], 5: [35, 42]
  }
  const [cx, cy] = centers[stage] || [35, 42]

  const colors = {
    1: [180, 230, 140],
    2: [180, 230, 140],
    3: [200, 240, 160],
    4: [230, 210, 140],
    5: [240, 255, 160],
  }
  const [r, g, b] = colors[stage] || [200, 240, 160]

  // Keep radius close to creature — matches Stage 5 aura scale
  const pulse = Math.sin(tick / 25) * 1.5
  const radius = 12 + pulse
  // Scale alpha down so max effective intensity matches Stage 5 aura (~0.25)
  const scaledAlpha = alpha * 0.4

  const grad = ctx.createRadialGradient(
    cx * SCALE, cy * SCALE, 1 * SCALE,
    cx * SCALE, cy * SCALE, radius * SCALE
  )
  grad.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${scaledAlpha})`)
  grad.addColorStop(0.5, `rgba(${r}, ${g}, ${b}, ${scaledAlpha * 0.4})`)
  grad.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`)

  ctx.fillStyle = grad
  ctx.fillRect(0, 0, W * SCALE, H * SCALE)
  ctx.restore()
}

function getDissolveParticles(stage, health, hour, startedAt, frozenTick) {
  if (_cachedParticleStage === stage && _cachedParticles) return _cachedParticles

  const tempCanvas = document.createElement('canvas')
  tempCanvas.width = W * SCALE
  tempCanvas.height = H * SCALE
  const tempCtx = tempCanvas.getContext('2d')
  tempCtx.imageSmoothingEnabled = false
  drawCreatureStage(tempCtx, stage, health, frozenTick, hour, startedAt)

  const particles = []
  for (let lx = 0; lx < W; lx++) {
    for (let ly = 0; ly < H; ly++) {
      const pixel = tempCtx.getImageData(lx * SCALE, ly * SCALE, 1, 1).data
      if (pixel[3] > 10) {
        particles.push({
          x: lx, y: ly,
          r: pixel[0], g: pixel[1], b: pixel[2], a: pixel[3]
        })
      }
    }
  }

  _cachedParticles = particles
  _cachedParticleStage = stage
  return particles
}

export function clearDissolveCache() {
  _cachedParticles = null
  _cachedParticleStage = null
}

function drawDissolve(ctx, stage, health, dissolveProgress, tick, hour, startedAt, frozenTick) {
  const particles = getDissolveParticles(stage, health, hour, startedAt, frozenTick)
  if (particles.length === 0) return

  const maxY = Math.max(...particles.map(p => p.y), 1)
  const minY = Math.min(...particles.map(p => p.y), 0)
  const range = maxY - minY || 1

  ctx.save()
  particles.forEach(p => {
    const normalizedY = (p.y - minY) / range // 0 = top, 1 = bottom
    const stagger = 1 - normalizedY // bottom starts first
    const particleProgress = Math.max(0, (dissolveProgress - stagger * 0.3) / 0.7)

    if (particleProgress >= 1) return // fully dissolved

    const drift = particleProgress * (3 + Math.sin(p.x * 7 + p.y * 3) * 2)
    const scatter = Math.sin(p.x * 13 + p.y * 7) * particleProgress * 2
    const drawX = p.x + scatter
    const drawY = p.y - drift

    const alpha = (1 - particleProgress) * (p.a / 255)

    ctx.globalAlpha = alpha
    ctx.fillStyle = `rgb(${p.r}, ${p.g}, ${p.b})`
    ctx.fillRect(Math.round(drawX) * SCALE, Math.round(drawY) * SCALE, SCALE, SCALE)
  })
  ctx.restore()
}

function celebrateStage2(ctx, progress, tick) {
  const rippleIntensity = Math.sin(progress * Math.PI) * 0.35
  if (rippleIntensity > 0.01) {
    ctx.save()
    const rippleWidth = progress * W * 0.8
    const cx = 35 * SCALE
    const y = 47 * SCALE
    const grad = ctx.createRadialGradient(cx, y, 0, cx, y, rippleWidth * SCALE)
    grad.addColorStop(0, `rgba(200, 180, 100, ${rippleIntensity})`)
    grad.addColorStop(1, 'rgba(200, 180, 100, 0)')
    ctx.fillStyle = grad
    ctx.fillRect(0, 44 * SCALE, W * SCALE, 18 * SCALE)
    ctx.restore()
  }
}

function celebrateStage3(ctx, progress, tick) {
  if (progress > 0.3 && progress < 0.7) {
    const debrisProgress = (progress - 0.3) / 0.4
    ctx.save()
    const debrisPositions = [
      [32, 48], [33, 48], [34, 48], [37, 48], [38, 48], [39, 48]
    ]
    debrisPositions.forEach(([dx, dy], i) => {
      const rise = debrisProgress * (3 + Math.sin(i * 4) * 2)
      const scatter = Math.sin(i * 7) * debrisProgress * 2
      const alpha = 1 - debrisProgress
      ctx.globalAlpha = alpha
      ctx.fillStyle = C.b3
      ctx.fillRect(
        Math.round(dx + scatter) * SCALE,
        Math.round(dy - rise) * SCALE,
        SCALE, SCALE
      )
    })
    ctx.restore()
  }

  if (progress > 0.5) {
    const bloomProgress = (progress - 0.5) / 0.5
    ctx.save()
    ctx.globalAlpha = bloomProgress
    const flowers = [[7, 45], [14, 45], [48, 45], [57, 45]]
    flowers.forEach(([fx, fy], i) => {
      const threshold = 0.1 + i * 0.2
      if (bloomProgress > threshold) {
        ctx.fillStyle = i % 2 === 0 ? C.a1 : C.a2
        ctx.fillRect(fx * SCALE, fy * SCALE, SCALE, SCALE)
      }
    })
    ctx.restore()
  }
}

function celebrateStage4(ctx, progress, tick) {
  if (progress > 0.2) {
    const driftProgress = (progress - 0.2) / 0.8
    ctx.save()
    const seeds = [12, 25, 38, 45, 55, 63]
    seeds.forEach((sx, i) => {
      const startTime = i * 0.12
      if (driftProgress < startTime) return
      const p = Math.min((driftProgress - startTime) / 0.5, 1)
      const x = sx + Math.sin(tick / 20 + i) * 2
      const y = 5 + p * 40
      const alpha = p < 0.8 ? 0.6 : 0.6 * (1 - (p - 0.8) / 0.2)
      ctx.globalAlpha = alpha
      ctx.fillStyle = i % 2 === 0 ? C.a1 : C.a2
      ctx.fillRect(Math.round(x) * SCALE, Math.round(y) * SCALE, SCALE, SCALE)
    })
    ctx.restore()
  }

  if (progress > 0.3 && progress < 0.8) {
    const washProgress = (progress - 0.3) / 0.5
    const washAlpha = Math.sin(washProgress * Math.PI) * 0.15
    ctx.save()
    ctx.globalAlpha = washAlpha
    ctx.fillStyle = '#c8a84b'
    ctx.fillRect(25 * SCALE, 35 * SCALE, 20 * SCALE, 15 * SCALE)
    ctx.restore()
  }
}

function celebrateStage5(ctx, progress, tick, hour) {
  const auraPhase = progress < 0.4
    ? progress / 0.4
    : 1 - (progress - 0.4) / 0.6
  const auraRadius = 5 + auraPhase * 50
  const auraAlpha = auraPhase * 0.4

  if (auraAlpha > 0.01) {
    ctx.save()
    const grad = ctx.createRadialGradient(
      35 * SCALE, 42 * SCALE, 2 * SCALE,
      35 * SCALE, 42 * SCALE, auraRadius * SCALE
    )
    grad.addColorStop(0, `rgba(240, 255, 160, ${auraAlpha})`)
    grad.addColorStop(0.4, `rgba(200, 255, 100, ${auraAlpha * 0.5})`)
    grad.addColorStop(1, 'rgba(200, 255, 100, 0)')
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, W * SCALE, H * SCALE)
    ctx.restore()
  }

  if (progress > 0.5) {
    const ffProgress = (progress - 0.5) / 0.5
    const ffPositions = [[15, 35], [48, 38], [22, 42]]
    ctx.save()
    ffPositions.forEach(([fx, fy], i) => {
      const threshold = i * 0.25
      if (ffProgress > threshold) {
        const intensity = Math.min((ffProgress - threshold) / 0.2, 1)
        const pulse = 0.5 + 0.5 * Math.sin(tick / 15 + i * 2)
        ctx.globalAlpha = intensity * pulse
        ctx.fillStyle = C.f1
        ctx.fillRect(fx * SCALE, fy * SCALE, SCALE, SCALE)
        ctx.fillStyle = C.f2
        ctx.fillRect(fx * SCALE, (fy - 1) * SCALE, SCALE, SCALE)
      }
    })
    ctx.restore()
  }

  if ((hour >= 21 || hour < 6) && progress > 0.1 && progress < 0.6) {
    const starBoost = Math.sin(((progress - 0.1) / 0.5) * Math.PI) * 0.3
    ctx.save()
    ctx.globalAlpha = starBoost
    drawStars(ctx, tick)
    ctx.restore()
  }
}

function drawTransitionCelebration(ctx, fromStage, toStage, progress, tick, hour) {
  switch (toStage) {
    case 2: celebrateStage2(ctx, progress, tick); break
    case 3: celebrateStage3(ctx, progress, tick); break
    case 4: celebrateStage4(ctx, progress, tick); break
    case 5: celebrateStage5(ctx, progress, tick, hour); break
  }
}

export function drawTransition(ctx, fromStage, toStage, progress, health, tick, startedAt, frozenTick) {
  const hour = new Date().getHours()

  ctx.clearRect(0, 0, W * SCALE, H * SCALE)

  // Environment uses new stage so stage-gated elements appear; inTransition=true for clouds + bonus bird
  drawEnvironment(ctx, toStage, health, tick, true, hour)

  if (progress < PHASE.OLD_FADE) {
    ctx.save()
    const glowAlpha = Math.min(progress / PHASE.FLASH_PEAK, 1) * 0.6
    drawCreatureStage(ctx, fromStage, health, frozenTick, hour, startedAt)
    drawTransitionGlow(ctx, fromStage, glowAlpha, tick)
    ctx.restore()
  } else if (progress < PHASE.NEW_FADE_IN) {
    const dissolveProgress = (progress - PHASE.OLD_FADE) / (PHASE.NEW_FADE_IN - PHASE.OLD_FADE)
    drawDissolve(ctx, fromStage, health, dissolveProgress, tick, hour, startedAt, frozenTick)
    drawTransitionGlow(ctx, fromStage, 0.6 - dissolveProgress * 0.3, tick)
  } else if (progress < PHASE.NEW_SOLID) {
    const fadeProgress = (progress - PHASE.NEW_FADE_IN) / (PHASE.NEW_SOLID - PHASE.NEW_FADE_IN)
    ctx.save()
    ctx.globalAlpha = fadeProgress
    drawCreatureStage(ctx, toStage, health, frozenTick, hour, startedAt)
    ctx.restore()
    drawTransitionGlow(ctx, toStage, 0.3 + fadeProgress * 0.2, tick)
  } else {
    const settleProgress = (progress - PHASE.NEW_SOLID) / (PHASE.SETTLE - PHASE.NEW_SOLID)
    drawCreatureStage(ctx, toStage, health, frozenTick, hour, startedAt)
    drawTransitionGlow(ctx, toStage, 0.5 * (1 - settleProgress), tick)
  }

  drawTransitionCelebration(ctx, fromStage, toStage, progress, tick, hour)
}

// ── Main draw function ────────────────────────────────────

export function drawScene(ctx, stage, health, tick, hour = new Date().getHours(), startedAt = null, surfing = false, wiltProgress = 0, bloomPulse = 0) {
  ctx.clearRect(0, 0, W * SCALE, H * SCALE)
  drawEnvironment(ctx, stage, health, tick, false, hour, wiltProgress)
  drawCreatureStage(ctx, stage, health, tick, hour, startedAt, surfing, wiltProgress)

  // Bloom pulse — quiet sigh of relief when creature returns from wilt
  if (bloomPulse > 0) {
    ctx.save()
    const cx = 35 * SCALE, cy = 40 * SCALE
    const grad = ctx.createRadialGradient(cx, cy, 2 * SCALE, cx, cy, 18 * SCALE)
    grad.addColorStop(0, `rgba(200, 240, 160, ${bloomPulse * 0.18})`)
    grad.addColorStop(1, 'rgba(200, 240, 160, 0)')
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, W * SCALE, H * SCALE)
    ctx.restore()
  }
}
