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
  const [userPage, setUserPage] = useState(0)
  const [creaturePage, setCreaturePage] = useState(0)

  const USER_PER_PAGE = 3
  const CREATURE_PER_PAGE = 3

  const creatureEntries = useMemo(
    () => [...(state.journalEntries || [])].sort((a, b) => b.ts - a.ts),
    [state.journalEntries]
  )

  const userEntries = useMemo(
    () => [...(state.userJournalEntries || [])].sort((a, b) => b.ts - a.ts),
    [state.userJournalEntries]
  )

  const userPrompt = USER_PROMPTS[state.stage] || 'something happened today.'

  useEffect(() => { setUserPage(0) }, [userEntries.length])
  useEffect(() => { setCreaturePage(0) }, [creatureEntries.length])

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

  const userPageCount = Math.max(1, Math.ceil(userEntries.length / USER_PER_PAGE))
  const userPageEntries = userEntries.slice(userPage * USER_PER_PAGE, userPage * USER_PER_PAGE + USER_PER_PAGE)

  const creaturePageCount = Math.max(1, Math.ceil(creatureEntries.length / CREATURE_PER_PAGE))
  const creaturePageEntries = creatureEntries.slice(creaturePage * CREATURE_PER_PAGE, creaturePage * CREATURE_PER_PAGE + CREATURE_PER_PAGE)

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

            {userPageEntries.map((entry, i) => (
              <div key={entry.id} className="journal-entry">
                <div className="je-meta">
                  <span className="je-date">
                    {formatJournalDate(entry.ts, state.startedAt)}
                  </span>
                </div>
                <div className="je-text je-text-user prose">{entry.text}</div>
                {i < userPageEntries.length - 1 && <div className="je-divider" />}
              </div>
            ))}
          </div>

          {userEntries.length > 0 && (
            <div className="journal-pagination">
              <button
                className="journal-page-btn"
                onClick={() => setUserPage(p => Math.max(0, p - 1))}
                disabled={userPage === 0}
              >←</button>
              <span className="journal-page-count">{userPage + 1} / {userPageCount}</span>
              <button
                className="journal-page-btn"
                onClick={() => setUserPage(p => Math.min(userPageCount - 1, p + 1))}
                disabled={userPage === userPageCount - 1}
              >→</button>
            </div>
          )}

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

            {creaturePageEntries.map((entry, i) => (
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
                {i < creaturePageEntries.length - 1 && <div className="je-divider" />}
              </div>
            ))}
          </div>

          {creatureEntries.length > 0 && (
            <div className="journal-pagination">
              <button
                className="journal-page-btn"
                onClick={() => setCreaturePage(p => Math.max(0, p - 1))}
                disabled={creaturePage === 0}
              >←</button>
              <span className="journal-page-count">{creaturePage + 1} / {creaturePageCount}</span>
              <button
                className="journal-page-btn"
                onClick={() => setCreaturePage(p => Math.min(creaturePageCount - 1, p + 1))}
                disabled={creaturePage === creaturePageCount - 1}
              >→</button>
            </div>
          )}

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
