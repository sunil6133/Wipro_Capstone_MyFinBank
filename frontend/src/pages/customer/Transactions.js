import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Layout from '../../components/shared/Layout';
import { fetchMyTransactions } from '../../store/slices/transactionSlice';

const typeColor = { CREDIT: '#22c55e', DEBIT: '#ef4444' };
const categoryLabel = { DEPOSIT: 'Deposit', WITHDRAW: 'Withdrawal', TRANSFER: 'Transfer', FD_INVESTMENT: 'FD Investment', RD_INSTALLMENT: 'RD Installment', LOAN_EMI: 'Loan EMI' };

export default function Transactions() {
  const dispatch = useDispatch();
  const { transactions, loading } = useSelector(s => s.transactions);

  useEffect(() => { dispatch(fetchMyTransactions()); }, [dispatch]);

  return (
    <Layout>
      <h2 style={{ margin: '0 0 28px', color: '#1e293b', fontSize: 28, fontWeight: 700 }}>Passbook</h2>
      {loading && <p style={{ color: '#94a3b8', fontSize: 16 }}>Loading...</p>}
      {!loading && transactions.length === 0 && (
        <div style={{ background: '#fff', borderRadius: 16, padding: 48, textAlign: 'center', color: '#94a3b8', fontSize: 16 }}>No transactions yet.</div>
      )}
      {transactions.length > 0 && (
        <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 2px 12px rgba(0,0,0,0.07)' }}>
          {/* Bootstrap table-responsive for horizontal scroll on mobile */}
          <div className="table-responsive">
            <table style={{ minWidth: 750, borderCollapse: 'collapse', width: '100%' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                  {['Date', 'Account', 'Description', 'Ref ID', 'Category', 'Amount', 'Balance After'].map(h => (
                    <th key={h} style={{ padding: '16px 20px', textAlign: 'left', fontWeight: 700, color: '#64748b', fontSize: 13, whiteSpace: 'nowrap', textTransform: 'uppercase', letterSpacing: 0.5 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {transactions.map((txn, i) => (
                  <tr key={txn.txnId} style={{ borderBottom: '1px solid #f1f5f9', background: i % 2 === 0 ? '#fff' : '#fafbfe' }}>
                    <td style={{ padding: '16px 20px', color: '#64748b', whiteSpace: 'nowrap', fontSize: 14 }}>{new Date(txn.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                    <td style={{ padding: '16px 20px', fontFamily: 'monospace', fontSize: 13, color: '#3b82f6' }}>{txn.accountNumber}</td>
                    <td style={{ padding: '16px 20px', color: '#1e293b', maxWidth: 220, fontSize: 14 }}>{txn.description || '-'}</td>
                    <td style={{ padding: '16px 20px', fontFamily: 'monospace', fontSize: 12, color: '#94a3b8' }}>{txn.referenceId || txn.txnId?.substring(0, 12)}</td>
                    <td style={{ padding: '16px 20px' }}>
                      <span style={{ padding: '4px 12px', borderRadius: 99, fontSize: 12, fontWeight: 600, background: '#f1f5f9', color: '#475569' }}>
                        {categoryLabel[txn.transactionCategory] || txn.transactionCategory}
                      </span>
                    </td>
                    <td style={{ padding: '16px 20px', fontWeight: 700, whiteSpace: 'nowrap', fontSize: 15, color: typeColor[txn.type] || '#1e293b' }}>
                      {txn.type === 'CREDIT' ? '+' : '-'}Rs. {txn.amount?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td style={{ padding: '16px 20px', color: '#1e293b', whiteSpace: 'nowrap', fontWeight: 600, fontSize: 14 }}>Rs. {txn.balanceAfterTxn?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </Layout>
  );
}
