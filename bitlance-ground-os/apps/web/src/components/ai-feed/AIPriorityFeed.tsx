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

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
      overflowY: 'auto',
      flex: 1,
    }}>
      {items.map((item) => (
        <div
          key={item.id}
          className={`card ${FEED_CLASSES[item.type] || ''}`}
          style={{ padding: '14px 16px', cursor: 'pointer' }}
          onClick={() => navigate(item.actionRoute)}
          id={`feed-item-${item.id}`}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
            {/* Icon */}
            <div style={{
              width: 28, height: 28, borderRadius: '50%',
              background: 'rgba(255,255,255,0.05)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0, marginTop: '2px'
            }}>
              {FEED_ICONS[item.type]}
            </div>

            {/* Content */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginBottom: '4px' }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--color-text-primary)', letterSpacing: '0.04em' }}>
                  {item.title}
                </span>
                <span style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)', flexShrink: 0 }}>{item.time}</span>
              </div>

              <p style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)', lineHeight: 1.5, marginBottom: '10px' }}>
                {item.body}
              </p>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                  {item.badge && (
                    <span className={`badge ${FEED_BADGE_CLASSES[item.type] || 'badge-brand'}`}>
                      {item.badge}
                    </span>
                  )}
                  {item.agent && (
                    <span style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)' }}>
                      {item.agent}
                    </span>
                  )}
                </div>
                <button
                  className="btn btn-ghost"
                  style={{ fontSize: '0.72rem', padding: '3px 8px', gap: '3px', color: 'var(--color-brand-light)' }}
                  onClick={(e) => { e.stopPropagation(); navigate(item.actionRoute); }}
                >
                  {item.action} <ChevronRight size={11} />
                </button>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

const FEED_BADGE_CLASSES: Record<string, string> = {
  HIGH_INTENT: 'badge-error',
  FOLLOW_UP_RISK: 'badge-warning',
  MARKET_SIGNAL: 'badge-brand',
  AGENT_COACHING: 'badge-success',
};
