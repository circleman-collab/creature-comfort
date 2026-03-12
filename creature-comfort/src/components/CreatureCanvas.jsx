import { memo, useEffect, useRef } from 'react'
import { drawScene, setScale, W, H } from '../utils/pixelRenderer'

const CreatureCanvas = memo(function CreatureCanvas({ stage, health, stageJustAdvanced }) {
  const canvasRef = useRef(null)
  const containerRef = useRef(null)
  const tickRef = useRef(0)
  const rafRef = useRef(null)
  const stageAdvancedRef = useRef(stageJustAdvanced)

  useEffect(() => {
    stageAdvancedRef.current = stageJustAdvanced
    if (stageJustAdvanced) {
      const t = setTimeout(() => { stageAdvancedRef.current = false }, 8000)
      return () => clearTimeout(t)
    }
  }, [stageJustAdvanced])

  useEffect(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return

    const availableWidth = container.offsetWidth
    const newScale = availableWidth >= 288 ? 4 : availableWidth >= 216 ? 3 : 2
    setScale(newScale)
    canvas.width = W * newScale
    canvas.height = H * newScale

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
    <div ref={containerRef} style={{ width: '100%' }}>
      <canvas
        ref={canvasRef}
        width={216}
        height={240}
        style={{
          width: '100%',
          height: 'auto',
          display: 'block',
          imageRendering: 'pixelated',
        }}
      />
    </div>
  )
})

export default CreatureCanvas
