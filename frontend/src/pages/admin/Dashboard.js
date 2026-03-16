import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/shared/Layout';
import axiosInstance from '../../utils/axiosInstance';

const icons = {
  customers: (<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>),
  accounts: (<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>),
  transactions: (<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>),
  loans: (<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>),
  investments: (<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>),
  support: (<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>)
};

function MetricRow({ label, value, highlight, badge, badgeColor }) {
  return (
    <div className="d-flex justify-content-between align-items-center py-3" style={{ borderBottom: '1px solid #f1f5f9' }}>
      <span style={{ fontSize: 14, color: '#64748b', fontWeight: 500 }}>{label}</span>
      <div className="d-flex align-items-center gap-2">
        {badge && <span style={{ padding: '2px 8px', borderRadius: 99, fontSize: 11, fontWeight: 700, background: badgeColor + '20', color: badgeColor }}>{badge}</span>}
        <span style={{ fontSize: 16, fontWeight: 800, color: highlight || '#1e293b' }}>{value ?? '-'}</span>
      </div>
    </div>
  );
}

function SectionCard({ title, iconKey, color, children, actionLabel, actionPath, navigate }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div style={{ background: '#fff', borderRadius: 20, overflow: 'hidden', boxShadow: hovered ? '0 8px 32px rgba(0,0,0,0.12)' : '0 2px 12px rgba(0,0,0,0.07)', transition: 'box-shadow 0.2s, transform 0.2s', transform: hovered ? 'translateY(-2px)' : 'translateY(0)', display: 'flex', flexDirection: 'column', height: '100%' }}
      onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
      <div style={{ background: color, padding: '20px 24px' }} className="d-flex justify-content-between align-items-center">
        <div className="d-flex align-items-center gap-3">
          <div style={{ width: 42, height: 42, borderRadius: 12, background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>{icons[iconKey]}</div>
          <h3 style={{ margin: 0, color: '#fff', fontSize: 17, fontWeight: 700, letterSpacing: 0.3 }}>{title}</h3>
        </div>
        {actionLabel && (
          <button onClick={() => navigate(actionPath)}
            style={{ padding: '7px 16px', borderRadius: 99, border: '1.5px solid rgba(255,255,255,0.5)', background: 'transparent', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
            {actionLabel} →
          </button>
        )}
      </div>
      <div style={{ padding: '4px 24px 8px', flex: 1 }}>{children}</div>
    </div>
  );
}

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const loadStats = () => {
    setLoading(true);
    axiosInstance.get('/admin/stats').then(r => { setStats(r.data.stats); setLoading(false); }).catch(() => setLoading(false));
  };

  useEffect(() => { loadStats(); }, []);

  if (loading) return (
    <Layout>
      <div className="d-flex align-items-center gap-3 py-5">
        <div style={{ width: 28, height: 28, borderRadius: '50%', border: '3px solid #e2e8f0', borderTopColor: '#3b82f6', animation: 'spin 0.7s linear infinite' }} />
        <p style={{ color: '#94a3b8', fontSize: 16, margin: 0 }}>Loading dashboard...</p>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </Layout>
  );

  if (!stats) return <Layout><p style={{ color: '#ef4444', fontSize: 16 }}>Failed to load stats. Please refresh.</p></Layout>;

  const now = new Date();
  const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  const dateStr = now.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <Layout>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <div className="d-flex flex-wrap justify-content-between align-items-start gap-3 mb-4">
        <div>
          <h2 style={{ margin: '0 0 6px', color: '#1e293b', fontSize: 28, fontWeight: 700 }}>Admin Dashboard</h2>
          <p style={{ margin: 0, color: '#94a3b8', fontSize: 14 }}>{dateStr} &nbsp;·&nbsp; {timeStr}</p>
        </div>
        <button onClick={loadStats}
          style={{ padding: '10px 20px', borderRadius: 10, border: '1.5px solid #e2e8f0', background: '#fff', color: '#475569', fontSize: 14, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
          Refresh
        </button>
      </div>

      {/* Bootstrap grid: col-12 col-sm-6 col-lg-4 col-xl-3 pattern — 2 cols on tablet, 3 on laptop */}
      <div className="row g-4">
        <div className="col-12 col-md-6">
          <SectionCard title="Customers" iconKey="customers" color="#3b82f6" actionLabel="Manage" actionPath="/admin/customers" navigate={navigate}>
            <MetricRow label="Total Registered" value={stats.customers.total} />
            <MetricRow label="Active Customers" value={stats.customers.active} highlight="#22c55e" />
            <MetricRow label="Pending KYC" value={stats.customers.pendingKYC} highlight={stats.customers.pendingKYC > 0 ? '#f59e0b' : '#1e293b'} badge={stats.customers.pendingKYC > 0 ? 'Needs Review' : null} badgeColor="#f59e0b" />
            <MetricRow label="AT RISK Accounts" value={stats.customers.atRisk} highlight={stats.customers.atRisk > 0 ? '#ef4444' : '#1e293b'} badge={stats.customers.atRisk > 0 ? 'Alert' : null} badgeColor="#ef4444" />
          </SectionCard>
        </div>
        <div className="col-12 col-md-6">
          <SectionCard title="Accounts" iconKey="accounts" color="#8b5cf6" actionLabel="Manage" actionPath="/admin/accounts" navigate={navigate}>
            <MetricRow label="Total Accounts" value={stats.accounts.total} />
            <MetricRow label="Pending Approval" value={stats.accounts.pending} highlight={stats.accounts.pending > 0 ? '#f59e0b' : '#1e293b'} badge={stats.accounts.pending > 0 ? 'Action Required' : null} badgeColor="#f59e0b" />
            <MetricRow label="Total Balance Held" value={`Rs. ${stats.accounts.totalBalance?.toLocaleString('en-IN')}`} highlight="#8b5cf6" />
          </SectionCard>
        </div>
        <div className="col-12 col-md-6">
          <SectionCard title="Transactions" iconKey="transactions" color="#22c55e" actionLabel="View All" actionPath="/admin/accounts" navigate={navigate}>
            <MetricRow label="Total Transactions" value={stats.transactions.total} />
            <MetricRow label="Today's Count" value={stats.transactions.todayCount} />
            <MetricRow label="Deposited Today" value={`Rs. ${stats.transactions.todayDeposited?.toLocaleString('en-IN')}`} highlight="#22c55e" />
            <MetricRow label="Withdrawn Today" value={`Rs. ${stats.transactions.todayWithdrawn?.toLocaleString('en-IN')}`} highlight="#ef4444" />
          </SectionCard>
        </div>
        <div className="col-12 col-md-6">
          <SectionCard title="Loans" iconKey="loans" color="#f59e0b" actionLabel="Manage" actionPath="/admin/loans" navigate={navigate}>
            <MetricRow label="Pending Approval" value={stats.loans.pending} highlight={stats.loans.pending > 0 ? '#f59e0b' : '#1e293b'} badge={stats.loans.pending > 0 ? 'Needs Review' : null} badgeColor="#f59e0b" />
            <MetricRow label="Active Loans" value={stats.loans.active} highlight="#22c55e" />
            <MetricRow label="Total Disbursed" value={`Rs. ${stats.loans.totalDisbursed?.toLocaleString('en-IN')}`} highlight="#f59e0b" />
          </SectionCard>
        </div>
        <div className="col-12 col-md-6">
          <SectionCard title="Investments" iconKey="investments" color="#ec4899" actionLabel="View" actionPath="/admin/accounts" navigate={navigate}>
            <MetricRow label="Active Fixed Deposits" value={stats.investments.activeFDs} highlight="#ec4899" />
            <MetricRow label="Active Recurring Deposits" value={stats.investments.activeRDs} highlight="#ec4899" />
          </SectionCard>
        </div>
        <div className="col-12 col-md-6">
          <SectionCard title="Support" iconKey="support" color="#64748b" actionLabel="Manage" actionPath="/admin/chat" navigate={navigate}>
            <MetricRow label="Open Tickets" value={stats.support.open} highlight={stats.support.open > 0 ? '#ef4444' : '#1e293b'} badge={stats.support.open > 0 ? 'Unresolved' : null} badgeColor="#ef4444" />
            <MetricRow label="In Progress" value={stats.support.inProgress} highlight={stats.support.inProgress > 0 ? '#f59e0b' : '#1e293b'} />
          </SectionCard>
        </div>
      </div>
    </Layout>
  );
}
