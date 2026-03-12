// Pixel art renderer for the creature and environment
// All drawing is done on a 64x64 logical canvas, scaled up

import { HEALTH } from '../constants'

export let SCALE = 3 // renders at 256x384 display
export function setScale(n) { SCALE = n }
export const W = 72
export const H = 80

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
}

// ── Sprite definitions (64x64 grid, each cell = 1px) ─────
// Sprites are arrays of [x, y, color] draw commands
// We define the creature at each stage + health states

function px(x, y, col) { return [x, y, col] }

// ── Stage 1: Seedling (just a sprout) ────────────────────
export function drawStage1(ctx, health, tick) {
  const wilt = health < HEALTH.WILT_THRESHOLD
  const col = wilt ? C.w3 : C.g3
  const col2 = wilt ? C.w2 : C.g4
  const soil = C.b3

  // Soil mound
  fill(ctx, [[28,52],[29,52],[30,52],[31,52],[32,52],[33,52],[34,52],[35,52],
             [27,53],[28,53],[29,53],[30,53],[31,53],[32,53],[33,53],[34,53],[35,53],[36,53],
             [27,54],[28,54],[29,54],[30,54],[31,54],[32,54],[33,54],[34,54],[35,54],[36,54]], soil)

  // Stem
  fill(ctx, [[31,48],[31,49],[31,50],[31,51]], col)

  // Leaves
  if (!wilt) {
    fill(ctx, [[28,47],[29,47],[30,47]], col)  // left leaf
    fill(ctx, [[32,47],[33,47],[34,47]], col)  // right leaf
    fill(ctx, [[29,46],[30,46]], col2)
    fill(ctx, [[32,46],[33,46]], col2)
  } else {
    // drooping leaves
    fill(ctx, [[28,48],[29,48],[30,48]], col)
    fill(ctx, [[32,48],[33,48],[34,48]], col)
  }

  // Tiny bud
  const budBob = Math.floor(tick / 30) % 2 === 0 ? 0 : -1
  fill(ctx, [[30,45+budBob],[31,45+budBob],[32,45+budBob],
             [30,44+budBob],[31,44+budBob],[32,44+budBob]], wilt ? C.w3 : C.g4)
  // Eye (tiny)
  dot(ctx, 31, 45+budBob, C.e1)
}

// ── Stage 2: Sprout with eyes + root-feet ────────────────
export function drawStage2(ctx, health, tick) {
  const wilt = health < HEALTH.WILT_THRESHOLD
  const bob = Math.floor(tick / 40) % 2 === 0 ? 0 : -1
  const col = wilt ? C.w3 : C.g3
  const col2 = wilt ? C.w2 : C.g4

  // Root feet
  fill(ctx, [[32,54],[33,54],[34,54]], C.b3)
  fill(ctx, [[37,54],[38,54],[39,54]], C.b3)
  fill(ctx, [[31,53],[32,53],[33,53]], C.b4)
  fill(ctx, [[38,53],[39,53],[40,53]], C.b4)

  // Body
  fill(ctx, [
    [33,51],[34,51],[35,51],[36,51],[37,51],[38,51],
    [32,50],[33,50],[34,50],[35,50],[36,50],[37,50],[38,50],[39,50],
    [32,49+bob],[33,49+bob],[34,49+bob],[35,49+bob],[36,49+bob],[37,49+bob],[38,49+bob],[39,49+bob],
    [33,48+bob],[34,48+bob],[35,48+bob],[36,48+bob],[37,48+bob],[38,48+bob],
  ], col)

  // Leaf crown
  fill(ctx, [
    [32,47+bob],[33,47+bob],[34,47+bob],[35,47+bob],[36,47+bob],[37,47+bob],[38,47+bob],[39,47+bob],
    [33,46+bob],[34,46+bob],[35,46+bob],[36,46+bob],[37,46+bob],[38,46+bob],
    [34,45+bob],[35,45+bob],[36,45+bob],[37,45+bob],
  ], col2)

  // Eyes
  const eyeY = 49 + bob
  dot(ctx, 34, eyeY, C.e1)
  dot(ctx, 37, eyeY, C.e1)
  dot(ctx, 34, eyeY-1, C.e2)  // gleam
  dot(ctx, 37, eyeY-1, C.e2)

  // Wilt droop
  if (wilt) {
    fill(ctx, [[34,eyeY+1],[35,eyeY+1],[36,eyeY+1]], C.w2) // frown
  }
}

