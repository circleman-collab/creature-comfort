import { memo, useEffect, useRef } from 'react'
import { drawScene, SCALE } from '../utils/pixelRenderer'

const SIZE = 64 * SCALE // 256px

// memo: skip re-render unless stage or health actually change
const CreatureCanvas = memo(function CreatureCanvas({ stage, health }) {
  const canvasRef = useRef(null)
  const tickRef = useRef(0)
  const rafRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    ctx.imageSmoothingEnabled = false

    let running = true

    function loop() {
      if (!running) return
      tickRef.current++
      drawScene(ctx, stage, health, tickRef.current)
      rafRef.current = requestAnimationFrame(loop)
    }

    loop()
    return () => {
      running = false
      cancelAnimationFrame(rafRef.current)
    }
  }, [stage, health]) // reacting intentionally excluded — it never affected drawing logic

  return (
    <canvas
      ref={canvasRef}
      width={SIZE}
      height={SIZE}
      style={{
        width: SIZE,
        height: SIZE,
        display: 'block',
        imageRendering: 'pixelated',
      }}
    />
  )
})

export default CreatureCanvas
