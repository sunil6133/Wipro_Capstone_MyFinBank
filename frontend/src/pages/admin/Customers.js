import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import Layout from '../../components/shared/Layout';
import axiosInstance from '../../utils/axiosInstance';

const statusColors = { ACTIVE: '#22c55e', PENDING_VERIFICATION: '#f59e0b', REJECTED: '#ef4444' };

function Badge({ status }) {
  const c = statusColors[status] || '#94a3b8';
  return <span style={{ padding: '5px 14px', borderRadius: 99, background: c + '20', color: c, fontWeight: 700, fontSize: 13 }}>{status}</span>;
}

export default function AdminCustomers() {
  const [customers, setCustomers] = useState([]);
  const [selected, setSelected] = useState(null);

  const fetchCustomers = () => axiosInstance.get('/customers').then(r => setCustomers(r.data.customers || []));
  useEffect(() => { fetchCustomers(); }, []);

  const approve = async (id) => {
    try { await axiosInstance.patch(`/customers/${id}/approve`); toast.success('KYC Approved'); fetchCustomers(); setSelected(null); }
    catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const reject = async (id) => {
    try { await axiosInstance.patch(`/customers/${id}/reject`); toast.success('KYC Rejected'); fetchCustomers(); setSelected(null); }
    catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  return (
    <Layout>
      <h2 style={{ margin: '0 0 28px', color: '#1e293b', fontSize: 28, fontWeight: 700 }}>Customers</h2>
      <div className="row g-4 align-items-start">
        {/* Table column */}
        <div className={selected ? 'col-12 col-xl-7' : 'col-12'}>
          <div style={{ background: '#fff', borderRadius: 16, overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.07)' }}>
            <div className="table-responsive">
              <table style={{ minWidth: 700, borderCollapse: 'collapse', width: '100%' }}>
                <thead>
                  <tr style={{ background: '#f8fafc' }}>
                    {['Customer ID', 'Name', 'Email', 'Phone', 'Gov ID', 'Status', 'Joined', 'Actions'].map(h => (
                      <th key={h} style={{ padding: '16px 20px', textAlign: 'left', fontSize: 13, fontWeight: 700, color: '#475569', borderBottom: '2px solid #e2e8f0', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {customers.map(c => (
                    <tr key={c.customerId} onClick={() => setSelected(c)} style={{ borderBottom: '1px solid #f1f5f9', cursor: 'pointer', background: selected?.customerId === c.customerId ? '#eff6ff' : 'transparent' }}>
                      <td style={{ padding: '16px 20px', fontFamily: 'monospace', fontSize: 13, color: '#3b82f6' }}>{c.customerId}</td>
                      <td style={{ padding: '16px 20px', fontWeight: 600, fontSize: 15 }}>{c.name}</td>
                      <td style={{ padding: '16px 20px', fontSize: 14, color: '#64748b' }}>{c.email}</td>
                      <td style={{ padding: '16px 20px', fontSize: 14 }}>{c.phone}</td>
                      <td style={{ padding: '16px 20px', fontSize: 13 }}>{c.govIdType}</td>
                      <td style={{ padding: '16px 20px' }}><Badge status={c.status} /></td>
                      <td style={{ padding: '16px 20px', fontSize: 13, color: '#94a3b8', whiteSpace: 'nowrap' }}>{new Date(c.createdAt).toLocaleDateString('en-IN')}</td>
                      <td style={{ padding: '16px 20px' }}>
                        {c.status === 'PENDING_VERIFICATION' && (
                          <div className="d-flex flex-wrap gap-2" onClick={e => e.stopPropagation()}>
                            <button onClick={() => approve(c.customerId)} style={{ padding: '6px 14px', borderRadius: 8, border: 'none', background: '#22c55e', color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>Approve</button>
                            <button onClick={() => reject(c.customerId)} style={{ padding: '6px 14px', borderRadius: 8, border: 'none', background: '#ef4444', color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>Reject</button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                  {customers.length === 0 && <tr><td colSpan={8} style={{ padding: 32, textAlign: 'center', color: '#94a3b8', fontSize: 15 }}>No customers found</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Detail panel */}
        {selected && (
          <div className="col-12 col-xl-5">
            <div style={{ background: '#fff', borderRadius: 16, padding: '28px 32px', boxShadow: '0 2px 12px rgba(0,0,0,0.07)', position: 'relative' }}>
              <button onClick={() => setSelected(null)} style={{ position: 'absolute', top: 18, right: 18, background: '#f1f5f9', border: 'none', borderRadius: 8, width: 32, height: 32, cursor: 'pointer', color: '#64748b', fontSize: 16 }}>&#x2715;</button>
              <h3 style={{ margin: '0 0 24px', color: '#1e293b', fontSize: 18, fontWeight: 700 }}>{selected.name}</h3>
              {[['Customer ID', selected.customerId], ['Email', selected.email], ['Phone', selected.phone], ['Address', selected.address], ['Gov ID Type', selected.govIdType], ['Gov ID Number', selected.govIdNumber], ['Status', selected.status]].map(([lbl, val]) => (
                <div key={lbl} className="d-flex justify-content-between flex-wrap gap-1 py-3" style={{ borderBottom: '1px solid #f1f5f9', fontSize: 14 }}>
                  <span style={{ color: '#64748b', fontWeight: 500 }}>{lbl}</span>
                  <span style={{ fontWeight: 600, wordBreak: 'break-all', textAlign: 'right', maxWidth: '55%' }}>{val || '-'}</span>
                </div>
              ))}
              {selected.govIdDocumentPath && (
                <div className="mt-3">
                  <p style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>KYC Document</p>
                  <a href={`http://localhost:5000/uploads/${selected.govIdDocumentPath}`} target="_blank" rel="noreferrer" style={{ color: '#3b82f6', fontSize: 14, fontWeight: 600 }}>View Document</a>
                </div>
              )}
              {selected.status === 'PENDING_VERIFICATION' && (
                <div className="d-flex gap-3 mt-4">
                  <button onClick={() => approve(selected.customerId)} className="btn flex-fill" style={{ padding: 14, borderRadius: 10, border: 'none', background: '#22c55e', color: '#fff', fontWeight: 700, fontSize: 15 }}>Approve KYC</button>
                  <button onClick={() => reject(selected.customerId)} className="btn flex-fill" style={{ padding: 14, borderRadius: 10, border: 'none', background: '#ef4444', color: '#fff', fontWeight: 700, fontSize: 15 }}>Reject KYC</button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
