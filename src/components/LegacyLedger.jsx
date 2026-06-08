import React, { useState } from 'react';
import { useStore } from '../store/StoreContext.jsx';
import { buildBriefPrompt } from '../config/orchestration.config.js';

function fmtDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

function statusKey(status) {
  return status?.toLowerCase().replace(/ /g, '-') || '';
}

export default function LegacyLedger({ entry, onClose }) {
  const { updateEntry, addImpactMoment, workstreams, briefPrompt } = useStore();

  const [editing,          setEditing]          = useState(false);
  const [editData,         setEditData]         = useState({});
  const [showImpactForm,   setShowImpactForm]   = useState(false);
  const [impactLabel,      setImpactLabel]      = useState('');
  const [generatingBrief,  setGeneratingBrief]  = useState(false);
  const [briefError,       setBriefError]       = useState('');
  const [showConfirmDel,   setShowConfirmDel]   = useState(false);

  const ws = workstreams.find(w => w.id === entry.workstream);
  const sc = statusKey(entry.status);

  function startEdit() {
    setEditData({ ...entry });
    setEditing(true);
  }

  function cancelEdit() {
    setEditing(false);
    setEditData({});
  }

  function saveEdit() {
    updateEntry(entry.id, editData);
    setEditing(false);
  }

  function markComplete() {
    updateEntry(entry.id, {
      status: 'COMPLETE',
      dateCompleted: new Date().toISOString(),
    });
  }

  function logImpact() {
    if (!impactLabel.trim()) return;
    addImpactMoment({ label: impactLabel.trim(), entryId: entry.id });
    updateEntry(entry.id, { isImpactMarker: true, impactLabel: impactLabel.trim() });
    setImpactLabel('');
    setShowImpactForm(false);
  }

  async function generateBrief() {
    setGeneratingBrief(true);
    setBriefError('');
    try {
      const prompt = buildBriefPrompt(briefPrompt, entry);
      const res = await fetch('/api/generate-brief', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'API error');
      updateEntry(entry.id, { claudeBrief: data.brief });
    } catch (err) {
      setBriefError(err.message);
    } finally {
      setGeneratingBrief(false);
    }
  }

  function setField(key, val) {
    setEditData(d => ({ ...d, [key]: val }));
  }

  return (
    <>
      <div className="ledger-overlay-bg" onClick={onClose} />

      <div className="ledger-panel">

        {/* ── HEADER ─────────────────────────────────────── */}
        <div className="ledger-header">
          <button className="ledger-close" onClick={onClose} aria-label="Close">✕</button>

          <div className="ledger-title-row">
            <div className="ledger-title">
              {editing
                ? <input
                    className="form-input"
                    value={editData.title || ''}
                    onChange={e => setField('title', e.target.value)}
                    style={{ fontSize: '18px', fontFamily: 'var(--font-display)' }}
                  />
                : entry.title
              }
            </div>
            <div className="ledger-badges">
              {editing
                ? <select
                    className="form-select"
                    value={editData.size || ''}
                    onChange={e => setField('size', e.target.value)}
                    style={{ fontSize: '10px', padding: '3px 20px 3px 6px', width: 'auto' }}
                  >
                    {['WORKSTREAM', 'DELIVERABLE', 'SESSION'].map(s =>
                      <option key={s}>{s}</option>
                    )}
                  </select>
                : <span className="badge badge-size">{entry.size}</span>
              }
              {editing
                ? <select
                    className="form-select"
                    value={editData.status || ''}
                    onChange={e => setField('status', e.target.value)}
                    style={{ fontSize: '10px', padding: '3px 20px 3px 6px', width: 'auto' }}
                  >
                    {['COMPLETE', 'IN PROGRESS', 'BLOCKED'].map(s =>
                      <option key={s}>{s}</option>
                    )}
                  </select>
                : <span className={`badge badge-${sc}`}>{entry.status}</span>
              }
            </div>
          </div>

          <div className="ledger-meta">
            <span style={{ color: ws?.color ?? 'var(--text-muted)' }}>
              {ws?.label ?? entry.workstream}
            </span>
            <span>
              {fmtDate(entry.dateLogged)}
              {entry.dateCompleted && ` · Completed ${fmtDate(entry.dateCompleted)}`}
            </span>
          </div>
        </div>

        {/* ── BODY ───────────────────────────────────────── */}
        <div className="ledger-body">

          {/* WHAT WAS BUILT */}
          <section>
            <div className="ledger-section-label">What Was Built</div>
            {editing
              ? <textarea
                  className="form-textarea"
                  value={editData.whatWasBuilt || ''}
                  onChange={e => setField('whatWasBuilt', e.target.value)}
                  rows={3}
                />
              : <p className="ledger-text">{entry.whatWasBuilt || <Em>Not recorded.</Em>}</p>
            }
          </section>

          <hr className="ledger-section-divider" />

          {/* LEGACY BRIEF */}
          <section>
            <div className="ledger-section-label">Legacy Brief</div>
            {editing
              ? <textarea
                  className="form-textarea"
                  value={editData.claudeBrief || ''}
                  onChange={e => setField('claudeBrief', e.target.value)}
                  rows={4}
                  placeholder="Edit the auto-generated brief, or leave to regenerate…"
                />
              : entry.claudeBrief
                ? <p className="ledger-brief">{entry.claudeBrief}</p>
                : <NoBrief generating={generatingBrief} error={briefError} onGenerate={generateBrief} />
            }
          </section>

          <hr className="ledger-section-divider" />

          {/* WHAT IT UNLOCKED */}
          <section>
            <div className="ledger-section-label">What It Unlocked</div>
            {editing
              ? <textarea
                  className="form-textarea"
                  value={editData.whatItUnlocked || ''}
                  onChange={e => setField('whatItUnlocked', e.target.value)}
                  rows={2}
                />
              : <p className="ledger-text">{entry.whatItUnlocked || <Em>Not recorded.</Em>}</p>
            }
          </section>

          <hr className="ledger-section-divider" />

          {/* EFFORT DATA */}
          <section>
            <div className="ledger-section-label">Effort Data</div>
            <div className="ledger-effort-grid">
              {[
                { key: 'sessions',          label: 'Sessions'   },
                { key: 'hours',             label: 'Hours'      },
                { key: 'decisionsInvolved', label: 'Decisions'  },
                { key: 'documentsCreated',  label: 'Documents'  },
              ].map(({ key, label }) => (
                <div key={key} className="ledger-effort-cell">
                  {editing
                    ? <input
                        className="form-input"
                        type="number"
                        min="0"
                        value={editData[key] ?? 0}
                        onChange={e => setField(key, Number(e.target.value))}
                        style={{ textAlign: 'center', padding: '4px', fontSize: '18px' }}
                      />
                    : <div className="ledger-effort-value">{entry[key] || 0}</div>
                  }
                  <div className="ledger-effort-key">{label}</div>
                </div>
              ))}
            </div>
          </section>

          <hr className="ledger-section-divider" />

          {/* NOTES */}
          <section>
            <div className="ledger-section-label">Notes</div>
            {editing
              ? <textarea
                  className="form-textarea"
                  value={editData.notes || ''}
                  onChange={e => setField('notes', e.target.value)}
                  rows={4}
                  placeholder="Freeform notes…"
                />
              : <p className="ledger-notes">
                  {entry.notes || <Em>No notes.</Em>}
                </p>
            }
          </section>

          {/* Tags */}
          {!editing && entry.tags?.length > 0 && (
            <div style={{ display: 'flex', gap: 'var(--sp-xs)', flexWrap: 'wrap' }}>
              {entry.tags.map(t => (
                <span key={t} style={{
                  fontSize: '9px',
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  color: 'var(--teal-warm)',
                  background: 'var(--teal-ghost)',
                  border: 'var(--border-teal)',
                  borderRadius: 'var(--r-sm)',
                  padding: '2px 8px',
                }}>
                  {t}
                </span>
              ))}
            </div>
          )}

          {/* Impact moment form */}
          {showImpactForm && (
            <div style={{
              background: 'var(--surface-base)',
              border: 'var(--border-gold)',
              borderRadius: 'var(--r-md)',
              padding: 'var(--sp-md)',
            }}>
              <div className="ledger-section-label" style={{ marginBottom: 'var(--sp-sm)' }}>
                Log Impact Moment
              </div>
              <input
                className="form-input"
                placeholder="Short label for this impact moment…"
                value={impactLabel}
                onChange={e => setImpactLabel(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && logImpact()}
                autoFocus
                style={{ marginBottom: 'var(--sp-sm)' }}
              />
              <div style={{ display: 'flex', gap: 'var(--sp-sm)' }}>
                <button className="btn btn-gold btn-sm" onClick={logImpact}>Log It</button>
                <button className="btn btn-ghost btn-sm" onClick={() => setShowImpactForm(false)}>Cancel</button>
              </div>
            </div>
          )}

          {/* Confirm delete */}
          {showConfirmDel && (
            <div style={{
              background: 'rgba(220,80,60,0.08)',
              border: '1px solid rgba(220,80,60,0.25)',
              borderRadius: 'var(--r-md)',
              padding: 'var(--sp-md)',
              fontSize: '13px',
              color: 'var(--linen-muted)',
            }}>
              Delete this entry permanently? This cannot be undone.
              <div style={{ display: 'flex', gap: 'var(--sp-sm)', marginTop: 'var(--sp-sm)' }}>
                <button
                  className="btn btn-danger btn-sm"
                  onClick={() => { /* handled via parent if needed */ setShowConfirmDel(false); onClose(); }}
                >
                  Delete
                </button>
                <button className="btn btn-ghost btn-sm" onClick={() => setShowConfirmDel(false)}>Cancel</button>
              </div>
            </div>
          )}

        </div>

        {/* ── ACTIONS FOOTER ─────────────────────────────── */}
        <div className="ledger-actions">
          {editing ? (
            <>
              <button className="btn btn-primary" onClick={saveEdit}>Save Changes</button>
              <button className="btn btn-ghost"   onClick={cancelEdit}>Cancel</button>
            </>
          ) : (
            <>
              <button className="btn btn-ghost" onClick={startEdit}>Edit</button>

              {entry.status !== 'COMPLETE' && (
                <button className="btn btn-gold" onClick={markComplete}>
                  ✓ Mark Complete
                </button>
              )}

              {!showImpactForm && (
                <button
                  className="btn btn-ghost"
                  onClick={() => setShowImpactForm(true)}
                  style={{ marginLeft: 'auto' }}
                >
                  + Log Impact
                </button>
              )}

              {!entry.claudeBrief && !generatingBrief && (
                <button className="btn btn-ghost" onClick={generateBrief}>
                  ✦ Brief
                </button>
              )}
            </>
          )}
        </div>

      </div>
    </>
  );
}

// ── Small helpers ──────────────────────────────────────────────────

function Em({ children }) {
  return (
    <span style={{ color: 'var(--text-ghost)', fontStyle: 'italic', fontFamily: 'var(--font-refined)' }}>
      {children}
    </span>
  );
}

function NoBrief({ generating, error, onGenerate }) {
  return (
    <div>
      <p style={{ fontSize: '13px', color: 'var(--text-ghost)', fontStyle: 'italic', fontFamily: 'var(--font-refined)', marginBottom: 'var(--sp-sm)' }}>
        Brief not yet generated.
      </p>
      <button
        className="btn btn-gold btn-sm"
        onClick={onGenerate}
        disabled={generating}
      >
        {generating ? <><span className="spinner" style={{ marginRight: '6px' }} />Generating…</> : '✦ Generate Brief'}
      </button>
      {error && (
        <p style={{ fontSize: '11px', color: 'rgba(220,100,80,0.9)', marginTop: 'var(--sp-xs)' }}>
          {error}
        </p>
      )}
    </div>
  );
}
