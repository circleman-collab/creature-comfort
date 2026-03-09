import { useState, useMemo } from 'react'
import {
  getMsSinceLastUse, formatDuration, getTodayStats,
  getAllStats, sameDay, getDaysSinceLastUse
} from '../hooks/useStore'
import { EVENT } from '../constants'
import './Stats.css'

const FAREWELL_MESSAGES = [
  'New roots grow stronger.',
  'Every beginning is brave.',
  'We\'ll find each other again.',
  'The forest remembers.',
  'It\'s okay. We\'ll start again, together.',
]

export default function Stats({ state, onReset }) {
  const [tab, setTab] = useState('today')
  const [resetStep, setResetStep] = useState(0)
  const [farewellMsg, setFarewellMsg] = useState('')

  const todayStats = useMemo(() => getTodayStats(state.events), [state.events])
  const allStats   = useMemo(() => getAllStats(state.events), [state.events])
  const msSinceUse = useMemo(() => getMsSinceLastUse(state.events), [state.events])
  const usedEvents = useMemo(
    () => state.events.filter(e => e.type === EVENT.USED),
    [state.events]
  )

  const eventsByDay = useMemo(() => {
    if (tab !== 'log') return null
    const map = {}
    ;[...state.events].reverse().forEach(e => {
      const d = new Date(e.ts)
      const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
      if (!map[key]) map[key] = []
      map[key].push(e)
    })
    return map
  }, [state.events, tab])

  const resistRatio = (todayStats.uses + todayStats.resisted) > 0
    ? Math.round((todayStats.resisted / (todayStats.uses + todayStats.resisted)) * 100)
    : null

  function beginReset() {
    setFarewellMsg(FAREWELL_MESSAGES[Math.floor(Math.random() * FAREWELL_MESSAGES.length)])
    setResetStep(1)
  }

  return (
    <div className="stats">
      <div className="stats-tabs">
        {['today', 'all time', 'log'].map(t => (
          <button
            key={t}
            className={`stats-tab ${tab === t ? 'active' : ''}`}
            onClick={() => setTab(t)}
          >{t}</button>
        ))}
      </div>

      <div className="stats-content scroll">
        {tab === 'today' && (
          <div className="stats-panel">
            <div className="stat-row">
              <div className="stat-card">
                <div className="sc-label">Used</div>
                <div className="sc-value red">{todayStats.uses}</div>
              </div>
              <div className="stat-card">
                <div className="sc-label">Resisted</div>
                <div className="sc-value green">{todayStats.resisted}</div>
              </div>
            </div>

            {resistRatio !== null && (
              <div className="stat-full-card">
                <div className="sc-label">Resistance rate</div>
                <div className="sc-value-lg">{resistRatio}%</div>
                <div className="sc-bar">
                  <div className="sc-bar-fill" style={{width: `${resistRatio}%`}} />
                </div>
                <div className="sc-sub prose">
                  {todayStats.resisted} resisted out of {todayStats.uses + todayStats.resisted} cravings
                </div>
              </div>
            )}

            <div className="stat-full-card">
              <div className="sc-label">Time since last use</div>
              <div className="sc-value-lg">{formatDuration(msSinceUse, true)}</div>
            </div>

            <div className="stat-full-card">
              <div className="sc-label">Stage</div>
              <div className="sc-value-lg">{state.stage} / 5</div>
              <div className="sc-sub prose">{state.creatureName} is {
                ['', 'just a seedling', 'finding their feet', 'wandering the forest',
                 'nearly in full bloom', 'radiant and thriving'][state.stage]
              }</div>
            </div>
          </div>
        )}

        {tab === 'all time' && (
          <div className="stats-panel">
            <div className="stat-row">
              <div className="stat-card">
                <div className="sc-label">Total uses</div>
                <div className="sc-value red">{allStats.totalUses}</div>
              </div>
              <div className="stat-card">
                <div className="sc-label">Total resisted</div>
                <div className="sc-value green">{allStats.totalResisted}</div>
              </div>
            </div>

            <div className="stat-full-card">
              <div className="sc-label">Longest clean stretch</div>
              <div className="sc-value-lg">{
                state.bestStreakMs > 0 ? formatDuration(state.bestStreakMs, true) : '—'
              }</div>
            </div>

            <div className="stat-full-card">
              <div className="sc-label">Longest gap between uses</div>
              <div className="sc-value-lg">{
                allStats.longestGapMs > 0 ? formatDuration(allStats.longestGapMs, true) : '—'
              }</div>
            </div>

            <div className="stat-full-card">
              <div className="sc-label">Craving surfs completed</div>
              <div className="sc-value-lg">{allStats.totalSurfed}</div>
              <div className="sc-sub prose">
                Each one is 90 seconds you chose {state.creatureName} over nicotine.
              </div>
            </div>

            <div className="stat-full-card">
              <div className="sc-label">Journey started</div>
              <div className="sc-value-lg">{
                state.startedAt
                  ? new Date(state.startedAt).toLocaleDateString([], {month:'short', day:'numeric', year:'numeric'})
                  : '—'
              }</div>
            </div>

            {/* Reset — separated from stats, at the bottom */}
            <div className="reset-section">
              {resetStep === 0 ? (
                <button className="btn-reset" onClick={beginReset}>
                  Reset everything
                </button>
              ) : (
                <div className="reset-confirm">
                  <div className="reset-farewell prose">"{farewellMsg}"</div>
                  <div className="reset-sub">This will erase all progress.</div>
                  <div className="reset-btns">
                    <button className="btn-pixel danger" onClick={onReset}>
                      Yes, start over
                    </button>
                    <button className="btn-reset-cancel" onClick={() => setResetStep(0)}>
                      Never mind
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {tab === 'log' && (
          <div className="log-panel">
            {eventsByDay && Object.keys(eventsByDay).length === 0 && (
              <div className="log-empty prose">No events yet. Start logging from the home screen.</div>
            )}
            {eventsByDay && Object.entries(eventsByDay).map(([day, events]) => {
              const ts = events[0].ts
              const isToday = sameDay(ts, Date.now())
              const isYesterday = sameDay(ts, Date.now() - 86400000)
              const label = isToday ? 'Today' : isYesterday ? 'Yesterday'
                : new Date(ts).toLocaleDateString([], {weekday:'short', month:'short', day:'numeric'})
              return (
                <div key={day} className="log-group">
                  <div className="log-day-header">{label}</div>
                  {events.map(e => {
                    const t = new Date(e.ts)
                    const timeStr = t.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})
                    const usedIdx = usedEvents.findIndex(u => u.ts === e.ts)
                    const gap = (e.type === EVENT.USED && usedIdx > 0)
                      ? formatDuration(e.ts - usedEvents[usedIdx-1].ts, true)
                      : null

                    return (
                      <div key={e.id || e.ts} className="log-item">
                        <div className={`log-dot ${e.type}`} />
                        <div className="log-item-text">
                          <div className="log-item-type pixel">
                            {e.type === EVENT.USED ? 'Used'
                              : e.type === EVENT.CRAVING_SURFED ? 'Surfed craving'
                              : 'Resisted'}
                          </div>
                          {gap && <div className="log-item-gap prose">{gap} since last</div>}
                        </div>
                        <div className="log-item-time">{timeStr}</div>
                      </div>
                    )
                  })}
                </div>
              )
            })}
          </div>
        )}

        <div style={{height: 24}} />
      </div>
    </div>
  )
}
