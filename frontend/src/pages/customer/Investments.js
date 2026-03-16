import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useFormik } from 'formik';
import { toast } from 'react-toastify';
import Layout from '../../components/shared/Layout';
import axiosInstance from '../../utils/axiosInstance';
import { fetchMyAccounts } from '../../store/slices/accountSlice';
import { fdSchema, rdSchema } from '../../schemas';

const statusColor = { ACTIVE: '#22c55e', MATURED: '#3b82f6', BROKEN: '#ef4444' };

const FD_RATES = [
  { label: 'Rs.1,000 – Rs.50,000 | 6 months | 5.50%', minAmount: 1000, maxAmount: 50000, tenure: 6, rate: 5.50 },
  { label: 'Rs.50,001 – Rs.2,00,000 | 1 year | 6.25%', minAmount: 50001, maxAmount: 200000, tenure: 12, rate: 6.25 },
  { label: 'Rs.2,00,001 – Rs.10,00,000 | 2 years | 6.40%', minAmount: 200001, maxAmount: 1000000, tenure: 24, rate: 6.40 },
  { label: 'Rs.10,00,001 – Rs.50,00,000 | 3 years | 6.50%', minAmount: 1000001, maxAmount: 5000000, tenure: 36, rate: 6.50 },
  { label: 'Rs.50,00,001 – Rs.1,00,00,000 | 5 years | 6.75%', minAmount: 5000001, maxAmount: 10000000, tenure: 60, rate: 6.75 },
];

const RD_RATES = [
  { label: 'Rs.500 – Rs.2,000/month | 1 year | 6.25%', minAmount: 500, maxAmount: 2000, tenure: 12, rate: 6.25 },
  { label: 'Rs.2,001 – Rs.5,000/month | 2 years | 6.50%', minAmount: 2001, maxAmount: 5000, tenure: 24, rate: 6.50 },
  { label: 'Rs.5,001 – Rs.10,000/month | 3 years | 6.75%', minAmount: 5001, maxAmount: 10000, tenure: 36, rate: 6.75 },
  { label: 'Rs.10,001 – Rs.25,000/month | 4 years | 7.00%', minAmount: 10001, maxAmount: 25000, tenure: 48, rate: 7.00 },
  { label: 'Rs.25,001 – Rs.50,000/month | 5 years | 7.10%', minAmount: 25001, maxAmount: 50000, tenure: 60, rate: 7.10 },
];

const inp = { padding: '11px 14px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 15, width: '100%', boxSizing: 'border-box', outline: 'none', fontFamily: 'inherit' };
const lbl = { fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 5 };
const errStyle = { color: '#ef4444', fontSize: 12, marginTop: 3, marginBottom: 8 };

function AccSelect({ formik, activeAccounts }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={lbl}>Account</label>
      <select style={{ ...inp, cursor: 'pointer' }} value={formik.values.accountNumber} onChange={e => formik.setFieldValue('accountNumber', e.target.value)}>
        {activeAccounts.length === 0 && <option value="">No active accounts</option>}
        {activeAccounts.map(a => (
          <option key={a.accountNumber} value={a.accountNumber}>
            {a.accountType} - {a.accountNumber} (Rs. {a.balance?.toLocaleString('en-IN')})
          </option>
        ))}
      </select>
      {formik.touched.accountNumber && formik.errors.accountNumber && <div style={errStyle}>{formik.errors.accountNumber}</div>}
    </div>
  );
}