// ── Stage 3: Leafy creature, can hop ─────────────────────
export function drawStage3(ctx, health, tick) {
  const wilt = health < HEALTH.WILT_THRESHOLD
  const hop = Math.floor(tick / 25) % 8
  const yOff = hop < 2 ? -2 : hop < 4 ? -4 : hop < 6 ? -2 : 0
  const col = wilt ? C.w3 : C.g3
  const col2 = wilt ? C.w2 : C.g4
  const col3 = wilt ? C.w1 : C.g5

  const y = 50 + (wilt ? 0 : yOff)

  // Legs
  fill(ctx, [[33,y+4],[34,y+4],[33,y+5],[34,y+5]], C.b4)
  fill(ctx, [[37,y+4],[38,y+4],[37,y+5],[38,y+5]], C.b4)

  // Body
  fill(ctx, [
    [31,y+1],[32,y+1],[33,y+1],[34,y+1],[35,y+1],[36,y+1],[37,y+1],[38,y+1],[39,y+1],[40,y+1],
    [31,y],[32,y],[33,y],[34,y],[35,y],[36,y],[37,y],[38,y],[39,y],[40,y],
    [32,y-1],[33,y-1],[34,y-1],[35,y-1],[36,y-1],[37,y-1],[38,y-1],[39,y-1],
    [33,y-2],[34,y-2],[35,y-2],[36,y-2],[37,y-2],[38,y-2],
  ], col)

  // Leaf ears/crown
  fill(ctx, [
    [31,y-2],[32,y-2],[32,y-3],[33,y-3],[33,y-4],[34,y-4],  // left ear
    [37,y-4],[38,y-4],[38,y-3],[39,y-3],[39,y-2],[40,y-2],  // right ear
    [34,y-3],[35,y-3],[36,y-3],[37,y-3],                    // crown
    [34,y-4],[35,y-4],[36,y-4],[37,y-4],
  ], col2)

  // Highlights
  fill(ctx, [[34,y-1],[35,y-1],[36,y-1],[37,y-1]], col3)

  // Eyes
  dot(ctx, 34, y, C.e1)
  dot(ctx, 37, y, C.e1)
  dot(ctx, 34, y-1, C.e2)
  dot(ctx, 37, y-1, C.e2)

  // Arms/leaf tendrils
  fill(ctx, [[29,y],[30,y],[29,y+1]], col2)
  fill(ctx, [[41,y],[42,y],[42,y+1]], col2)

  if (wilt) {
    fill(ctx, [[34,y+1],[35,y+1],[36,y+1]], C.w2)
  } else {
    // tiny smile
    fill(ctx, [[34,y+1],[37,y+1]], col3)
  }
}

// ── Stage 4: Fur growing through leaves ──────────────────
export function drawStage4(ctx, health, tick) {
  const wilt = health < HEALTH.WILT_THRESHOLD
  const breathe = Math.floor(tick / 50) % 2 === 0 ? 0 : -1
  const col = wilt ? C.w3 : C.g3
  const fur = wilt ? C.w2 : C.b4
  const leaf = wilt ? C.w2 : C.g4
  const glow = C.a1

  const y = 46 + breathe

  // Tail
  fill(ctx, [[40,y+6],[41,y+6],[42,y+5],[42,y+4],[41,y+3]], fur)

  // Legs
  fill(ctx, [[30,y+8],[31,y+8],[30,y+9],[31,y+9]], fur)
  fill(ctx, [[37,y+8],[38,y+8],[37,y+9],[38,y+9]], fur)

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

  // Glowing eye
  dot(ctx, 32, y+3, C.e1)
  dot(ctx, 35, y+3, C.e1)
  dot(ctx, 32, y+2, glow)
  dot(ctx, 35, y+2, glow)

  if (!wilt) {
    // nose glint
    dot(ctx, 33, y+4, C.a2)
    dot(ctx, 34, y+4, C.a2)
  }
}

