import { useState, useEffect, useCallback } from 'react'

const STORAGE_KEY = 'tt_data_v1'

const DEFAULT_PROJECTS = [
  { id: 'p1', name: 'Design', color: '#6366f1' },
  { id: 'p2', name: 'Engineering', color: '#22c55e' },
  { id: 'p3', name: 'Meetings', color: '#f59e0b' },
]

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw)
  } catch {
    return null
  }
}

function save(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

export function useStore() {
  const [state, setState] = useState(() => {
    const saved = load()
    return saved ?? {
      projects: DEFAULT_PROJECTS,
      entries: [],
      activeTimer: null, // { projectId, description, startedAt }
    }
  })

  useEffect(() => {
    save(state)
  }, [state])

  // Projects
  const addProject = useCallback((name, color) => {
    setState(s => ({
      ...s,
      projects: [...s.projects, { id: crypto.randomUUID(), name, color }],
    }))
  }, [])

  const deleteProject = useCallback((id) => {
    setState(s => ({
      ...s,
      projects: s.projects.filter(p => p.id !== id),
      entries: s.entries.filter(e => e.projectId !== id),
      activeTimer: s.activeTimer?.projectId === id ? null : s.activeTimer,
    }))
  }, [])

  const updateProject = useCallback((id, patch) => {
    setState(s => ({
      ...s,
      projects: s.projects.map(p => p.id === id ? { ...p, ...patch } : p),
    }))
  }, [])

  // Timer
  const startTimer = useCallback((projectId, description = '') => {
    setState(s => ({
      ...s,
      activeTimer: { projectId, description, startedAt: Date.now() },
    }))
  }, [])

  const stopTimer = useCallback(() => {
    setState(s => {
      if (!s.activeTimer) return s
      const { projectId, description, startedAt } = s.activeTimer
      const entry = {
        id: crypto.randomUUID(),
        projectId,
        description,
        startTime: startedAt,
        endTime: Date.now(),
      }
      return { ...s, activeTimer: null, entries: [entry, ...s.entries] }
    })
  }, [])

  const updateTimerDescription = useCallback((description) => {
    setState(s => s.activeTimer ? { ...s, activeTimer: { ...s.activeTimer, description } } : s)
  }, [])

  // Entries
  const addEntry = useCallback((entry) => {
    setState(s => ({
      ...s,
      entries: [{ id: crypto.randomUUID(), ...entry }, ...s.entries].sort(
        (a, b) => b.startTime - a.startTime
      ),
    }))
  }, [])

  const deleteEntry = useCallback((id) => {
    setState(s => ({ ...s, entries: s.entries.filter(e => e.id !== id) }))
  }, [])

  const updateEntry = useCallback((id, patch) => {
    setState(s => ({
      ...s,
      entries: s.entries.map(e => e.id === id ? { ...e, ...patch } : e),
    }))
  }, [])

  return {
    ...state,
    addProject, deleteProject, updateProject,
    startTimer, stopTimer, updateTimerDescription,
    addEntry, deleteEntry, updateEntry,
  }
}
