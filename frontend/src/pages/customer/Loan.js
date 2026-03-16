import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useFormik } from 'formik';
import { toast } from 'react-toastify';
import Layout from '../../components/shared/Layout';
import axiosInstance from '../../utils/axiosInstance';
import { fetchMyLoans } from '../../store/slices/loanSlice';
import { fetchMyAccounts } from '../../store/slices/accountSlice';
import { loanSchema } from '../../schemas';

const statusColor = { PENDING: '#f59e0b', APPROVED: '#22c55e', REJECTED: '#ef4444', ACTIVE: '#3b82f6', CLOSED: '#94a3b8' };
const statusBg = { PENDING: '#fef3c7', APPROVED: '#dcfce7', REJECTED: '#fee2e2', ACTIVE: '#eff6ff', CLOSED: '#f1f5f9' };

const LOAN_TYPES = [
  { label: 'Personal Loan (Rs.50,000 – Rs.5,00,000)', type: 'Personal Loan', minAmount: 50000, maxAmount: 500000, rate: 10.5, minTenure: 12, maxTenure: 36, tenureLabel: '1–3 years' },
  { label: 'Personal Loan (Rs.5,00,001 – Rs.20,00,000)', type: 'Personal Loan', minAmount: 500001, maxAmount: 2000000, rate: 11.5, minTenure: 36, maxTenure: 60, tenureLabel: '3–5 years' },
  { label: 'Home Loan (Rs.5,00,000 – Rs.50,00,000)', type: 'Home Loan', minAmount: 500000, maxAmount: 5000000, rate: 8.75, minTenure: 120, maxTenure: 240, tenureLabel: '10–20 years' },
  { label: 'Home Loan (Rs.50,00,001 – Rs.1,00,00,000)', type: 'Home Loan', minAmount: 5000001, maxAmount: 10000000, rate: 9.10, minTenure: 240, maxTenure: 360, tenureLabel: '20–30 years' },
  { label: 'Vehicle Loan (Rs.1,00,000 – Rs.10,00,000)', type: 'Vehicle Loan', minAmount: 100000, maxAmount: 1000000, rate: 9.50, minTenure: 36, maxTenure: 84, tenureLabel: '3–7 years' },
  { label: 'Education Loan (Rs.1,00,000 – Rs.20,00,000)', type: 'Education Loan', minAmount: 100000, maxAmount: 2000000, rate: 10.25, minTenure: 60, maxTenure: 120, tenureLabel: '5–10 years' },
];

