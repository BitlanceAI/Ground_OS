import React from 'react';
import { 
  Clock, 
  Brain, 
  Phone, 
  MessageSquare, 
  CheckCircle2, 
  Zap, 
  GitBranch, 
  Plus 
} from 'lucide-react';
import { WorkflowNode } from './VisualCanvas';

interface NodePaletteProps {
  onAddNode: (type: string, label: string, color: string) => void;
}

const PALETTE_ITEMS = [
  { type: 'TRIGGER', label: 'Inbound Webhook', color: '#ec4899', icon: Clock, desc: 'Triggers on incoming API payload or CRM event' },
  { type: 'AI', label: 'AI Lead Qualifier', color: '#6366f1', icon: Brain, desc: 'Analyzes intent, score & sentiment with Gemini AI' },
  { type: 'VOICE', label: 'Outbound AI Voice Call', color: '#3b82f6', icon: Phone, desc: 'Executes real-time conversational phone outreach' },
  { type: 'MESSAGE', label: 'WhatsApp Dispatch', color: '#10b981', icon: MessageSquare, desc: 'Sends dynamic automated WhatsApp template message' },
  { type: 'CONDITION', label: 'Intent Evaluator', color: '#f59e0b', icon: CheckCircle2, desc: 'Branches workflow based on lead score & rules' },
  { type: 'DELAY', label: 'Smart Wait Buffer', color: '#8b5cf6', icon: Clock, desc: 'Pauses execution until specific time window' },
  { type: 'CRM_UPDATE', label: 'CRM Sync Action', color: '#14b8a6', icon: Zap, desc: 'Updates deal status and lead profile tags' }
];

export default function NodePalette({ onAddNode }: NodePaletteProps) {
  return (
    <div
      style={{
        background: 'rgba(15, 23, 42, 0.8)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '16px',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#f8fafc', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <GitBranch size={16} color="#818cf8" />
          Step Library
        </h4>
        <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Click to add step</span>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
          gap: '10px'
        }}
      >
        {PALETTE_ITEMS.map(item => {
          const Icon = item.icon;
          return (
            <button
              key={item.type}
              onClick={() => onAddNode(item.type, item.label, item.color)}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '10px',
                background: 'rgba(30, 41, 59, 0.5)',
                border: `1px solid ${item.color}33`,
                borderRadius: '12px',
                padding: '10px 12px',
                textAlign: 'left',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                color: '#f8fafc'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = 'rgba(30, 41, 59, 0.9)';
                e.currentTarget.style.borderColor = item.color;
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'rgba(30, 41, 59, 0.5)';
                e.currentTarget.style.borderColor = `${item.color}33`;
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <div
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '8px',
                  background: `${item.color}22`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}
              >
                <Icon size={14} color={item.color} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.78rem', fontWeight: 600, color: '#f1f5f9' }}>
                  {item.label}
                </div>
                <div style={{ fontSize: '0.68rem', color: '#94a3b8', marginTop: '2px', lineHeight: 1.2 }}>
                  {item.desc}
                </div>
              </div>
              <Plus size={14} color="#94a3b8" style={{ marginTop: '2px' }} />
            </button>
          );
        })}
      </div>
    </div>
  );
}
