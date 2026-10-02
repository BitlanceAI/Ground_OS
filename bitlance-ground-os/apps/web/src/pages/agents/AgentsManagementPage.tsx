import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, UserPlus, ShieldCheck,
  Key, Phone, MapPin, Edit3, Trash2, PauseCircle, PlayCircle,
  ExternalLink, Eye, EyeOff, Search, Check, AlertTriangle, X,
  Copy, Sparkles, BarChart3, Target, Calendar, CalendarCheck,
  TrendingUp, ChevronRight, RefreshCw,
  CheckCircle, Zap, Shield,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { agentsApi, meetingsApi, customersApi } from '../../lib/api';

export interface AgentRecord {
  id: string;
  userId: string;
  name: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  territory?: string;
  employeeCode?: string;
  status: string;
  isActive: boolean;
  role: string;
  avatarUrl?: string;
  lat?: number;
  lng?: number;
  todayStats?: {
    assignedVisits: number;
    completedVisits: number;
    meetingsHeld: number;
  };
}

interface AgentReportRow {
  agentId: string;
  name: string;
  email: string;
  isActive: boolean;
  territory: string;
  employeeCode: string;
  stats: {
    totalVisits: number;
    completedVisits: number;
    leadsTapped: number;
    totalMeetings: number;
    scheduledMeetings: number;
    conversionRate: number;
  };
}

type ActiveTab = 'agents' | 'reports' | 'schedule';