export default function InvestmentsPage() {
  const dispatch = useDispatch();
  const { accounts } = useSelector(s => s.accounts);
  const [fds, setFds] = useState([]);
  const [rds, setRds] = useState([]);
  const [activeTab, setActiveTab] = useState('fd');
  const [submitting, setSubmitting] = useState(false);
  const [selectedFDPlan, setSelectedFDPlan] = useState(null);
  const [selectedRDPlan, setSelectedRDPlan] = useState(null);

  useEffect(() => {
    dispatch(fetchMyAccounts());
    loadData();
  }, [dispatch]);

  const loadData = async () => {
    try {
      const [fdRes, rdRes] = await Promise.all([
        axiosInstance.get('/investments/fd/my'),
        axiosInstance.get('/investments/rd/my'),
      ]);
      setFds(fdRes.data.fds || []);
      setRds(rdRes.data.rds || []);
    } catch (_) { }
  };

  const activeAccounts = accounts.filter(a => a.status === 'ACTIVE');

  const fdFormik = useFormik({
    initialValues: { accountNumber: activeAccounts[0]?.accountNumber || '', amount: '', interestRate: '', tenureMonths: '' },
    validationSchema: fdSchema,
    enableReinitialize: true,
    onSubmit: async (values, { resetForm }) => {
      setSubmitting(true);
      if (selectedFDPlan) {
        const amt = Number(values.amount);
        if (amt < selectedFDPlan.minAmount || amt > selectedFDPlan.maxAmount) {
          toast.error(`Amount must be between Rs. ${selectedFDPlan.minAmount.toLocaleString('en-IN')} and Rs. ${selectedFDPlan.maxAmount.toLocaleString('en-IN')} for this plan`);
          setSubmitting(false);
          return;
        }
      }
      if (selectedRDPlan) {
        const amt = Number(values.monthlyAmount);
        if (amt < selectedRDPlan.minAmount || amt > selectedRDPlan.maxAmount) {
          toast.error(`Monthly amount must be between Rs. ${selectedRDPlan.minAmount.toLocaleString('en-IN')} and Rs. ${selectedRDPlan.maxAmount.toLocaleString('en-IN')} for this plan`);
          setSubmitting(false);
          return;
        }
      }
      try {
        await axiosInstance.post('/investments/fd', { accountNumber: values.accountNumber, amount: Number(values.amount), interestRate: Number(values.interestRate), tenureMonths: Number(values.tenureMonths) });
        toast.success('Fixed Deposit created');
        dispatch(fetchMyAccounts());
        loadData();
        resetForm();
        setSelectedFDPlan(null);
      } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
      finally { setSubmitting(false); }
    },
  });

  const rdFormik = useFormik({
    initialValues: { accountNumber: activeAccounts[0]?.accountNumber || '', monthlyAmount: '', interestRate: '', tenureMonths: '' },
    validationSchema: rdSchema,
    enableReinitialize: true,
    onSubmit: async (values, { resetForm }) => {
      setSubmitting(true);
      try {
        await axiosInstance.post('/investments/rd', { accountNumber: values.accountNumber, monthlyAmount: Number(values.monthlyAmount), interestRate: Number(values.interestRate), tenureMonths: Number(values.tenureMonths) });
        toast.success('Recurring Deposit started');
        dispatch(fetchMyAccounts());
        loadData();
        resetForm();
        setSelectedRDPlan(null);
      } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
      finally { setSubmitting(false); }
    },
  });

  const handleFDPlanChange = (e) => {
    const index = e.target.value;
    if (index === '') { setSelectedFDPlan(null); fdFormik.setFieldValue('interestRate', ''); fdFormik.setFieldValue('tenureMonths', ''); return; }
    const plan = FD_RATES[index];
    setSelectedFDPlan(plan);
    fdFormik.setFieldValue('interestRate', String(plan.rate));
    fdFormik.setFieldValue('tenureMonths', String(plan.tenure));
  };

  const handleRDPlanChange = (e) => {
    const index = e.target.value;
    if (index === '') { setSelectedRDPlan(null); rdFormik.setFieldValue('interestRate', ''); rdFormik.setFieldValue('tenureMonths', ''); return; }
    const plan = RD_RATES[index];
    setSelectedRDPlan(plan);
    rdFormik.setFieldValue('interestRate', String(plan.rate));
    rdFormik.setFieldValue('tenureMonths', String(plan.tenure));
  };

  const maturityPreview = (principal, rate, months) => {
    if (!principal || !rate || !months) return null;
    return Math.round(Number(principal) * (1 + (Number(rate) / 100) * (Number(months) / 12)));
  };

  const tabBtn = (active) => ({ padding: '10px 28px', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 14, background: active ? '#3b82f6' : '#fff', color: active ? '#fff' : '#64748b' });
  const card = { background: '#fff', borderRadius: 12, padding: 22, marginBottom: 14, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' };

  return (
    <Layout>
      <h2 style={{ margin: '0 0 24px', color: '#1e293b', fontSize: 24 }}>Investments</h2>
      <div className="d-flex flex-wrap gap-2" style={{ marginBottom: 28 }}>
        <button onClick={() => setActiveTab('fd')} style={tabBtn(activeTab === 'fd')}>Fixed Deposits</button>
        <button onClick={() => setActiveTab('rd')} style={tabBtn(activeTab === 'rd')}>Recurring Deposits</button>
      </div>
      <div className="row g-4 align-items-start">
        <div className="col-12 col-lg-5"><div style={{ background: '#fff', borderRadius: 12, padding: 28, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <h3 style={{ margin: '0 0 22px', color: '#1e293b', fontSize: 17 }}>
            {activeTab === 'fd' ? 'Open Fixed Deposit' : 'Start Recurring Deposit'}
          </h3>
          {activeAccounts.length === 0 ? (
            <p style={{ color: '#ef4444', fontSize: 14 }}>No active accounts available.</p>
          ) : activeTab === 'fd' ? (
            <form onSubmit={fdFormik.handleSubmit}>
              <AccSelect formik={fdFormik} activeAccounts={activeAccounts} />

              <div style={{ marginBottom: 16 }}>
                <label style={lbl}>Select FD Plan</label>
                <select style={{ ...inp, cursor: 'pointer' }} onChange={handleFDPlanChange} defaultValue="">
                  <option value="">Choose a plan</option>
                  {FD_RATES.map((plan, i) => (
                    <option key={i} value={i}>{plan.label}</option>
                  ))}
                </select>
              </div>

              {selectedFDPlan && (
                <div style={{ background: '#f0fdf4', borderRadius: 8, padding: '12px 14px', marginBottom: 16, border: '1px solid #bbf7d0', fontSize: 13 }}>
                  <div className="row g-2">
                    <div><span style={{ color: '#64748b' }}>Interest Rate: </span><strong style={{ color: '#22c55e' }}>{selectedFDPlan.rate}% p.a.</strong></div>
                    <div><span style={{ color: '#64748b' }}>Tenure: </span><strong style={{ color: '#22c55e' }}>{selectedFDPlan.tenure} months</strong></div>
                    <div><span style={{ color: '#64748b' }}>Min: </span><strong>Rs. {selectedFDPlan.minAmount.toLocaleString('en-IN')}</strong></div>
                    <div><span style={{ color: '#64748b' }}>Max: </span><strong>Rs. {selectedFDPlan.maxAmount.toLocaleString('en-IN')}</strong></div>
                  </div>
                </div>
              )}

              <div style={{ marginBottom: 16 }}>
                <label style={lbl}>Amount (Rs.)</label>
                <input type="number" style={{ ...inp, background: selectedFDPlan ? '#fff' : '#f8fafc' }}
                  placeholder={selectedFDPlan ? `Enter amount between Rs. ${selectedFDPlan.minAmount.toLocaleString('en-IN')} – Rs. ${selectedFDPlan.maxAmount.toLocaleString('en-IN')}` : 'Select a plan first'}
                  {...fdFormik.getFieldProps('amount')}
                  disabled={!selectedFDPlan}
                  min={selectedFDPlan?.minAmount}
                  max={selectedFDPlan?.maxAmount}
                  onBlur={(e) => {
                    fdFormik.handleBlur(e);
                    const val = Number(e.target.value);
                    if (selectedFDPlan && val > 0) {
                      if (val < selectedFDPlan.minAmount) {
                        fdFormik.setFieldError('amount', `Minimum amount for this plan is Rs. ${selectedFDPlan.minAmount.toLocaleString('en-IN')}`);
                      } else if (val > selectedFDPlan.maxAmount) {
                        fdFormik.setFieldError('amount', `Maximum amount for this plan is Rs. ${selectedFDPlan.maxAmount.toLocaleString('en-IN')}`);
                      }
                    }
                  }}
                />
                {selectedFDPlan && !fdFormik.errors.amount && fdFormik.values.amount === '' && (
                  <p style={{ margin: '4px 0 0', fontSize: 12, color: '#64748b' }}>
                    Enter between Rs. {selectedFDPlan.minAmount.toLocaleString('en-IN')} and Rs. {selectedFDPlan.maxAmount.toLocaleString('en-IN')}
                  </p>
                )}
                {fdFormik.touched.amount && fdFormik.errors.amount && <div style={errStyle}>{fdFormik.errors.amount}</div>}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                <div>
                  <label style={lbl}>Interest Rate</label>
                  <input style={{ ...inp, background: '#f8fafc', color: '#22c55e', fontWeight: 700 }} value={fdFormik.values.interestRate ? `${fdFormik.values.interestRate}% p.a.` : ''} readOnly placeholder="Auto-set by plan" />
                </div>
                <div>
                  <label style={lbl}>Tenure</label>
                  <input style={{ ...inp, background: '#f8fafc', color: '#22c55e', fontWeight: 700 }} value={fdFormik.values.tenureMonths ? `${fdFormik.values.tenureMonths} months` : ''} readOnly placeholder="Auto-set by plan" />
                </div>
              </div>

              {maturityPreview(fdFormik.values.amount, fdFormik.values.interestRate, fdFormik.values.tenureMonths) && (
                <div style={{ background: '#f0fdf4', borderRadius: 8, padding: '12px 14px', marginBottom: 16, border: '1px solid #bbf7d0', fontSize: 14 }}>
                  Estimated maturity amount: <strong style={{ color: '#22c55e' }}>Rs. {maturityPreview(fdFormik.values.amount, fdFormik.values.interestRate, fdFormik.values.tenureMonths)?.toLocaleString('en-IN')}</strong>
                </div>
              )}

              <button type="submit" disabled={submitting || !selectedFDPlan}
                style={{ width: '100%', padding: 13, borderRadius: 8, border: 'none', background: submitting || !selectedFDPlan ? '#94a3b8' : '#3b82f6', color: '#fff', fontWeight: 700, fontSize: 15, cursor: submitting || !selectedFDPlan ? 'not-allowed' : 'pointer' }}>
                {submitting ? 'Creating...' : 'Create Fixed Deposit'}
              </button>
            </form>
          ) : (
            <form onSubmit={rdFormik.handleSubmit}>
              <AccSelect formik={rdFormik} activeAccounts={activeAccounts} />

              <div style={{ marginBottom: 16 }}>
                <label style={lbl}>Select RD Plan</label>
                <select style={{ ...inp, cursor: 'pointer' }} onChange={handleRDPlanChange} defaultValue="">
                  <option value="">Choose a plan</option>
                  {RD_RATES.map((plan, i) => (
                    <option key={i} value={i}>{plan.label}</option>
                  ))}
                </select>
              </div>

              {selectedRDPlan && (
                <div style={{ background: '#f0fdf4', borderRadius: 8, padding: '12px 14px', marginBottom: 16, border: '1px solid #bbf7d0', fontSize: 13 }}>
                  <div className="row g-2">
                    <div><span style={{ color: '#64748b' }}>Interest Rate: </span><strong style={{ color: '#22c55e' }}>{selectedRDPlan.rate}% p.a.</strong></div>
                    <div><span style={{ color: '#64748b' }}>Tenure: </span><strong style={{ color: '#22c55e' }}>{selectedRDPlan.tenure} months</strong></div>
                    <div><span style={{ color: '#64748b' }}>Min Monthly: </span><strong>Rs. {selectedRDPlan.minAmount.toLocaleString('en-IN')}</strong></div>
                    <div><span style={{ color: '#64748b' }}>Max Monthly: </span><strong>Rs. {selectedRDPlan.maxAmount.toLocaleString('en-IN')}</strong></div>
                  </div>
                </div>
              )}

              <div style={{ marginBottom: 16 }}>
                <label style={lbl}>Monthly Amount (Rs.)</label>
                <input type="number" style={{ ...inp, background: selectedRDPlan ? '#fff' : '#f8fafc' }}
                  placeholder={selectedRDPlan ? `Enter amount between Rs. ${selectedRDPlan.minAmount.toLocaleString('en-IN')} – Rs. ${selectedRDPlan.maxAmount.toLocaleString('en-IN')}` : 'Select a plan first'}
                  {...rdFormik.getFieldProps('monthlyAmount')}
                  disabled={!selectedRDPlan}
                  min={selectedRDPlan?.minAmount}
                  max={selectedRDPlan?.maxAmount}
                  onBlur={(e) => {
                    rdFormik.handleBlur(e);
                    const val = Number(e.target.value);
                    if (selectedRDPlan && val > 0) {
                      if (val < selectedRDPlan.minAmount) {
                        rdFormik.setFieldError('monthlyAmount', `Minimum monthly amount for this plan is Rs. ${selectedRDPlan.minAmount.toLocaleString('en-IN')}`);
                      } else if (val > selectedRDPlan.maxAmount) {
                        rdFormik.setFieldError('monthlyAmount', `Maximum monthly amount for this plan is Rs. ${selectedRDPlan.maxAmount.toLocaleString('en-IN')}`);
                      }
                    }
                  }}
                />
                {selectedRDPlan && !rdFormik.errors.monthlyAmount && rdFormik.values.monthlyAmount === '' && (
                  <p style={{ margin: '4px 0 0', fontSize: 12, color: '#64748b' }}>
                    Enter between Rs. {selectedRDPlan.minAmount.toLocaleString('en-IN')} and Rs. {selectedRDPlan.maxAmount.toLocaleString('en-IN')} per month
                  </p>
                )}
                {rdFormik.touched.monthlyAmount && rdFormik.errors.monthlyAmount && <div style={errStyle}>{rdFormik.errors.monthlyAmount}</div>}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                <div>
                  <label style={lbl}>Interest Rate</label>
                  <input style={{ ...inp, background: '#f8fafc', color: '#22c55e', fontWeight: 700 }} value={rdFormik.values.interestRate ? `${rdFormik.values.interestRate}% p.a.` : ''} readOnly placeholder="Auto-set by plan" />
                </div>
                <div>
                  <label style={lbl}>Tenure</label>
                  <input style={{ ...inp, background: '#f8fafc', color: '#22c55e', fontWeight: 700 }} value={rdFormik.values.tenureMonths ? `${rdFormik.values.tenureMonths} months` : ''} readOnly placeholder="Auto-set by plan" />
                </div>
              </div>

              <button type="submit" disabled={submitting || !selectedRDPlan}
                style={{ width: '100%', padding: 13, borderRadius: 8, border: 'none', background: submitting || !selectedRDPlan ? '#94a3b8' : '#3b82f6', color: '#fff', fontWeight: 700, fontSize: 15, cursor: submitting || !selectedRDPlan ? 'not-allowed' : 'pointer' }}>
                {submitting ? 'Creating...' : 'Start Recurring Deposit'}
              </button>
            </form>
          )}
        </div>

        </div></div>
        <div className="col-12 col-lg-7">
          {activeTab === 'fd' ? (
            fds.length === 0
              ? <div style={{ ...card, textAlign: 'center', color: '#94a3b8', padding: 48 }}>No fixed deposits yet.</div>
              : fds.map(fd => (
                <div key={fd.fdId} style={card}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                    <span style={{ fontFamily: 'monospace', fontSize: 13, color: '#3b82f6', fontWeight: 600 }}>{fd.fdId}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: statusColor[fd.status] }}>{fd.status}</span>
                  </div>
                  <p style={{ margin: '0 0 12px', fontSize: 12, color: '#64748b', fontFamily: 'monospace' }}>Account: {fd.accountNumber}</p>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
                    {[['Principal', `Rs. ${fd.amount?.toLocaleString('en-IN')}`], ['Maturity Amount', `Rs. ${fd.maturityAmount?.toLocaleString('en-IN')}`], ['Rate', `${fd.interestRate}% p.a.`], ['Tenure', `${fd.tenureMonths} months`], ['Start', new Date(fd.startDate).toLocaleDateString('en-IN')], ['Maturity', new Date(fd.maturityDate).toLocaleDateString('en-IN')]].map(([k, v]) => (
                      <div key={k}>
                        <p style={{ margin: 0, fontSize: 11, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.4 }}>{k}</p>
                        <strong style={{ fontSize: 14 }}>{v}</strong>
                      </div>
                    ))}
                  </div>
                </div>
              ))
          ) : (
            rds.length === 0
              ? <div style={{ ...card, textAlign: 'center', color: '#94a3b8', padding: 48 }}>No recurring deposits yet.</div>
              : rds.map(rd => (
                <div key={rd.rdId} style={card}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                    <span style={{ fontFamily: 'monospace', fontSize: 13, color: '#3b82f6', fontWeight: 600 }}>{rd.rdId}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: statusColor[rd.status] }}>{rd.status}</span>
                  </div>
                  <p style={{ margin: '0 0 12px', fontSize: 12, color: '#64748b', fontFamily: 'monospace' }}>Account: {rd.accountNumber}</p>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14, marginBottom: 14 }}>
                    {[['Monthly', `Rs. ${rd.monthlyAmount?.toLocaleString('en-IN')}`], ['Tenure', `${rd.tenureMonths} months`], ['Rate', `${rd.interestRate}% p.a.`], ['Paid', `${rd.paidInstallments} / ${rd.tenureMonths}`]].map(([k, v]) => (
                      <div key={k}>
                        <p style={{ margin: 0, fontSize: 11, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.4 }}>{k}</p>
                        <strong>{v}</strong>
                      </div>
                    ))}
                  </div>
                  <div style={{ background: '#e2e8f0', borderRadius: 99, height: 7, marginBottom: 14 }}>
                    <div style={{ background: '#3b82f6', borderRadius: 99, height: 7, width: `${Math.min((rd.paidInstallments / rd.tenureMonths) * 100, 100)}%` }} />
                  </div>
                  {rd.status === 'ACTIVE' && rd.paidInstallments < rd.tenureMonths && (
                    <button onClick={async () => {
                      try { await axiosInstance.post(`/investments/rd/${rd.rdId}/pay`); toast.success('Installment paid'); dispatch(fetchMyAccounts()); loadData(); }
                      catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
                    }} style={{ padding: '9px 20px', borderRadius: 8, border: 'none', background: '#22c55e', color: '#fff', fontWeight: 600, cursor: 'pointer', fontSize: 14 }}>
                      Pay Installment #{rd.paidInstallments + 1} — Rs. {rd.monthlyAmount?.toLocaleString('en-IN')}
                    </button>
                  )}
                </div>
              ))
          )}
        </div>
    </Layout>
  );
}