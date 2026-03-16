import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/shared/Layout';
import { fetchMyAccounts } from '../../store/slices/accountSlice';
import { fetchMyTransactions } from '../../store/slices/transactionSlice';
import { fetchMyLoans } from '../../store/slices/loanSlice';
import axiosInstance from '../../utils/axiosInstance';

const statusColor = { ACTIVE: '#22c55e', AT_RISK: '#f59e0b', DEACTIVATED: '#ef4444', REQUESTED: '#3b82f6', REJECTED: '#94a3b8' };

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function getCountdown(atRiskSince) {
  if (!atRiskSince) return null;
  const elapsed = Date.now() - new Date(atRiskSince).getTime();
  const remaining = 24 * 60 * 60 * 1000 - elapsed;
  if (remaining <= 0) return '0 hours 0 minutes';
  const hours = Math.floor(remaining / (1000 * 60 * 60));
  const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
  return `${hours} hour${hours !== 1 ? 's' : ''} ${minutes} minute${minutes !== 1 ? 's' : ''}`;
}

export default function CustomerDashboard() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector(s => s.auth);
  const { accounts } = useSelector(s => s.accounts);
  const { transactions } = useSelector(s => s.transactions);
  const { loans } = useSelector(s => s.loans);
  const [fds, setFds] = useState([]);
  const [rds, setRds] = useState([]);
  const [balanceIndex, setBalanceIndex] = useState(0);
  const [, setTick] = useState(0);

  useEffect(() => {
    dispatch(fetchMyAccounts());
    dispatch(fetchMyTransactions());
    dispatch(fetchMyLoans());
    axiosInstance.get('/investments/fd/my').then(r => setFds(r.data.fds || [])).catch(() => {});
    axiosInstance.get('/investments/rd/my').then(r => setRds(r.data.rds || [])).catch(() => {});
  }, [dispatch]);

  useEffect(() => {
    const hasAtRisk = accounts.some(a => a.status === 'AT_RISK');
    if (!hasAtRisk) return;
    const timer = setInterval(() => setTick(t => t + 1), 60000);
    return () => clearInterval(timer);
  }, [accounts]);

  const activeAccounts = accounts.filter(a => ['ACTIVE', 'AT_RISK'].includes(a.status));
  const atRiskAccounts = accounts.filter(a => a.status === 'AT_RISK');

  const safeIndex = activeAccounts.length > 0 ? balanceIndex % activeAccounts.length : 0;
  const displayAccount = activeAccounts[safeIndex] || accounts[0];

  const cycleAccount = () => {
    if (activeAccounts.length > 1) setBalanceIndex(prev => (prev + 1) % activeAccounts.length);
  };

  const recentTxns = [...transactions].slice(0, 5);
  const activeFD = fds.find(f => f.status === 'ACTIVE');
  const activeRD = rds.find(r => r.status === 'ACTIVE');
  const pendingLoans = loans.filter(l => l.status === 'PENDING');
  const approvedLoans = loans.filter(l => ['APPROVED', 'ACTIVE'].includes(l.status));

  const card = { background: '#fff', borderRadius: 16, padding: '22px 24px', boxShadow: '0 2px 12px rgba(0,0,0,0.07)', height: '100%' };

  return (
    <Layout>
      <div className="mb-4">
        <h2 style={{ margin: '0 0 4px', color: '#1e293b', fontSize: 28, fontWeight: 700 }}>{getGreeting()}, {user?.name?.split(' ')[0]}</h2>
        <p style={{ color: '#64748b', margin: 0, fontSize: 15 }}>Here's an overview of your account</p>
      </div>

      {/* AT RISK banners */}
      {atRiskAccounts.map(acc => (
        <div key={acc.accountNumber} className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-3 p-3"
          style={{ background: '#fef3c7', borderRadius: 16, border: '1px solid #f59e0b' }}>
          <div>
            <p style={{ margin: '0 0 4px', fontWeight: 700, color: '#92400e', fontSize: 15 }}>
              Account At Risk — {acc.accountType} ({acc.accountNumber})
            </p>
            <p style={{ margin: 0, fontSize: 13, color: '#92400e' }}>
              Balance is zero. Deposit funds to avoid auto-deactivation.
              {acc.atRiskSince && <strong> Time remaining: {getCountdown(acc.atRiskSince)}</strong>}
            </p>
          </div>
          <button onClick={() => navigate('/transfer')}
            style={{ padding: '10px 20px', borderRadius: 10, border: 'none', background: '#f59e0b', color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer', whiteSpace: 'nowrap' }}>
            Deposit Now
          </button>
        </div>
      ))}

      {/* Balance cards — col-12 col-sm-6 col-lg-4 col-xl-3 */}
      <div className="row g-3 mb-4">
        {/* Savings/Account Balance */}
        <div className="col-12 col-sm-6 col-lg-4">
          <div style={{ ...card, borderTop: `4px solid ${statusColor[displayAccount?.status] || '#3b82f6'}` }}>
            <div className="d-flex justify-content-between align-items-start">
              <div className="flex-fill" style={{ minWidth: 0 }}>
                <p style={{ margin: '0 0 8px', fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1 }}>
                  {displayAccount ? `${displayAccount.accountType} Balance` : 'Account Balance'}
                </p>
                <p style={{ margin: '0 0 4px', fontSize: 26, fontWeight: 800, color: '#1e293b' }}>
                  {displayAccount && ['ACTIVE', 'AT_RISK'].includes(displayAccount.status)
                    ? `Rs. ${displayAccount.balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '-'}
                </p>
                <p style={{ margin: '0 0 4px', fontSize: 13, color: '#64748b', fontFamily: 'monospace' }}>
                  {displayAccount?.accountNumber || 'No active account'}
                </p>
                {displayAccount && (
                  <span style={{ display: 'inline-block', padding: '2px 10px', borderRadius: 99, fontSize: 12, fontWeight: 700, background: (statusColor[displayAccount.status] || '#94a3b8') + '20', color: statusColor[displayAccount.status] || '#94a3b8' }}>
                    {displayAccount.status}
                  </span>
                )}
                {activeAccounts.length > 1 && (
                  <div className="d-flex gap-1 mt-2">
                    {activeAccounts.map((_, i) => (
                      <div key={i} onClick={() => setBalanceIndex(i)}
                        style={{ width: i === safeIndex ? 16 : 6, height: 6, borderRadius: 99, background: i === safeIndex ? '#3b82f6' : '#e2e8f0', transition: 'all 0.2s', cursor: 'pointer' }} />
                    ))}
                  </div>
                )}
              </div>
              {activeAccounts.length > 1 && (
                <button onClick={cycleAccount}
                  style={{ flexShrink: 0, marginLeft: 12, width: 34, height: 34, borderRadius: '50%', border: '1.5px solid #e2e8f0', background: '#f8fafc', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3b82f6', fontSize: 16, fontWeight: 700 }}>
                  &#8250;
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Fixed Deposit */}
        <div className="col-12 col-sm-6 col-lg-4">
          <div style={{ ...card, borderTop: '4px solid #f59e0b' }}>
            <p style={{ margin: '0 0 8px', fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1 }}>Fixed Deposit</p>
            <p style={{ margin: '0 0 4px', fontSize: 26, fontWeight: 800, color: '#1e293b' }}>
              Rs. {activeFD ? activeFD.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '0.00'}
            </p>
            <p style={{ margin: 0, fontSize: 13, color: '#64748b' }}>{activeFD ? `${activeFD.interestRate}% p.a.` : 'No active FD'}</p>
          </div>
        </div>

        {/* Recurring Deposit */}
        <div className="col-12 col-sm-6 col-lg-4">
          <div style={{ ...card, borderTop: '4px solid #8b5cf6' }}>
            <p style={{ margin: '0 0 8px', fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1 }}>Recurring Deposit</p>
            <p style={{ margin: '0 0 4px', fontSize: 26, fontWeight: 800, color: '#1e293b' }}>
              Rs. {activeRD ? (activeRD.monthlyAmount * activeRD.paidInstallments).toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '0.00'}
            </p>
            <p style={{ margin: 0, fontSize: 13, color: '#64748b' }}>{activeRD ? `${activeRD.interestRate}% p.a.` : 'No active RD'}</p>
          </div>
        </div>
      </div>

      {/* Recent Transactions + Quick Actions */}
      <div className="row g-4 align-items-start">
        {/* Recent Transactions */}
        <div className="col-12 col-lg-8">
          <div style={{ background: '#fff', borderRadius: 16, padding: '24px 28px', boxShadow: '0 2px 12px rgba(0,0,0,0.07)' }}>
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h3 style={{ margin: 0, color: '#1e293b', fontSize: 18, fontWeight: 700 }}>Recent Transactions</h3>
              <button onClick={() => navigate('/transactions')} style={{ background: 'none', border: 'none', color: '#3b82f6', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>View all</button>
            </div>
            {recentTxns.length === 0 ? (
              <p style={{ color: '#94a3b8', fontSize: 14, textAlign: 'center', padding: '20px 0' }}>No transactions yet</p>
            ) : recentTxns.map(txn => (
              <div key={txn.txnId} className="d-flex justify-content-between align-items-start flex-wrap gap-2 py-3"
                style={{ borderBottom: '1px solid #f1f5f9' }}>
                <div>
                  <p style={{ margin: '0 0 3px', fontWeight: 600, color: '#1e293b', fontSize: 14 }}>{txn.description || txn.transactionCategory}</p>
                  <p style={{ margin: 0, fontFamily: 'monospace', fontSize: 12, color: '#94a3b8' }}>{txn.referenceId || txn.txnId}</p>
                </div>
                <p style={{ margin: 0, fontWeight: 700, fontSize: 15, color: txn.type === 'CREDIT' ? '#22c55e' : '#ef4444', whiteSpace: 'nowrap' }}>
                  {txn.type === 'CREDIT' ? '+' : '-'}Rs. {txn.amount?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions + Loans */}
        <div className="col-12 col-lg-4">
          <div style={{ background: '#fff', borderRadius: 16, padding: '24px 28px', boxShadow: '0 2px 12px rgba(0,0,0,0.07)', marginBottom: 20 }}>
            <h3 style={{ margin: '0 0 16px', color: '#1e293b', fontSize: 18, fontWeight: 700 }}>Quick Actions</h3>
            {[
              { label: 'Fund Transfer', path: '/transfer', bg: '#3b82f6', color: '#fff' },
              { label: 'Invest Money', path: '/investments', bg: '#fff', color: '#1e293b' },
              { label: 'Apply for Loan', path: '/loans', bg: '#fff', color: '#1e293b' }
            ].map(a => (
              <button key={a.path} onClick={() => navigate(a.path)} className="btn w-100 mb-2"
                style={{ padding: '14px', borderRadius: 10, border: '1px solid #e2e8f0', background: a.bg, color: a.color, fontWeight: 700, fontSize: 15, textAlign: 'center' }}>
                {a.label}
              </button>
            ))}
          </div>

          {(approvedLoans.length > 0 || pendingLoans.length > 0) && (
            <div style={{ background: '#fff', borderRadius: 16, padding: '24px 28px', boxShadow: '0 2px 12px rgba(0,0,0,0.07)' }}>
              <h3 style={{ margin: '0 0 16px', color: '#1e293b', fontSize: 18, fontWeight: 700 }}>Loan Applications</h3>
              {[...approvedLoans, ...pendingLoans].map(loan => (
                <div key={loan.loanId} className="d-flex justify-content-between align-items-center flex-wrap gap-2 py-3"
                  style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <div>
                    <p style={{ margin: '0 0 2px', fontWeight: 700, color: '#1e293b', fontSize: 14 }}>Rs. {loan.loanAmount?.toLocaleString('en-IN')}</p>
                    <p style={{ margin: 0, fontSize: 12, color: '#94a3b8' }}>{loan.tenureMonths} months @ {loan.interestRate}%</p>
                  </div>
                  <span style={{ padding: '4px 12px', borderRadius: 99, fontSize: 12, fontWeight: 700, background: ['APPROVED', 'ACTIVE'].includes(loan.status) ? '#dcfce7' : '#fef3c7', color: ['APPROVED', 'ACTIVE'].includes(loan.status) ? '#16a34a' : '#92400e' }}>
                    {loan.status.toLowerCase()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