const inp = { padding: '11px 14px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 15, width: '100%', boxSizing: 'border-box', outline: 'none', fontFamily: 'inherit' };
const lbl = { fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 5 };
const errStyle = { color: '#ef4444', fontSize: 12, marginTop: 3 };

export default function LoanPage() {
  const dispatch = useDispatch();
  const { loans, loading } = useSelector(s => s.loans);
  const { accounts } = useSelector(s => s.accounts);
  const [showForm, setShowForm] = useState(false);
  const [emiInfo, setEmiInfo] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [selectedLoanType, setSelectedLoanType] = useState(null);

  useEffect(() => {
    dispatch(fetchMyLoans());
    dispatch(fetchMyAccounts());
  }, [dispatch]);

  const activeAccounts = accounts.filter(a => a.status === 'ACTIVE');

  const formik = useFormik({
    initialValues: {
      accountNumber: activeAccounts[0]?.accountNumber || '',
      loanAmount: '',
      interestRate: '',
      tenureMonths: '',
      purpose: ''
    },
    validationSchema: loanSchema,
    enableReinitialize: true,
    onSubmit: async (values, { resetForm }) => {
      setSubmitting(true);
      if (selectedLoanType) {
        const amt = Number(values.loanAmount);
        if (amt < selectedLoanType.minAmount || amt > selectedLoanType.maxAmount) {
          toast.error(`Loan amount must be between Rs. ${selectedLoanType.minAmount.toLocaleString('en-IN')} and Rs. ${selectedLoanType.maxAmount.toLocaleString('en-IN')} for ${selectedLoanType.type}`);
          setSubmitting(false);
          return;
        }
      }
      try {
        await axiosInstance.post('/loans/apply', {
          accountNumber: values.accountNumber,
          loanAmount: Number(values.loanAmount),
          interestRate: Number(values.interestRate),
          tenureMonths: Number(values.tenureMonths),
          purpose: values.purpose
        });
        toast.success('Loan application submitted');
        dispatch(fetchMyLoans());
        resetForm();
        setShowForm(false);
        setEmiInfo(null);
        setSelectedLoanType(null);
      } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
      finally { setSubmitting(false); }
    },
  });

  const handleLoanTypeChange = (e) => {
    const index = e.target.value;
    if (index === '') {
      setSelectedLoanType(null);
      formik.setFieldValue('interestRate', '');
      formik.setFieldValue('tenureMonths', '');
      formik.setFieldValue('purpose', '');
      setEmiInfo(null);
      return;
    }
    const selected = LOAN_TYPES[index];
    setSelectedLoanType(selected);
    formik.setFieldValue('interestRate', String(selected.rate));
    formik.setFieldValue('tenureMonths', String(selected.minTenure));
    formik.setFieldValue('purpose', selected.type);
    setEmiInfo(null);
  };

  const calcEmi = async (overrideAmount, overrideTenure) => {
    const loanAmount = overrideAmount ?? formik.values.loanAmount;
    const interestRate = formik.values.interestRate;
    const tenureMonths = overrideTenure ?? formik.values.tenureMonths;
    if (!loanAmount || !interestRate || !tenureMonths) {
      setEmiInfo(null);
      return;
    }
    try {
      const { data } = await axiosInstance.post('/loans/calculate-emi', {
        principal: Number(loanAmount),
        rate: Number(interestRate),
        months: Number(tenureMonths)
      });
      setEmiInfo(data);
    } catch (_) { }
  };

useEffect(() => {
  if (formik.values.loanAmount && formik.values.interestRate && formik.values.tenureMonths) {
    calcEmi();
  } else {
    setEmiInfo(null);
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [formik.values.loanAmount, formik.values.tenureMonths, formik.values.interestRate]);
  const payEmi = async (loanId) => {
    try {
      await axiosInstance.post(`/loans/${loanId}/pay-emi`);
      toast.success('EMI paid successfully');
      dispatch(fetchMyLoans());
      dispatch(fetchMyAccounts());
    } catch (err) { toast.error(err.response?.data?.message || 'Payment failed'); }
  };

  return (
    <Layout>
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-3" style={{ marginBottom: 24 }}>
        <h2 style={{ margin: 0, color: '#1e293b', fontSize: 24 }}>Loans</h2>
        {activeAccounts.length > 0 && (
          <button onClick={() => { setShowForm(!showForm); setEmiInfo(null); setSelectedLoanType(null); }}
            style={{ padding: '10px 20px', borderRadius: 8, border: 'none', background: showForm ? '#e2e8f0' : '#3b82f6', color: showForm ? '#64748b' : '#fff', fontWeight: 600, cursor: 'pointer' }}>
            {showForm ? 'Cancel' : 'Apply for Loan'}
          </button>
        )}
      </div>

      {activeAccounts.length === 0 && !loading && (
        <div style={{ background: '#fef3c7', borderRadius: 10, padding: 16, marginBottom: 20, border: '1px solid #f59e0b', color: '#92400e', fontSize: 14 }}>
          You need an active account to apply for a loan.
        </div>
      )}

      {showForm && (
        <div style={{ background: '#fff', borderRadius: 12, padding: 28, maxWidth: 520, marginBottom: 24, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <h3 style={{ margin: '0 0 20px', color: '#1e293b', fontSize: 17 }}>Loan Application</h3>
          <form onSubmit={formik.handleSubmit}>

            <div style={{ marginBottom: 16 }}>
              <label style={lbl}>Disbursement Account</label>
              <select style={{ ...inp, cursor: 'pointer' }} value={formik.values.accountNumber} onChange={e => formik.setFieldValue('accountNumber', e.target.value)}>
                {activeAccounts.map(a => (
                  <option key={a.accountNumber} value={a.accountNumber}>{a.accountType} - {a.accountNumber}</option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={lbl}>Loan Type</label>
              <select style={{ ...inp, cursor: 'pointer' }} onChange={handleLoanTypeChange} defaultValue="">
                <option value="">Select loan type</option>
                {LOAN_TYPES.map((lt, i) => (
                  <option key={i} value={i}>{lt.label}</option>
                ))}
              </select>
            </div>

            {selectedLoanType && (
              <div style={{ background: '#eff6ff', borderRadius: 8, padding: '12px 16px', marginBottom: 16, border: '1px solid #bfdbfe', fontSize: 13 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <div><span style={{ color: '#64748b' }}>Interest Rate: </span><strong style={{ color: '#3b82f6' }}>{selectedLoanType.rate}% p.a.</strong></div>
                  <div><span style={{ color: '#64748b' }}>Tenure Range: </span><strong style={{ color: '#3b82f6' }}>{selectedLoanType.tenureLabel}</strong></div>
                  <div><span style={{ color: '#64748b' }}>Min Amount: </span><strong>Rs. {selectedLoanType.minAmount.toLocaleString('en-IN')}</strong></div>
                  <div><span style={{ color: '#64748b' }}>Max Amount: </span><strong>Rs. {selectedLoanType.maxAmount.toLocaleString('en-IN')}</strong></div>
                </div>
              </div>
            )}

            <div style={{ marginBottom: 16 }}>
              <label style={lbl}>Loan Amount (Rs.)</label>
              <input type="number" style={{ ...inp, background: selectedLoanType ? '#fff' : '#f8fafc' }}
                placeholder={selectedLoanType ? `Enter between Rs. ${selectedLoanType.minAmount.toLocaleString('en-IN')} – Rs. ${selectedLoanType.maxAmount.toLocaleString('en-IN')}` : 'Select loan type first'}
                {...formik.getFieldProps('loanAmount')}
                disabled={!selectedLoanType}
                min={selectedLoanType?.minAmount}
                max={selectedLoanType?.maxAmount}
                onBlur={(e) => {
                  formik.handleBlur(e);
                  const val = Number(e.target.value);
                  if (selectedLoanType && val > 0) {
                    if (val < selectedLoanType.minAmount) {
                      formik.setFieldError('loanAmount', `Minimum loan amount for this type is Rs. ${selectedLoanType.minAmount.toLocaleString('en-IN')}`);
                    } else if (val > selectedLoanType.maxAmount) {
                      formik.setFieldError('loanAmount', `Maximum loan amount for this type is Rs. ${selectedLoanType.maxAmount.toLocaleString('en-IN')}`);
                    }
                  }
                }}
              />
              {selectedLoanType && !formik.errors.loanAmount && formik.values.loanAmount === '' && (
                <p style={{ margin: '4px 0 0', fontSize: 12, color: '#64748b' }}>
                  Enter between Rs. {selectedLoanType.minAmount.toLocaleString('en-IN')} and Rs. {selectedLoanType.maxAmount.toLocaleString('en-IN')}
                </p>
              )}
              {formik.touched.loanAmount && formik.errors.loanAmount && <div style={errStyle}>{formik.errors.loanAmount}</div>}
            </div>

            <div className="row g-3" style={{ marginBottom: 16 }}>
              <div>
                <label style={lbl}>Interest Rate (% p.a.)</label>
                <input type="number" style={{ ...inp, background: '#f8fafc', color: '#3b82f6', fontWeight: 700 }}
                  value={formik.values.interestRate} readOnly />
                <p style={{ margin: '4px 0 0', fontSize: 11, color: '#94a3b8' }}>Auto-set by loan type</p>
              </div>
              <div>
                <label style={lbl}>Tenure (Months)</label>
                <select style={{ ...inp, cursor: selectedLoanType ? 'pointer' : 'not-allowed' }}
                  value={formik.values.tenureMonths} onChange={e => { formik.setFieldValue('tenureMonths', e.target.value); setTimeout(calcEmi, 100); }}
                  disabled={!selectedLoanType}>
                  {selectedLoanType
                    ? Array.from({ length: Math.floor((selectedLoanType.maxTenure - selectedLoanType.minTenure) / 12) + 1 }, (_, i) => selectedLoanType.minTenure + i * 12)
                      .map(m => <option key={m} value={m}>{m} months ({m / 12} {m / 12 === 1 ? 'year' : 'years'})</option>)
                    : <option value="">Select loan type first</option>
                  }
                </select>
                {formik.touched.tenureMonths && formik.errors.tenureMonths && <div style={errStyle}>{formik.errors.tenureMonths}</div>}
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={lbl}>Purpose</label>
              <input type="text" style={{ ...inp, background: '#f8fafc' }} value={formik.values.purpose} readOnly />
              <p style={{ margin: '4px 0 0', fontSize: 11, color: '#94a3b8' }}>Auto-set by loan type</p>
            </div>

            {emiInfo && (
              <div style={{ background: '#eff6ff', borderRadius: 8, padding: 14, marginBottom: 16, border: '1px solid #bfdbfe' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                  {[['Monthly EMI', `Rs. ${emiInfo.emi?.toLocaleString('en-IN')}`], ['Total Payable', `Rs. ${emiInfo.totalPayable?.toLocaleString('en-IN')}`], ['Total Interest', `Rs. ${emiInfo.totalInterest?.toLocaleString('en-IN')}`]].map(([k, v]) => (
                    <div key={k}>
                      <p style={{ margin: 0, fontSize: 11, color: '#64748b' }}>{k}</p>
                      <strong style={{ fontSize: 13 }}>{v}</strong>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button type="submit" disabled={submitting || !selectedLoanType}
              style={{ width: '100%', padding: 12, borderRadius: 8, border: 'none', background: submitting || !selectedLoanType ? '#94a3b8' : '#3b82f6', color: '#fff', fontWeight: 700, fontSize: 15, cursor: submitting || !selectedLoanType ? 'not-allowed' : 'pointer' }}>
              {submitting ? 'Submitting...' : 'Submit Application'}
            </button>
          </form>
        </div>
      )}

      {loading ? (
        <p style={{ color: '#94a3b8' }}>Loading...</p>
      ) : loans.length === 0 ? (
        <div style={{ background: '#fff', borderRadius: 12, padding: 40, textAlign: 'center', color: '#94a3b8' }}>No loan applications yet.</div>
      ) : (
        loans.map(loan => (
          <div key={loan.loanId} style={{ background: '#fff', borderRadius: 12, padding: 24, marginBottom: 14, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
              <div>
                <p style={{ margin: 0, fontFamily: 'monospace', fontSize: 13, color: '#64748b' }}>{loan.loanId}</p>
                <p style={{ margin: '4px 0 2px', fontWeight: 700, color: '#1e293b' }}>{loan.purpose || 'Loan'}</p>
                <p style={{ margin: 0, fontFamily: 'monospace', fontSize: 12, color: '#94a3b8' }}>Account: {loan.accountNumber}</p>
              </div>
              <span style={{ padding: '4px 14px', borderRadius: 99, fontSize: 12, fontWeight: 700, background: statusBg[loan.status] || '#f1f5f9', color: statusColor[loan.status] || '#64748b' }}>
                {loan.status}
              </span>
            </div>
            <div className="d-flex flex-wrap gap-4">
              {[['Amount', `Rs. ${loan.loanAmount?.toLocaleString('en-IN')}`], ['EMI', `Rs. ${loan.emi?.toLocaleString('en-IN')}/mo`], ['Remaining', `Rs. ${(loan.remainingBalance ?? loan.loanAmount)?.toLocaleString('en-IN')}`], ['Tenure', `${loan.tenureMonths} months`], ['Rate', `${loan.interestRate}% p.a.`]].map(([k, v]) => (
                <div key={k}>
                  <p style={{ margin: 0, fontSize: 11, color: '#94a3b8' }}>{k}</p>
                  <p style={{ margin: '2px 0 0', fontWeight: 700, color: '#1e293b' }}>{v}</p>
                </div>
              ))}
            </div>
            {loan.adminComment && <p style={{ margin: '12px 0 0', fontSize: 13, color: '#ef4444' }}>Admin note: {loan.adminComment}</p>}
            {['APPROVED', 'ACTIVE'].includes(loan.status) && (
              <button onClick={() => payEmi(loan.loanId)} style={{ marginTop: 16, padding: '10px 24px', borderRadius: 8, border: 'none', background: '#22c55e', color: '#fff', fontWeight: 700, cursor: 'pointer' }}>
                Pay EMI — Rs. {loan.emi?.toLocaleString('en-IN')}
              </button>
            )}
          </div>
        ))
      )}
    </Layout>
  );
}