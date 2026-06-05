import { useState, useMemo } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie, Legend,
} from 'recharts'
import { formatDurationShort } from '../hooks/useTimer'

const RANGES = [
  { label: '7 days', days: 7 },
  { label: '30 days', days: 30 },
  { label: '90 days', days: 90 },
  { label: 'All time', days: null },
]

function startOfDay(ms) {
  const d = new Date(ms)
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

function dayLabel(ms) {
  return new Date(ms).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

function tooltipMs(value) {
  return formatDurationShort(value * 60000)
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: '#1e293b', border: '1px solid #334155', borderRadius: 8,
      padding: '8px 14px', fontSize: '0.82rem',
    }}>
      <div style={{ fontWeight: 700, marginBottom: 4 }}>{label}</div>
      {payload.map(p => (
        <div key={p.name} style={{ color: p.fill ?? p.color }}>
          {p.name}: {formatDurationShort(p.value * 60000)}
        </div>
      ))}
    </div>
  )
}

export default function Reports({ store }) {
  const { entries, projects } = store
  const [rangeIdx, setRangeIdx] = useState(0)

  const range = RANGES[rangeIdx]
  const cutoff = range.days ? Date.now() - range.days * 86400000 : 0

  const filtered = useMemo(
    () => entries.filter(e => e.startTime >= cutoff),
    [entries, cutoff]
  )

  const totalMs = filtered.reduce((s, e) => s + (e.endTime - e.startTime), 0)

  // Per-project totals for pie chart
  const projectTotals = useMemo(() => {
    const map = {}
    for (const e of filtered) {
      map[e.projectId] = (map[e.projectId] ?? 0) + (e.endTime - e.startTime)
    }
    return projects
      .map(p => ({ name: p.name, color: p.color, value: Math.round(map[p.id] / 60000) }))
      .filter(p => p.value > 0)
      .sort((a, b) => b.value - a.value)
  }, [filtered, projects])

  // Daily bar chart data
  const dailyData = useMemo(() => {
    if (!filtered.length) return []
    const days = {}
    for (const e of filtered) {
      const day = startOfDay(e.startTime)
      if (!days[day]) days[day] = {}
      const pid = e.projectId
      days[day][pid] = (days[day][pid] ?? 0) + (e.endTime - e.startTime)
    }
    const sorted = Object.entries(days).sort(([a], [b]) => Number(a) - Number(b))
    return sorted.map(([dayMs, projectMap]) => {
      const row = { day: dayLabel(Number(dayMs)) }
      for (const [pid, ms] of Object.entries(projectMap)) {
        const proj = projects.find(p => p.id === pid)
        if (proj) row[proj.name] = Math.round(ms / 60000)
      }
      return row
    })
  }, [filtered, projects])

  const activeProjects = useMemo(
    () => projects.filter(p => projectTotals.some(pt => pt.name === p.name)),
    [projects, projectTotals]
  )

  return (
    <div>
      <div className="grid-3" style={{ marginBottom: 20 }}>
        <div className="stat-card">
          <div className="stat-value">{formatDurationShort(totalMs)}</div>
          <div className="stat-label">Total time</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{filtered.length}</div>
          <div className="stat-label">Entries</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{projectTotals.length}</div>
          <div className="stat-label">Active projects</div>
        </div>
      </div>

      <div className="date-range-row">
        {RANGES.map((r, i) => (
          <button
            key={r.label}
            className={`date-range-btn${rangeIdx === i ? ' active' : ''}`}
            onClick={() => setRangeIdx(i)}
          >
            {r.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <p className="font-bold" style={{ marginBottom: 4 }}>No data for this period</p>
            <p className="text-sm">Track some time to see your reports here.</p>
          </div>
        </div>
      ) : (
        <>
          {dailyData.length > 0 && (
            <div className="card" style={{ marginBottom: 16 }}>
              <div className="section-title">Time per day (minutes)</div>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={dailyData} margin={{ top: 4, right: 4, bottom: 4, left: -20 }}>
                  <XAxis dataKey="day" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                  <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} tickFormatter={v => `${v}m`} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
                  {activeProjects.map(p => (
                    <Bar key={p.id} dataKey={p.name} stackId="a" fill={p.color} radius={activeProjects[activeProjects.length - 1].id === p.id ? [4, 4, 0, 0] : [0, 0, 0, 0]} />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {projectTotals.length > 0 && (
            <div className="grid-2">
              <div className="card">
                <div className="section-title">By project</div>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={projectTotals}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      labelLine={false}
                    >
                      {projectTotals.map((p, i) => <Cell key={i} fill={p.color} />)}
                    </Pie>
                    <Tooltip formatter={(val) => formatDurationShort(val * 60000)} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="card">
                <div className="section-title">Breakdown</div>
                {projectTotals.map(p => {
                  const pct = totalMs > 0 ? (p.value * 60000 / totalMs) * 100 : 0
                  return (
                    <div key={p.name} style={{ marginBottom: 14 }}>
                      <div className="row" style={{ marginBottom: 4 }}>
                        <span className="project-dot" style={{ background: p.color }} />
                        <span className="text-sm font-bold">{p.name}</span>
                        <div className="spacer" />
                        <span className="text-sm font-mono">{formatDurationShort(p.value * 60000)}</span>
                        <span className="text-xs text-muted" style={{ minWidth: 36, textAlign: 'right' }}>{pct.toFixed(0)}%</span>
                      </div>
                      <div style={{ height: 6, background: 'var(--border)', borderRadius: 3 }}>
                        <div style={{ height: '100%', width: `${pct}%`, background: p.color, borderRadius: 3 }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
