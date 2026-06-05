import { useState } from 'react'
import { Plus } from 'lucide-react'

function toMs(dateStr, timeStr) {
  return new Date(`${dateStr}T${timeStr}`).getTime()
}

function todayStr() {
  return new Date().toISOString().split('T')[0]
}

function nowTimeStr(offsetMinutes = 0) {
  const d = new Date(Date.now() + offsetMinutes * 60000)
  return d.toTimeString().slice(0, 5)
}

export default function ManualEntry({ store }) {
  const { projects, addEntry } = store
  const [date, setDate] = useState(todayStr())
  const [startTime, setStartTime] = useState(() => nowTimeStr(-30))
  const [endTime, setEndTime] = useState(() => nowTimeStr(0))
  const [projectId, setProjectId] = useState(projects[0]?.id ?? '')
  const [description, setDescription] = useState('')
  const [error, setError] = useState('')

  function handleSubmit(e) {
    e.preventDefault()
    const start = toMs(date, startTime)
    const end = toMs(date, endTime)
    if (isNaN(start) || isNaN(end)) { setError('Invalid date or time'); return }
    if (end <= start) { setError('End time must be after start time'); return }
    if (!projectId) { setError('Select a project'); return }
    setError('')
    addEntry({ projectId, description, startTime: start, endTime: end })
    setDescription('')
  }

  return (
    <div className="card">
      <div className="section-title">Log Time Manually</div>
      <form onSubmit={handleSubmit}>
        <div className="grid-2" style={{ marginBottom: 12 }}>
          <div>
            <label className="field-label">Project</label>
            <select className="input" value={projectId} onChange={e => setProjectId(e.target.value)}>
              {projects.length === 0 && <option value="">No projects</option>}
              {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div>
            <label className="field-label">Date</label>
            <input type="date" className="input" value={date} onChange={e => setDate(e.target.value)} />
          </div>
        </div>
        <div className="grid-2" style={{ marginBottom: 12 }}>
          <div>
            <label className="field-label">Start time</label>
            <input type="time" className="input" value={startTime} onChange={e => setStartTime(e.target.value)} />
          </div>
          <div>
            <label className="field-label">End time</label>
            <input type="time" className="input" value={endTime} onChange={e => setEndTime(e.target.value)} />
          </div>
        </div>
        <div style={{ marginBottom: 14 }}>
          <label className="field-label">Description (optional)</label>
          <input
            className="input"
            placeholder="What did you work on?"
            value={description}
            onChange={e => setDescription(e.target.value)}
          />
        </div>
        {error && <p style={{ color: 'var(--danger)', fontSize: '0.85rem', marginBottom: 10 }}>{error}</p>}
        <button type="submit" className="btn btn-primary">
          <Plus size={15} /> Add entry
        </button>
      </form>
    </div>
  )
}
