import React from 'react';
import { useStore } from '../store/StoreContext.jsx';

const NOW_DEFS = [
  { key: 'views',       label: 'Views on our posts' },
  { key: 'followers',   label: 'Followers',         noteKey: 'followers' },
  { key: 'subscribers', label: 'Email subscribers' },
  { key: 'published',   label: 'Posts published' },
  { key: 'revenue',     label: 'Revenue',           money: true, noteKey: 'revenue' },
];

function nextGoal(milestones, phasePrefix) {
  return milestones
    .filter(m => !m.achieved && m.phase.startsWith(phasePrefix))
    .sort((a, b) => a.order - b.order)[0];
}

function fmtDate(iso) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' });
}

export default function Overview() {
  const { statList, milestones, impactMoments, entries, feed } = useStore();

  // Group milestones by phase, preserve insertion order
  const phases = [];
  const phaseMap = {};
  milestones
    .slice()
    .sort((a, b) => a.order - b.order)
    .forEach(m => {
      if (!phaseMap[m.phase]) {
        phaseMap[m.phase] = [];
        phases.push(m.phase);
      }
      phaseMap[m.phase].push(m);
    });

  // Right column: entries flagged as impact markers + standalone impact moments
  const impactEntries = entries
    .filter(e => e.isImpactMarker && e.impactLabel)
    .map(e => ({ id: e.id, label: e.impactLabel, date: e.dateLogged }));

  const allImpacts = [
    ...impactMoments.map(m => ({ id: m.id, label: m.label, date: m.dateLogged })),
    ...impactEntries,
  ].sort((a, b) => new Date(b.date) - new Date(a.date));

  return (
    <div className="overview-wrap">

      {/* ── HERO: The Orchestration ─────────────────────────── */}
      <div className="overview-hero">
        <h1 className="orch-title">Orchestration</h1>
        <p className="orch-quote">
          "Just as music is a composition of sounds — so is art. An orchestration of line, color, and form."
        </p>
        <p className="orch-attribution">Joseph L. Abbrescia Sr. · Book I</p>
      </div>

      {/* ── STATS ROW ────────────────────────────────────────── */}
      <div className="stats-row">
        {statList.map(({ label, value }) => (
          <div key={label} className="stat-cell">
            <div className="stat-number">
              {Number(value || 0).toLocaleString()}
            </div>
            <div className="stat-label">{label}</div>
          </div>
        ))}
      </div>

      {/* ── WHERE WE ARE NOW (live from Pulse) ───────────────── */}
      {feed?.current && (
        <>
          <div className="impact-section-label">Where We Are Now</div>
          <div className="now-grid">
            {NOW_DEFS.map(({ key, label, money, noteKey }) => {
              const goal = nextGoal(milestones, {
                views: 'Audience — Views', followers: 'Audience — Followers',
                subscribers: 'Audience — Email', published: 'Content', revenue: 'Revenue',
              }[key]);
              return (
                <div key={key} className="now-cell">
                  <div className="now-number">{money ? '$' : ''}{(feed.current[key] ?? 0).toLocaleString()}</div>
                  <div className="now-label">{label}</div>
                  {goal && <div className="now-next">Next: {goal.label}</div>}
                  {noteKey && feed.notes?.[noteKey] && <div className="now-note">{feed.notes[noteKey]}</div>}
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* ── IMPACT MARKERS PANEL ─────────────────────────────── */}
      <div className="impact-section-label">Impact Markers</div>

      <div className="impact-grid">

        {/* Left — Milestone Map */}
        <div>
          <div className="impact-col-title">Milestone Map</div>
          {phases.map(phase => (
            <div key={phase} className="impact-phase">
              <div className="impact-phase-label">{phase}</div>
              {phaseMap[phase].map(m => (
                <div key={m.id} className="milestone-row">
                  <div className={`milestone-dot ${m.achieved ? 'achieved' : 'pending'}`} />
                  <div className="milestone-date">
                    {m.achievedDate ? fmtDate(m.achievedDate) : '—'}
                  </div>
                  <div className={`milestone-label ${m.achieved ? 'achieved' : 'pending'}`}>
                    {m.label}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* Right — Impact Moments */}
        <div>
          <div className="impact-col-title">Impact Moments</div>
          {allImpacts.length === 0 ? (
            <p className="impact-empty">
              Impact moments appear here when logged. Mark an entry as an Impact Marker in the admin panel, or use the "Log Impact" button in any entry's detail view.
            </p>
          ) : (
            allImpacts.map(impact => (
              <div key={impact.id} className="impact-moment-row">
                <div
                  className="milestone-dot achieved"
                  style={{ marginTop: '4px', flexShrink: 0 }}
                />
                <div className="impact-moment-label">{impact.label}</div>
                <div className="impact-moment-date">{fmtDate(impact.date)}</div>
              </div>
            ))
          )}
        </div>

      </div>
    </div>
  );
}
