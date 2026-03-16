import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import Layout from '../../components/shared/Layout';
import axiosInstance from '../../utils/axiosInstance';

const statusColors = { PENDING: '#f59e0b', APPROVED: '#22c55e', REJECTED: '#ef4444', ACTIVE: '#3b82f6', CLOSED: '#94a3b8' };

function Badge({ status }) {
  const c = statusColors[status] || '#94a3b8';
  return <span style={{ padding: '3px 10px', borderRadius: 99, background: c + '20', color: c, fontWeight: 700, fontSize: 12 }}>{status}</span>;
}

export default function AdminLoans() {
  const [loans, setLoans] = useState([]);
  const [filter, setFilter] = useState('ALL');
  const [comment, setComment] = useState('');
  const [rejectId, setRejectId] = useState(null);

  const fetchLoans = () => axiosInstance.get('/loans').then(r => setLoans(r.data.loans || []));
  useEffect(() => { fetchLoans(); }, []);

  const approve = async (loanId) => {
    try { await axiosInstance.patch(`/loans/${loanId}/approve`); toast.success('Loan approved and disbursed'); fetchLoans(); }
    catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const reject = async (loanId) => {
    try { await axiosInstance.patch(`/loans/${loanId}/reject`, { adminComment: comment || 'Rejected by admin' }); toast.success('Loan rejected'); fetchLoans(); setRejectId(null); setComment(''); }
    catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const filtered = filter === 'ALL' ? loans : loans.filter(l => l.status === filter);

  return (
    <Layout>
      <h2 style={{ margin: '0 0 24px', color: '#1e293b', fontSize: 24 }}>Loan Applications</h2>
      {/* Filter pills — wrap on mobile */}
      <div className="d-flex flex-wrap gap-2 mb-4">
        {['ALL', 'PENDING', 'APPROVED', 'ACTIVE', 'REJECTED', 'CLOSED'].map(s => (
          <button key={s} onClick={() => setFilter(s)}
            style={{ padding: '6px 14px', borderRadius: 99, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 12, background: filter === s ? '#1e293b' : '#fff', color: filter === s ? '#fff' : '#64748b', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
            {s}
          </button>
        ))}
      </div>

      {/* Reject modal */}
      {rejectId && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }}>
          <div style={{ background: '#fff', borderRadius: 12, padding: 28, width: '100%', maxWidth: 400 }}>
            <h3 style={{ margin: '0 0 16px', color: '#1e293b' }}>Reject Loan</h3>
            <textarea value={comment} onChange={e => setComment(e.target.value)} placeholder="Reason for rejection (optional)"
              style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 14, resize: 'vertical', minHeight: 80, boxSizing: 'border-box', marginBottom: 16, fontFamily: 'inherit' }} />
            <div className="d-flex gap-3">
              <button onClick={() => reject(rejectId)} className="btn flex-fill" style={{ padding: 12, borderRadius: 8, border: 'none', background: '#ef4444', color: '#fff', fontWeight: 700 }}>Reject</button>
              <button onClick={() => { setRejectId(null); setComment(''); }} className="btn flex-fill" style={{ padding: 12, borderRadius: 8, border: 'none', background: '#f1f5f9', color: '#64748b', fontWeight: 700 }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      <div className="d-flex flex-column gap-3">
        {filtered.length === 0 && <div style={{ background: '#fff', borderRadius: 12, padding: 32, textAlign: 'center', color: '#94a3b8' }}>No loans found</div>}
        {filtered.map(loan => (
          <div key={loan.loanId} style={{ background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
            <div className="d-flex flex-wrap justify-content-between align-items-start gap-2 mb-3">
              <div>
                <span style={{ fontFamily: 'monospace', fontSize: 12, color: '#94a3b8' }}>{loan.loanId}</span>
                <div className="d-flex flex-wrap gap-3 mt-1">
                  <span style={{ fontSize: 12, color: '#64748b' }}>Customer: <strong>{loan.customerId}</strong></span>
                  <span style={{ fontSize: 12, color: '#64748b' }}>Account: <strong style={{ fontFamily: 'monospace' }}>{loan.accountNumber}</strong></span>
                </div>
              </div>
              <Badge status={loan.status} />
            </div>
            <div className="d-flex flex-wrap gap-4 mb-3">
              {[['Loan Amount', `Rs. ${loan.loanAmount?.toLocaleString('en-IN')}`], ['EMI', `Rs. ${loan.emi?.toLocaleString('en-IN')}/mo`], ['Remaining', `Rs. ${(loan.remainingBalance ?? loan.loanAmount)?.toLocaleString('en-IN')}`], ['Tenure', `${loan.tenureMonths} months`], ['Rate', `${loan.interestRate}%`], ['Purpose', loan.purpose], ['Applied', new Date(loan.createdAt).toLocaleDateString('en-IN')]].map(([lbl, val]) => (
                <div key={lbl}>
                  <p style={{ margin: 0, color: '#94a3b8', fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.4 }}>{lbl}</p>
                  <p style={{ margin: 0, fontWeight: 700, fontSize: 14 }}>{val}</p>
                </div>
              ))}
            </div>
            {loan.adminComment && <p style={{ fontSize: 13, color: '#ef4444', margin: '0 0 12px' }}>Note: {loan.adminComment}</p>}
            {loan.status === 'PENDING' && (
              <div className="d-flex flex-wrap gap-2">
                <button onClick={() => approve(loan.loanId)} style={{ padding: '8px 20px', borderRadius: 8, border: 'none', background: '#22c55e', color: '#fff', fontWeight: 700, cursor: 'pointer' }}>Approve and Disburse</button>
                <button onClick={() => setRejectId(loan.loanId)} style={{ padding: '8px 20px', borderRadius: 8, border: 'none', background: '#ef4444', color: '#fff', fontWeight: 700, cursor: 'pointer' }}>Reject</button>
              </div>
            )}
          </div>
        ))}
      </div>
    </Layout>
  );
}
