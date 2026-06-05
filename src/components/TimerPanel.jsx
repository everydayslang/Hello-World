import { useState } from 'react'
import { Play, Square } from 'lucide-react'
import { useElapsed, formatDuration } from '../hooks/useTimer'

export default function TimerPanel({ store }) {
  const { projects, activeTimer, startTimer, stopTimer, updateTimerDescription } = store
  const [selectedProject, setSelectedProject] = useState(projects[0]?.id ?? '')
  const [description, setDescription] = useState('')
  const elapsed = useElapsed(activeTimer?.startedAt)

  const activeProject = projects.find(p => p.id === activeTimer?.projectId)

  function handleStart() {
    if (!selectedProject) return
    startTimer(selectedProject, description)
    setDescription('')
  }

  function handleStop() {
    stopTimer()
  }

  return (
    <div className="card">
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24, padding: '16px 0' }}>
        <div
          className={`timer-display${activeTimer ? ' running' : ''}`}
          title={activeTimer ? `Started at ${new Date(activeTimer.startedAt).toLocaleTimeString()}` : ''}
        >
          {formatDuration(elapsed)}
        </div>

        {activeTimer ? (
          <div style={{ textAlign: 'center' }}>
            <div className="row" style={{ justifyContent: 'center', gap: 8, marginBottom: 8 }}>
              <span
                className="project-dot"
                style={{ background: activeProject?.color ?? '#888', width: 12, height: 12 }}
              />
              <span className="font-bold">{activeProject?.name ?? 'Unknown'}</span>
            </div>
            <input
              className="input"
              style={{ textAlign: 'center', maxWidth: 340 }}
              placeholder="What are you working on?"
              value={activeTimer.description}
              onChange={e => updateTimerDescription(e.target.value)}
            />
          </div>
        ) : (
          <div style={{ width: '100%', maxWidth: 400, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <select
              className="input"
              value={selectedProject}
              onChange={e => setSelectedProject(e.target.value)}
            >
              {projects.length === 0 && <option value="">No projects — add one first</option>}
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            <input
              className="input"
              placeholder="What are you working on? (optional)"
              value={description}
              onChange={e => setDescription(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleStart()}
            />
          </div>
        )}

        {activeTimer ? (
          <button className="btn btn-danger" style={{ fontSize: '0.95rem', padding: '10px 28px' }} onClick={handleStop}>
            <Square size={16} fill="currentColor" /> Stop
          </button>
        ) : (
          <button
            className="btn btn-success"
            style={{ fontSize: '0.95rem', padding: '10px 28px' }}
            onClick={handleStart}
            disabled={!selectedProject}
          >
            <Play size={16} fill="currentColor" /> Start
          </button>
        )}
      </div>
    </div>
  )
}
