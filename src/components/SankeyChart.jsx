import { useMemo } from 'react'
import { Sankey, Tooltip, ResponsiveContainer } from 'recharts'
import { formatDurationShort } from '../hooks/useTimer'

const BLOCK_MIN = 8 * 60    // 480 — one in-office block
const MAX_WEEK_MIN = 20 * 60 // 1200 — weekly budget

function buildData(entries, projects) {
  const weekAgo = Date.now() - 7 * 86400000
  const week = entries.filter(e => e.startTime >= weekAgo)

  const byProject = {}
  for (const e of week) {
    byProject[e.projectId] = (byProject[e.projectId] ?? 0) + (e.endTime - e.startTime)
  }

  // Projects sorted greatest → least (top → bottom in Sankey)
  const sorted = projects
    .filter(p => byProject[p.id] > 0)
    .map(p => ({ ...p, minutes: byProject[p.id] / 60000 }))
    .sort((a, b) => b.minutes - a.minutes)

  const totalMin = sorted.reduce((s, p) => s + p.minutes, 0)
  // Cap at 16h for the block display; overflow goes to a Flex node
  const inOfficeMin = Math.min(totalMin, BLOCK_MIN * 2)
  const availMin = Math.max(0, BLOCK_MIN * 2 - inOfficeMin) // unused office capacity
  const flexMin = Math.max(0, totalMin - BLOCK_MIN * 2)     // time beyond 2 blocks

  const srcNodes = [
    { name: 'In-Office Block 1', sub: '8h', isSource: true, fillColor: '#6366f1' },
    { name: 'In-Office Block 2', sub: '8h', isSource: true, fillColor: '#818cf8' },
  ]
  if (flexMin > 0.5) {
    srcNodes.push({ name: 'Flex', sub: formatDurationShort(flexMin * 60000), isSource: true, fillColor: '#06b6d4' })
  }

  const sinkNodes = sorted.map(p => ({ name: p.name, fillColor: p.color, minutes: p.minutes }))
  if (availMin > 0.5) {
    sinkNodes.push({
      name: 'Available',
      sub: formatDurationShort(availMin * 60000),
      isAvailable: true,
      fillColor: '#475569',
      minutes: availMin,
    })
  }

  const nodes = [...srcNodes, ...sinkNodes]
  const srcCount = srcNodes.length
  const links = []

  // Distribute project minutes across in-office blocks (greedy fill block1 → block2 → flex)
  let b1 = BLOCK_MIN, b2 = BLOCK_MIN

  for (let i = 0; i < sorted.length; i++) {
    let rem = sorted[i].minutes
    const ti = srcCount + i

    if (b1 > 0 && rem > 0) {
      const v = round(Math.min(b1, rem))
      links.push({ source: 0, target: ti, value: v })
      b1 -= v; rem -= v
    }
    if (b2 > 0 && rem > 0) {
      const v = round(Math.min(b2, rem))
      links.push({ source: 1, target: ti, value: v })
      b2 -= v; rem -= v
    }
    if (rem > 0.1 && flexMin > 0) {
      links.push({ source: 2, target: ti, value: round(rem) })
    }
  }

  // Remaining block capacity → Available
  if (availMin > 0.5) {
    const ai = nodes.length - 1
    if (b1 > 0.1) links.push({ source: 0, target: ai, value: round(b1) })
    if (b2 > 0.1) links.push({ source: 1, target: ai, value: round(b2) })
  }

  return { nodes, links, sorted, totalMin, availMin, flexMin }
}

function round(v) {
  return Math.round(v * 10) / 10
}

function SankeyNode({ x, y, width, height, payload }) {
  if (!payload || height < 1) return null
  const { name, sub, fillColor = '#6366f1', isAvailable, isSource } = payload
  return (
    <g>
      <rect
        x={x} y={y} width={width} height={height}
        fill={fillColor}
        fillOpacity={isAvailable ? 0.25 : 0.88}
        rx={3}
      />
      {height >= 10 && (
        <text
          x={isSource ? x + width + 8 : x - 8}
          y={y + height / 2}
          textAnchor={isSource ? 'start' : 'end'}
          dominantBaseline="middle"
          fill="#f1f5f9"
          fontSize={11}
          fontFamily="-apple-system, BlinkMacSystemFont, sans-serif"
          fontWeight={isSource ? 700 : 500}
        >
          {name}{sub ? ` · ${sub}` : ''}
        </text>
      )}
    </g>
  )
}

