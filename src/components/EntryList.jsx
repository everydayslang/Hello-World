import { useState } from 'react'
import { Trash2, Pencil, Check, X } from 'lucide-react'
import { formatDurationShort } from '../hooks/useTimer'

function formatDate(ms) {
  return new Date(ms).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

function formatTime(ms) {
  return new Date(ms).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
}

function groupByDate(entries) {
  const groups = {}
  for (const e of entries) {
    const key = new Date(e.startTime).toDateString()
    if (!groups[key]) groups[key] = []
    groups[key].push(e)
  }
  return Object.entries(groups)
}

function EditRow({ entry, projects, onSave, onCancel }) {
  const [projectId, setProjectId] = useState(entry.projectId)
  const [description, setDescription] = useState(entry.description)

  function save() {
    onSave({ projectId, description })
  }

  return (
    <div className="entry-row" style={{ flexWrap: 'wrap', gap: 8 }}>
      <select className="input" style={{ width: 140 }} value={projectId} onChange={e => setProjectId(e.target.value)}>
        {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
      </select>
      <input
        className="input"
        style={{ flex: 1, minWidth: 120 }}
        value={description}
        onChange={e => setDescription(e.target.value)}
        placeholder="Description"
      />
      <button className="btn btn-primary btn-sm" onClick={save}><Check size={13} /></button>
      <button className="btn btn-ghost btn-sm" onClick={onCancel}><X size={13} /></button>
    </div>
  )
}

export default function EntryList({ store }) {
  const { entries, projects, deleteEntry, updateEntry } = store
  const [editing, setEditing] = useState(null)

  if (entries.length === 0) {
    return (
      <div className="card">
        <div className="empty-state">
          <p className="font-bold" style={{ marginBottom: 4 }}>No entries yet</p>
          <p className="text-sm">Start a timer or log time manually to get started.</p>
        </div>
      </div>
    )
  }

  const groups = groupByDate(entries)

  return (
    <div className="card">
      <div className="section-title">Time Entries</div>
      {groups.map(([dateKey, dayEntries]) => {
        const dayTotal = dayEntries.reduce((s, e) => s + (e.endTime - e.startTime), 0)
        return (
          <div key={dateKey} style={{ marginBottom: 20 }}>
            <div className="row" style={{ marginBottom: 8 }}>
              <span className="text-sm font-bold text-muted">{formatDate(dayEntries[0].startTime)}</span>
              <div className="spacer" />
              <span className="text-sm text-muted">{formatDurationShort(dayTotal)}</span>
            </div>
            {dayEntries.map(entry => {
              const project = projects.find(p => p.id === entry.projectId)
              const duration = entry.endTime - entry.startTime
              if (editing === entry.id) {
                return (
                  <EditRow
                    key={entry.id}
                    entry={entry}
                    projects={projects}
                    onSave={patch => { updateEntry(entry.id, patch); setEditing(null) }}
                    onCancel={() => setEditing(null)}
                  />
                )
              }
              return (
                <div key={entry.id} className="entry-row">
                  <span
                    className="project-dot"
                    style={{ background: project?.color ?? '#888' }}
                  />
                  <span className="text-sm font-bold" style={{ minWidth: 80 }}>{project?.name ?? 'Unknown'}</span>
                  <span className="text-sm text-muted" style={{ flex: 1 }}>
                    {entry.description || <em style={{ opacity: 0.5 }}>No description</em>}
                  </span>
                  <span className="text-xs text-muted font-mono">
                    {formatTime(entry.startTime)} – {formatTime(entry.endTime)}
                  </span>
                  <span className="text-sm font-bold font-mono" style={{ minWidth: 52, textAlign: 'right' }}>
                    {formatDurationShort(duration)}
                  </span>
                  <button className="btn btn-ghost btn-sm" onClick={() => setEditing(entry.id)}><Pencil size={13} /></button>
                  <button className="btn btn-danger btn-sm" onClick={() => deleteEntry(entry.id)}><Trash2 size={13} /></button>
                </div>
              )
            })}
          </div>
        )
      })}
    </div>
  )
}
