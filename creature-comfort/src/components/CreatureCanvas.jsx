import { memo, useEffect, useRef } from 'react'
import { drawScene, SCALE, W, H } from '../utils/pixelRenderer'

const CANVAS_W = W * SCALE  // 256px
const CANVAS_H = H * SCALE  // 384px

// memo: skip re-render unless stage or health actually change
const CreatureCanvas = memo(function CreatureCanvas({ stage, health, stageJustAdvanced }) {
  const canvasRef = useRef(null)
  const tickRef = useRef(0)
  const rafRef = useRef(null)
  const stageAdvancedRef = useRef(stageJustAdvanced)

  // Track stageJustAdvanced without restarting the loop
  useEffect(() => {
    stageAdvancedRef.current = stageJustAdvanced
    if (stageJustAdvanced) {
      // Clear the flag after one full bird-cycle window (~500 ticks at 60fps ≈ 8s)
      const t = setTimeout(() => { stageAdvancedRef.current = false }, 8000)
      return () => clearTimeout(t)
    }
  }, [stageJustAdvanced])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    ctx.imageSmoothingEnabled = false

    let running = true

    function loop() {
      if (!running) return
      tickRef.current++
      drawScene(ctx, stage, health, tickRef.current, stageAdvancedRef.current, new Date().getHours())
      rafRef.current = requestAnimationFrame(loop)
    }

    loop()
    return () => {
      running = false
      cancelAnimationFrame(rafRef.current)
    }
  }, [stage, health])

  return (
    <canvas
      ref={canvasRef}
      width={CANVAS_W}
      height={CANVAS_H}
      style={{
        width: '100%',
        height: 'auto',
        display: 'block',
        imageRendering: 'pixelated',
      }}
    />
  )
})

export default CreatureCanvas
