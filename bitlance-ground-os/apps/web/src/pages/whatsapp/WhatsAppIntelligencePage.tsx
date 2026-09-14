import { useState } from 'react';
import { MessageSquare, Zap, Brain, Send, Bot } from 'lucide-react';
import { DEMO_WHATSAPP_MESSAGES } from '../../lib/demo-data';

const CONVERSATIONS = [
  { id: 'c1', name: 'Rajesh Kumar', business: 'Rajesh Electronics', lastMessage: 'Yes that works.', time: '09:47', status: 'INACTIVE', score: 86, unread: 0 },
  { id: 'c2', name: 'Kavitha Nair', business: 'Individual', lastMessage: 'Can you share more details about the 2BHK?', time: '10:32', status: 'ACTIVE', score: 71, unread: 1 },
  { id: 'c3', name: 'Suresh Mehta', business: 'Mehta Textiles', lastMessage: 'What is the commercial unit size?', time: '11:01', status: 'ACTIVE', score: 42, unread: 2 },
];

export default function WhatsAppIntelligencePage() {
  const [selected, setSelected] = useState('c1');
  const [newMessage, setNewMessage] = useState('');

  const conv = CONVERSATIONS.find(c => c.id === selected) || CONVERSATIONS[0];
  const messages = selected === 'c1' ? DEMO_WHATSAPP_MESSAGES : [];

  return (
    <div style={{ display: 'flex', gap: '0', height: 'calc(100vh - 100px)', borderRadius: '14px', overflow: 'hidden', border: '1px solid var(--color-border-subtle)' }}>
      {/* Sidebar */}
      <div style={{ width: 300, background: 'var(--color-bg-surface)', borderRight: '1px solid var(--color-border-subtle)', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '16px', borderBottom: '1px solid var(--color-border-subtle)' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <MessageSquare size={16} color="var(--color-brand-light)" />
            WhatsApp Intelligence
          </h3>
          <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>AI-qualified conversations</p>
        </div>

        <div style={{ flex: 1, overflowY: 'auto' }}>
          {CONVERSATIONS.map(c => (
            <div
              key={c.id}
              onClick={() => setSelected(c.id)}
              style={{
                padding: '14px 16px', cursor: 'pointer',
                background: selected === c.id ? 'rgba(99,102,241,0.08)' : 'transparent',
                borderLeft: selected === c.id ? '3px solid var(--color-brand)' : '3px solid transparent',
                borderBottom: '1px solid var(--color-border-subtle)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{c.name}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>{c.business}</div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                  <span style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)' }}>{c.time}</span>
                  {c.unread > 0 && (
                    <div style={{ background: 'var(--color-brand)', color: '#fff', borderRadius: '50%', width: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', fontWeight: 700 }}>
                      {c.unread}
                    </div>
                  )}
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                  {c.lastMessage}
                </p>
                <span className={`badge ${c.score >= 70 ? 'badge-warning' : 'badge-neutral'}`} style={{ marginLeft: '8px', fontSize: '0.65rem' }}>
                  {c.score}
                </span>
              </div>
              {c.status === 'INACTIVE' && (
                <div style={{ marginTop: '6px' }}>
                  <div className="ai-state ai-state-processing" style={{ fontSize: '0.6rem' }}>Voice AI Triggered</div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Chat Header */}
        <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--color-border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--color-bg-surface)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, #6366f1, #4f46e5)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.875rem', fontWeight: 700, color: '#fff' }}>
              {conv.name.split(' ').map(n => n[0]).join('')}
            </div>
            <div>
              <div style={{ fontWeight: 600 }}>{conv.name}</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>Lead Score: {conv.score}</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <div className={`ai-state ${conv.status === 'INACTIVE' ? 'ai-state-warning' : 'ai-state-recommend'}`}>
              {conv.status}
            </div>
            <button className="btn btn-secondary" style={{ fontSize: '0.78rem' }}>
              <Brain size={13} /> AI Draft
            </button>
          </div>
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px', background: 'var(--color-bg-base)' }}>
          {messages.map(msg => (
            <div
              key={msg.id}
              style={{
                display: 'flex',
                flexDirection: msg.direction === 'OUTBOUND' ? 'row-reverse' : 'row',
                gap: '8px', alignItems: 'flex-end'
              }}
            >
              {msg.direction === 'OUTBOUND' && msg.isAi && (
                <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'rgba(99,102,241,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Bot size={12} color="var(--color-brand-light)" />
                </div>
              )}
              <div style={{
                maxWidth: '70%', padding: '10px 14px', borderRadius: msg.direction === 'OUTBOUND' ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                background: msg.direction === 'OUTBOUND'
                  ? msg.isAi ? 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(79,70,229,0.15))' : 'rgba(99,102,241,0.15)'
                  : 'rgba(255,255,255,0.06)',
                border: `1px solid ${msg.direction === 'OUTBOUND' ? 'rgba(99,102,241,0.3)' : 'rgba(255,255,255,0.08)'}`,
              }}>
                <p style={{ fontSize: '0.875rem', color: 'var(--color-text-primary)', lineHeight: 1.5 }}>{msg.content}</p>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px', marginTop: '4px' }}>
                  {msg.isAi && <span style={{ fontSize: '0.6rem', color: 'var(--color-brand-light)' }}>AI</span>}
                  <span style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)' }}>{msg.time}</span>
                </div>
              </div>
            </div>
          ))}

          {/* Inactive state card */}
          {conv.status === 'INACTIVE' && (
            <div style={{
              margin: '8px 0', padding: '14px', borderRadius: '10px',
              background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)',
              textAlign: 'center'
            }}>
              <div className="ai-state ai-state-warning" style={{ display: 'inline-flex', marginBottom: '8px' }}>Conversation Inactive — 5 min</div>
              <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
                Voice AI triggered. Calling Rajesh Kumar with conversation context...
              </p>
            </div>
          )}
        </div>

        {/* Input */}
        <div style={{ padding: '14px 20px', borderTop: '1px solid var(--color-border-subtle)', background: 'var(--color-bg-surface)', display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button className="btn btn-ghost" style={{ padding: '8px', gap: '4px', fontSize: '0.78rem' }}>
            <Zap size={14} color="var(--color-brand-light)" /> AI Draft
          </button>
          <input
            value={newMessage}
            onChange={e => setNewMessage(e.target.value)}
            className="input"
            placeholder="Type a message or use AI Draft..."
            style={{ flex: 1 }}
          />
          <button className="btn btn-primary" style={{ padding: '8px 16px' }}>
            <Send size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