// ── Stage 5: Full animal, glowing, lush ──────────────────
export function drawStage5(ctx, health, tick) {
  const breathe = Math.floor(tick / 60) % 2
  const y = 42 + breathe
  const fur = C.g3
  const leaf = C.g5
  const glow = C.a2
  const gleam = C.a3

  // Aura
  const auraAlpha = 0.18 + 0.08 * Math.sin(tick / 30)
  ctx.save()
  const grad = ctx.createRadialGradient(36*SCALE, (y+4)*SCALE, 2*SCALE, 36*SCALE, (y+4)*SCALE, 14*SCALE)
  grad.addColorStop(0, `rgba(200, 255, 100, ${auraAlpha})`)
  grad.addColorStop(1, 'rgba(200,255,100,0)')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, W * SCALE, H * SCALE)
  ctx.restore()

  // Tail (bushy)
  fill(ctx, [
    [41,y+8],[42,y+8],[43,y+7],[44,y+6],[44,y+5],[43,y+4],[42,y+4],
    [42,y+7],[43,y+6],[43,y+5],
  ], leaf)

  // Legs
  fill(ctx, [[30,y+10],[31,y+10],[30,y+11],[31,y+11]], fur)
  fill(ctx, [[38,y+10],[39,y+10],[38,y+11],[39,y+11]], fur)

  // Body
  const body = []
  for (let bx = 29; bx <= 41; bx++) for (let by = y+4; by <= y+9; by++) body.push([bx,by])
  fill(ctx, body, fur)

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

  // Glowing eyes
  dot(ctx, 33, y+4, C.e1)
  dot(ctx, 36, y+4, C.e1)
  dot(ctx, 33, y+3, glow)
  dot(ctx, 36, y+3, glow)
  dot(ctx, 33, y+2, gleam)
  dot(ctx, 36, y+2, gleam)

  // Nose
  fill(ctx, [[34,y+5],[35,y+5]], glow)

  // Smile
  fill(ctx, [[33,y+6],[34,y+6],[35,y+6],[36,y+6]], leaf)
}

// ── Environment layers ────────────────────────────────────

function getSkyColors(stage, hour) {
  const times = {
    night:   ['#0a0c1a', '#0f1028'],
    dawn:    ['#1a1030', '#2e1a3a'],
    morning: ['#1a2848', '#2a4060'],
    day:     ['#1e3858', '#3a6070'],
    dusk:    ['#2a1828', '#3a2040'],
    evening: ['#140e22', '#1e1430'],
  }
  let base
  if (hour >= 22 || hour < 5)  base = times.night
  else if (hour < 7)            base = times.dawn
  else if (hour < 10)           base = times.morning
  else if (hour < 16)           base = times.day
  else if (hour < 19)           base = times.dusk
  else                          base = times.evening

  const stageTint = (stage - 1) * 0.04
  return base
}

