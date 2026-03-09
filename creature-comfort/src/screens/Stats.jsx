import { useState } from 'react'
import {
  getMsSinceLastUse, formatDuration, getTodayStats,
  getAllStats, sameDay, getDaysSinceLastUse
} from '../hooks/useStore'
import './Stats.css'

export default function Stats({ state }) {
  const [tab, setTab] = useState('today')
  const todayStats = getTodayStats(state.events)
  const allStats = getAllStats(state.events)
  const msSinceUse = getMsSinceLastUse(state.events)
  const daysSince = getDaysSinceLastUse(state.events)

  const totalEvents = state.events.length
  const resistRatio = (todayStats.uses + todayStats.resisted) > 0
    ? Math.round((todayStats.resisted / (todayStats.uses + todayStats.resisted)) * 100)
    : null

  // Log grouped by day
  const eventsByDay = {}
  ;[...state.events].reverse().forEach(e => {
    const d = new Date(e.ts)
    const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
    if (!eventsByDay[key]) eventsByDay[key] = []
    eventsByDay[key].push(e)
  })

  const usedEvents = state.events.filter(e => e.type === 'used')

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
              <div className="stat-card red">
                <div className="sc-label">Used</div>
                <div className="sc-value">{todayStats.uses}</div>
              </div>
              <div className="stat-card green">
                <div className="sc-label">Resisted</div>
                <div className="sc-value">{todayStats.resisted}</div>
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
          </div>
        )}

        {tab === 'log' && (
          <div className="log-panel">
            {Object.keys(eventsByDay).length === 0 && (
              <div className="log-empty prose">No events yet. Start logging from the home screen.</div>
            )}
            {Object.entries(eventsByDay).map(([day, events]) => {
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
                    const gap = (e.type === 'used' && usedIdx > 0)
                      ? formatDuration(e.ts - usedEvents[usedIdx-1].ts, true)
                      : null

                    return (
                      <div key={e.id || e.ts} className="log-item">
                        <div className={`log-dot ${e.type}`} />
                        <div className="log-item-text">
                          <div className="log-item-type pixel">
                            {e.type === 'used' ? 'Used'
                              : e.type === 'craving_surfed' ? 'Surfed craving'
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
