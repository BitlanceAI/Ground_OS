import { useNavigate } from 'react-router-dom';
import { ChevronRight, AlertTriangle, TrendingUp, Zap, Brain } from 'lucide-react';

interface FeedItem {
  id: string;
  type: string;
  priority: string;
  title: string;
  body: string;
  badge: string | null;
  action: string;
  actionRoute: string;
  agent: string | null;
  time: string;
  customerId: string | null;
}

const FEED_ICONS: Record<string, React.ReactNode> = {
  HIGH_INTENT:    <TrendingUp size={14} color="#ef4444" />,
  FOLLOW_UP_RISK: <AlertTriangle size={14} color="#f59e0b" />,
  MARKET_SIGNAL:  <Zap size={14} color="#6366f1" />,
  AGENT_COACHING: <Brain size={14} color="#10b981" />,
};

const FEED_CLASSES: Record<string, string> = {
  HIGH_INTENT:    'feed-high-intent',
  FOLLOW_UP_RISK: 'feed-followup-risk',
  MARKET_SIGNAL:  'feed-market-signal',
  AGENT_COACHING: 'feed-coaching',
};

const FEED_BADGE_COLORS: Record<string, string> = {
  HIGH_INTENT:    'badge-error',
  FOLLOW_UP_RISK: 'badge-warning',
  MARKET_SIGNAL:  'badge-brand',
  AGENT_COACHING: 'badge-success',
};

interface Props {
  items: FeedItem[];
}

export default function AIPriorityFeed({ items }: Props) {
  const navigate = useNavigate();

  if (!items || items.length === 0) {
    return (
      <div
        className="card"
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px 20px',
          textAlign: 'center',
          flex: 1,
          minHeight: 280,
          background: 'rgba(13, 20, 36, 0.4)',
          border: '1px dashed var(--color-border)',
          borderRadius: 'var(--radius-lg)',
        }}
      >
        <div style={{
          width: 44,
          height: 44,
          borderRadius: 'var(--radius-full)',
          background: 'rgba(99, 102, 241, 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '12px',
          color: 'var(--color-brand-light)',
        }}>
          <Brain size={22} />
        </div>
        <div style={{ fontWeight: 600, fontSize: '0.9375rem', color: 'var(--color-text-primary)', marginBottom: '6px' }}>
          No Active AI Signals
        </div>
        <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', maxWidth: 280, lineHeight: 1.5 }}>
          Real-time AI signals, high-intent lead alerts, and follow-up risks will appear here automatically when field meetings are recorded.
        </div>
      </div>
    );
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
      overflowY: 'auto',
      flex: 1,
    }}>
      {items.map((item) => (
        <div
          key={item.id}
          className={`card ${FEED_CLASSES[item.type] || ''}`}
          style={{ padding: '16px', cursor: 'pointer' }}
          onClick={() => navigate(item.actionRoute)}
          id={`feed-item-${item.id}`}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
            {/* Icon */}
            <div style={{
              width: 32, height: 32, borderRadius: 'var(--radius-full)',
              background: 'rgba(255,255,255,0.05)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0, marginTop: '2px'
            }}>
              {FEED_ICONS[item.type]}
            </div>

            {/* Content */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginBottom: '6px' }}>
                <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                  {item.title}
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', fontWeight: 500, flexShrink: 0 }}>{item.time}</span>
              </div>

              <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', lineHeight: 1.5, marginBottom: '12px' }}>
                {item.body}
              </p>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  {item.badge && (
                    <span className={`badge ${FEED_BADGE_COLORS[item.type] || 'badge-brand'}`} style={{ fontSize: '0.75rem' }}>
                      Score {item.badge}
                    </span>
                  )}
                  {item.agent && (
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                      {item.agent}
                    </span>
                  )}
                </div>
                <button
                  className="btn btn-ghost"
                  style={{ gap: '4px', color: 'var(--color-brand-light)' }}
                  onClick={(e) => { e.stopPropagation(); navigate(item.actionRoute); }}
                >
                  {item.action} <ChevronRight size={14} />
                </button>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

