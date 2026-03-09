import { useState } from 'react'
import './Onboarding.css'

const STEPS = ['name', 'why', 'mode', 'done']

export default function Onboarding({ onComplete }) {
  const [step, setStep] = useState(0)
  const [creatureName, setCreatureName] = useState('')
  const [intentionBig, setIntentionBig] = useState('')
  const [quitMode, setQuitMode] = useState('vaping')

  function next() {
    if (step < STEPS.length - 1) setStep(s => s + 1)
    else onComplete({ creatureName, intentionBig, quitMode })
  }

  function canAdvance() {
    if (STEPS[step] === 'name') return creatureName.trim().length > 0
    if (STEPS[step] === 'why') return intentionBig.trim().length > 0
    return true
  }

  return (
    <div className="onboarding">
      <div className="onboarding-inner">
        <div className="ob-step-label">
          {step + 1} / {STEPS.length}
        </div>

        {STEPS[step] === 'name' && (
          <div className="ob-block">
            <h1 className="ob-title">Name your<br />companion.</h1>
            <p className="ob-body prose">
              This creature will grow alongside you. It'll be here when it's hard, and it'll bloom when you do.
            </p>
            <input
              className="ob-input"
              type="text"
              placeholder="give them a name..."
              maxLength={18}
              value={creatureName}
              onChange={e => setCreatureName(e.target.value)}
              autoFocus
            />
          </div>
        )}

        {STEPS[step] === 'why' && (
          <div className="ob-block">
            <h1 className="ob-title">Why are<br />you doing this?</h1>
            <p className="ob-body prose">
              One honest reason. The real one. <em>{creatureName}</em> will remind you of this when it matters most.
            </p>
            <textarea
              className="ob-input ob-textarea"
              placeholder="I'm doing this because..."
              maxLength={120}
              value={intentionBig}
              onChange={e => setIntentionBig(e.target.value)}
            />
            <div className="ob-char-count">{intentionBig.length}/120</div>
          </div>
        )}

        {STEPS[step] === 'mode' && (
          <div className="ob-block">
            <h1 className="ob-title">What are<br />you quitting?</h1>
            <p className="ob-body prose">
              Be honest — you can change this later. There's no wrong answer.
            </p>
            <div className="ob-options">
              {[
                { id: 'vaping', label: 'Vaping', sub: 'Track vaping only' },
                { id: 'all', label: 'All nicotine', sub: 'Vaping, pouches, everything' },
                { id: 'transition', label: 'Transitioning', sub: 'Vaping → pouches → free' },
              ].map(opt => (
                <button
                  key={opt.id}
                  className={`ob-option ${quitMode === opt.id ? 'selected' : ''}`}
                  onClick={() => setQuitMode(opt.id)}
                >
                  <span className="ob-option-label">{opt.label}</span>
                  <span className="ob-option-sub prose">{opt.sub}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {STEPS[step] === 'done' && (
          <div className="ob-block">
            <h1 className="ob-title">Meet<br />{creatureName}.</h1>
            <p className="ob-body prose">
              They're small right now. A seedling, really.<br /><br />
              Every hour you give them is an hour they grow. They're rooting for you — literally.
            </p>
            <p className="ob-body prose" style={{opacity: 0.6, marginTop: '12px', fontSize: '14px'}}>
              If you slip, tell the app. Grace is built in. What matters is that you come back.
            </p>
          </div>
        )}

        <button
          className={`ob-next ${canAdvance() ? 'ready' : ''}`}
          onClick={canAdvance() ? next : undefined}
        >
          {STEPS[step] === 'done' ? `Start with ${creatureName}` : 'Continue →'}
        </button>

        {step > 0 && (
          <button className="ob-back" onClick={() => setStep(s => s - 1)}>← back</button>
        )}
      </div>
    </div>
  )
}
