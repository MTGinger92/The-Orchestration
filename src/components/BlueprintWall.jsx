import React, { useState, useMemo } from 'react';
import { useStore } from '../store/StoreContext.jsx';
import { CONFIG } from '../config/orchestration.config.js';

const ALL_STATUSES = ['ALL', 'COMPLETE', 'IN PROGRESS', 'BLOCKED'];
const ALL_SIZES    = ['ALL', ...CONFIG.sizes];

function statusKey(status) {
  if (!status) return '';
  return status.toLowerCase().replace(/ /g, '-');
}

function fmtDate(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' });
}

export default function BlueprintWall({ onEntryClick }) {
  const { entries, workstreams } = useStore();

  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sizeFilter,   setSizeFilter]   = useState('ALL');
  const [wsFilter,     setWsFilter]     = useState('ALL');
  const [search,       setSearch]       = useState('');

  const filtered = useMemo(() => entries.filter(e => {
    if (statusFilter !== 'ALL' && e.status !== statusFilter) return false;
    if (sizeFilter   !== 'ALL' && e.size   !== sizeFilter)   return false;
    if (wsFilter     !== 'ALL' && e.workstream !== wsFilter)  return false;
    if (search && !e.title?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  }), [entries, statusFilter, sizeFilter, wsFilter, search]);

  const byWorkstream = useMemo(() => {
    const map = {};
    workstreams.forEach(ws => { map[ws.id] = []; });
    filtered.forEach(e => { if (map[e.workstream]) map[e.workstream].push(e); });
    return map;
  }, [filtered, workstreams]);

  const wsShortName = label => {
    // Shorten long labels for filter buttons
    const short = {
      'Brand & Digital Infrastructure': 'Brand',
      'Commerce': 'Commerce',
      'Content Engine & SM': 'Content',
      'Institutional & Relationships': 'Institutional',
      'Legal & Entity Structure': 'Legal',
      'Digitization & Archive': 'Digitization',
    };
    return short[label] ?? label.split('&')[0].trim().split(' ').slice(0, 2).join(' ');
  };

  return (
    <div className="wall-wrap">

      {/* ── FILTER BAR ──────────────────────────────────────── */}
      <div className="filter-bar">

        {/* Status */}
        <div className="filter-group">
          {ALL_STATUSES.map(s => (
            <button
              key={s}
              className={`filter-btn${statusFilter === s ? ' active' : ''}`}
              onClick={() => setStatusFilter(s)}
            >
              {s === 'ALL' ? 'All Status' : s}
            </button>
          ))}
        </div>

        <div className="filter-divider" />

        {/* Size */}
        <div className="filter-group">
          {ALL_SIZES.map(s => (
            <button
              key={s}
              className={`filter-btn${sizeFilter === s ? ' active' : ''}`}
              onClick={() => setSizeFilter(s)}
            >
              {s === 'ALL' ? 'All Sizes' : s}
            </button>
          ))}
        </div>

        <div className="filter-divider" />

        {/* Workstream */}
        <div className="filter-group" style={{ flexWrap: 'nowrap' }}>
          <button
            className={`filter-btn${wsFilter === 'ALL' ? ' active' : ''}`}
            onClick={() => setWsFilter('ALL')}
          >
            All
          </button>
          {workstreams.map(ws => (
            <button
              key={ws.id}
              className={`filter-btn${wsFilter === ws.id ? ' active' : ''}`}
              onClick={() => setWsFilter(ws.id)}
              style={wsFilter === ws.id
                ? { borderColor: ws.color, color: ws.color, background: `${ws.color}18` }
                : {}
              }
            >
              {wsShortName(ws.label)}
            </button>
          ))}
        </div>

        <div className="filter-divider" />

        {/* Search */}
        <input
          className="filter-search"
          type="text"
          placeholder="Search entries…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />

        <span style={{ fontSize: '10px', color: 'var(--text-ghost)', marginLeft: 'auto', flexShrink: 0 }}>
          {filtered.length} of {entries.length}
        </span>
      </div>

      {/* ── COLUMNS ─────────────────────────────────────────── */}
      <div className="blueprint-columns-wrap">
        {entries.length === 0 ? (
          <div className="wall-empty">
            <p style={{
              fontFamily: 'var(--font-display)',
              fontSize: '22px',
              fontWeight: 400,
              fontStyle: 'italic',
              color: 'var(--text-muted)',
              marginBottom: 'var(--sp-md)',
            }}>
              The ledger awaits its first entry.
            </p>
            <p style={{ fontSize: '13px', color: 'var(--text-ghost)' }}>
              Open the Admin panel and log your first entry to begin the record.
            </p>
          </div>
        ) : (
          <div className="blueprint-columns">
            {workstreams.map(ws => {
              const cols = byWorkstream[ws.id] || [];
              const totalInWs = entries.filter(e => e.workstream === ws.id).length;
              return (
                <div key={ws.id} className="ws-column">

                  <div
                    className="ws-column-header"
                    style={{ borderBottom: `1px solid ${ws.borderColor}` }}
                  >
                    <div className="ws-column-name" style={{ color: ws.color }}>
                      {ws.label}
                    </div>
                    <div className="ws-column-count">
                      {cols.length}
                      {cols.length !== totalInWs && ` / ${totalInWs}`}
                      {' '}{cols.length === 1 ? 'entry' : 'entries'}
                    </div>
                  </div>

                  <div className="ws-column-cards">
                    {cols.length === 0 ? (
                      <p style={{
                        padding: 'var(--sp-md)',
                        fontSize: '11px',
                        color: 'var(--text-ghost)',
                        fontStyle: 'italic',
                        fontFamily: 'var(--font-refined)',
                        textAlign: 'center',
                      }}>
                        {totalInWs > 0 ? 'No matches' : 'Nothing logged yet'}
                      </p>
                    ) : cols.map(entry => {
                      const sc = statusKey(entry.status);
                      return (
                        <div
                          key={entry.id}
                          className={`entry-card ${sc}`}
                          onClick={() => onEntryClick(entry.id)}
                          role="button"
                          tabIndex={0}
                          onKeyDown={e => e.key === 'Enter' && onEntryClick(entry.id)}
                        >
                          <div className="card-top">
                            <div className="card-title">{entry.title}</div>
                            <div className={`card-status-dot ${sc}`} />
                          </div>

                          <div className="card-bottom">
                            <span className="card-size-badge">{entry.size}</span>
                            <span className={`card-status-chip ${sc}`}>{entry.status}</span>
                            <span className="card-date">{fmtDate(entry.dateLogged)}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}
