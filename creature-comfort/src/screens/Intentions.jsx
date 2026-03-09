import { useState } from 'react'
import './Intentions.css'

export default function Intentions({ state, update }) {
  const [newText, setNewText] = useState('')
  const [newType, setNewType] = useState('daily')

  function addIntention() {
    if (!newText.trim()) return
    const intention = {
      id: Date.now(),
      text: newText.trim(),
      type: newType,
      createdAt: Date.now(),
    }
    update(prev => ({ ...prev, intentions: [...(prev.intentions || []), intention] }))
    setNewText('')
  }

  function removeIntention(id) {
    update(prev => ({ ...prev, intentions: prev.intentions.filter(i => i.id !== id) }))
  }

  const daily = (state.intentions || []).filter(i => i.type === 'daily')
  const weekly = (state.intentions || []).filter(i => i.type === 'weekly')

  return (
    <div className="intentions scroll">
      {/* The big why */}
      <div className="int-section">
        <div className="int-section-label">Your reason</div>
        <div className="int-big-why">
          <div className="int-big-why-label prose">Why you're doing this</div>
          <div className="int-big-why-text">{state.intentionBig}</div>
        </div>
      </div>

      {/* Daily intentions */}
      <div className="int-section">
        <div className="int-section-label">Daily</div>
        {daily.length === 0 && (
          <div className="int-empty prose">Nothing added yet. What's keeping you going today?</div>
        )}
        {daily.map(i => (
          <div key={i.id} className="int-item">
            <span className="int-item-dot" />
            <span className="int-item-text prose">{i.text}</span>
            <button className="int-remove" onClick={() => removeIntention(i.id)}>✕</button>
          </div>
        ))}
      </div>

      {/* Weekly intentions */}
      <div className="int-section">
        <div className="int-section-label">Weekly</div>
        {weekly.length === 0 && (
          <div className="int-empty prose">What's your focus this week?</div>
        )}
        {weekly.map(i => (
          <div key={i.id} className="int-item">
            <span className="int-item-dot weekly" />
            <span className="int-item-text prose">{i.text}</span>
            <button className="int-remove" onClick={() => removeIntention(i.id)}>✕</button>
          </div>
        ))}
      </div>

      {/* Add new */}
      <div className="int-add-section">
        <div className="int-section-label">Add intention</div>
        <textarea
          className="int-input"
          placeholder="For my wife. For my lungs. For tomorrow."
          maxLength={100}
          value={newText}
          onChange={e => setNewText(e.target.value)}
          rows={2}
        />
        <div className="int-type-row">
          {['daily', 'weekly'].map(t => (
            <button
              key={t}
              className={`int-type-btn ${newType === t ? 'active' : ''}`}
              onClick={() => setNewType(t)}
            >{t}</button>
          ))}
        </div>
        <button
          className={`btn-pixel ${newText.trim() ? 'accent' : ''}`}
          style={{marginTop: 12}}
          onClick={addIntention}
          disabled={!newText.trim()}
        >
          Add →
        </button>
      </div>

      <div style={{height: 24}} />
    </div>
  )
}
