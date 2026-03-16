import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { useFormik } from 'formik';
import Layout from '../../components/shared/Layout';
import axiosInstance from '../../utils/axiosInstance';
import { beneficiarySchema } from '../../schemas';

const statusColor = { ACTIVE: '#22c55e', AT_RISK: '#f59e0b', DEACTIVATED: '#ef4444', REQUESTED: '#3b82f6', REJECTED: '#94a3b8', PENDING: '#f59e0b', PENDING_VERIFICATION: '#f59e0b' };

const inp = { padding: '12px 16px', borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 15, width: '100%', boxSizing: 'border-box', outline: 'none', fontFamily: 'inherit' };
const lbl = { fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6, color: '#475569' };
const errStyle = { color: '#ef4444', fontSize: 12, marginTop: 3 };
const card = { background: '#fff', borderRadius: 16, padding: '28px 32px', marginBottom: 24, boxShadow: '0 2px 12px rgba(0,0,0,0.07)' };

export default function ProfilePage() {
  const [profile, setProfile] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [beneficiaries, setBeneficiaries] = useState([]);
  const [showBenForm, setShowBenForm] = useState(false);
  const [requestingAccount, setRequestingAccount] = useState(false);
  const [newAccType, setNewAccType] = useState('');

  const loadData = () => {
    axiosInstance.get('/customers/profile/me').then(r => { setProfile(r.data.customer); setAccounts(r.data.accounts || []); }).catch(() => {});
    axiosInstance.get('/beneficiaries/my').then(r => setBeneficiaries(r.data.beneficiaries || [])).catch(() => {});
  };

  useEffect(() => { loadData(); }, []);

  const activeAccounts = accounts.filter(a => a.status !== 'REJECTED');
  const rejectedAccounts = accounts.filter(a => a.status === 'REJECTED');

  const nonRejectedCount = accounts.filter(a => a.status !== 'REJECTED').length;

  const hasSavings = accounts.some(a =>
    a.accountType === 'SAVINGS' && ['REQUESTED', 'ACTIVE', 'AT_RISK', 'DEACTIVATED'].includes(a.status)
  );
  const hasCurrent = accounts.some(a =>
    a.accountType === 'CURRENT' && ['REQUESTED', 'ACTIVE', 'AT_RISK', 'DEACTIVATED'].includes(a.status)
  );

  const availableTypes = [];
  if (!hasSavings) availableTypes.push('SAVINGS');
  if (!hasCurrent) availableTypes.push('CURRENT');

  const canRequestAccount = nonRejectedCount < 2 && availableTypes.length > 0;

  const selectedAccType = newAccType && availableTypes.includes(newAccType) ? newAccType : (availableTypes[0] || '');

  const requestAccount = async () => {
    if (!selectedAccType) return toast.error('Select account type');
    try {
      setRequestingAccount(true);
      await axiosInstance.post('/accounts/request', { accountType: selectedAccType });
      toast.success(`${selectedAccType} account request submitted`);
      setNewAccType('');
      loadData();
    } catch (err) { toast.error(err.response?.data?.message || 'Request failed'); }
    finally { setRequestingAccount(false); }
  };

  const benFormik = useFormik({
    initialValues: { beneficiaryName: '', accountNumber: '', branch: '' },
    validationSchema: beneficiarySchema,
    onSubmit: async (values, { resetForm }) => {
      try {
        await axiosInstance.post('/beneficiaries', values);
        toast.success('Beneficiary added. Pending admin approval.');
        resetForm();
        setShowBenForm(false);
        loadData();
      } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    }
  });

  return (
    <Layout>
      <h2 style={{ margin: '0 0 28px', color: '#1e293b', fontSize: 28, fontWeight: 700 }}>My Profile</h2>

      {profile && (
        <div style={card}>
          <h3 style={{ margin: '0 0 20px', fontSize: 17, color: '#1e293b', fontWeight: 700 }}>Personal Details</h3>
          <div className="row g-3">
            {[['Name', profile.name], ['Email', profile.email], ['Phone', profile.phone], ['ID Type', profile.govIdType], ['ID Number', profile.govIdNumber]].map(([label, value]) => (
              <div key={label}>
                <p style={{ margin: 0, fontSize: 12, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</p>
                <p style={{ margin: '4px 0 0', fontWeight: 600, color: '#1e293b', fontSize: 15 }}>{value || '-'}</p>
              </div>
            ))}
            <div>
              <p style={{ margin: 0, fontSize: 12, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5 }}>KYC Status</p>
              <p style={{ margin: '4px 0 0', fontWeight: 700, color: statusColor[profile.status] || '#64748b', fontSize: 15 }}>{profile.status}</p>
            </div>
          </div>
          {profile.address && (
            <div style={{ marginTop: 16 }}>
              <p style={{ margin: 0, fontSize: 12, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5 }}>Address</p>
              <p style={{ margin: '4px 0 0', fontWeight: 600, color: '#1e293b', fontSize: 15 }}>{profile.address}</p>
            </div>
          )}
        </div>
      )}

      <div style={card}>
        <div className="d-flex flex-wrap justify-content-between align-items-center gap-3" style={{ marginBottom: 20 }}>
          <h3 style={{ margin: 0, fontSize: 17, color: '#1e293b', fontWeight: 700 }}>Accounts</h3>
          {canRequestAccount && (
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <select
                value={selectedAccType}
                onChange={e => setNewAccType(e.target.value)}
                style={{ padding: '10px 16px', borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 14, fontFamily: 'inherit', cursor: 'pointer', outline: 'none' }}
              >
                {availableTypes.map(t => (
                  <option key={t} value={t}>{t === 'SAVINGS' ? 'Savings Account' : 'Current Account'}</option>
                ))}
              </select>
              <button
                onClick={requestAccount}
                disabled={requestingAccount}
                style={{ padding: '10px 20px', borderRadius: 10, border: 'none', background: '#3b82f6', color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer', whiteSpace: 'nowrap' }}
              >
                {requestingAccount ? 'Requesting...' : 'Request Account'}
              </button>
            </div>
          )}
        </div>

        {activeAccounts.length === 0 && rejectedAccounts.length === 0 && (
          <p style={{ color: '#94a3b8', fontSize: 15 }}>No accounts found. KYC approval pending or request an account above.</p>
        )}

        {activeAccounts.map((acc, i) => (
          <div key={acc.requestId || i} style={{ padding: '20px 24px', borderRadius: 12, background: '#f8fafc', border: '1px solid #e2e8f0', marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
              <div>
                <p style={{ margin: 0, fontSize: 12, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5 }}>{acc.accountType} Account</p>
                {acc.accountNumber
                  ? <p style={{ margin: '6px 0 0', fontFamily: 'monospace', fontSize: 20, fontWeight: 700, color: '#1e293b' }}>{acc.accountNumber}</p>
                  : <p style={{ margin: '6px 0 0', fontSize: 14, color: '#3b82f6', fontStyle: 'italic' }}>Account number will be assigned upon admin approval</p>
                }
                {acc.accountNumber && (
                  <p style={{ margin: '8px 0 0', fontSize: 16, color: '#1e293b' }}>Balance: <strong>Rs. {acc.balance?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong></p>
                )}
                {acc.status === 'REQUESTED' && (
                  <p style={{ margin: '8px 0 0', fontSize: 13, color: '#3b82f6' }}>Your request is pending admin approval.</p>
                )}
                {acc.status === 'DEACTIVATED' && (
                  <p style={{ margin: '8px 0 0', fontSize: 13, color: '#ef4444' }}>
                    Account deactivated {acc.deactivationType === 'AUTO' ? 'automatically due to zero balance' : 'by admin'}.
                  </p>
                )}
              </div>
              <span style={{ padding: '6px 16px', borderRadius: 99, fontSize: 13, fontWeight: 700, background: (statusColor[acc.status] || '#94a3b8') + '20', color: statusColor[acc.status] || '#94a3b8' }}>
                {acc.status}
              </span>
            </div>
          </div>
        ))}

        {rejectedAccounts.map((acc, i) => (
          <div key={i} style={{ padding: '18px 24px', borderRadius: 12, background: '#fef2f2', border: '1px solid #fecaca', marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <p style={{ margin: 0, fontSize: 12, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5 }}>{acc.accountType} Account</p>
              <p style={{ margin: '6px 0 0', fontWeight: 700, color: '#dc2626', fontSize: 15 }}>Your request for a {acc.accountType.toLowerCase()} account has been rejected by the admin.</p>
              <p style={{ margin: '4px 0 0', fontSize: 13, color: '#ef4444' }}>You may submit a new request using the button above.</p>
            </div>
            <span style={{ padding: '6px 16px', borderRadius: 99, fontSize: 13, fontWeight: 700, background: '#fee2e2', color: '#dc2626' }}>
              REJECTED
            </span>
          </div>
        ))}
      </div>

      <div style={card}>
        <div className="d-flex flex-wrap justify-content-between align-items-center gap-3" style={{ marginBottom: 20 }}>
          <h3 style={{ margin: 0, fontSize: 17, color: '#1e293b', fontWeight: 700 }}>Beneficiaries</h3>
          <button onClick={() => setShowBenForm(!showBenForm)} style={{ padding: '10px 20px', borderRadius: 10, border: 'none', background: showBenForm ? '#e2e8f0' : '#3b82f6', color: showBenForm ? '#64748b' : '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
            {showBenForm ? 'Cancel' : 'Add Beneficiary'}
          </button>
        </div>
        {showBenForm && (
          <form onSubmit={benFormik.handleSubmit} style={{ background: '#f8fafc', borderRadius: 12, padding: '20px 24px', border: '1px solid #e2e8f0', marginBottom: 20 }}>
            <div className="row g-3">
              <div>
                <label style={lbl}>Beneficiary Name</label>
                <input style={inp} type="text" placeholder="Full name" {...benFormik.getFieldProps('beneficiaryName')} />
                {benFormik.touched.beneficiaryName && benFormik.errors.beneficiaryName && <div style={errStyle}>{benFormik.errors.beneficiaryName}</div>}
              </div>
              <div>
                <label style={lbl}>Account Number</label>
                <input style={inp} type="text" placeholder="e.g. 00000002" {...benFormik.getFieldProps('accountNumber')} />
                {benFormik.touched.accountNumber && benFormik.errors.accountNumber && <div style={errStyle}>{benFormik.errors.accountNumber}</div>}
              </div>
              <div>
                <label style={lbl}>Branch (optional)</label>
                <input style={inp} type="text" placeholder="Branch name" {...benFormik.getFieldProps('branch')} />
              </div>
            </div>
            <button type="submit" style={{ marginTop: 16, padding: '12px 28px', borderRadius: 10, border: 'none', background: '#3b82f6', color: '#fff', fontWeight: 700, fontSize: 15, cursor: 'pointer' }}>Submit</button>
          </form>
        )}
        {beneficiaries.length === 0 ? (
          <p style={{ color: '#94a3b8', fontSize: 15 }}>No beneficiaries added yet.</p>
        ) : (
          beneficiaries.map(b => (
            <div key={b.beneficiaryId} style={{ padding: '16px 20px', borderRadius: 12, background: '#f8fafc', border: '1px solid #e2e8f0', marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
              <div>
                <p style={{ margin: 0, fontWeight: 700, color: '#1e293b', fontSize: 15 }}>{b.beneficiaryName}</p>
                <p style={{ margin: '3px 0 0', fontFamily: 'monospace', fontSize: 14, color: '#64748b' }}>{b.accountNumber}</p>
                {b.branch && <p style={{ margin: '2px 0 0', fontSize: 13, color: '#94a3b8' }}>{b.branch}</p>}
              </div>
              <span style={{ padding: '5px 14px', borderRadius: 99, fontSize: 13, fontWeight: 700, background: (statusColor[b.status] || '#94a3b8') + '20', color: statusColor[b.status] || '#94a3b8' }}>
                {b.status}
              </span>
            </div>
          ))
        )}
      </div>
    </Layout>
  );
}