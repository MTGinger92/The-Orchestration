import React, { useState, useMemo, useRef } from 'react';
import { useStore } from '../store/StoreContext.jsx';
import { CONFIG, buildBriefPrompt } from '../config/orchestration.config.js';

// ── Helpers ────────────────────────────────────────────────────────

function fmtDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' });
}

function fmtDateInput(iso) {
  if (!iso) return '';
  return new Date(iso).toISOString().split('T')[0];
}

const EMPTY_FORM = {
  title: '',
  workstream: '',
  size: 'DELIVERABLE',
  status: 'IN PROGRESS',
  whatWasBuilt: '',
  whatItUnlocked: '',
  sessions: '',
  hours: '',
  decisionsInvolved: '',
  documentsCreated: '',
  conversationContext: '',
  tags: '',
  notes: '',
  isImpactMarker: false,
  impactLabel: '',
};

// ══════════════════════════════════════════════════════════════════
//  PIN GATE
// ══════════════════════════════════════════════════════════════════
function PinGate({ correctPin, onSuccess }) {
  const [digits,   setDigits]   = useState([]);
  const [error,    setError]    = useState('');
  const [shaking,  setShaking]  = useState(false);

  function push(d) {
    if (digits.length >= 4) return;
    const next = [...digits, d];
    setDigits(next);
    setError('');
    if (next.length === 4) {
      setTimeout(() => check(next), 80);
    }
  }

  function pop() {
    setDigits(prev => prev.slice(0, -1));
    setError('');
  }

  function check(ds) {
    if (ds.join('') === correctPin) {
      onSuccess();
    } else {
      setShaking(true);
      setError('Incorrect PIN.');
      setTimeout(() => {
        setDigits([]);
        setShaking(false);
      }, 600);
    }
  }

  const KEYS = ['1','2','3','4','5','6','7','8','9','0'];

  return (
    <div className="pin-gate">
      <div className="pin-label">Admin Access</div>
      <p style={{ fontFamily: 'var(--font-refined)', fontSize: '13px', fontStyle: 'italic', color: 'var(--text-ghost)', marginTop: '-var(--sp-md)' }}>
        Enter your 4-digit PIN
      </p>

      <div className={`pin-dots${shaking ? ' pin-error' : ''}`} style={{ display: 'flex', gap: 'var(--sp-md)' }}>
        {[0,1,2,3].map(i => (
          <div key={i} className={`pin-dot${digits[i] !== undefined ? ' filled' : ''}`} />
        ))}
      </div>

      {error && <div className="pin-error">{error}</div>}

      <div className="pin-keypad">
        {KEYS.slice(0,9).map(d => (
          <button key={d} className="pin-key" onClick={() => push(d)}>{d}</button>
        ))}
        <button className="pin-key del" onClick={pop}>⌫</button>
        <button className="pin-key" onClick={() => push('0')}>0</button>
        <button className="pin-key del" onClick={() => setDigits([])}>C</button>
      </div>

      <p style={{ fontSize: '10px', color: 'var(--text-ghost)', marginTop: 'var(--sp-sm)' }}>
        Default PIN: 1936
      </p>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
//  LOG ENTRY FORM
// ══════════════════════════════════════════════════════════════════
function LogEntryForm({ workstreams, onEntryLogged }) {
  const { addEntry, updateEntry, briefPrompt } = useStore();
  const [form,     setForm]     = useState({ ...EMPTY_FORM, workstream: workstreams[0]?.id ?? '' });
  const [errors,   setErrors]   = useState({});
  const [saving,   setSaving]   = useState(false);
  const [success,  setSuccess]  = useState('');
  const [apiError, setApiError] = useState('');

  function set(key, val) {
    setForm(f => ({ ...f, [key]: val }));
    setErrors(e => ({ ...e, [key]: '' }));
  }

  function validate() {
    const errs = {};
    if (!form.title.trim())         errs.title         = 'Required';
    if (!form.workstream)           errs.workstream     = 'Required';
    if (!form.size)                 errs.size           = 'Required';
    if (!form.status)               errs.status         = 'Required';
    if (!form.whatWasBuilt.trim())  errs.whatWasBuilt   = 'Required';
    if (!form.whatItUnlocked.trim()) errs.whatItUnlocked = 'Required';
    return errs;
  }

  async function handleSave() {
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setSaving(true);
    setApiError('');

    const entryData = {
      title:             form.title.trim(),
      workstream:        form.workstream,
      size:              form.size,
      status:            form.status,
      whatWasBuilt:      form.whatWasBuilt.trim(),
      whatItUnlocked:    form.whatItUnlocked.trim(),
      sessions:          Number(form.sessions) || 0,
      hours:             Number(form.hours) || 0,
      decisionsInvolved: Number(form.decisionsInvolved) || 0,
      documentsCreated:  Number(form.documentsCreated) || 0,
      conversationContext: form.conversationContext.trim(),
      notes:             form.notes.trim(),
      isImpactMarker:    form.isImpactMarker,
      impactLabel:       form.impactLabel.trim(),
      tags:              form.tags.split(',').map(t => t.trim()).filter(Boolean),
    };

    const entry = addEntry(entryData);

    // Generate brief via API
    try {
      const prompt = buildBriefPrompt(briefPrompt, entry);
      const res = await fetch('/api/generate-brief', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });
      const data = await res.json();
      if (res.ok && data.brief) {
        updateEntry(entry.id, { claudeBrief: data.brief });
      } else {
        setApiError(`Brief not generated: ${data.error || 'API error'}. Entry saved — regenerate from Edit Entries.`);
      }
    } catch (err) {
      setApiError(`Brief not generated: ${err.message}. Entry saved — regenerate from Edit Entries.`);
    }

    setSaving(false);
    setSuccess(`"${entry.title}" logged to the Ledger.`);
    setForm({ ...EMPTY_FORM, workstream: workstreams[0]?.id ?? '' });
    if (onEntryLogged) onEntryLogged(entry);
    setTimeout(() => setSuccess(''), 5000);
  }

  const F = ({ label, required, error, children }) => (
    <div className="form-field">
      <label className={`form-label${required ? ' required' : ''}`}>{label}</label>
      {children}
      {error && <span style={{ fontSize: '10px', color: 'rgba(220,100,80,0.9)' }}>{error}</span>}
    </div>
  );

  return (
    <div>
      <div className="form-section-title">Log New Entry</div>

      {success && (
        <div style={{
          background: 'rgba(50,110,110,0.12)',
          border: 'var(--border-teal)',
          borderRadius: 'var(--r-md)',
          padding: 'var(--sp-md)',
          marginBottom: 'var(--sp-lg)',
          color: 'var(--teal-warm)',
          fontSize: '13px',
        }}>
          ✓ {success}
        </div>
      )}

      {apiError && (
        <div style={{
          background: 'rgba(196,168,122,0.08)',
          border: 'var(--border-gold)',
          borderRadius: 'var(--r-md)',
          padding: 'var(--sp-md)',
          marginBottom: 'var(--sp-lg)',
          color: 'var(--gold)',
          fontSize: '12px',
        }}>
          {apiError}
        </div>
      )}

      {/* Required fields */}
      <div className="form-row full">
        <F label="Title" required error={errors.title}>
          <input
            className="form-input"
            placeholder="What was built or done?"
            value={form.title}
            onChange={e => set('title', e.target.value)}
          />
        </F>
      </div>

      <div className="form-row">
        <F label="Workstream" required error={errors.workstream}>
          <select
            className="form-select"
            value={form.workstream}
            onChange={e => set('workstream', e.target.value)}
          >
            {workstreams.map(ws => (
              <option key={ws.id} value={ws.id}>{ws.label}</option>
            ))}
          </select>
        </F>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--sp-md)' }}>
          <F label="Size" required error={errors.size}>
            <select className="form-select" value={form.size} onChange={e => set('size', e.target.value)}>
              {CONFIG.sizes.map(s => <option key={s}>{s}</option>)}
            </select>
          </F>
          <F label="Status" required error={errors.status}>
            <select className="form-select" value={form.status} onChange={e => set('status', e.target.value)}>
              {CONFIG.statuses.map(s => <option key={s}>{s}</option>)}
            </select>
          </F>
        </div>
      </div>

      <div className="form-row full">
        <F label="What Was Built" required error={errors.whatWasBuilt}>
          <textarea
            className="form-textarea"
            placeholder="1–3 sentences describing what was built or completed."
            value={form.whatWasBuilt}
            onChange={e => set('whatWasBuilt', e.target.value)}
            rows={3}
          />
        </F>
      </div>

      <div className="form-row full">
        <F label="What It Unlocked" required error={errors.whatItUnlocked}>
          <textarea
            className="form-textarea"
            placeholder="What did this make possible? What did it open the door to?"
            value={form.whatItUnlocked}
            onChange={e => set('whatItUnlocked', e.target.value)}
            rows={2}
          />
        </F>
      </div>

      <hr className="form-divider" />

      {/* Effort data */}
      <div className="form-row four">
        {[
          { key: 'sessions',          label: 'Sessions' },
          { key: 'hours',             label: 'Hours' },
          { key: 'decisionsInvolved', label: 'Decisions' },
          { key: 'documentsCreated',  label: 'Documents' },
        ].map(({ key, label }) => (
          <F key={key} label={label}>
            <input
              className="form-input"
              type="number"
              min="0"
              placeholder="0"
              value={form[key]}
              onChange={e => set(key, e.target.value)}
            />
          </F>
        ))}
      </div>

      <hr className="form-divider" />

      {/* Optional narrative */}
      <div className="form-row full">
        <F label="Conversation Context (optional)">
          <textarea
            className="form-textarea"
            placeholder="Paste relevant chat excerpt to give Claude more context for the brief…"
            value={form.conversationContext}
            onChange={e => set('conversationContext', e.target.value)}
            rows={3}
          />
        </F>
      </div>

      <div className="form-row full">
        <F label="Notes (optional)">
          <textarea
            className="form-textarea"
            placeholder="Freeform notes, anything that doesn't fit elsewhere…"
            value={form.notes}
            onChange={e => set('notes', e.target.value)}
            rows={2}
          />
        </F>
      </div>

      <div className="form-row">
        <F label="Tags (optional, comma-separated)">
          <input
            className="form-input"
            placeholder="e.g. foundation, grant, system"
            value={form.tags}
            onChange={e => set('tags', e.target.value)}
          />
        </F>
        <div>
          <label className="form-label" style={{ marginBottom: 'var(--sp-sm)', display: 'block' }}>Impact Marker</label>
          <label className="form-checkbox-row">
            <input
              type="checkbox"
              checked={form.isImpactMarker}
              onChange={e => set('isImpactMarker', e.target.checked)}
            />
            <span style={{ fontSize: '13px', color: 'var(--text-body)' }}>
              Flag as Impact Moment
            </span>
          </label>
          {form.isImpactMarker && (
            <input
              className="form-input"
              placeholder="Short label for Overview display…"
              value={form.impactLabel}
              onChange={e => set('impactLabel', e.target.value)}
              style={{ marginTop: 'var(--sp-sm)' }}
            />
          )}
        </div>
      </div>

      <div className="form-actions">
        <button
          className="btn btn-primary"
          onClick={handleSave}
          disabled={saving}
          style={{ fontSize: '11px', padding: '10px 24px' }}
        >
          {saving ? <><span className="spinner" style={{ marginRight: '6px' }} />Saving & Generating Brief…</> : 'Log to The Orchestration →'}
        </button>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
//  EDIT ENTRIES
// ══════════════════════════════════════════════════════════════════
function EditEntries({ workstreams }) {
  const { entries, updateEntry, deleteEntry, briefPrompt } = useStore();
  const [search,       setSearch]       = useState('');
  const [expandedId,   setExpandedId]   = useState(null);
  const [editData,     setEditData]     = useState({});
  const [confirmDel,   setConfirmDel]   = useState(null);
  const [generatingId, setGeneratingId] = useState(null);
  const [briefError,   setBriefError]   = useState('');

  const filtered = useMemo(() =>
    entries.filter(e =>
      !search || e.title?.toLowerCase().includes(search.toLowerCase())
    ),
    [entries, search]
  );

  function toggleExpand(id) {
    if (expandedId === id) {
      setExpandedId(null);
    } else {
      const entry = entries.find(e => e.id === id);
      setEditData({ ...entry });
      setExpandedId(id);
      setBriefError('');
    }
  }

  function saveEdit(id) {
    updateEntry(id, editData);
    setExpandedId(null);
  }

  async function genBrief(entry) {
    setGeneratingId(entry.id);
    setBriefError('');
    try {
      const prompt = buildBriefPrompt(briefPrompt, editData.id === entry.id ? { ...entry, ...editData } : entry);
      const res = await fetch('/api/generate-brief', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'API error');
      updateEntry(entry.id, { claudeBrief: data.brief });
      if (editData.id === entry.id) setEditData(d => ({ ...d, claudeBrief: data.brief }));
    } catch (err) {
      setBriefError(err.message);
    } finally {
      setGeneratingId(null);
    }
  }

  const ws = id => workstreams.find(w => w.id === id);

  return (
    <div>
      <div className="form-section-title">Edit Entries</div>

      <input
        className="form-input"
        placeholder="Search entries…"
        value={search}
        onChange={e => setSearch(e.target.value)}
        style={{ marginBottom: 'var(--sp-lg)', maxWidth: '400px' }}
      />

      {filtered.length === 0 && (
        <p style={{ color: 'var(--text-ghost)', fontStyle: 'italic', fontFamily: 'var(--font-refined)' }}>
          {entries.length === 0 ? 'No entries logged yet.' : 'No matches.'}
        </p>
      )}

      {filtered.map(entry => {
        const expanded = expandedId === entry.id;
        const wsInfo = ws(entry.workstream);

        return (
          <div key={entry.id} className={`entry-list-item${expanded ? ' expanded' : ''}`}>
            {/* Summary row */}
            <div onClick={() => toggleExpand(entry.id)}>
              <div className="entry-list-title">{entry.title}</div>
              <div className="entry-list-meta">
                <span style={{ fontSize: '10px', color: wsInfo?.color ?? 'var(--text-muted)' }}>
                  {wsInfo?.label ?? entry.workstream}
                </span>
                <span className={`badge badge-${entry.status?.toLowerCase().replace(/ /g,'-')}`}>
                  {entry.status}
                </span>
                <span className="badge badge-size">{entry.size}</span>
                <span style={{ fontSize: '10px', color: 'var(--text-ghost)' }}>
                  {fmtDate(entry.dateLogged)}
                </span>
                {!entry.claudeBrief && (
                  <span style={{ fontSize: '9px', color: 'var(--gold)', letterSpacing: '0.1em' }}>
                    NO BRIEF
                  </span>
                )}
              </div>
            </div>

            {/* Expanded edit form */}
            {expanded && (
              <div style={{ marginTop: 'var(--sp-md)', borderTop: 'var(--border-subtle)', paddingTop: 'var(--sp-md)' }}>

                <div className="form-row">
                  <div className="form-field">
                    <label className="form-label">Title</label>
                    <input
                      className="form-input"
                      value={editData.title || ''}
                      onChange={e => setEditData(d => ({ ...d, title: e.target.value }))}
                    />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--sp-sm)' }}>
                    <div className="form-field">
                      <label className="form-label">Workstream</label>
                      <select
                        className="form-select"
                        value={editData.workstream || ''}
                        onChange={e => setEditData(d => ({ ...d, workstream: e.target.value }))}
                      >
                        {workstreams.map(w => <option key={w.id} value={w.id}>{w.label.split('&')[0].trim()}</option>)}
                      </select>
                    </div>
                    <div className="form-field">
                      <label className="form-label">Size</label>
                      <select
                        className="form-select"
                        value={editData.size || ''}
                        onChange={e => setEditData(d => ({ ...d, size: e.target.value }))}
                      >
                        {CONFIG.sizes.map(s => <option key={s}>{s}</option>)}
                      </select>
                    </div>
                    <div className="form-field">
                      <label className="form-label">Status</label>
                      <select
                        className="form-select"
                        value={editData.status || ''}
                        onChange={e => setEditData(d => ({ ...d, status: e.target.value }))}
                      >
                        {CONFIG.statuses.map(s => <option key={s}>{s}</option>)}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="form-row full" style={{ marginTop: 'var(--sp-sm)' }}>
                  <div className="form-field">
                    <label className="form-label">Legacy Brief</label>
                    <textarea
                      className="form-textarea"
                      value={editData.claudeBrief || ''}
                      onChange={e => setEditData(d => ({ ...d, claudeBrief: e.target.value }))}
                      rows={3}
                      placeholder="Auto-generated by Claude. Edit or regenerate below."
                    />
                  </div>
                </div>

                <div className="form-row full" style={{ marginTop: 'var(--sp-sm)' }}>
                  <div className="form-field">
                    <label className="form-label">What Was Built</label>
                    <textarea
                      className="form-textarea"
                      value={editData.whatWasBuilt || ''}
                      onChange={e => setEditData(d => ({ ...d, whatWasBuilt: e.target.value }))}
                      rows={2}
                    />
                  </div>
                </div>

                <div className="form-row full" style={{ marginTop: 'var(--sp-sm)' }}>
                  <div className="form-field">
                    <label className="form-label">What It Unlocked</label>
                    <textarea
                      className="form-textarea"
                      value={editData.whatItUnlocked || ''}
                      onChange={e => setEditData(d => ({ ...d, whatItUnlocked: e.target.value }))}
                      rows={2}
                    />
                  </div>
                </div>

                <div className="form-row four" style={{ marginTop: 'var(--sp-sm)' }}>
                  {[
                    { key: 'sessions',          label: 'Sessions' },
                    { key: 'hours',             label: 'Hours' },
                    { key: 'decisionsInvolved', label: 'Decisions' },
                    { key: 'documentsCreated',  label: 'Documents' },
                  ].map(({ key, label }) => (
                    <div key={key} className="form-field">
                      <label className="form-label">{label}</label>
                      <input
                        className="form-input"
                        type="number"
                        min="0"
                        value={editData[key] ?? 0}
                        onChange={e => setEditData(d => ({ ...d, [key]: Number(e.target.value) }))}
                      />
                    </div>
                  ))}
                </div>

                <div className="form-row full" style={{ marginTop: 'var(--sp-sm)' }}>
                  <div className="form-field">
                    <label className="form-label">Notes</label>
                    <textarea
                      className="form-textarea"
                      value={editData.notes || ''}
                      onChange={e => setEditData(d => ({ ...d, notes: e.target.value }))}
                      rows={2}
                    />
                  </div>
                </div>

                {briefError && (
                  <p style={{ fontSize: '11px', color: 'rgba(220,100,80,0.9)', marginBottom: 'var(--sp-sm)' }}>
                    {briefError}
                  </p>
                )}

                <div style={{ display: 'flex', gap: 'var(--sp-sm)', marginTop: 'var(--sp-md)', flexWrap: 'wrap' }}>
                  <button className="btn btn-primary btn-sm" onClick={() => saveEdit(entry.id)}>
                    Save Changes
                  </button>
                  <button
                    className="btn btn-gold btn-sm"
                    onClick={() => genBrief(entry)}
                    disabled={generatingId === entry.id}
                  >
                    {generatingId === entry.id
                      ? <><span className="spinner" style={{ marginRight: '4px' }} />Generating…</>
                      : '✦ Regenerate Brief'
                    }
                  </button>
                  <button className="btn btn-ghost btn-sm" onClick={() => setExpandedId(null)}>
                    Cancel
                  </button>
                  <button
                    className="btn btn-danger btn-sm"
                    style={{ marginLeft: 'auto' }}
                    onClick={() => setConfirmDel(entry.id)}
                  >
                    Delete
                  </button>
                </div>

                {confirmDel === entry.id && (
                  <div style={{
                    marginTop: 'var(--sp-sm)',
                    padding: 'var(--sp-sm) var(--sp-md)',
                    background: 'rgba(220,80,60,0.07)',
                    border: '1px solid rgba(220,80,60,0.2)',
                    borderRadius: 'var(--r-md)',
                    fontSize: '12px',
                    color: 'var(--linen-muted)',
                  }}>
                    Delete "{entry.title}" permanently?
                    <div style={{ display: 'flex', gap: 'var(--sp-sm)', marginTop: 'var(--sp-sm)' }}>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => { deleteEntry(entry.id); setConfirmDel(null); setExpandedId(null); }}
                      >
                        Yes, Delete
                      </button>
                      <button className="btn btn-ghost btn-sm" onClick={() => setConfirmDel(null)}>
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
//  MILESTONE MANAGER
// ══════════════════════════════════════════════════════════════════
function MilestoneManager() {
  const { milestones, updateMilestone, addMilestone, deleteMilestone } = useStore();
  const [newPhase, setNewPhase] = useState('');
  const [newLabel, setNewLabel] = useState('');
  const [adding,   setAdding]   = useState(false);

  // Group by phase
  const phases = [];
  const phaseMap = {};
  milestones
    .slice()
    .sort((a, b) => a.order - b.order)
    .forEach(m => {
      if (!phaseMap[m.phase]) { phaseMap[m.phase] = []; phases.push(m.phase); }
      phaseMap[m.phase].push(m);
    });

  return (
    <div>
      <div className="form-section-title">Milestone Manager</div>
      <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: 'var(--sp-xl)', lineHeight: 1.6 }}>
        Toggle milestones as achieved and record the date. Gold dot = achieved, teal dot = pending. These appear in the Overview Impact Markers panel.
      </p>

      {phases.map(phase => (
        <div key={phase} className="milestone-phase-section">
          <div className="milestone-phase-title">{phase}</div>
          {phaseMap[phase].map(m => (
            <div key={m.id} className="milestone-item">
              <button
                className={`milestone-toggle${m.achieved ? ' achieved' : ''}`}
                onClick={() => updateMilestone(m.id, {
                  achieved: !m.achieved,
                  achievedDate: !m.achieved ? new Date().toISOString() : null,
                })}
                title={m.achieved ? 'Mark pending' : 'Mark achieved'}
              >
                {m.achieved ? '✓' : ''}
              </button>

              <div className={`milestone-item-label${m.achieved ? ' achieved' : ''}`}>
                {m.label}
              </div>

              <input
                type="date"
                className="milestone-date-input"
                value={m.achievedDate ? fmtDateInput(m.achievedDate) : ''}
                onChange={e => updateMilestone(m.id, {
                  achievedDate: e.target.value ? new Date(e.target.value + 'T12:00:00').toISOString() : null,
                  achieved: !!e.target.value,
                })}
              />

              <button
                className="btn btn-danger btn-sm"
                style={{ padding: '3px 8px', fontSize: '9px' }}
                onClick={() => deleteMilestone(m.id)}
                title="Delete milestone"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      ))}

      {/* Add new milestone */}
      <div style={{ marginTop: 'var(--sp-xl)', borderTop: 'var(--border-subtle)', paddingTop: 'var(--sp-xl)' }}>
        <div style={{ color: 'var(--teal-warm)', letterSpacing: '0.16em', textTransform: 'uppercase', fontSize: '9px', fontWeight: 500, marginBottom: 'var(--sp-md)' }}>
          Add Milestone
        </div>
        {adding ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-sm)', maxWidth: '520px' }}>
            <input
              className="form-input"
              placeholder="Phase name (e.g. NOW — Commerce Live)"
              value={newPhase}
              onChange={e => setNewPhase(e.target.value)}
            />
            <input
              className="form-input"
              placeholder="Milestone label"
              value={newLabel}
              onChange={e => setNewLabel(e.target.value)}
            />
            <div style={{ display: 'flex', gap: 'var(--sp-sm)' }}>
              <button
                className="btn btn-primary btn-sm"
                onClick={() => {
                  if (!newLabel.trim()) return;
                  addMilestone({ phase: newPhase.trim() || 'Custom', label: newLabel.trim() });
                  setNewLabel('');
                  setNewPhase('');
                  setAdding(false);
                }}
              >
                Add
              </button>
              <button className="btn btn-ghost btn-sm" onClick={() => setAdding(false)}>Cancel</button>
            </div>
          </div>
        ) : (
          <button className="btn btn-ghost btn-sm" onClick={() => setAdding(true)}>
            + Add Milestone
          </button>
        )}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
//  CONFIG EDITOR
// ══════════════════════════════════════════════════════════════════
function ConfigEditor() {
  const { workstreams, setWorkstreams, briefPrompt, setBriefPrompt, adminPin, setAdminPin } = useStore();
  const [prompt,    setPrompt]    = useState(briefPrompt);
  const [pin1,      setPin1]      = useState('');
  const [pin2,      setPin2]      = useState('');
  const [pinMsg,    setPinMsg]    = useState('');
  const [promptMsg, setPromptMsg] = useState('');

  function saveWs(id, key, val) {
    setWorkstreams(prev => prev.map(w => w.id === id ? { ...w, [key]: val } : w));
  }

  function savePrompt() {
    setBriefPrompt(prompt);
    setPromptMsg('Prompt saved.');
    setTimeout(() => setPromptMsg(''), 3000);
  }

  function resetPrompt() {
    setPrompt(CONFIG.briefPromptTemplate);
    setBriefPrompt(CONFIG.briefPromptTemplate);
    setPromptMsg('Reset to default.');
    setTimeout(() => setPromptMsg(''), 3000);
  }

  function changePin() {
    if (pin1.length !== 4 || !/^\d{4}$/.test(pin1)) { setPinMsg('PIN must be exactly 4 digits.'); return; }
    if (pin1 !== pin2) { setPinMsg('PINs do not match.'); return; }
    setAdminPin(pin1);
    setPinMsg('PIN updated.');
    setPin1('');
    setPin2('');
    setTimeout(() => setPinMsg(''), 3000);
  }

  return (
    <div>
      <div className="form-section-title">Config Editor</div>

      {/* Workstreams */}
      <div style={{ marginBottom: 'var(--sp-xl)' }}>
        <div className="form-label" style={{ marginBottom: 'var(--sp-md)', fontSize: '10px' }}>
          Workstream Categories
        </div>
        {workstreams.map(ws => (
          <div key={ws.id} className="config-ws-item">
            <div className="config-color-swatch" style={{ background: ws.color }} />
            <input
              className="form-input"
              value={ws.label}
              onChange={e => saveWs(ws.id, 'label', e.target.value)}
              style={{ flex: 1 }}
            />
            <div className="form-field" style={{ flexDirection: 'row', alignItems: 'center', gap: 'var(--sp-xs)' }}>
              <label className="form-label" style={{ whiteSpace: 'nowrap', marginBottom: 0 }}>Color</label>
              <input
                type="color"
                value={ws.color}
                onChange={e => saveWs(ws.id, 'color', e.target.value)}
                style={{
                  background: 'var(--surface-card)',
                  border: 'var(--border-subtle)',
                  borderRadius: 'var(--r-sm)',
                  width: '40px',
                  height: '28px',
                  cursor: 'pointer',
                  padding: '2px',
                }}
              />
            </div>
          </div>
        ))}
      </div>

      <hr className="form-divider" />

      {/* Brief prompt template */}
      <div style={{ marginBottom: 'var(--sp-xl)' }}>
        <div className="form-label" style={{ marginBottom: 'var(--sp-sm)', fontSize: '10px' }}>
          Brief Generation Prompt Template
        </div>
        <p style={{ fontSize: '11px', color: 'var(--text-ghost)', marginBottom: 'var(--sp-sm)' }}>
          Use {'{{title}}'}, {'{{workstream}}'}, {'{{size}}'}, {'{{whatWasBuilt}}'}, {'{{whatItUnlocked}}'}, {'{{conversationContext}}'} as placeholders.
        </p>
        <textarea
          className="form-textarea"
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          rows={14}
          style={{ fontFamily: 'monospace', fontSize: '12px', lineHeight: 1.55 }}
        />
        {promptMsg && (
          <p style={{ fontSize: '11px', color: 'var(--teal-warm)', marginTop: 'var(--sp-xs)' }}>{promptMsg}</p>
        )}
        <div style={{ display: 'flex', gap: 'var(--sp-sm)', marginTop: 'var(--sp-sm)' }}>
          <button className="btn btn-primary btn-sm" onClick={savePrompt}>Save Prompt</button>
          <button className="btn btn-ghost btn-sm" onClick={resetPrompt}>Reset to Default</button>
        </div>
      </div>

      <hr className="form-divider" />

      {/* Change PIN */}
      <div>
        <div className="form-label" style={{ marginBottom: 'var(--sp-md)', fontSize: '10px' }}>
          Change Admin PIN
        </div>
        <div style={{ display: 'flex', gap: 'var(--sp-md)', alignItems: 'flex-end', maxWidth: '360px' }}>
          <div className="form-field">
            <label className="form-label">New PIN (4 digits)</label>
            <input
              className="form-input"
              type="password"
              maxLength={4}
              placeholder="• • • •"
              value={pin1}
              onChange={e => setPin1(e.target.value.replace(/\D/g, '').slice(0, 4))}
            />
          </div>
          <div className="form-field">
            <label className="form-label">Confirm PIN</label>
            <input
              className="form-input"
              type="password"
              maxLength={4}
              placeholder="• • • •"
              value={pin2}
              onChange={e => setPin2(e.target.value.replace(/\D/g, '').slice(0, 4))}
              onKeyDown={e => e.key === 'Enter' && changePin()}
            />
          </div>
          <button className="btn btn-gold btn-sm" onClick={changePin} style={{ marginBottom: '1px' }}>
            Update PIN
          </button>
        </div>
        {pinMsg && (
          <p style={{ fontSize: '11px', color: pinMsg.includes('updated') ? 'var(--teal-warm)' : 'rgba(220,100,80,0.9)', marginTop: 'var(--sp-xs)' }}>
            {pinMsg}
          </p>
        )}
        <p style={{ fontSize: '11px', color: 'var(--text-ghost)', marginTop: 'var(--sp-sm)' }}>
          Current PIN: {adminPin.split('').map(() => '●').join('')}
        </p>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
//  STATS OVERRIDE
// ══════════════════════════════════════════════════════════════════
function StatsOverride() {
  const { computedStats, statsOverride, setStatsOverride } = useStore();

  const DEFS = [
    { key: 'totalSessions',    label: 'Total Sessions'    },
    { key: 'totalHours',       label: 'Estimated Hours'   },
    { key: 'decisionsCount',   label: 'Decisions Made'    },
    { key: 'systemsBuilt',     label: 'Systems Built'     },
    { key: 'documentsCreated', label: 'Documents Created' },
    { key: 'daysActive',       label: 'Days Active'       },
  ];

  function setOverride(key, val) {
    setStatsOverride(prev => ({ ...prev, [key]: val === '' ? undefined : Number(val) }));
  }

  function clearOverride(key) {
    setStatsOverride(prev => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }

  function clearAll() {
    setStatsOverride({});
  }

  return (
    <div>
      <div className="form-section-title">Stats Override</div>
      <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: 'var(--sp-xl)', lineHeight: 1.6 }}>
        Override any auto-calculated stat. Leave blank to use the computed value. Overrides persist until cleared. These numbers display on the Overview.
      </p>

      <div className="stats-override-grid">
        {DEFS.map(({ key, label }) => (
          <div key={key} className="override-cell">
            <div className="form-label" style={{ marginBottom: 'var(--sp-sm)' }}>{label}</div>
            <div style={{ display: 'flex', gap: 'var(--sp-sm)', alignItems: 'center' }}>
              <input
                className="form-input"
                type="number"
                min="0"
                placeholder={`${computedStats[key]} (computed)`}
                value={statsOverride[key] ?? ''}
                onChange={e => setOverride(key, e.target.value)}
                style={{ flex: 1 }}
              />
              {statsOverride[key] !== undefined && (
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => clearOverride(key)}
                  title="Use computed value"
                  style={{ padding: '6px 8px' }}
                >
                  ✕
                </button>
              )}
            </div>
            <div className="override-computed">
              Computed: {computedStats[key].toLocaleString()}
              {statsOverride[key] !== undefined && (
                <span style={{ color: 'var(--gold)', marginLeft: '6px' }}>→ Override: {statsOverride[key]}</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {Object.keys(statsOverride).length > 0 && (
        <button
          className="btn btn-ghost btn-sm"
          style={{ marginTop: 'var(--sp-xl)' }}
          onClick={clearAll}
        >
          Clear All Overrides
        </button>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
//  ADMIN PANEL — Main Export
// ══════════════════════════════════════════════════════════════════
const TABS = [
  { id: 'log',        label: 'Log Entry'      },
  { id: 'edit',       label: 'Edit Entries'   },
  { id: 'milestones', label: 'Milestones'     },
  { id: 'config',     label: 'Config'         },
  { id: 'stats',      label: 'Stats Override' },
];

export default function AdminPanel({ onClose }) {
  const { adminPin, workstreams } = useStore();
  const [authenticated, setAuthenticated] = useState(false);
  const [activeTab,     setActiveTab]     = useState('log');

  return (
    <div className="admin-overlay">
      <div className="admin-header">
        <span className="admin-title">
          The Orchestration — Admin
        </span>

        <div style={{ display: 'flex', gap: 'var(--sp-sm)', alignItems: 'center' }}>
          {authenticated && (
            <button
              className="admin-log-btn"
              onClick={() => setActiveTab('log')}
              style={{ display: activeTab === 'log' ? 'none' : undefined }}
            >
              + Log Entry
            </button>
          )}
          <button className="admin-close" onClick={onClose} aria-label="Close admin">✕</button>
        </div>
      </div>

      {!authenticated ? (
        <PinGate correctPin={adminPin} onSuccess={() => setAuthenticated(true)} />
      ) : (
        <>
          <div className="admin-tabs">
            {TABS.map(tab => (
              <button
                key={tab.id}
                className={`admin-tab${activeTab === tab.id ? ' active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="admin-body">
            {activeTab === 'log'        && <LogEntryForm workstreams={workstreams} onEntryLogged={() => {}} />}
            {activeTab === 'edit'       && <EditEntries  workstreams={workstreams} />}
            {activeTab === 'milestones' && <MilestoneManager />}
            {activeTab === 'config'     && <ConfigEditor />}
            {activeTab === 'stats'      && <StatsOverride />}
          </div>
        </>
      )}
    </div>
  );
}
