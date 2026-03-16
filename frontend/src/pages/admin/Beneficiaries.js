import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import Layout from '../../components/shared/Layout';
import axiosInstance from '../../utils/axiosInstance';

const statusColors = { PENDING: '#f59e0b', ACTIVE: '#22c55e', REJECTED: '#ef4444' };

function Badge({ status }) {
  const c = statusColors[status] || '#94a3b8';
  return <span style={{ padding: '5px 14px', borderRadius: 99, background: c + '20', color: c, fontWeight: 700, fontSize: 13 }}>{status}</span>;
}

export default function AdminBeneficiaries() {
  const [beneficiaries, setBeneficiaries] = useState([]);
  const [filter, setFilter] = useState('PENDING');

  const fetchBeneficiaries = () =>
    axiosInstance.get('/beneficiaries/all').then(r => setBeneficiaries(r.data.beneficiaries || [])).catch(() => {});

  useEffect(() => { fetchBeneficiaries(); }, []);

  const approve = async (id) => {
    try { await axiosInstance.patch(`/beneficiaries/${id}/approve`); toast.success('Beneficiary approved'); fetchBeneficiaries(); }
    catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const reject = async (id) => {
    try { await axiosInstance.patch(`/beneficiaries/${id}/reject`); toast.success('Beneficiary rejected'); fetchBeneficiaries(); }
    catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const statuses = ['ALL', 'PENDING', 'ACTIVE', 'REJECTED'];
  const filtered = filter === 'ALL' ? beneficiaries : beneficiaries.filter(b => b.status === filter);
  const pendingCount = beneficiaries.filter(b => b.status === 'PENDING').length;

  return (
    <Layout>
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
        <h2 style={{ margin: 0, color: '#1e293b', fontSize: 28, fontWeight: 700 }}>Beneficiaries</h2>
        {pendingCount > 0 && (
          <span style={{ background: '#fef3c7', color: '#92400e', padding: '8px 18px', borderRadius: 99, fontSize: 14, fontWeight: 700, border: '1px solid #f59e0b' }}>
            {pendingCount} pending approval
          </span>
        )}
      </div>
      {/* Filter pills — wrap on mobile */}
      <div className="d-flex flex-wrap gap-2 mb-4">
        {statuses.map(s => (
          <button key={s} onClick={() => setFilter(s)}
            style={{ padding: '8px 18px', borderRadius: 99, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 14, background: filter === s ? '#1e293b' : '#fff', color: filter === s ? '#fff' : '#64748b', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
            {s} ({s === 'ALL' ? beneficiaries.length : beneficiaries.filter(b => b.status === s).length})
          </button>
        ))}
      </div>
      <div style={{ background: '#fff', borderRadius: 16, overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.07)' }}>
        {/* Bootstrap table-responsive */}
        <div className="table-responsive">
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 700 }}>
            <thead>
              <tr style={{ background: '#f8fafc' }}>
                {['Beneficiary ID', 'Customer ID', 'Beneficiary Name', 'Account Number', 'Branch', 'Status', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '16px 20px', textAlign: 'left', fontSize: 13, fontWeight: 700, color: '#475569', borderBottom: '2px solid #e2e8f0', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && <tr><td colSpan={7} style={{ padding: 40, textAlign: 'center', color: '#94a3b8', fontSize: 15 }}>No beneficiaries found</td></tr>}
              {filtered.map(b => (
                <tr key={b.beneficiaryId} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '16px 20px', fontFamily: 'monospace', fontSize: 13, color: '#3b82f6' }}>{b.beneficiaryId}</td>
                  <td style={{ padding: '16px 20px', fontFamily: 'monospace', fontSize: 13, color: '#64748b' }}>{b.customerId}</td>
                  <td style={{ padding: '16px 20px', fontWeight: 600, fontSize: 15 }}>{b.beneficiaryName}</td>
                  <td style={{ padding: '16px 20px', fontFamily: 'monospace', fontSize: 14, color: '#1e293b', fontWeight: 600 }}>{b.accountNumber}</td>
                  <td style={{ padding: '16px 20px', fontSize: 14, color: '#64748b' }}>{b.branch || '-'}</td>
                  <td style={{ padding: '16px 20px' }}><Badge status={b.status} /></td>
                  <td style={{ padding: '16px 20px' }}>
                    {b.status === 'PENDING' && (
                      <div className="d-flex flex-wrap gap-2">
                        <button onClick={() => approve(b.beneficiaryId)} style={{ padding: '7px 16px', borderRadius: 8, border: 'none', background: '#22c55e', color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>Approve</button>
                        <button onClick={() => reject(b.beneficiaryId)} style={{ padding: '7px 16px', borderRadius: 8, border: 'none', background: '#ef4444', color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>Reject</button>
                      </div>
                    )}
                    {b.status !== 'PENDING' && <span style={{ color: '#94a3b8', fontSize: 13 }}>-</span>}
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
