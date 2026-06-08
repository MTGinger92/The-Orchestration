import React, { useState } from 'react';
import { StoreProvider, useStore } from './store/StoreContext.jsx';
import Overview from './components/Overview.jsx';
import BlueprintWall from './components/BlueprintWall.jsx';
import LegacyLedger from './components/LegacyLedger.jsx';
import AdminPanel from './components/AdminPanel.jsx';

function AppShell() {
  const { entries } = useStore();
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedEntryId, setSelectedEntryId] = useState(null);
  const [showAdmin, setShowAdmin] = useState(false);

  // Derived so it auto-updates when the entry changes in the store
  const selectedEntry = selectedEntryId
    ? entries.find(e => e.id === selectedEntryId) ?? null
    : null;

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
          Abbrescia Legacy Studio LLC · Personal Record-Keeping System
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
