import { Search, Bell, Zap } from 'lucide-react';
import { useState } from 'react';

interface TopBarProps {
  organizationName: string;
}

export default function TopBar({ organizationName }: TopBarProps) {
  const [query, setQuery] = useState('');

  return (
    <header className="topbar">
      {/* Brand */}
      <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2, minWidth: 160 }}>
        <span style={{ fontFamily: 'var(--font-head)', fontWeight: 800, fontSize: '0.85rem', color: 'var(--color-text-primary)' }}>
          GROUND OS
        </span>
        <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>{organizationName}</span>
      </div>

      {/* Ask Bitlance Command Bar */}
      <div className="command-bar">
        <Zap size={14} color="var(--color-brand-light)" />
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Ask Bitlance — Show high-intent leads, overdue follow-ups..."
          id="ask-bitlance-input"
        />
        <div style={{
          fontSize: '0.7rem', color: 'var(--color-text-muted)',
          background: 'rgba(255,255,255,0.06)', padding: '2px 6px',
          borderRadius: '4px', border: '1px solid var(--color-border-subtle)'
        }}>⌘K</div>
      </div>

      {/* Right */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: 'auto' }}>
        {/* AI Processing indicator */}
        <div className="ai-state ai-state-processing" style={{ fontSize: '0.65rem' }}>
          AI Active
        </div>

        {/* Notifications */}
        <button className="btn btn-ghost" style={{ position: 'relative', padding: '8px' }}>
          <Bell size={18} />
          <span style={{
            position: 'absolute', top: 4, right: 4,
            width: 8, height: 8, borderRadius: '50%',
            background: 'var(--color-error)',
            boxShadow: '0 0 6px var(--color-error)'
          }} />
        </button>
      </div>
    </header>
  );
}
