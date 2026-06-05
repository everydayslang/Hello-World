import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { formatDurationShort } from '../hooks/useTimer'

const COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#ef4444',
  '#f97316', '#f59e0b', '#22c55e', '#06b6d4',
  '#3b82f6', '#14b8a6', '#84cc16', '#a855f7',
]

export default function Projects({ store }) {
  const { projects, entries, addProject, deleteProject } = store
  const [name, setName] = useState('')
  const [color, setColor] = useState(COLORS[0])
  const [error, setError] = useState('')

  function handleAdd(e) {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) { setError('Name is required'); return }
    if (projects.some(p => p.name.toLowerCase() === trimmed.toLowerCase())) {
      setError('Project already exists'); return
    }
    setError('')
    addProject(trimmed, color)
    setName('')
    setColor(COLORS[Math.floor(Math.random() * COLORS.length)])
  }

  function totalForProject(id) {
    return entries
      .filter(e => e.projectId === id)
      .reduce((s, e) => s + (e.endTime - e.startTime), 0)
  }

  return (
    <div>
      <div className="card mb-4">
        <div className="section-title">Add Project</div>
        <form onSubmit={handleAdd}>
          <div className="row" style={{ marginBottom: 12, flexWrap: 'wrap' }}>
            <input
              className="input"
              style={{ flex: 1, minWidth: 160 }}
              placeholder="Project name"
              value={name}
              onChange={e => setName(e.target.value)}
            />
          </div>
          <div style={{ marginBottom: 14 }}>
            <label className="field-label">Color</label>
            <div className="color-picker-row">
              {COLORS.map(c => (
                <button
                  type="button"
                  key={c}
                  className={`color-swatch${color === c ? ' selected' : ''}`}
                  style={{ background: c }}
                  onClick={() => setColor(c)}
                />
              ))}
            </div>
          </div>
          {error && <p style={{ color: 'var(--danger)', fontSize: '0.85rem', marginBottom: 10 }}>{error}</p>}
          <button type="submit" className="btn btn-primary">
            <Plus size={15} /> Add project
          </button>
        </form>
      </div>

      <div className="card">
        <div className="section-title">Projects ({projects.length})</div>
        {projects.length === 0 && (
          <div className="empty-state">
            <p className="text-sm">No projects yet. Add one above.</p>
          </div>
        )}
        {projects.map(p => {
          const total = totalForProject(p.id)
          const entryCount = entries.filter(e => e.projectId === p.id).length
          return (
            <div key={p.id} className="entry-row">
              <span className="project-dot" style={{ background: p.color }} />
              <span className="font-bold" style={{ flex: 1 }}>{p.name}</span>
              <span className="text-sm text-muted">{entryCount} {entryCount === 1 ? 'entry' : 'entries'}</span>
              <span className="text-sm font-bold font-mono">{total > 0 ? formatDurationShort(total) : '—'}</span>
              <button
                className="btn btn-danger btn-sm"
                onClick={() => {
                  if (entryCount > 0 && !confirm(`Delete "${p.name}" and its ${entryCount} entries?`)) return
                  deleteProject(p.id)
                }}
              >
                <Trash2 size={13} />
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
