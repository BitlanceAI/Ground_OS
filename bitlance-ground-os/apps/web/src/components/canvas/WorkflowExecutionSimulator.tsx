import React from 'react';
import { Terminal, CheckCircle2, Clock, Play, AlertCircle, RefreshCw } from 'lucide-react';
import { WorkflowNode } from './VisualCanvas';

export interface SimulationLog {
  id: string;
  nodeId: string;
  stepName: string;
  status: 'pending' | 'running' | 'success' | 'failed';
  message: string;
  durationMs?: number;
  timestamp: string;
}

interface WorkflowExecutionSimulatorProps {
  logs: SimulationLog[];
  isSimulating: boolean;
  activeStepId: string | null;
  onClearLogs: () => void;
}

export default function WorkflowExecutionSimulator({
  logs,
  isSimulating,
  activeStepId,
  onClearLogs
}: WorkflowExecutionSimulatorProps) {
  return (
    <div
      style={{
        background: 'rgba(15, 23, 42, 0.85)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '16px',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        maxHeight: '260px'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#f8fafc', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Terminal size={15} color="#38bdf8" />
          Live Execution Telemetry & Logs
        </h4>

        {logs.length > 0 && (
          <button
            onClick={onClearLogs}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94a3b8',
              fontSize: '0.72rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <RefreshCw size={12} /> Clear Logs
          </button>
        )}
      </div>

      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
          fontFamily: 'monospace',
          fontSize: '0.75rem'
        }}
      >
        {logs.length === 0 ? (
          <div style={{ color: '#64748b', fontStyle: 'italic', padding: '12px 0', textAlign: 'center' }}>
            Press "Test Run Workflow" above to launch step-by-step telemetry simulation.
          </div>
        ) : (
          logs.map(log => (
            <div
              key={log.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '6px 10px',
                borderRadius: '6px',
                background: log.nodeId === activeStepId ? 'rgba(56, 189, 248, 0.12)' : 'rgba(30, 41, 59, 0.4)',
                borderLeft: log.status === 'success' 
                  ? '3px solid #10b981' 
                  : log.status === 'running'
                  ? '3px solid #38bdf8'
                  : '3px solid #64748b'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: '#64748b', fontSize: '0.68rem' }}>[{log.timestamp}]</span>
                <span style={{ fontWeight: 600, color: log.status === 'success' ? '#34d399' : '#e2e8f0' }}>
                  {log.stepName}:
                </span>
                <span style={{ color: '#94a3b8' }}>{log.message}</span>
              </div>

              {log.durationMs && (
                <span style={{ color: '#64748b', fontSize: '0.68rem' }}>{log.durationMs}ms</span>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
