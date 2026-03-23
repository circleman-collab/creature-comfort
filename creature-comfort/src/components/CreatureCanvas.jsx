import { memo, useEffect, useRef } from 'react'
import { drawScene, drawTransition, clearDissolveCache, setScale, W, H, TRANSITION_DURATION } from '../utils/pixelRenderer'

const CreatureCanvas = memo(function CreatureCanvas({ stage, health, transitionInfo, onTransitionComplete, startedAt, surfing = false }) {
  const canvasRef = useRef(null)
  const containerRef = useRef(null)
  const tickRef = useRef(0)
  const rafRef = useRef(null)
  const transitionRef = useRef(null) // { fromStage, toStage, startTick }
  const onCompleteRef = useRef(onTransitionComplete)

  useEffect(() => { onCompleteRef.current = onTransitionComplete }, [onTransitionComplete])

  // When transitionInfo arrives, capture the start tick
  useEffect(() => {
    if (transitionInfo) {
      transitionRef.current = {
        ...transitionInfo,
        startTick: tickRef.current,
      }
    }
  }, [transitionInfo])

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

      const t = transitionRef.current
      if (t) {
        const elapsed = tickRef.current - t.startTick
        const progress = elapsed / TRANSITION_DURATION
        if (progress >= 1) {
          transitionRef.current = null
          clearDissolveCache()
          onCompleteRef.current?.()
          drawScene(ctx, stage, health, tickRef.current, new Date().getHours(), startedAt, surfing)
        } else {
          drawTransition(ctx, t.fromStage, t.toStage, progress, health, tickRef.current, startedAt, t.startTick)
        }
      } else {
        drawScene(ctx, stage, health, tickRef.current, new Date().getHours(), startedAt, surfing)
      }

      rafRef.current = requestAnimationFrame(loop)
    }
    loop()

    return () => {
      running = false
      cancelAnimationFrame(rafRef.current)
    }
  }, [stage, health, startedAt])
  // NOTE: onTransitionComplete deliberately excluded from deps — stored in onCompleteRef instead.

  return (
    <div ref={containerRef} style={{ width: '100%' }}>
      <canvas
        ref={canvasRef}
        width={W * 3}
        height={H * 3}
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