export default function AgentsManagementPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<ActiveTab>('agents');

  const [agents, setAgents] = useState<AgentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const [reportData, setReportData] = useState<AgentReportRow[]>([]);
  const [reportLoading, setReportLoading] = useState(false);

  const [schedAgentId, setSchedAgentId] = useState('');
  const [schedTitle, setSchedTitle] = useState('');
  const [schedFor, setSchedFor] = useState('');
  const [schedNotes, setSchedNotes] = useState('');
  const [schedPurpose, setSchedPurpose] = useState('');
  const [schedSubmitting, setSchedSubmitting] = useState(false);
  const [customers, setCustomers] = useState<any[]>([]);
  const [schedCustomerId, setSchedCustomerId] = useState('');

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<AgentRecord | null>(null);
  const [deleteConfirmAgent, setDeleteConfirmAgent] = useState<AgentRecord | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [statusConfirmAgent, setStatusConfirmAgent] = useState<AgentRecord | null>(null);

  const [newFirstName, setNewFirstName] = useState('');
  const [newLastName, setNewLastName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newTerritory, setNewTerritory] = useState('Delhi NCR (Dwarka Hub)');
  const [newEmployeeCode, setNewEmployeeCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [manualCredentialsOverride, setManualCredentialsOverride] = useState(false);

  const [editFirstName, setEditFirstName] = useState('');
  const [editLastName, setEditLastName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editTerritory, setEditTerritory] = useState('');
  const [editEmployeeCode, setEditEmployeeCode] = useState('');
  const [editIsActive, setEditIsActive] = useState(true);
  const [showEditPassword, setShowEditPassword] = useState(false);

  const fetchAgents = useCallback(async () => {
    try {
      setLoading(true);
      const res = await agentsApi.list();
      if (res?.data && Array.isArray(res.data)) setAgents(res.data);
    } catch { toast.error('Could not refresh agents.'); }
    finally { setLoading(false); }
  }, []);

  const fetchReport = useCallback(async () => {
    try {
      setReportLoading(true);
      const res = await meetingsApi.agentReport();
      if (res?.data) setReportData(res.data as AgentReportRow[]);
    } catch { toast.error('Could not load agent reports'); }
    finally { setReportLoading(false); }
  }, []);

  const fetchCustomers = useCallback(async () => {
    try {
      const res = await customersApi.list();
      if (res?.data) setCustomers(res.data as any[]);
    } catch {}
  }, []);

  useEffect(() => { fetchAgents(); }, [fetchAgents]);

  useEffect(() => {
    if (activeTab === 'reports') fetchReport();
    if (activeTab === 'schedule') { fetchAgents(); fetchCustomers(); fetchReport(); }
  }, [activeTab]);

  const handleNameChange = (nameVal: string) => {
    setNewFirstName(nameVal);
    if (!manualCredentialsOverride) {
      const token = nameVal.toLowerCase().trim().replace(/[^a-z0-9]/g, '');
      setNewEmail(token ? `agent${token}@gmail.com` : '');
      setNewPassword(token ? `${token}@123` : '');
    }
  };

  const handlePhoneChange = (val: string) => {
    let clean = val.replace(/[^0-9+]/g, '');
    if (!clean.startsWith('+91')) {
      const digits = clean.replace(/[^0-9]/g, '');
      clean = digits ? `+91 ${digits}` : '';
    }
    setNewPhone(clean);
  };

  const handleOpenAddModal = () => {
    setNewFirstName(''); setNewLastName(''); setNewEmail(''); setNewPassword('');
    setNewPhone('+91 '); setNewTerritory('Delhi NCR (Dwarka Hub)');
    setNewEmployeeCode(`AG00${agents.length + 1}`);
    setShowPassword(false); setManualCredentialsOverride(false);
    setShowAddModal(true);
  };

  const handleCreateAgent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFirstName.trim() || !newEmail.trim() || !newPassword.trim()) {
      toast.error('First name, email, and password are required'); return;
    }
    try {
      setIsSubmitting(true);
      const res = await agentsApi.create({
        firstName: newFirstName.trim(), lastName: newLastName.trim(),
        email: newEmail.trim().toLowerCase(), password: newPassword.trim(),
        phone: newPhone.trim() || '+91 7498162774',
        territory: newTerritory.trim(), employeeCode: newEmployeeCode.trim(),
      });
      if (res.success) {
        toast.success(`Agent ${newFirstName} created!`, { duration: 5000 });
        setShowAddModal(false); await fetchAgents();
      } else { toast.error((res as any)?.message || 'Failed'); }
    } catch (err: any) { toast.error(err?.message || 'Error'); }
    finally { setIsSubmitting(false); }
  };

  const handleOpenEditModal = (agent: AgentRecord) => {
    setSelectedAgent(agent);
    setEditFirstName(agent.firstName || agent.name.split(' ')[0] || '');
    setEditLastName(agent.lastName || agent.name.split(' ').slice(1).join(' ') || '');
    setEditEmail(agent.email || ''); setEditPassword('');
    setEditPhone(agent.phone || '+91 ');
    setEditTerritory(agent.territory || 'Delhi NCR');
    setEditEmployeeCode(agent.employeeCode || '');
    setEditIsActive(agent.isActive ?? true);
    setShowEditPassword(false); setShowEditModal(true);
  };

  const handleUpdateAgent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAgent) return;
    try {
      setIsSubmitting(true);
      const payload: any = {
        firstName: editFirstName.trim(), lastName: editLastName.trim(),
        email: editEmail.trim().toLowerCase(), phone: editPhone.trim(),
        territory: editTerritory.trim(), employeeCode: editEmployeeCode.trim(),
        isActive: editIsActive,
      };
      if (editPassword.trim()) payload.password = editPassword.trim();
      const res = await agentsApi.update(selectedAgent.id, payload);
      if (res.success) {
        toast.success('Agent updated'); setShowEditModal(false); await fetchAgents();
      } else { toast.error((res as any)?.message || 'Failed'); }
    } catch (err: any) { toast.error(err?.message || 'Error'); }
    finally { setIsSubmitting(false); }
  };

  const handleConfirmToggleActive = async () => {
    if (!statusConfirmAgent) return;
    try {
      const res = await agentsApi.toggleActive(statusConfirmAgent.id);
      if (res.success) {
        toast.success((res as any)?.message || 'Status changed');
        setStatusConfirmAgent(null); await fetchAgents();
      }
    } catch (err: any) { toast.error(err?.message || 'Error'); }
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirmAgent) return;
    try {
      setIsDeleting(true);
      const res = await agentsApi.delete(deleteConfirmAgent.id);
      if (res.success) {
        toast.success(`Agent ${deleteConfirmAgent.name} deleted`);
        setDeleteConfirmAgent(null); await fetchAgents();
      }
    } catch (err: any) { toast.error(err?.message || 'Error'); }
    finally { setIsDeleting(false); }
  };

  const handleScheduleMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!schedAgentId || !schedFor) { toast.error('Pick an agent and a date/time'); return; }
    try {
      setSchedSubmitting(true);
      const res = await meetingsApi.adminSchedule({
        agentId: schedAgentId, customerId: schedCustomerId || undefined,
        scheduledFor: schedFor, title: schedTitle || 'Scheduled Meeting',
        notes: schedNotes, purposeOfVisit: schedPurpose,
      });
      if (res.success) {
        toast.success(`Meeting scheduled for ${agents.find(a => a.id === schedAgentId)?.name}!`, { duration: 4000 });
        setSchedTitle(''); setSchedFor(''); setSchedNotes(''); setSchedPurpose(''); setSchedAgentId('');
        fetchReport();
      } else { toast.error((res as any)?.message || 'Failed'); }
    } catch (err: any) { toast.error(err?.message || 'Error scheduling meeting'); }
    finally { setSchedSubmitting(false); }
  };

  const copyCredentials = (emailStr: string, pwStr: string) => {
    navigator.clipboard.writeText(`Ground OS Agent Login:\nEmail: ${emailStr}\nPassword: ${pwStr}`);
    toast.success('Credentials copied!', { icon: '📋' });
  };

  const filteredAgents = agents.filter(a => {
    const q = searchQuery.toLowerCase();
    return a.name?.toLowerCase().includes(q) || a.email?.toLowerCase().includes(q) ||
      a.phone?.toLowerCase().includes(q) || a.territory?.toLowerCase().includes(q) ||
      a.employeeCode?.toLowerCase().includes(q);
  });

  const selectedAgentForSched = agents.find(a => a.id === schedAgentId);
  const schedAgentReport = reportData.find(r => r.agentId === schedAgentId);

  return (
    <div className="amps-container">
      {/* Header */}
      <div className="amps-header">
        <div>
          <div className="badge-row">
            <span className="badge badge-brand"><ShieldCheck size={13} /> Admin Command</span>
            <span className="dot-sep">•</span>
            <span className="sub-title-text">Multi-Agent Control & Analytics</span>
          </div>
          <h1 className="amps-title">Field Agent Management</h1>
          <p className="amps-desc">Manage agents, view performance reports, and schedule meetings.</p>
        </div>
        <button onClick={handleOpenAddModal} className="btn btn-primary add-agent-btn">
          <UserPlus size={16} /> Add New Field Agent
        </button>
      </div>

      {/* Tabs */}
      <div className="amps-tabs">
        <button className={`amps-tab ${activeTab === 'agents' ? 'active' : ''}`} onClick={() => setActiveTab('agents')}>
          <Users size={15} /> Agents
        </button>
        <button className={`amps-tab ${activeTab === 'reports' ? 'active' : ''}`} onClick={() => setActiveTab('reports')}>
          <BarChart3 size={15} /> Agent Reports
        </button>
        <button className={`amps-tab ${activeTab === 'schedule' ? 'active' : ''}`} onClick={() => setActiveTab('schedule')}>
          <Calendar size={15} /> Schedule Meeting
        </button>
      </div>

      {/* ═══ TAB: AGENTS ═══════════════════════════════════════════════════ */}
      {activeTab === 'agents' && (
        <>
          <div className="primary-agent-banner">
            <div className="banner-left">
              <div className="banner-icon-box"><Key size={19} /></div>
              <div>
                <div className="banner-title">Primary Field Agent: Nilesh Somnawane</div>
                <div className="banner-subtext">
                  Login: <strong className="text-highlight">agentnilesh@gmail.com</strong>
                  {' '}· Password: <strong className="text-white">nilesh@123</strong>
                  {' '}· Phone: <strong className="text-highlight">+91 7498162774</strong>
                </div>
              </div>
            </div>
            <div className="banner-actions">
              <button onClick={() => copyCredentials('agentnilesh@gmail.com', 'nilesh@123')} className="btn btn-secondary copy-pill-btn">
                <Copy size={13} /> Copy Credentials
              </button>
              <span className="badge badge-success"><Check size={12} /> Active in DB</span>
            </div>
          </div>

          <div className="search-bar-wrap">
            <Search size={16} color="var(--color-text-muted)" />
            <input type="text" placeholder="Search agents by name, email, code, territory..."
              value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="search-input-field" />
            {searchQuery && <X size={15} className="clear-search-btn" onClick={() => setSearchQuery('')} />}
          </div>

          {loading ? (
            <div className="loading-state-card"><div className="spinner-ring" /><span>Loading agents...</span></div>
          ) : filteredAgents.length === 0 ? (
            <div className="card empty-state-card">
              <Users size={44} color="var(--color-text-muted)" style={{ margin: '0 auto 14px' }} />
              <h3>{searchQuery ? 'No agent matches your search.' : 'No field agents created yet.'}</h3>
              <button onClick={handleOpenAddModal} className="btn btn-primary"><UserPlus size={14} /> Add First Agent</button>
            </div>
          ) : (
            <div className="agents-grid-stack">
              {filteredAgents.map((agent) => {
                const isActive = agent.isActive ?? true;
                return (
                  <div key={agent.id} className={`card agent-row-card ${!isActive ? 'revoked' : ''}`}>
                    <div className="agent-identity-wrap">
                      <div className={`agent-avatar-circle ${!isActive ? 'offline' : ''}`}>
                        {agent.firstName?.[0] || agent.name?.[0] || 'A'}{agent.lastName?.[0] || ''}
                      </div>
                      <div className="agent-text-meta">
                        <div className="agent-title-row">
                          <h3 className="agent-name-text">{agent.name}</h3>
                          {agent.employeeCode && <span className="badge badge-secondary emp-badge">{agent.employeeCode}</span>}
                          {isActive
                            ? <span className="badge badge-success status-pill"><span className="dot-green" /> ACTIVE</span>
                            : <span className="badge badge-error status-pill"><span className="dot-red" /> REVOKED</span>}
                        </div>
                        <div className="agent-meta-details">
                          <span className="agent-email-mono">{agent.email}</span>
                          <span className="dot-sep">•</span>
                          <span className="agent-phone-item"><Phone size={12} color="var(--color-brand-light)" /> {agent.phone || '+91 7498162774'}</span>
                          <span className="dot-sep">•</span>
                          <span className="agent-territory-item"><MapPin size={12} color="var(--color-brand-light)" /> {agent.territory || 'Delhi NCR'}</span>
                        </div>
                        {agent.todayStats && (
                          <div className="agent-today-stats">
                            <span className="today-stat-pill"><Target size={11} /> {agent.todayStats.assignedVisits} visits</span>
                            <span className="today-stat-pill completed"><CheckCircle size={11} /> {agent.todayStats.completedVisits} done</span>
                            <span className="today-stat-pill meetings"><CalendarCheck size={11} /> {agent.todayStats.meetingsHeld} meetings</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="agent-actions-cluster">
                      <button onClick={() => setStatusConfirmAgent(agent)}
                        className={`btn btn-secondary action-pill ${isActive ? 'danger-ghost' : 'success-ghost'}`}>
                        {isActive ? <PauseCircle size={14} /> : <PlayCircle size={14} />}
                        <span>{isActive ? 'Pause' : 'Resume'}</span>
                      </button>
                      <button onClick={() => handleOpenEditModal(agent)} className="btn btn-secondary action-pill">
                        <Edit3 size={14} /><span>Edit</span>
                      </button>
                      <button onClick={() => navigate(`/agents/${agent.id}`)} className="btn btn-secondary action-pill portal-btn">
                        <ExternalLink size={14} /><span>Portal</span>
                      </button>
                      <button onClick={() => setDeleteConfirmAgent(agent)} className="btn btn-secondary delete-icon-btn">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ═══ TAB: REPORTS ═════════════════════════════════════════════════ */}
      {activeTab === 'reports' && (
        <div className="reports-section">
          <div className="reports-header-row">
            <div>
              <h2 className="section-heading"><BarChart3 size={20} /> Agent-wise Performance Report</h2>
              <p className="section-subtext">Real-time breakdown per agent: visits, leads tapped, meetings, conversion</p>
            </div>
            <button onClick={fetchReport} className="btn btn-secondary refresh-btn" disabled={reportLoading}>
              <RefreshCw size={14} className={reportLoading ? 'spin-icon' : ''} />
              {reportLoading ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>

          {reportLoading ? (
            <div className="loading-state-card"><div className="spinner-ring" /><span>Loading reports...</span></div>
          ) : reportData.length === 0 ? (
            <div className="card empty-state-card" style={{ padding: '48px 24px' }}>
              <BarChart3 size={44} color="var(--color-text-muted)" style={{ margin: '0 auto 14px' }} />
              <h3>No Report Data Yet</h3>
              <p style={{ color: 'var(--color-text-secondary)', fontSize: '.875rem' }}>
                Agent stats appear once visits and meetings are logged.
              </p>
            </div>
          ) : (
            <div className="report-cards-grid">
              {reportData.map((row) => (
                <div key={row.agentId} className="report-agent-card">
                  <div className="report-card-header">
                    <div className="report-avatar">
                      {row.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                    </div>
                    <div className="report-card-title">
                      <div className="report-agent-name">{row.name}</div>
                      <div className="report-agent-meta">{row.email}</div>
                      <div className="report-agent-meta" style={{ marginTop: 2 }}>
                        <MapPin size={11} /> {row.territory}
                        <span className="dot-sep">·</span>
                        <span className="emp-code-small">{row.employeeCode}</span>
                      </div>
                    </div>
                    <span className={`badge ${row.isActive ? 'badge-success' : 'badge-error'}`}>
                      {row.isActive ? 'Active' : 'Paused'}
                    </span>
                  </div>

                  <div className="report-stats-grid">
                    <div className="report-stat-cell">
                      <div className="report-stat-icon visits"><Target size={16} /></div>
                      <div className="report-stat-value">{row.stats.totalVisits}</div>
                      <div className="report-stat-label">Total Visits</div>
                    </div>
                    <div className="report-stat-cell">
                      <div className="report-stat-icon completed"><CheckCircle size={16} /></div>
                      <div className="report-stat-value">{row.stats.completedVisits}</div>
                      <div className="report-stat-label">Completed</div>
                    </div>
                    <div className="report-stat-cell highlight">
                      <div className="report-stat-icon tapped"><Zap size={16} /></div>
                      <div className="report-stat-value tapped-val">{row.stats.leadsTapped}</div>
                      <div className="report-stat-label">Leads Tapped</div>
                    </div>
                    <div className="report-stat-cell">
                      <div className="report-stat-icon meetings"><CalendarCheck size={16} /></div>
                      <div className="report-stat-value">{row.stats.totalMeetings}</div>
                      <div className="report-stat-label">Meetings</div>
                    </div>
                  </div>

                  <div className="conversion-bar-wrap">
                    <div className="conversion-bar-header">
                      <span className="conversion-label"><TrendingUp size={12} /> Lead Conversion Rate</span>
                      <span className="conversion-pct">{row.stats.conversionRate}%</span>
                    </div>
                    <div className="conversion-bar-track">
                      <div className="conversion-bar-fill" style={{ width: `${Math.min(row.stats.conversionRate, 100)}%` }} />
                    </div>
                  </div>

                  <button onClick={() => navigate(`/agents/${row.agentId}`)} className="btn btn-secondary view-portal-full-btn">
                    <ExternalLink size={13} /> View Full Agent Portal
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ═══ TAB: SCHEDULE MEETING ════════════════════════════════════════ */}
      {activeTab === 'schedule' && (
        <div className="schedule-section">
          <div className="schedule-header-row">
            <div>
              <h2 className="section-heading"><Calendar size={20} /> Schedule Agent Meeting</h2>
              <p className="section-subtext">Assign a meeting to a field agent — it immediately appears in their portal.</p>
            </div>
          </div>

          <div className="schedule-layout">
            <div className="card schedule-form-card">
              <form onSubmit={handleScheduleMeeting} className="sched-form">
                <div className="sched-field">
                  <label className="field-label-text">Select Field Agent *</label>
                  <select value={schedAgentId} onChange={e => setSchedAgentId(e.target.value)}
                    className="input sched-select" required>
                    <option value="">— Pick an agent —</option>
                    {agents.map(a => (
                      <option key={a.id} value={a.id}>
                        {a.name} ({a.employeeCode || a.email})
                      </option>
                    ))}
                  </select>

                  {/* Live meeting count for selected agent */}
                  {schedAgentId && schedAgentReport && (
                    <div className="agent-meeting-callout">
                      <CalendarCheck size={14} color="#6366f1" />
                      <div>
                        <span className="callout-agent-name">{selectedAgentForSched?.name}</span> currently has{' '}
                        <strong className="callout-count">{schedAgentReport.stats.totalMeetings}</strong> meeting{schedAgentReport.stats.totalMeetings !== 1 ? 's' : ''}
                        {' '}and <strong className="callout-leads">{schedAgentReport.stats.leadsTapped}</strong> leads tapped
                      </div>
                    </div>
                  )}
                </div>

                {/* All agents meeting count mini-display */}
                {reportData.length > 0 && (
                  <div className="all-agents-counts">
                    <div className="all-agents-counts-title"><Users size={13} /> Meeting Load per Agent</div>
                    {reportData.map(r => (
                      <div key={r.agentId} className={`agent-count-row ${r.agentId === schedAgentId ? 'selected-row' : ''}`}>
                        <span className="agent-count-name">{r.name}</span>
                        <div className="agent-count-bar-wrap">
                          <div className="agent-count-bar" style={{ width: `${Math.min(r.stats.totalMeetings * 10, 100)}%` }} />
                        </div>
                        <span className="agent-count-num">{r.stats.totalMeetings} mtgs</span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="sched-field">
                  <label className="field-label-text">Meeting Title</label>
                  <input type="text" value={schedTitle} onChange={e => setSchedTitle(e.target.value)}
                    placeholder="e.g. Site Visit – Sector 62, Follow-up Call" className="input" />
                </div>

                <div className="sched-field">
                  <label className="field-label-text">Schedule Date & Time *</label>
                  <input type="datetime-local" value={schedFor} onChange={e => setSchedFor(e.target.value)}
                    className="input" required />
                </div>

                {customers.length > 0 && (
                  <div className="sched-field">
                    <label className="field-label-text">Customer / Lead (Optional)</label>
                    <select value={schedCustomerId} onChange={e => setSchedCustomerId(e.target.value)} className="input sched-select">
                      <option value="">— None / Auto-assign —</option>
                      {customers.map((c: any) => (
                        <option key={c.id} value={c.id}>
                          {c.firstName} {c.lastName}{c.businessName ? ` (${c.businessName})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="sched-field">
                  <label className="field-label-text">Purpose of Meeting</label>
                  <input type="text" value={schedPurpose} onChange={e => setSchedPurpose(e.target.value)}
                    placeholder="e.g. Product Demo, Follow-up, Site Visit" className="input" />
                </div>

                <div className="sched-field">
                  <label className="field-label-text">Admin Notes (for agent)</label>
                  <textarea value={schedNotes} onChange={e => setSchedNotes(e.target.value)}
                    placeholder="Special instructions for the agent..." className="input sched-textarea" rows={3} />
                </div>

                <button type="submit" className="btn btn-primary sched-submit-btn" disabled={schedSubmitting}>
                  {schedSubmitting
                    ? <><span className="spinner-ring small" /> Scheduling...</>
                    : <><Calendar size={15} /> Schedule Meeting</>}
                </button>
              </form>
            </div>

            <div className="schedule-sidebar">
              <div className="card sched-info-card">
                <h3 className="sched-info-title"><Shield size={16} /> How it works</h3>
                <ul className="sched-info-list">
                  <li><ChevronRight size={14} /> Select the agent you want to assign</li>
                  <li><ChevronRight size={14} /> System shows live meeting count per agent to balance workload</li>
                  <li><ChevronRight size={14} /> Scheduled meeting appears immediately in agent's portal</li>
                  <li><ChevronRight size={14} /> Agent sees title, date/time, and your notes</li>
                </ul>
              </div>

              {reportData.length > 0 && (
                <div className="card sched-info-card">
                  <h3 className="sched-info-title"><TrendingUp size={16} /> Agent Quick Stats</h3>
                  {reportData.map(r => (
                    <div key={r.agentId} className="quick-stat-row">
                      <div className="quick-stat-avatar">
                        {r.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                      </div>
                      <div className="quick-stat-info">
                        <div className="quick-stat-name">{r.name}</div>
                        <div className="quick-stat-sub">
                          <Zap size={11} color="#fbbf24" /> {r.stats.leadsTapped} tapped
                          <span className="dot-sep">·</span>
                          <CalendarCheck size={11} color="#6366f1" /> {r.stats.totalMeetings} meetings
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Add Agent */}
      {showAddModal && (
        <div className="modal-backdrop-glass">
          <div className="card modal-content-box animate-scale-in">
            <div className="modal-header-row">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div className="modal-icon-header"><UserPlus size={18} color="#fff" /></div>
                <div>
                  <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800 }}>Provision Field Agent</h2>
                  <p style={{ margin: '2px 0 0', fontSize: '.78rem', color: 'var(--color-text-secondary)' }}>
                    Type name — login & password autofill instantly
                  </p>
                </div>
              </div>
              <X size={20} className="close-modal-icon" onClick={() => setShowAddModal(false)} />
            </div>
            <form onSubmit={handleCreateAgent} className="modal-form-body">
              <div className="form-two-col">
                <div>
                  <label className="field-label-text">First Name *</label>
                  <input type="text" value={newFirstName} onChange={e => handleNameChange(e.target.value)}
                    placeholder="e.g. Nilesh" className="input modal-input" required autoFocus />
                </div>
                <div>
                  <label className="field-label-text">Last Name</label>
                  <input type="text" value={newLastName} onChange={e => setNewLastName(e.target.value)}
                    placeholder="e.g. Somnawane" className="input modal-input" />
                </div>
              </div>
              <div className="autofill-callout-card">
                <div className="autofill-callout-header">
                  <span className="badge badge-brand autofill-badge"><Sparkles size={11} /> SMART AUTOFILL</span>
                  <span style={{ fontSize: '.75rem', color: 'var(--color-text-muted)' }}>Auto-generated from name</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div>
                    <label className="field-label-text">Agent Login Email *</label>
                    <input type="email" value={newEmail}
                      onChange={e => { setManualCredentialsOverride(true); setNewEmail(e.target.value); }}
                      placeholder="agentnilesh@gmail.com" className="input modal-input mono-font" required />
                  </div>
                  <div>
                    <label className="field-label-text">Agent Login Password *</label>
                    <div style={{ position: 'relative' }}>
                      <input type={showPassword ? 'text' : 'password'} value={newPassword}
                        onChange={e => { setManualCredentialsOverride(true); setNewPassword(e.target.value); }}
                        placeholder="nilesh@123" className="input modal-input mono-font" required style={{ paddingRight: 44 }} />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="eye-toggle-btn">
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              <div className="form-two-col">
                <div>
                  <label className="field-label-text">Mobile (WhatsApp)</label>
                  <input type="text" value={newPhone} onChange={e => handlePhoneChange(e.target.value)}
                    placeholder="+91 7498162774" className="input modal-input" />
                </div>
                <div>
                  <label className="field-label-text">Employee Code</label>
                  <input type="text" value={newEmployeeCode} onChange={e => setNewEmployeeCode(e.target.value)}
                    placeholder="AG001" className="input modal-input" />
                </div>
              </div>
              <div>
                <label className="field-label-text">Assigned Territory</label>
                <input type="text" value={newTerritory} onChange={e => setNewTerritory(e.target.value)}
                  placeholder="e.g. Delhi NCR (Dwarka Hub)" className="input modal-input" />
              </div>
              <div className="modal-actions-footer">
                <button type="button" onClick={() => setShowAddModal(false)} className="btn btn-secondary modal-cancel-btn">Cancel</button>
                <button type="submit" className="btn btn-primary modal-submit-btn" disabled={isSubmitting}>
                  {isSubmitting ? 'Provisioning...' : '✓ Create Field Agent'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Edit Agent */}
      {showEditModal && selectedAgent && (
        <div className="modal-backdrop-glass">
          <div className="card modal-content-box animate-scale-in">
            <div className="modal-header-row">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div className="modal-icon-header" style={{ background: 'linear-gradient(135deg,#3b82f6,#1d4ed8)' }}><Edit3 size={18} color="#fff" /></div>
                <div>
                  <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800 }}>Edit Agent Credentials</h2>
                  <p style={{ margin: '2px 0 0', fontSize: '.78rem', color: 'var(--color-text-secondary)' }}>Update profile, reset password, or territory</p>
                </div>
              </div>
              <X size={20} className="close-modal-icon" onClick={() => setShowEditModal(false)} />
            </div>
            <form onSubmit={handleUpdateAgent} className="modal-form-body">
              <div className="form-two-col">
                <div>
                  <label className="field-label-text">First Name</label>
                  <input type="text" value={editFirstName} onChange={e => setEditFirstName(e.target.value)} className="input modal-input" required />
                </div>
                <div>
                  <label className="field-label-text">Last Name</label>
                  <input type="text" value={editLastName} onChange={e => setEditLastName(e.target.value)} className="input modal-input" />
                </div>
              </div>
              <div>
                <label className="field-label-text">Email</label>
                <input type="email" value={editEmail} onChange={e => setEditEmail(e.target.value)} className="input modal-input mono-font" required />
              </div>
              <div>
                <label className="field-label-text">Reset Password (blank = keep)</label>
                <div style={{ position: 'relative' }}>
                  <input type={showEditPassword ? 'text' : 'password'} value={editPassword}
                    onChange={e => setEditPassword(e.target.value)} placeholder="Enter new password..." className="input modal-input mono-font" style={{ paddingRight: 44 }} />
                  <button type="button" onClick={() => setShowEditPassword(!showEditPassword)} className="eye-toggle-btn">
                    {showEditPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <div className="form-two-col">
                <div>
                  <label className="field-label-text">Mobile</label>
                  <input type="text" value={editPhone} onChange={e => setEditPhone(e.target.value)} className="input modal-input" />
                </div>
                <div>
                  <label className="field-label-text">Employee Code</label>
                  <input type="text" value={editEmployeeCode} onChange={e => setEditEmployeeCode(e.target.value)} className="input modal-input" />
                </div>
              </div>
              <div>
                <label className="field-label-text">Territory</label>
                <input type="text" value={editTerritory} onChange={e => setEditTerritory(e.target.value)} className="input modal-input" />
              </div>
              <div className="active-checkbox-box">
                <input type="checkbox" id="activeToggle" checked={editIsActive} onChange={e => setEditIsActive(e.target.checked)}
                  style={{ width: 18, height: 18, cursor: 'pointer', accentColor: '#10b981' }} />
                <label htmlFor="activeToggle" style={{ fontSize: '.85rem', fontWeight: 600, cursor: 'pointer' }}>
                  Account Active (uncheck to revoke login)
                </label>
              </div>
              <div className="modal-actions-footer">
                <button type="button" onClick={() => setShowEditModal(false)} className="btn btn-secondary modal-cancel-btn">Cancel</button>
                <button type="submit" className="btn btn-primary modal-submit-btn" disabled={isSubmitting}>
                  {isSubmitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Delete */}
      {deleteConfirmAgent && (
        <div className="modal-backdrop-glass">
          <div className="card modal-content-box animate-scale-in danger-border-modal" style={{ maxWidth: 440 }}>
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <div className="danger-icon-circle"><AlertTriangle size={28} color="#ef4444" /></div>
              <h2 style={{ margin: '14px 0 6px', fontSize: '1.25rem', fontWeight: 800, color: '#ef4444' }}>Delete Field Agent?</h2>
              <p style={{ margin: 0, fontSize: '.85rem', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
                Permanently delete <strong style={{ color: '#fff' }}>{deleteConfirmAgent.name}</strong> ({deleteConfirmAgent.email})? This is irreversible.
              </p>
            </div>
            <div className="confirm-modal-actions">
              <button type="button" onClick={() => setDeleteConfirmAgent(null)} className="btn btn-secondary modal-cancel-btn" disabled={isDeleting}>Cancel</button>
              <button type="button" onClick={handleConfirmDelete} className="btn delete-confirm-btn" disabled={isDeleting}>
                {isDeleting ? 'Deleting...' : 'Yes, Delete Agent'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Pause/Resume */}
      {statusConfirmAgent && (
        <div className="modal-backdrop-glass">
          <div className="card modal-content-box animate-scale-in" style={{ maxWidth: 440 }}>
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <div className="pause-icon-circle" style={{ background: statusConfirmAgent.isActive ? 'rgba(239,68,68,.12)' : 'rgba(16,185,129,.12)' }}>
                {statusConfirmAgent.isActive ? <PauseCircle size={28} color="#ef4444" /> : <PlayCircle size={28} color="#10b981" />}
              </div>
              <h2 style={{ margin: '14px 0 6px', fontSize: '1.25rem', fontWeight: 800 }}>
                {statusConfirmAgent.isActive ? 'Pause Login Access?' : 'Resume Login Access?'}
              </h2>
              <p style={{ margin: 0, fontSize: '.85rem', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
                {statusConfirmAgent.isActive
                  ? <><strong style={{ color: '#fff' }}>{statusConfirmAgent.name}</strong> will be blocked from signing in immediately.</>
                  : <>Re-enabling will allow <strong style={{ color: '#fff' }}>{statusConfirmAgent.name}</strong> to sign in.</>}
              </p>
            </div>
            <div className="confirm-modal-actions">
              <button type="button" onClick={() => setStatusConfirmAgent(null)} className="btn btn-secondary modal-cancel-btn">Cancel</button>
              <button type="button" onClick={handleConfirmToggleActive} className="btn"
                style={{ background: statusConfirmAgent.isActive ? '#ef4444' : '#10b981', color: '#fff', fontWeight: 700 }}>
                {statusConfirmAgent.isActive ? 'Confirm Pause' : 'Confirm Resume'}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .amps-container{display:flex;flex-direction:column;gap:24px;max-width:1100px;margin:0 auto;padding-bottom:48px;width:100%;}
        .amps-header{display:flex;align-items:flex-start;justify-content:space-between;flex-wrap:wrap;gap:16px;}
        .badge-row{display:flex;align-items:center;gap:8px;margin-bottom:6px;flex-wrap:wrap;}
        .dot-sep{color:var(--color-text-muted);font-size:.8rem;}
        .sub-title-text{font-size:.8125rem;color:var(--color-text-secondary);}
        .amps-title{font-size:1.85rem;font-weight:800;margin:0 0 6px;letter-spacing:-.02em;color:#fff;}
        .amps-desc{color:var(--color-text-secondary);font-size:.9rem;margin:0;max-width:640px;line-height:1.5;}
        .add-agent-btn{display:flex;align-items:center;gap:8px;padding:10px 20px;font-weight:700;font-size:.9rem;white-space:nowrap;}
        .amps-tabs{display:flex;gap:4px;background:var(--color-bg-card);border:1px solid var(--color-border);border-radius:var(--radius-lg);padding:5px;width:fit-content;flex-wrap:wrap;}
        .amps-tab{display:flex;align-items:center;gap:7px;padding:8px 18px;border-radius:var(--radius-md);border:none;background:none;color:var(--color-text-secondary);font-size:.875rem;font-weight:600;cursor:pointer;transition:.15s;}
        .amps-tab:hover{color:#fff;background:rgba(255,255,255,.05);}
        .amps-tab.active{background:linear-gradient(135deg,#6366f1,#4f46e5);color:#fff;box-shadow:0 4px 12px rgba(99,102,241,.35);}
        .primary-agent-banner{background:linear-gradient(135deg,rgba(99,102,241,.1),rgba(16,185,129,.08));border:1px solid rgba(99,102,241,.28);border-radius:var(--radius-lg);padding:16px 20px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:14px;}
        .banner-left{display:flex;align-items:center;gap:14px;}
        .banner-icon-box{width:42px;height:42px;border-radius:10px;background:linear-gradient(135deg,#6366f1,#4f46e5);display:flex;align-items:center;justify-content:center;color:#fff;box-shadow:0 0 16px rgba(99,102,241,.4);flex-shrink:0;}
        .banner-title{font-size:.925rem;font-weight:700;color:#fff;}
        .banner-subtext{font-size:.8125rem;color:var(--color-text-secondary);margin-top:2px;}
        .text-highlight{color:var(--color-brand-light);}
        .text-white{color:#fff;}
        .banner-actions{display:flex;align-items:center;gap:10px;flex-wrap:wrap;}
        .copy-pill-btn{font-size:.75rem;padding:5px 12px;display:flex;align-items:center;gap:5px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.12);}
        .search-bar-wrap{display:flex;align-items:center;gap:12px;background:var(--color-bg-card);padding:10px 16px;border-radius:var(--radius-md);border:1px solid var(--color-border);transition:border-color .2s;}
        .search-bar-wrap:focus-within{border-color:var(--color-brand-light);}
        .search-input-field{background:none;border:none;color:#fff;font-size:.875rem;width:100%;outline:none;}
        .clear-search-btn{cursor:pointer;color:var(--color-text-muted);transition:color .15s;}
        .clear-search-btn:hover{color:#fff;}
        .agents-grid-stack{display:flex;flex-direction:column;gap:12px;}
        .agent-row-card{padding:20px 24px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:16px;border-radius:var(--radius-lg);border:1px solid var(--color-border);background:var(--color-bg-card);transition:transform .15s,box-shadow .15s,border-color .15s;}
        .agent-row-card:hover{border-color:rgba(99,102,241,.4);box-shadow:0 6px 20px rgba(0,0,0,.25);}
        .agent-row-card.revoked{border-color:rgba(239,68,68,.35);background:rgba(239,68,68,.03);}
        .agent-identity-wrap{display:flex;align-items:center;gap:16px;min-width:280px;}
        .agent-avatar-circle{width:52px;height:52px;border-radius:50%;background:linear-gradient(135deg,#6366f1,#4f46e5);display:flex;align-items:center;justify-content:center;color:#fff;font-weight:800;font-size:1.15rem;box-shadow:0 0 16px rgba(99,102,241,.35);flex-shrink:0;}
        .agent-avatar-circle.offline{background:#4b5563;box-shadow:none;}
        .agent-text-meta{display:flex;flex-direction:column;gap:3px;}
        .agent-title-row{display:flex;align-items:center;gap:8px;flex-wrap:wrap;}
        .agent-name-text{margin:0;font-size:1.1rem;font-weight:700;color:#fff;}
        .emp-badge{font-size:.7rem;padding:2px 7px;border-radius:4px;}
        .status-pill{font-size:.68rem;padding:2px 8px;display:flex;align-items:center;gap:4px;font-weight:700;}
        .dot-green{width:6px;height:6px;border-radius:50%;background:#10b981;box-shadow:0 0 6px #10b981;}
        .dot-red{width:6px;height:6px;border-radius:50%;background:#ef4444;box-shadow:0 0 6px #ef4444;}
        .agent-meta-details{display:flex;align-items:center;gap:10px;flex-wrap:wrap;font-size:.8125rem;color:var(--color-text-secondary);}
        .agent-email-mono{color:var(--color-brand-light);font-family:var(--font-mono);font-weight:500;}
        .agent-phone-item,.agent-territory-item{display:flex;align-items:center;gap:4px;}
        .agent-today-stats{display:flex;gap:8px;margin-top:4px;flex-wrap:wrap;}
        .today-stat-pill{display:flex;align-items:center;gap:4px;font-size:.73rem;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.08);padding:2px 8px;border-radius:20px;color:var(--color-text-secondary);}
        .today-stat-pill.completed{border-color:rgba(16,185,129,.2);color:#10b981;}
        .today-stat-pill.meetings{border-color:rgba(99,102,241,.2);color:#a5b4fc;}
        .agent-actions-cluster{display:flex;align-items:center;gap:8px;flex-wrap:wrap;}
        .action-pill{font-size:.8125rem;padding:8px 13px;display:flex;align-items:center;gap:6px;border-radius:var(--radius-md);}
        .action-pill.danger-ghost{color:#f87171;border:1px solid rgba(239,68,68,.28);}
        .action-pill.danger-ghost:hover{background:rgba(239,68,68,.1);}
        .action-pill.success-ghost{color:#34d399;border:1px solid rgba(16,185,129,.28);}
        .action-pill.success-ghost:hover{background:rgba(16,185,129,.1);}
        .delete-icon-btn{font-size:.8rem;padding:8px 10px;color:#ef4444;border-color:rgba(239,68,68,.2);border-radius:var(--radius-md);}
        .delete-icon-btn:hover{background:rgba(239,68,68,.12);}
        .reports-section,.schedule-section{display:flex;flex-direction:column;gap:24px;}
        .reports-header-row,.schedule-header-row{display:flex;align-items:flex-start;justify-content:space-between;flex-wrap:wrap;gap:12px;}
        .section-heading{display:flex;align-items:center;gap:10px;margin:0 0 4px;font-size:1.35rem;font-weight:800;color:#fff;}
        .section-subtext{color:var(--color-text-secondary);font-size:.875rem;margin:0;}
        .refresh-btn{display:flex;align-items:center;gap:7px;font-size:.8125rem;padding:8px 14px;}
        .spin-icon{animation:spin .8s linear infinite;}
        .report-cards-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:20px;}
        .report-agent-card{background:var(--color-bg-card);border:1px solid var(--color-border);border-radius:var(--radius-lg);padding:22px;display:flex;flex-direction:column;gap:18px;transition:border-color .2s,box-shadow .2s;}
        .report-agent-card:hover{border-color:rgba(99,102,241,.4);box-shadow:0 8px 24px rgba(0,0,0,.25);}
        .report-card-header{display:flex;align-items:flex-start;gap:14px;}
        .report-avatar{width:48px;height:48px;border-radius:50%;background:linear-gradient(135deg,#6366f1,#4f46e5);display:flex;align-items:center;justify-content:center;color:#fff;font-weight:800;font-size:1.1rem;flex-shrink:0;box-shadow:0 0 14px rgba(99,102,241,.3);}
        .report-card-title{flex:1;min-width:0;}
        .report-agent-name{font-size:1.05rem;font-weight:700;color:#fff;margin-bottom:2px;}
        .report-agent-meta{font-size:.775rem;color:var(--color-text-muted);display:flex;align-items:center;gap:4px;}
        .emp-code-small{font-size:.7rem;color:var(--color-brand-light);font-family:var(--font-mono);}
        .report-stats-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;}
        .report-stat-cell{background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.06);border-radius:var(--radius-md);padding:12px 8px;display:flex;flex-direction:column;align-items:center;gap:6px;transition:border-color .15s;}
        .report-stat-cell.highlight{border-color:rgba(251,191,36,.25);background:rgba(251,191,36,.04);}
        .report-stat-cell:hover{border-color:rgba(99,102,241,.3);}
        .report-stat-icon{width:30px;height:30px;border-radius:8px;display:flex;align-items:center;justify-content:center;}
        .report-stat-icon.visits{background:rgba(99,102,241,.15);color:#6366f1;}
        .report-stat-icon.completed{background:rgba(16,185,129,.15);color:#10b981;}
        .report-stat-icon.tapped{background:rgba(251,191,36,.15);color:#fbbf24;}
        .report-stat-icon.meetings{background:rgba(139,92,246,.15);color:#8b5cf6;}
        .report-stat-value{font-size:1.6rem;font-weight:900;color:#fff;line-height:1;}
        .report-stat-value.tapped-val{color:#fbbf24;}
        .report-stat-label{font-size:.65rem;color:var(--color-text-muted);text-align:center;font-weight:600;text-transform:uppercase;letter-spacing:.05em;}
        .conversion-bar-wrap{display:flex;flex-direction:column;gap:8px;}
        .conversion-bar-header{display:flex;align-items:center;justify-content:space-between;}
        .conversion-label{font-size:.775rem;color:var(--color-text-secondary);display:flex;align-items:center;gap:5px;}
        .conversion-pct{font-size:.875rem;font-weight:700;color:#6366f1;}
        .conversion-bar-track{height:6px;background:rgba(255,255,255,.06);border-radius:9999px;overflow:hidden;}
        .conversion-bar-fill{height:100%;background:linear-gradient(90deg,#6366f1,#22d3ee);border-radius:9999px;transition:width .5s ease;}
        .view-portal-full-btn{display:flex;align-items:center;gap:7px;justify-content:center;font-size:.8125rem;padding:9px;width:100%;}
        .schedule-layout{display:grid;grid-template-columns:1fr 340px;gap:20px;align-items:start;}
        .schedule-form-card{padding:28px;}
        .sched-form{display:flex;flex-direction:column;gap:18px;}
        .sched-field{display:flex;flex-direction:column;gap:6px;}
        .sched-select{width:100%;cursor:pointer;}
        .sched-textarea{resize:vertical;min-height:80px;}
        .agent-meeting-callout{display:flex;align-items:flex-start;gap:10px;background:linear-gradient(135deg,rgba(99,102,241,.08),rgba(16,185,129,.06));border:1px solid rgba(99,102,241,.25);border-radius:var(--radius-md);padding:12px 14px;font-size:.8125rem;color:var(--color-text-secondary);margin-top:8px;}
        .callout-agent-name{color:#fff;font-weight:700;}
        .callout-count{color:#6366f1;font-size:1.1rem;}
        .callout-leads{color:#fbbf24;font-size:1.1rem;}
        .all-agents-counts{background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.06);border-radius:var(--radius-md);padding:14px 16px;display:flex;flex-direction:column;gap:8px;}
        .all-agents-counts-title{font-size:.78rem;color:var(--color-text-muted);font-weight:700;display:flex;align-items:center;gap:6px;margin-bottom:4px;text-transform:uppercase;letter-spacing:.06em;}
        .agent-count-row{display:flex;align-items:center;gap:10px;padding:4px 0;border-radius:4px;transition:.15s;}
        .agent-count-row.selected-row{background:rgba(99,102,241,.08);padding:6px;margin:0 -4px;}
        .agent-count-name{width:130px;font-size:.8rem;font-weight:600;color:#e2e8f0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;flex-shrink:0;}
        .agent-count-bar-wrap{flex:1;height:5px;background:rgba(255,255,255,.07);border-radius:9999px;overflow:hidden;}
        .agent-count-bar{height:100%;background:linear-gradient(90deg,#6366f1,#8b5cf6);border-radius:9999px;min-width:2px;transition:width .4s ease;}
        .agent-count-num{font-size:.73rem;color:var(--color-text-muted);white-space:nowrap;flex-shrink:0;min-width:50px;text-align:right;}
        .sched-submit-btn{display:flex;align-items:center;justify-content:center;gap:8px;padding:13px;font-size:.95rem;font-weight:700;}
        .sched-info-card{padding:22px;display:flex;flex-direction:column;gap:14px;}
        .sched-info-title{margin:0;font-size:.9rem;font-weight:700;color:#fff;display:flex;align-items:center;gap:8px;}
        .sched-info-list{margin:0;padding:0;list-style:none;display:flex;flex-direction:column;gap:8px;}
        .sched-info-list li{font-size:.8125rem;color:var(--color-text-secondary);display:flex;align-items:flex-start;gap:6px;line-height:1.4;}
        .schedule-sidebar{display:flex;flex-direction:column;gap:16px;}
        .quick-stat-row{display:flex;align-items:center;gap:12px;padding:8px 0;border-bottom:1px solid rgba(255,255,255,.05);}
        .quick-stat-row:last-child{border-bottom:none;}
        .quick-stat-avatar{width:34px;height:34px;border-radius:50%;background:linear-gradient(135deg,#6366f1,#4f46e5);display:flex;align-items:center;justify-content:center;color:#fff;font-weight:800;font-size:.8rem;flex-shrink:0;}
        .quick-stat-info{flex:1;}
        .quick-stat-name{font-size:.8125rem;font-weight:700;color:#fff;}
        .quick-stat-sub{font-size:.73rem;color:var(--color-text-muted);display:flex;align-items:center;gap:5px;margin-top:2px;}
        .modal-backdrop-glass{position:fixed;inset:0;background:rgba(4,7,15,.8);backdrop-filter:blur(8px);z-index:1100;display:flex;align-items:center;justify-content:center;padding:16px;}
        .modal-content-box{width:100%;max-width:520px;padding:28px;border-radius:var(--radius-lg);border:1px solid rgba(255,255,255,.1);background:#0f172a;box-shadow:0 20px 50px rgba(0,0,0,.6);}
        .animate-scale-in{animation:scaleIn .2s cubic-bezier(.16,1,.3,1);}
        @keyframes scaleIn{from{opacity:0;transform:scale(.95);}to{opacity:1;transform:scale(1);}}
        .modal-header-row{display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;}
        .modal-icon-header{width:38px;height:38px;border-radius:10px;background:linear-gradient(135deg,#6366f1,#4f46e5);display:flex;align-items:center;justify-content:center;}
        .close-modal-icon{cursor:pointer;color:var(--color-text-muted);transition:color .15s;}
        .close-modal-icon:hover{color:#fff;}
        .modal-form-body{display:flex;flex-direction:column;gap:16px;}
        .form-two-col{display:grid;grid-template-columns:1fr 1fr;gap:12px;}
        .field-label-text{display:block;font-size:.78rem;color:var(--color-text-secondary);margin-bottom:6px;font-weight:600;}
        .modal-input{padding:9px 12px;font-size:.875rem;border-radius:var(--radius-md);}
        .mono-font{font-family:var(--font-mono);}
        .autofill-callout-card{padding:14px 16px;background:rgba(99,102,241,.05);border:1px solid rgba(99,102,241,.2);border-radius:var(--radius-md);}
        .autofill-callout-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;}
        .autofill-badge{font-size:.68rem;padding:2px 7px;display:flex;align-items:center;gap:4px;}
        .eye-toggle-btn{position:absolute;right:12px;top:50%;transform:translateY(-50%);background:none;border:none;color:var(--color-text-muted);cursor:pointer;}
        .active-checkbox-box{display:flex;align-items:center;gap:10px;padding:12px;background:rgba(255,255,255,.03);border-radius:var(--radius-md);border:1px solid var(--color-border-subtle);}
        .modal-actions-footer{display:flex;justify-content:flex-end;gap:10px;margin-top:14px;}
        .modal-cancel-btn{padding:10px 20px;}
        .modal-submit-btn{padding:10px 24px;}
        .danger-border-modal{border-color:rgba(239,68,68,.35);}
        .danger-icon-circle{width:56px;height:56px;border-radius:50%;background:rgba(239,68,68,.12);display:flex;align-items:center;justify-content:center;margin:0 auto;}
        .pause-icon-circle{width:56px;height:56px;border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto;}
        .confirm-modal-actions{display:grid;grid-template-columns:1fr 1fr;gap:12px;}
        .delete-confirm-btn{background:#ef4444;color:#fff;font-weight:700;box-shadow:0 4px 14px rgba(239,68,68,.35);}
        .delete-confirm-btn:hover{background:#dc2626;}
        .loading-state-card{display:flex;align-items:center;justify-content:center;gap:12px;padding:48px;color:var(--color-text-secondary);font-size:.9rem;}
        .empty-state-card{display:flex;flex-direction:column;align-items:center;text-align:center;padding:48px 24px;}
        .spinner-ring{width:20px;height:20px;border:2px solid rgba(99,102,241,.2);border-top-color:#6366f1;border-radius:50%;animation:spin .8s linear infinite;flex-shrink:0;}
        .spinner-ring.small{width:14px;height:14px;}
        @keyframes spin{to{transform:rotate(360deg);}}
        @media(max-width:900px){
          .schedule-layout{grid-template-columns:1fr;}
          .report-stats-grid{grid-template-columns:repeat(2,1fr);}
          .amps-header{flex-direction:column;align-items:stretch;}
          .add-agent-btn{justify-content:center;}
          .agent-row-card{flex-direction:column;align-items:stretch;padding:16px;}
          .agent-actions-cluster{justify-content:flex-start;border-top:1px solid var(--color-border-subtle);padding-top:12px;width:100%;}
          .action-pill{flex:1;justify-content:center;}
          .form-two-col{grid-template-columns:1fr;}
        }
        @media(max-width:600px){
          .amps-tabs{width:100%;}
          .amps-tab{flex:1;justify-content:center;padding:8px 10px;font-size:.8rem;}
          .amps-title{font-size:1.5rem;}
          .report-cards-grid{grid-template-columns:1fr;}
          .banner-actions{width:100%;justify-content:space-between;}
          .copy-pill-btn{flex:1;justify-content:center;}
          .agent-identity-wrap{gap:12px;min-width:0;}
          .agent-avatar-circle{width:44px;height:44px;font-size:1rem;}
        }
      `}</style>
    </div>
  );
}
