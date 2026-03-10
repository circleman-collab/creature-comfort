import { useState, useMemo, useEffect } from 'react'
import { STAGE_NAMES } from '../constants'
import { TRIGGER_LABELS } from '../data/journal'
import './Journal.css'

function formatJournalDate(ts, startedAt) {
  const dayNum = startedAt
    ? Math.floor((ts - startedAt) / 86400000) + 1
    : null
  const time = new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  return dayNum != null ? `day ${dayNum} · ${time}` : time
}

const USER_PROMPTS = [
  '',
  'something happened today.',
  'what are you carrying right now?',
  'say the thing.',
  'what do you know today?',
  'how does it feel to still be here?',
]

export default function Journal({ state, update }) {
  const [flipped, setFlipped] = useState(false)
  const [draft, setDraft] = useState('')

  const creatureEntries = useMemo(
    () => [...(state.journalEntries || [])].reverse(),
    [state.journalEntries]
  )

  const userEntries = useMemo(
    () => [...(state.userJournalEntries || [])].reverse(),
    [state.userJournalEntries]
  )

  const userPrompt = USER_PROMPTS[state.stage] || 'something happened today.'

  // Temporarily lift overflow on .app-content during the flip to avoid 3D clipping
  useEffect(() => {
    const el = document.querySelector('.app-content')
    if (!el) return
    el.classList.add('journal-flipping')
    const t = setTimeout(() => el.classList.remove('journal-flipping'), 650)
    return () => clearTimeout(t)
  }, [flipped])

  function handleSave() {
    const text = draft.trim()
    if (!text) return
    const entry = { id: Date.now(), ts: Date.now(), text }
    update(prev => ({
      ...prev,
      userJournalEntries: [entry, ...(prev.userJournalEntries || [])],
      hasWrittenFirstEntry: true,
    }))
    setDraft('')
  }

  function handleKeyDown(e) {
    // Cmd+Enter or Ctrl+Enter to save
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault()
      handleSave()
    }
  }

  return (
    <div className="journal">
      <div className={`journal-book ${flipped ? 'flipped' : ''}`}>

        {/* ── Side A: User's journal ── */}
        <div className="journal-side journal-side-user">
          <div className="journal-header">
            <div className="journal-title prose">what's on your mind</div>
            <div className="journal-subtitle">your journal</div>
          </div>

          <div className="journal-compose">
            <textarea
              className="journal-input prose"
              placeholder={userPrompt}
              value={draft}
              onChange={e => setDraft(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            <button
              className="journal-save"
              onClick={handleSave}
              disabled={!draft.trim()}
            >
              keep it
            </button>
          </div>

          <div className="journal-entries scroll">
            {userEntries.length === 0 && (
              <div className="journal-empty">
                <div className="journal-empty-icon">✦</div>
                <div className="journal-empty-text prose">
                  Nothing written yet.
                  <br />
                  This is yours.
                </div>
              </div>
            )}

            {userEntries.map((entry, i) => (
              <div key={entry.id} className="journal-entry">
                <div className="je-meta">
                  <span className="je-date">
                    {formatJournalDate(entry.ts, state.startedAt)}
                  </span>
                </div>
                <div className="je-text je-text-user prose">{entry.text}</div>
                {i < userEntries.length - 1 && <div className="je-divider" />}
              </div>
            ))}

            <div style={{ height: 32 }} />
          </div>

          {/* Discovery tab — appears after first entry, pulses until tapped */}
          {state.hasWrittenFirstEntry && (
            <div
              className={`journal-tab journal-tab-right ${!flipped ? 'pulse' : ''}`}
              onClick={() => setFlipped(true)}
              aria-label="Open creature's journal"
            />
          )}
        </div>

        {/* ── Side B: Creature's journal ── */}
        <div className="journal-side journal-side-creature">
          <div className="journal-header">
            <div className="journal-title">{state.creatureName}</div>
            <div className="journal-subtitle">a journal</div>
          </div>

          <div className="journal-entries scroll">
            {creatureEntries.length === 0 && (
              <div className="journal-empty">
                <div className="journal-empty-icon">✦</div>
                <div className="journal-empty-text prose">
                  {state.creatureName} is watching,
                  <br />
                  and will write when there's something to say.
                </div>
              </div>
            )}

            {creatureEntries.map((entry, i) => (
              <div key={entry.id} className="journal-entry">
                <div className="je-meta">
                  <span className="je-date">
                    {formatJournalDate(entry.ts, state.startedAt)}
                  </span>
                  <span className="je-badges">
                    <span className="je-stage">{STAGE_NAMES[entry.stage]}</span>
                    {TRIGGER_LABELS[entry.trigger] && (
                      <span className="je-trigger">{TRIGGER_LABELS[entry.trigger]}</span>
                    )}
                  </span>
                </div>
                <div className="je-text je-text-creature prose">{entry.text}</div>
                {i < creatureEntries.length - 1 && <div className="je-divider" />}
              </div>
            ))}

            <div style={{ height: 32 }} />
          </div>

          {/* Tab to flip back */}
          <div
            className="journal-tab journal-tab-left"
            onClick={() => setFlipped(false)}
            aria-label="Return to your journal"
          />
        </div>

      </div>
    </div>
  )
}
