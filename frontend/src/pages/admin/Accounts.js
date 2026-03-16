import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import Layout from '../../components/shared/Layout';
import axiosInstance from '../../utils/axiosInstance';

const statusColors = { ACTIVE: '#22c55e', REQUESTED: '#3b82f6', AT_RISK: '#f59e0b', DEACTIVATED: '#ef4444', REJECTED: '#94a3b8' };

function Badge({ status }) {
  const c = statusColors[status] || '#94a3b8';
  return <span style={{ padding: '5px 14px', borderRadius: 99, background: c + '20', color: c, fontWeight: 700, fontSize: 13 }}>{status}</span>;
}

export default function AdminAccounts() {
  const [accounts, setAccounts] = useState([]);
  const [filter, setFilter] = useState('ALL');

  const fetchAccounts = () => axiosInstance.get('/accounts').then(r => setAccounts(r.data.accounts || []));
  useEffect(() => { fetchAccounts(); }, []);

  const action = async (url, msg) => {
    try { await axiosInstance.patch(url); toast.success(msg); fetchAccounts(); }
    catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const statuses = ['ALL', 'REQUESTED', 'ACTIVE', 'AT_RISK', 'DEACTIVATED', 'REJECTED'];
  const filtered = filter === 'ALL' ? accounts : accounts.filter(a => a.status === filter);
  const requestedCount = accounts.filter(a => a.status === 'REQUESTED').length;

  return (
    <Layout>
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
        <h2 style={{ margin: 0, color: '#1e293b', fontSize: 28, fontWeight: 700 }}>Accounts</h2>
        {requestedCount > 0 && (
          <span style={{ background: '#fef3c7', color: '#92400e', padding: '8px 18px', borderRadius: 99, fontSize: 14, fontWeight: 700, border: '1px solid #f59e0b' }}>
            {requestedCount} pending approval
          </span>
        )}
      </div>
      {/* Filter pills — flex-wrap for mobile */}
      <div className="d-flex flex-wrap gap-2 mb-4">
        {statuses.map(s => (
          <button key={s} onClick={() => setFilter(s)}
            style={{ padding: '8px 18px', borderRadius: 99, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 14, background: filter === s ? '#1e293b' : '#fff', color: filter === s ? '#fff' : '#64748b', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
            {s} ({s === 'ALL' ? accounts.length : accounts.filter(a => a.status === s).length})
          </button>
        ))}
      </div>
      <div style={{ background: '#fff', borderRadius: 16, overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.07)' }}>
        {/* Bootstrap table-responsive */}
        <div className="table-responsive">
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 750 }}>
            <thead>
              <tr style={{ background: '#f8fafc' }}>
                {['Account Number', 'Customer', 'Type', 'Balance', 'Status', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '16px 20px', textAlign: 'left', fontSize: 13, fontWeight: 700, color: '#475569', borderBottom: '2px solid #e2e8f0', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && <tr><td colSpan={6} style={{ padding: 36, textAlign: 'center', color: '#94a3b8', fontSize: 15 }}>No accounts found</td></tr>}
              {filtered.map(a => (
                <tr key={a.requestId || a.accountNumber} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '16px 20px' }}>
                    {a.accountNumber
                      ? <span style={{ fontFamily: 'monospace', fontSize: 15, color: '#3b82f6', fontWeight: 700 }}>{a.accountNumber}</span>
                      : <span style={{ fontSize: 13, color: '#94a3b8', fontStyle: 'italic' }}>Pending approval</span>}
                  </td>
                  <td style={{ padding: '16px 20px' }}>
                    <p style={{ margin: 0, fontWeight: 700, fontSize: 15 }}>{a.customerName || '-'}</p>
                    <p style={{ margin: '3px 0 0', fontSize: 12, color: '#94a3b8', fontFamily: 'monospace' }}>{a.customerId}</p>
                  </td>
                  <td style={{ padding: '16px 20px', fontSize: 14, fontWeight: 500 }}>{a.accountType}</td>
                  <td style={{ padding: '16px 20px', fontWeight: 700, fontSize: 15 }}>{a.accountNumber ? `Rs. ${a.balance?.toLocaleString('en-IN')}` : '-'}</td>
                  <td style={{ padding: '16px 20px' }}>
                    <Badge status={a.status} />
                    {a.status === 'AT_RISK' && a.atRiskSince && <p style={{ margin: '5px 0 0', fontSize: 12, color: '#f59e0b' }}>Since {new Date(a.atRiskSince).toLocaleDateString('en-IN')}</p>}
                    {a.status === 'DEACTIVATED' && a.deactivationType && <p style={{ margin: '5px 0 0', fontSize: 12, color: '#94a3b8' }}>{a.deactivationType}</p>}
                  </td>
                  <td style={{ padding: '16px 20px' }}>
                    <div className="d-flex flex-wrap gap-2">
                      {a.status === 'REQUESTED' && (
                        <>
                          <button onClick={() => action(`/accounts/${a.requestId}/approve`, 'Account approved')} style={{ padding: '7px 14px', borderRadius: 8, border: 'none', background: '#22c55e', color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>Approve</button>
                          <button onClick={() => action(`/accounts/${a.requestId}/reject`, 'Account rejected')} style={{ padding: '7px 14px', borderRadius: 8, border: 'none', background: '#ef4444', color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>Reject</button>
                        </>
                      )}
                      {['ACTIVE', 'AT_RISK'].includes(a.status) && (
                        <button onClick={() => action(`/accounts/${a.accountNumber}/deactivate`, 'Deactivated')} style={{ padding: '7px 14px', borderRadius: 8, border: 'none', background: '#ef4444', color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>Deactivate</button>
                      )}
                      {a.status === 'DEACTIVATED' && (
                        <button onClick={() => action(`/accounts/${a.accountNumber}/activate`, 'Activated')} style={{ padding: '7px 14px', borderRadius: 8, border: 'none', background: '#22c55e', color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>Activate</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
}