function SankeyLink({ sourceX, sourceY, sourceControlX, targetX, targetY, targetControlX, linkWidth, payload }) {
  if (!payload || linkWidth < 0.5) return null
  const color = payload.source?.fillColor ?? '#6366f1'
  const hw = linkWidth / 2
  return (
    <path
      d={`
        M${sourceX},${sourceY + hw}
        C${sourceControlX},${sourceY + hw} ${targetControlX},${targetY + hw} ${targetX},${targetY + hw}
        L${targetX},${targetY - hw}
        C${targetControlX},${targetY - hw} ${sourceControlX},${sourceY - hw} ${sourceX},${sourceY - hw}
        Z
      `}
      fill={color}
      fillOpacity={0.22}
      stroke={color}
      strokeOpacity={0.45}
      strokeWidth={0.5}
    />
  )
}

const LinkTooltip = ({ active, payload }) => {
  if (!active || !payload?.[0]) return null
  const d = payload[0].payload
  return (
    <div style={{
      background: '#1e293b', border: '1px solid #334155', borderRadius: 8,
      padding: '8px 12px', fontSize: '0.82rem',
    }}>
      <div style={{ fontWeight: 700 }}>{d.source?.name} → {d.target?.name}</div>
      <div style={{ color: '#94a3b8', marginTop: 2 }}>{formatDurationShort(d.value * 60000)}</div>
    </div>
  )
}

export default function SankeyChart({ entries, projects }) {
  const { nodes, links, totalMin, flexMin } = useMemo(
    () => buildData(entries, projects),
    [entries, projects]
  )

  const overBudget = totalMin > MAX_WEEK_MIN
  const weekPct = Math.min(100, (totalMin / MAX_WEEK_MIN) * 100)

  if (!links.length) {
    return (
      <div className="card">
        <div className="empty-state">
          <p className="font-bold" style={{ marginBottom: 4 }}>No data this week</p>
          <p className="text-sm">Track time this week to see the weekly flow.</p>
        </div>
      </div>
    )
  }

  // Enough vertical space for each sink node
  const sinkCount = nodes.filter(n => !n.isSource).length
  const chartHeight = Math.max(280, sinkCount * 38 + 60)

  return (
    <div className="card">
      <div className="row" style={{ marginBottom: 6, alignItems: 'flex-start' }}>
        <div>
          <div className="section-title" style={{ marginBottom: 2 }}>Weekly Flow</div>
          <div className="text-sm text-muted">
            Two 8h in-office blocks · 20h max
            {flexMin > 0.5 && <span style={{ color: 'var(--warning)', marginLeft: 8 }}>+{formatDurationShort(flexMin * 60000)} over in-office blocks</span>}
          </div>
        </div>
        <div className="spacer" />
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{
            fontWeight: 700, fontFamily: 'monospace', fontSize: '1.1rem',
            color: overBudget ? 'var(--danger)' : 'var(--text)',
          }}>
            {formatDurationShort(totalMin * 60000)}
            <span style={{ fontSize: '0.72rem', fontWeight: 400, color: 'var(--text-muted)', marginLeft: 5 }}>/ 20h</span>
          </div>
          {overBudget && <div style={{ fontSize: '0.7rem', color: 'var(--danger)' }}>over budget</div>}
        </div>
      </div>

      {/* 20h budget progress bar with 8h / 16h tick marks */}
      <div style={{ marginBottom: 22 }}>
        <div style={{ height: 5, background: 'var(--border)', borderRadius: 3, position: 'relative' }}>
          <div style={{
            height: '100%', width: `${weekPct}%`,
            background: overBudget ? 'var(--danger)' : 'var(--accent)',
            borderRadius: 3, transition: 'width 0.3s',
          }} />
          {/* Tick marks at 8h (40%) and 16h (80%) */}
          {[40, 80].map(pct => (
            <div key={pct} style={{
              position: 'absolute', top: -4, left: `${pct}%`,
              width: 2, height: 13, background: 'var(--text-muted)', borderRadius: 1,
            }} />
          ))}
        </div>
        <div style={{ position: 'relative', height: 16, marginTop: 3, fontSize: '0.7rem', color: 'var(--text-muted)' }}>
          <span style={{ position: 'absolute', left: 0 }}>0h</span>
          <span style={{ position: 'absolute', left: '40%', transform: 'translateX(-50%)' }}>8h</span>
          <span style={{ position: 'absolute', left: '80%', transform: 'translateX(-50%)' }}>16h</span>
          <span style={{ position: 'absolute', right: 0 }}>20h</span>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={chartHeight}>
        <Sankey
          data={{ nodes, links }}
          nodeWidth={14}
          nodePadding={14}
          node={<SankeyNode />}
          link={<SankeyLink />}
          margin={{ top: 10, right: 160, bottom: 10, left: 160 }}
        >
          <Tooltip content={<LinkTooltip />} />
        </Sankey>
      </ResponsiveContainer>
    </div>
  )
}
