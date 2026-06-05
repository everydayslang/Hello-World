import { useState } from 'react'
import { Timer, List, FolderOpen, BarChart2 } from 'lucide-react'
import { useStore } from './hooks/useStore'
import TimerPanel from './components/TimerPanel'
import ManualEntry from './components/ManualEntry'
import EntryList from './components/EntryList'
import Projects from './components/Projects'
import Reports from './components/Reports'

const TABS = [
  { id: 'tracker', label: 'Tracker', icon: Timer },
  { id: 'entries', label: 'Entries', icon: List },
  { id: 'projects', label: 'Projects', icon: FolderOpen },
  { id: 'reports', label: 'Reports', icon: BarChart2 },
]

export default function App() {
  const [tab, setTab] = useState('tracker')
  const store = useStore()

  return (
    <div className="app">
      <header className="app-header">
        <div className="logo">
          <Timer size={20} />
        </div>
        <h1>Time Tracker</h1>
        {store.activeTimer && (
          <span className="badge" style={{ background: 'rgba(34,197,94,0.15)', color: '#22c55e', marginLeft: 8 }}>
            ● Recording
          </span>
        )}
      </header>

      <nav className="nav-tabs">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            className={`nav-tab${tab === id ? ' active' : ''}`}
            onClick={() => setTab(id)}
          >
            <Icon size={14} />
            {label}
          </button>
        ))}
      </nav>

      {tab === 'tracker' && (
        <div>
          <TimerPanel store={store} />
          <div className="mt-4">
            <ManualEntry store={store} />
          </div>
        </div>
      )}
      {tab === 'entries' && <EntryList store={store} />}
      {tab === 'projects' && <Projects store={store} />}
      {tab === 'reports' && <Reports store={store} />}
    </div>
  )
}
