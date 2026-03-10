import { useMemo } from 'react'
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

export default function Journal({ state }) {
  // Newest first
  const entries = useMemo(
    () => [...(state.journalEntries || [])].reverse(),
    [state.journalEntries]
  )

  return (
    <div className="journal">
      <div className="journal-header">
        <div className="journal-title">{state.creatureName}</div>
        <div className="journal-subtitle">a journal</div>
      </div>

      <div className="journal-entries scroll">
        {entries.length === 0 && (
          <div className="journal-empty">
            <div className="journal-empty-icon">✦</div>
            <div className="journal-empty-text prose">
              The journal is empty.
              <br />
              {state.creatureName} is watching, and will write when there's something to say.
            </div>
          </div>
        )}

        {entries.map((entry, i) => (
          <div key={entry.id} className="journal-entry">
            <div className="je-meta">
              <span className="je-date">{formatJournalDate(entry.ts, state.startedAt)}</span>
              <span className="je-badges">
                <span className="je-stage">{STAGE_NAMES[entry.stage]}</span>
                {TRIGGER_LABELS[entry.trigger] && (
                  <span className="je-trigger">{TRIGGER_LABELS[entry.trigger]}</span>
                )}
              </span>
            </div>
            <div className="je-text prose">{entry.text}</div>
            {i < entries.length - 1 && <div className="je-divider" />}
          </div>
        ))}

        <div style={{ height: 32 }} />
      </div>
    </div>
  )
}
