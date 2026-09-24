import React, { useState, useEffect } from 'react';
import { 
  X, 
  Trash2, 
  Copy, 
  Settings, 
  Brain, 
  Phone, 
  MessageSquare, 
  Clock, 
  CheckCircle2, 
  Zap, 
  Sliders 
} from 'lucide-react';
import { WorkflowNode } from './VisualCanvas';

interface NodeInspectorProps {
  node: WorkflowNode | null;
  onClose: () => void;
  onUpdateNode: (updatedNode: WorkflowNode) => void;
  onDeleteNode: (nodeId: string) => void;
  onDuplicateNode: (node: WorkflowNode) => void;
}

export default function NodeInspector({
  node,
  onClose,
  onUpdateNode,
  onDeleteNode,
  onDuplicateNode
}: NodeInspectorProps) {
  if (!node) return null;

  const [label, setLabel] = useState(node.label);
  const [prompt, setPrompt] = useState(node.config?.prompt || 'Evaluate lead priority and attempt immediate outbound voice connection.');
  const [delaySec, setDelaySec] = useState(node.config?.delaySec || 30);
  const [channel, setChannel] = useState(node.config?.channel || 'WhatsApp');

  useEffect(() => {
    setLabel(node.label);
    setPrompt(node.config?.prompt || 'Evaluate lead priority and attempt immediate outbound voice connection.');
    setDelaySec(node.config?.delaySec || 30);
    setChannel(node.config?.channel || 'WhatsApp');
  }, [node]);

  const handleSave = () => {
    onUpdateNode({
      ...node,
      label,
      config: {
        ...node.config,
        prompt,
        delaySec,
        channel
      }
    });
  };

  const color = node.color || '#6366f1';

  return (
    <div
      style={{
        width: '320px',
        background: 'rgba(15, 23, 42, 0.95)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '16px',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
        color: '#f8fafc'
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: `${color}22`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: `1px solid ${color}44`
            }}
          >
            <Sliders size={16} color={color} />
          </div>
          <div>
            <h4 style={{ fontSize: '0.9rem', fontWeight: 700, margin: 0 }}>Step Settings</h4>
            <span style={{ fontSize: '0.68rem', color: color, fontWeight: 600, textTransform: 'uppercase' }}>
              {node.type}
            </span>
          </div>
        </div>

        <button
          onClick={onClose}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#94a3b8',
            cursor: 'pointer',
            padding: '4px'
          }}
        >
          <X size={18} />
        </button>
      </div>

      {/* Step Title Input */}
      <div>
        <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#cbd5e1', display: 'block', marginBottom: '6px' }}>
          Step Label
        </label>
        <input
          type="text"
          value={label}
          onChange={e => setLabel(e.target.value)}
          onBlur={handleSave}
          style={{
            width: '100%',
            background: 'rgba(30, 41, 59, 0.6)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: '8px',
            padding: '8px 12px',
            color: '#ffffff',
            fontSize: '0.85rem',
            outline: 'none'
          }}
        />
      </div>

      {/* Dynamic Inspector Form based on Node Type */}
      {node.type === 'AI' && (
        <div>
          <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#cbd5e1', display: 'block', marginBottom: '6px' }}>
            Gemini Agent Prompt
          </label>
          <textarea
            rows={4}
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            onBlur={handleSave}
            placeholder="Instruct the AI agent..."
            style={{
              width: '100%',
              background: 'rgba(30, 41, 59, 0.6)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '8px',
              padding: '8px 12px',
              color: '#ffffff',
              fontSize: '0.8rem',
              outline: 'none',
              resize: 'vertical'
            }}
          />
        </div>
      )}

      {node.type === 'DELAY' && (
        <div>
          <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#cbd5e1', display: 'block', marginBottom: '6px' }}>
            Delay Duration (seconds)
          </label>
          <input
            type="number"
            value={delaySec}
            onChange={e => setDelaySec(Number(e.target.value))}
            onBlur={handleSave}
            style={{
              width: '100%',
              background: 'rgba(30, 41, 59, 0.6)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '8px',
              padding: '8px 12px',
              color: '#ffffff',
              fontSize: '0.85rem',
              outline: 'none'
            }}
          />
        </div>
      )}

      {node.type === 'MESSAGE' && (
        <div>
          <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#cbd5e1', display: 'block', marginBottom: '6px' }}>
            Outbound Channel
          </label>
          <select
            value={channel}
            onChange={e => {
              setChannel(e.target.value);
              handleSave();
            }}
            style={{
              width: '100%',
              background: 'rgba(30, 41, 59, 0.6)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '8px',
              padding: '8px 12px',
              color: '#ffffff',
              fontSize: '0.85rem',
              outline: 'none'
            }}
          >
            <option value="WhatsApp">WhatsApp Business</option>
            <option value="SMS">Twilio SMS</option>
            <option value="Email">SendGrid Email</option>
          </select>
        </div>
      )}

      {/* Action Footer */}
      <div style={{ display: 'flex', gap: '8px', marginTop: 'auto', paddingTop: '12px', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
        <button
          onClick={() => onDuplicateNode(node)}
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '8px',
            padding: '8px',
            color: '#e2e8f0',
            fontSize: '0.78rem',
            cursor: 'pointer'
          }}
        >
          <Copy size={14} /> Duplicate
        </button>

        <button
          onClick={() => onDeleteNode(node.id)}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '8px',
            padding: '8px 12px',
            color: '#fca5a5',
            fontSize: '0.78rem',
            cursor: 'pointer'
          }}
        >
          <Trash2 size={14} /> Delete
        </button>
      </div>
    </div>
  );
}
