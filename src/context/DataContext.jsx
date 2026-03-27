import { createContext, useContext, useReducer, useEffect, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabase'

const DataContext = createContext(null)
const ROW_ID = 'main'

function getNestedValue(obj, path) {
  return path.split('.').reduce((acc, key) => {
    if (acc === null || acc === undefined) return undefined
    const idx = Number(key)
    return Number.isNaN(idx) ? acc[key] : acc[idx]
  }, obj)
}

function setNestedValue(obj, path, value) {
  const clone = JSON.parse(JSON.stringify(obj))
  const keys = path.split('.')
  let curr = clone
  for (let i = 0; i < keys.length - 1; i++) {
    const k = keys[i]
    const idx = Number(k)
    curr = Number.isNaN(idx) ? curr[k] : curr[idx]
  }
  const last = keys[keys.length - 1]
  const lastIdx = Number(last)
  if (Number.isNaN(lastIdx)) {
    curr[last] = value
  } else {
    curr[lastIdx] = value
  }
  return clone
}

function reducer(state, action) {
  switch (action.type) {
    case 'SET_ALL':
      return action.payload

    case 'SET_FIELD':
      return setNestedValue(state, action.path, action.value)

    case 'ADD_TO_ARRAY': {
      const arr = getNestedValue(state, action.path)
      if (!Array.isArray(arr)) return state
      return setNestedValue(state, action.path, [...arr, action.value])
    }

    case 'PREPEND_TO_ARRAY': {
      const arr = getNestedValue(state, action.path)
      if (!Array.isArray(arr)) return state
      return setNestedValue(state, action.path, [action.value, ...arr])
    }

    case 'REMOVE_FROM_ARRAY': {
      const arr = getNestedValue(state, action.path)
      if (!Array.isArray(arr)) return state
      return setNestedValue(state, action.path, arr.filter(item => item.id !== action.id))
    }

    case 'UPDATE_IN_ARRAY': {
      const arr = getNestedValue(state, action.path)
      if (!Array.isArray(arr)) return state
      return setNestedValue(state, action.path, arr.map(item =>
        item.id === action.id ? { ...item, ...action.updates } : item
      ))
    }

    case 'TOGGLE_TASK': {
      const arr = getNestedValue(state, action.path)
      if (!Array.isArray(arr)) return state
      return setNestedValue(state, action.path, arr.map(item =>
        item.id === action.id ? { ...item, completed: !item.completed } : item
      ))
    }

    case 'APPLY_OPERATIONS': {
      let s = state
      for (const op of action.operations) {
        switch (op.type) {
          case 'set':
            s = setNestedValue(s, op.path, op.value)
            break
          case 'add': {
            const a1 = getNestedValue(s, op.path)
            if (Array.isArray(a1)) s = setNestedValue(s, op.path, [...a1, op.value])
            break
          }
          case 'prepend': {
            const a2 = getNestedValue(s, op.path)
            if (Array.isArray(a2)) s = setNestedValue(s, op.path, [op.value, ...a2])
            break
          }
          case 'remove': {
            const a3 = getNestedValue(s, op.path)
            if (Array.isArray(a3)) s = setNestedValue(s, op.path, a3.filter(i => i.id !== op.id))
            break
          }
          case 'toggle': {
            const a4 = getNestedValue(s, op.path)
            if (Array.isArray(a4)) s = setNestedValue(s, op.path, a4.map(i => i.id === op.id ? { ...i, completed: !i.completed } : i))
            break
          }
          case 'update': {
            const a5 = getNestedValue(s, op.path)
            if (Array.isArray(a5)) s = setNestedValue(s, op.path, a5.map(i => i.id === op.id ? { ...i, ...op.value } : i))
            break
          }
        }
      }
      return s
    }

    default:
      return state
  }
}

function migrateData(d) {
  if (d.outreach?.weeklyGoal && !d.outreach?.weeklyGoals) {
    d.outreach.weeklyGoals = [{ id: 'og-1', ...d.outreach.weeklyGoal }]
    delete d.outreach.weeklyGoal
  }
  if (d.outreach?.monthlyGoal && !d.outreach?.monthlyGoals) {
    d.outreach.monthlyGoals = [{ id: 'og-2', ...d.outreach.monthlyGoal }]
    delete d.outreach.monthlyGoal
  }
  if (d.aiSaas?.weeklyGoal && !d.aiSaas?.weeklyGoals) {
    d.aiSaas.weeklyGoals = [{ id: 'ag-1', ...d.aiSaas.weeklyGoal }]
    delete d.aiSaas.weeklyGoal
  }
  if (d.coaching?.weeklyGoal && !d.coaching?.weeklyGoals) {
    d.coaching.weeklyGoals = [{ id: 'cg-1', ...d.coaching.weeklyGoal }]
    delete d.coaching.weeklyGoal
  }
  if (d.coaching?.monthlyRevenueGoal && !d.coaching?.monthlyRevenueGoals) {
    d.coaching.monthlyRevenueGoals = [{ id: 'cg-2', ...d.coaching.monthlyRevenueGoal }]
    delete d.coaching.monthlyRevenueGoal
  }
  if (d.youtube?.weeklyGoal && !d.youtube?.weeklyGoals) {
    d.youtube.weeklyGoals = [{ id: 'yg-1', ...d.youtube.weeklyGoal }]
    delete d.youtube.weeklyGoal
  }
  if (d.outreach?.statuses && !Array.isArray(d.outreach.statuses)) {
    const labels = { emailCampaign: 'Email Campaign', a2pRegistration: 'A2P Registration', smsAds: 'SMS Ads' }
    const opts = { emailCampaign: ['ACTIVE', 'PAUSED', 'TESTING', 'OFF'], a2pRegistration: ['PENDING', 'APPROVED'], smsAds: ['ON', 'OFF'] }
    d.outreach.statuses = Object.entries(d.outreach.statuses).map(([key, val], i) => ({
      id: `st-${i + 1}`,
      label: labels[key] || key,
      value: val,
      options: opts[key] || ['ON', 'OFF']
    }))
  }
  return d
}

async function loadFromSupabase() {
  if (!supabase) return null
  try {
    const { data, error } = await supabase
      .from('app_state')
      .select('data')
      .eq('id', ROW_ID)
      .single()
    if (error || !data) return null
    return data.data
  } catch {
    return null
  }
}

async function saveToSupabase(state) {
  if (!supabase) return
  try {
    await supabase
      .from('app_state')
      .upsert({ id: ROW_ID, data: state, updated_at: new Date().toISOString() })
  } catch {
    // silent fail — localStorage is still the backup
  }
}

export function DataProvider({ children }) {
  const [data, dispatch] = useReducer(reducer, null)
  const saveTimer = useRef(null)

  useEffect(() => {
    async function init() {
      // 1. Try Supabase first (shared across devices)
      const remote = await loadFromSupabase()
      if (remote) {
        dispatch({ type: 'SET_ALL', payload: migrateData(remote) })
        return
      }
      // 2. Fall back to localStorage
      const saved = localStorage.getItem('atasof-data')
      if (saved) {
        try {
          dispatch({ type: 'SET_ALL', payload: migrateData(JSON.parse(saved)) })
          return
        } catch {}
      }
      // 3. Fall back to data.json
      fetch('/data.json')
        .then(r => r.json())
        .then(d => dispatch({ type: 'SET_ALL', payload: migrateData(d) }))
    }
    init()
  }, [])

  useEffect(() => {
    if (!data) return
    // Always save to localStorage immediately
    localStorage.setItem('atasof-data', JSON.stringify(data))
    // Debounce Supabase saves (2s) to avoid hammering on every keystroke
    clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => saveToSupabase(data), 2000)
  }, [data])

  const setField = useCallback((path, value) => dispatch({ type: 'SET_FIELD', path, value }), [])
  const addToArray = useCallback((path, value) => dispatch({ type: 'ADD_TO_ARRAY', path, value }), [])
  const prependToArray = useCallback((path, value) => dispatch({ type: 'PREPEND_TO_ARRAY', path, value }), [])
  const removeFromArray = useCallback((path, id) => dispatch({ type: 'REMOVE_FROM_ARRAY', path, id }), [])
  const updateInArray = useCallback((path, id, updates) => dispatch({ type: 'UPDATE_IN_ARRAY', path, id, updates }), [])
  const toggleTask = useCallback((path, id) => dispatch({ type: 'TOGGLE_TASK', path, id }), [])
  const applyOperations = useCallback((operations) => dispatch({ type: 'APPLY_OPERATIONS', operations }), [])
  const exportData = useCallback(() => JSON.stringify(data, null, 2), [data])
  const importData = useCallback((json) => {
    try {
      dispatch({ type: 'SET_ALL', payload: JSON.parse(json) })
      return true
    } catch { return false }
  }, [])
  const resetData = useCallback(() => {
    localStorage.removeItem('atasof-data')
    fetch('/data.json')
      .then(r => r.json())
      .then(d => dispatch({ type: 'SET_ALL', payload: migrateData(d) }))
  }, [])

  return (
    <DataContext.Provider value={{
      data, setField, addToArray, prependToArray, removeFromArray,
      updateInArray, toggleTask, applyOperations, exportData, importData, resetData
    }}>
      {children}
    </DataContext.Provider>
  )
}

export function useData() {
  const ctx = useContext(DataContext)
  if (!ctx) throw new Error('useData must be used within DataProvider')
  return ctx
}
