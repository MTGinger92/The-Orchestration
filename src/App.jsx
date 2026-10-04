import React, { useState } from 'react';
import { StoreProvider, useStore } from './store/StoreContext.jsx';
import Overview from './components/Overview.jsx';
import BlueprintWall from './components/BlueprintWall.jsx';
import LegacyLedger from './components/LegacyLedger.jsx';
import AdminPanel from './components/AdminPanel.jsx';

function timeAgo(iso) {
  if (!iso) return '';
  const m = Math.round((Date.now() - new Date(iso)) / 60000);
  if (m < 60) return `${Math.max(m, 1)} min ago`;
  const h = Math.round(m / 60);
  return h < 48 ? `${h} hr ago` : `${Math.round(h / 24)} days ago`;
}

function Unlock() {
  const { refreshFeed, feedStatus } = useStore();
  const [pass, setPass] = useState('');
  const [busy, setBusy] = useState(false);
  const submit = async e => {
    e.preventDefault();
    setBusy(true);
    await refreshFeed(pass.trim());
    setBusy(false);
  };
  return (
    <div className="unlock-wrap">
      <form className="unlock-card" onSubmit={submit}>
        <div className="unlock-the">The</div>
        <h1 className="unlock-title">Orchestration</h1>
        <p className="unlock-sub">Abbrescia Art Legacy Revival · private record</p>
        <input
          className="unlock-input"
          type="password"
          autoComplete="current-password"
          placeholder="Passphrase"
          value={pass}
          onChange={e => setPass(e.target.value)}
          autoFocus
        />
        {feedStatus === 'badpass' && <p className="unlock-error">That passphrase didn't open it. Try again.</p>}
        <button className="unlock-btn" disabled={!pass || busy}>{busy ? 'Opening…' : 'Open'}</button>
        <p className="unlock-note">Asked once per device; it's remembered after that.</p>
      </form>
    </div>
  );
}

function AppShell() {
  const { entries, feed, feedStatus, refreshFeed } = useStore();
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedEntryId, setSelectedEntryId] = useState(null);
  const [showAdmin, setShowAdmin] = useState(false);

  // Derived so it auto-updates when the entry changes in the store
  const selectedEntry = selectedEntryId
    ? entries.find(e => e.id === selectedEntryId) ?? null
    : null;

  if (feedStatus === 'loading') return <div className="unlock-wrap"><p className="unlock-sub">Opening the record…</p></div>;
  if (feedStatus === 'locked' || feedStatus === 'badpass') return <Unlock />;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>

      {/* HEADER */}
      <header className="app-header">
        <div className="app-wordmark">
          <span className="wordmark-the">The</span>
          <span className="wordmark-title">Orchestration</span>
          <span className="wordmark-sub">Abbrescia Art Legacy Revival</span>
        </div>

        <nav className="nav-tabs">
          {[
            { id: 'overview',       label: 'Overview' },
            { id: 'orchestration',  label: 'The Orchestration' },
          ].map(tab => (
            <button
              key={tab.id}
              className={`nav-tab${activeTab === tab.id ? ' active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        {feed && (
          <button
            className="feed-updated"
            title="Refresh from Notion + Pulse"
            onClick={async () => { setRefreshing(true); await refreshFeed(); setRefreshing(false); }}
          >
            {refreshing ? 'Refreshing…' : `Updated ${timeAgo(feed.generatedAt)} ↻`}
          </button>
        )}

        <button
          className="admin-gear"
          onClick={() => setShowAdmin(true)}
          title="Admin"
          aria-label="Open admin panel"
        >
          ⚙
        </button>
      </header>

      {/* MAIN */}
      <main style={{ flex: 1, position: 'relative' }}>
        {activeTab === 'overview' && <Overview />}
        {activeTab === 'orchestration' && (
          <BlueprintWall
            onEntryClick={id => setSelectedEntryId(id)}
          />
        )}
      </main>

      {/* FOOTER */}
      <footer className="app-footer">
        <span style={{ fontSize: '10px', color: 'var(--text-ghost)', fontFamily: 'var(--font-body)' }}>
          Abbrescia Art Legacy Revival · Personal Record-Keeping System
        </span>
        <span style={{
          fontFamily: 'var(--font-refined)',
          fontSize: '12px',
          fontStyle: 'italic',
          color: 'var(--text-ghost)',
        }}>
          Just as music is a composition of sounds — so is art.
        </span>
        <button className="footer-admin-link" onClick={() => setShowAdmin(true)}>
          Admin ⚙
        </button>
      </footer>

      {/* LEGACY LEDGER — entry detail side panel */}
      {selectedEntry && (
        <LegacyLedger
          entry={selectedEntry}
          onClose={() => setSelectedEntryId(null)}
        />
      )}

      {/* ADMIN PANEL — full-screen overlay */}
      {showAdmin && (
        <AdminPanel onClose={() => setShowAdmin(false)} />
      )}
    </div>
  );
}

export default function App() {
  return (
    <StoreProvider>
      <AppShell />
    </StoreProvider>
  );
}