export function drawEnvironment(ctx, stage, health, tick, stageJustAdvanced = false, hour = new Date().getHours()) {
  const wilt = health < HEALTH.WILT_THRESHOLD

  // ── Sky gradient (time-of-day aware) ─────────────────
  const [skyTop, skyBot] = getSkyColors(stage, hour)
  const skyGrad = ctx.createLinearGradient(0, 0, 0, 56 * SCALE)
  skyGrad.addColorStop(0, skyTop)
  skyGrad.addColorStop(1, skyBot)
  ctx.fillStyle = skyGrad
  ctx.fillRect(0, 0, W * SCALE, 56 * SCALE)

  // ── Ground fill (below horizon) ───────────────────────
  ctx.fillStyle = '#221408'
  ctx.fillRect(0, 56 * SCALE, W * SCALE, (H - 56) * SCALE)

  // ── Clouds ─────────────────────────────────────────────
  if (!wilt) {
    const cloudAlpha = [0.18, 0.24, 0.28, 0.34, 0.40][stage - 1]
    drawClouds(ctx, tick, cloudAlpha, stageJustAdvanced)
  }

  // ── Horizon line (sky meets earth) ────────────────────
  // Subtle lighter band at y=55 — the seam between worlds
  const horizonCol = wilt ? '#2a1a0a' : '#5a3418'
  fill(ctx, Array.from({length: W}, (_, x) => [x, 55]), horizonCol)

  // ── Ground surface ────────────────────────────────────
  const groundY = 56
  fill(ctx, Array.from({length: W}, (_, x) => [x, groundY]),   wilt ? C.b2 : '#4e2c14')
  fill(ctx, Array.from({length: W}, (_, x) => [x, groundY+1]), wilt ? C.b1 : '#341a0a')
  fill(ctx, Array.from({length: W}, (_, x) => [x, groundY+2]), '#221408')
  for (let dy = 3; dy <= H - groundY - 1; dy++) {
    fill(ctx, Array.from({length: W}, (_, x) => [x, groundY + dy]), '#221408')
  }

  // ── Grass tufts (stage 2+) ────────────────────────────
  if (stage >= 2) {
    const grassCol = wilt ? C.w3 : C.g3
    const tufts = [[5,55],[8,55],[12,55],[18,55],[45,55],[50,55],[55,55],[60,55]]
    fill(ctx, tufts, grassCol)
    if (!wilt) fill(ctx, [[6,54],[7,54],[11,54],[13,54],[46,54],[51,54],[56,54],[59,54]], C.g4)
  }

  // ── Wildflowers (stage 3+) ────────────────────────────
  if (stage >= 3 && !wilt) {
    fill(ctx, [[7,54],[14,54],[48,54],[57,54]], C.a1)
    fill(ctx, [[7,53],[14,53],[48,53],[57,53]], C.a2)
  }

  // ── Trees (stage 3+) ──────────────────────────────────
  if (stage >= 3) {
    drawTree(ctx, 8, 40, wilt, stage)
    drawTree(ctx, 52, 38, wilt, stage)
  }

  // ── Background trees (stage 4+) ───────────────────────
  if (stage >= 4) {
    drawTree(ctx, 2, 46, wilt, stage, true)
    drawTree(ctx, 58, 44, wilt, stage, true)
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

  // ── Ambient: bird (stage 2+, no wilt) ────────────────
  if (stage >= 2 && !wilt) {
    drawBird(ctx, tick, false)
    // Bonus bird on stage advance
    if (stageJustAdvanced) drawBird(ctx, tick + 180, true)
  }

  // ── Ambient: falling leaf (stage 3+, no wilt) ────────
  if (stage >= 3 && !wilt) {
    drawLeaf(ctx, tick)
  }

  // ── Wilt: rain ────────────────────────────────────────
  if (wilt) {
    drawRain(ctx, tick)
    ctx.save()
    ctx.globalAlpha = 0.15
    ctx.fillStyle = '#4a3010'
    ctx.fillRect(0, 0, W * SCALE, H * SCALE)
    ctx.restore()
  }
}

// ── Clouds ────────────────────────────────────────────────
// Three clouds, each a cluster of pixel rects drifting at different speeds
function drawClouds(ctx, tick, alpha, stageJustAdvanced) {
  ctx.save()
  ctx.globalAlpha = stageJustAdvanced ? Math.min(alpha * 1.8, 0.5) : alpha

  const clouds = [
    { shape: [[0,0],[1,0],[2,0],[3,0],[1,-1],[2,-1]], speed: 0.012, offset: 0,  y: 8  },
    { shape: [[0,0],[1,0],[2,0],[3,0],[4,0],[1,-1],[2,-1],[3,-1]], speed: 0.007, offset: 25, y: 14 },
    { shape: [[0,0],[1,0],[2,0],[1,-1]], speed: 0.018, offset: 45, y: 6  },
  ]

  clouds.forEach(({ shape, speed, offset, y }) => {
    const xBase = ((tick * speed + offset) % (W + 10)) - 6
    ctx.fillStyle = '#c8d4e0'
    shape.forEach(([dx, dy]) => {
      const px = Math.floor(xBase + dx)
      const py = y + dy
      if (px >= 0 && px < W) {
        ctx.fillRect(px * SCALE, py * SCALE, SCALE, SCALE)
      }
    })
  })

  ctx.restore()
}

// ── Bird ──────────────────────────────────────────────────
// Simple 3-pixel V silhouette crossing the upper sky
function drawBird(ctx, tick, offset = false) {
  const cycleLen = 460
  const startOffset = offset ? 200 : 0
  const pos = (tick + startOffset) % (cycleLen + W + 10)
  if (pos > cycleLen) return // bird is off-screen / resting

  const x = Math.floor((pos / cycleLen) * (W + 10)) - 5
  const y = offset ? 12 : 8

  if (x < 0 || x > W - 2) return

  ctx.fillStyle = '#0a0e18'
  // V shape: two diagonal wings
  ctx.fillRect((x)   * SCALE, (y)   * SCALE, SCALE, SCALE)
  ctx.fillRect((x+1) * SCALE, (y+1) * SCALE, SCALE, SCALE)
  ctx.fillRect((x+2) * SCALE, (y)   * SCALE, SCALE, SCALE)
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
function drawRain(ctx, tick) {
  ctx.save()
  ctx.globalAlpha = 0.25
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

function drawTree(ctx, x, baseY, wilt, stage, bg = false) {
  const trunk = C.b3
  const leaf = wilt ? C.w3 : (stage >= 5 ? C.g4 : C.g3)
  const leaf2 = wilt ? C.w2 : C.g5
  const alpha = bg ? 0.5 : 1

  ctx.save()
  ctx.globalAlpha = alpha

  // Trunk
  fill(ctx, [[x,baseY+6],[x,baseY+7],[x,baseY+8],[x+1,baseY+6],[x+1,baseY+7],[x+1,baseY+8]], trunk)

  // Canopy
  fill(ctx, [
    [x-1,baseY+4],[x,baseY+4],[x+1,baseY+4],[x+2,baseY+4],
    [x-2,baseY+3],[x-1,baseY+3],[x,baseY+3],[x+1,baseY+3],[x+2,baseY+3],[x+3,baseY+3],
    [x-1,baseY+2],[x,baseY+2],[x+1,baseY+2],[x+2,baseY+2],
    [x,baseY+1],[x+1,baseY+1],
  ], leaf)

  if (!wilt && stage >= 4) {
    fill(ctx, [[x,baseY+2],[x+1,baseY+2],[x,baseY+3],[x+1,baseY+3]], leaf2)
  }

  ctx.restore()
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

// ── Main draw function ────────────────────────────────────

export function drawScene(ctx, stage, health, tick, stageJustAdvanced = false, hour = new Date().getHours()) {
  ctx.clearRect(0, 0, W * SCALE, H * SCALE)
  drawEnvironment(ctx, stage, health, tick, stageJustAdvanced, hour)

  switch (stage) {
    case 1: drawStage1(ctx, health, tick); break
    case 2: drawStage2(ctx, health, tick); break
    case 3: drawStage3(ctx, health, tick); break
    case 4: drawStage4(ctx, health, tick); break
    case 5: drawStage5(ctx, health, tick); break
  }
}
