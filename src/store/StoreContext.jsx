import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from 'react';
import { CONFIG } from '../config/orchestration.config.js';

// ── Storage keys — versioned so future schema changes are safe ──
const K = {
  ENTRIES:        'orch_entries_v1',
  MILESTONES:     'orch_milestones_v1',
  IMPACT:         'orch_impact_v1',
  PIN:            'orch_pin_v1',
  STATS_OVERRIDE: 'orch_stats_override_v1',
  WORKSTREAMS:    'orch_workstreams_v1',
  PROMPT:         'orch_prompt_v1',
};

function load(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw !== null ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function persist(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* storage full */ }
}

function genId() {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2) + Date.now().toString(36);
}

// ── Context ──────────────────────────────────────────────────────
const StoreContext = createContext(null);

export function StoreProvider({ children }) {
  const [entries,       setEntries]       = useState(() => load(K.ENTRIES,        []));
  const [milestones,    setMilestones]    = useState(() => load(K.MILESTONES,     CONFIG.initialMilestones));
  const [impactMoments, setImpactMoments] = useState(() => load(K.IMPACT,         []));
  const [adminPin,      setAdminPin]      = useState(() => load(K.PIN,             CONFIG.defaultAdminPin));
  const [statsOverride, setStatsOverride] = useState(() => load(K.STATS_OVERRIDE, {}));
  const [workstreams,   setWorkstreams]   = useState(() => load(K.WORKSTREAMS,     CONFIG.workstreams));
  const [briefPrompt,   setBriefPrompt]   = useState(() => load(K.PROMPT,          CONFIG.briefPromptTemplate));

  // Sync each slice to localStorage on change
  useEffect(() => { persist(K.ENTRIES,        entries);       }, [entries]);
  useEffect(() => { persist(K.MILESTONES,     milestones);    }, [milestones]);
  useEffect(() => { persist(K.IMPACT,         impactMoments); }, [impactMoments]);
  useEffect(() => { persist(K.PIN,            adminPin);      }, [adminPin]);
  useEffect(() => { persist(K.STATS_OVERRIDE, statsOverride); }, [statsOverride]);
  useEffect(() => { persist(K.WORKSTREAMS,    workstreams);   }, [workstreams]);
  useEffect(() => { persist(K.PROMPT,         briefPrompt);   }, [briefPrompt]);

  // ── Entry CRUD ────────────────────────────────────────────────
  const addEntry = useCallback((data) => {
    const entry = {
      schemaVersion: 1,
      dateLogged: new Date().toISOString(),
      dateCompleted: null,
      sessions: 0,
      hours: 0,
      decisionsInvolved: 0,
      documentsCreated: 0,
      claudeBrief: '',
      notes: '',
      isImpactMarker: false,
      impactLabel: '',
      conversationContext: '',
      tags: [],
      ...data,
      id: genId(),
    };
    setEntries(prev => [entry, ...prev]);
    return entry;
  }, []);

  const updateEntry = useCallback((id, updates) => {
    setEntries(prev => prev.map(e => e.id === id ? { ...e, ...updates } : e));
  }, []);

  const deleteEntry = useCallback((id) => {
    setEntries(prev => prev.filter(e => e.id !== id));
  }, []);

  // ── Milestones ────────────────────────────────────────────────
  const updateMilestone = useCallback((id, updates) => {
    setMilestones(prev => prev.map(m => m.id === id ? { ...m, ...updates } : m));
  }, []);

  const addMilestone = useCallback((data) => {
    const m = {
      id: genId(),
      achieved: false,
      achievedDate: null,
      order: Date.now(),
      ...data,
    };
    setMilestones(prev => [...prev, m]);
  }, []);

  const deleteMilestone = useCallback((id) => {
    setMilestones(prev => prev.filter(m => m.id !== id));
  }, []);

  // ── Impact moments ────────────────────────────────────────────
  const addImpactMoment = useCallback((data) => {
    const moment = {
      id: genId(),
      dateLogged: new Date().toISOString(),
      ...data,
    };
    setImpactMoments(prev => [moment, ...prev]);
    return moment;
  }, []);

  const deleteImpactMoment = useCallback((id) => {
    setImpactMoments(prev => prev.filter(m => m.id !== id));
  }, []);

  // ── Computed stats ────────────────────────────────────────────
  const computedStats = useMemo(() => {
    const sorted = [...entries].sort((a, b) => new Date(a.dateLogged) - new Date(b.dateLogged));
    const firstDate = sorted[0]?.dateLogged;
    return {
      totalSessions:    entries.reduce((s, e) => s + (Number(e.sessions) || 0), 0),
      totalHours:       entries.reduce((s, e) => s + (Number(e.hours) || 0), 0),
      decisionsCount:   entries.reduce((s, e) => s + (Number(e.decisionsInvolved) || 0), 0),
      systemsBuilt:     entries.filter(e => e.size === 'WORKSTREAM').length,
      documentsCreated: entries.reduce((s, e) => s + (Number(e.documentsCreated) || 0), 0),
      daysActive:       firstDate
        ? Math.max(1, Math.ceil((Date.now() - new Date(firstDate)) / 86400000))
        : 0,
    };
  }, [entries]);

  // Stats with manual overrides applied on top
  const stats = useMemo(() => ({
    totalSessions:    statsOverride.totalSessions    ?? computedStats.totalSessions,
    totalHours:       statsOverride.totalHours       ?? computedStats.totalHours,
    decisionsCount:   statsOverride.decisionsCount   ?? computedStats.decisionsCount,
    systemsBuilt:     statsOverride.systemsBuilt     ?? computedStats.systemsBuilt,
    documentsCreated: statsOverride.documentsCreated ?? computedStats.documentsCreated,
    daysActive:       statsOverride.daysActive       ?? computedStats.daysActive,
  }), [computedStats, statsOverride]);

  const value = {
    entries,
    milestones,
    impactMoments,
    adminPin,
    stats,
    computedStats,
    statsOverride,
    workstreams,
    briefPrompt,
    // Actions
    addEntry,
    updateEntry,
    deleteEntry,
    updateMilestone,
    addMilestone,
    deleteMilestone,
    addImpactMoment,
    deleteImpactMoment,
    setAdminPin,
    setStatsOverride,
    setWorkstreams,
    setBriefPrompt,
    setMilestones,
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be inside StoreProvider');
  return ctx;
}
