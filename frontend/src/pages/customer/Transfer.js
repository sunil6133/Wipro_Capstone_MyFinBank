import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useFormik } from 'formik';
import { toast } from 'react-toastify';
import Layout from '../../components/shared/Layout';
import axiosInstance from '../../utils/axiosInstance';
import { fetchMyAccounts } from '../../store/slices/accountSlice';
import { transferSchema, depositSchema, withdrawSchema } from '../../schemas';

const inp = { padding: '13px 16px', borderRadius: 10, border: '1.5px solid #e2e8f0', fontSize: 15, width: '100%', boxSizing: 'border-box', outline: 'none', fontFamily: 'inherit' };
const lbl = { fontSize: 14, fontWeight: 600, display: 'block', marginBottom: 7, color: '#475569' };
const errStyle = { color: '#ef4444', fontSize: 13, marginTop: 4 };

function AccSelect({ formik, fieldName, list }) {
  return (
    <div className="mb-3">
      <label style={lbl}>Account</label>
      <select style={{ ...inp, cursor: 'pointer' }} value={formik.values[fieldName]} onChange={e => formik.setFieldValue(fieldName, e.target.value)}>
        {list.length === 0 && <option value="">No eligible accounts</option>}
        {list.map(a => <option key={a.accountNumber} value={a.accountNumber}>{a.accountType} - {a.accountNumber}</option>)}
      </select>
      {formik.touched[fieldName] && formik.errors[fieldName] && <div style={errStyle}>{formik.errors[fieldName]}</div>}
    </div>
  );
}

function Field({ formik, name, label, type, placeholder }) {
  return (
    <div className="mb-3">
      <label style={lbl}>{label}</label>
      <input type={type || 'text'} style={inp} placeholder={placeholder} {...formik.getFieldProps(name)} />
      {formik.touched[name] && formik.errors[name] && <div style={errStyle}>{formik.errors[name]}</div>}
    </div>
  );
}

export default function TransferPage() {
  const dispatch = useDispatch();
  const { accounts } = useSelector(s => s.accounts);
  const [beneficiaries, setBeneficiaries] = useState([]);
  const [activeTab, setActiveTab] = useState('deposit');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    dispatch(fetchMyAccounts());
    axiosInstance.get('/beneficiaries/my').then(r => setBeneficiaries(r.data.beneficiaries || [])).catch(() => {});
  }, [dispatch]);

  const activeAccounts = accounts.filter(a => ['ACTIVE', 'AT_RISK'].includes(a.status));
  const depositableAccounts = accounts.filter(a => a.status === 'ACTIVE' || a.status === 'AT_RISK' || (a.status === 'DEACTIVATED' && a.deactivationType === 'AUTO'));

  const depositFormik = useFormik({
    initialValues: { accountNumber: depositableAccounts[0]?.accountNumber || '', amount: '', description: '' },
    validationSchema: depositSchema, enableReinitialize: true,
    onSubmit: async (values, { resetForm }) => {
      setLoading(true);
      try { await axiosInstance.post('/transactions/deposit', { accountNumber: values.accountNumber, amount: Number(values.amount), description: values.description }); toast.success('Deposit successful'); dispatch(fetchMyAccounts()); resetForm(); }
      catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
      finally { setLoading(false); }
    },
  });

  const withdrawFormik = useFormik({
    initialValues: { accountNumber: activeAccounts[0]?.accountNumber || '', amount: '', description: '' },
    validationSchema: withdrawSchema, enableReinitialize: true,
    onSubmit: async (values, { resetForm }) => {
      setLoading(true);
      try { await axiosInstance.post('/transactions/withdraw', { accountNumber: values.accountNumber, amount: Number(values.amount), description: values.description }); toast.success('Withdrawal successful'); dispatch(fetchMyAccounts()); resetForm(); }
      catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
      finally { setLoading(false); }
    },
  });

  const transferFormik = useFormik({
    initialValues: { fromAccountNumber: activeAccounts[0]?.accountNumber || '', toAccountNumber: '', amount: '', description: '' },
    validationSchema: transferSchema, enableReinitialize: true,
    onSubmit: async (values, { resetForm }) => {
      setLoading(true);
      try { await axiosInstance.post('/transactions/transfer', { fromAccountNumber: values.fromAccountNumber, toAccountNumber: values.toAccountNumber, amount: Number(values.amount), description: values.description }); toast.success('Transfer successful'); dispatch(fetchMyAccounts()); resetForm(); }
      catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
      finally { setLoading(false); }
    },
  });

  const tabBtn = (active) => ({ padding: '13px 28px', border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 700, fontSize: 15, background: active ? '#3b82f6' : '#fff', color: active ? '#fff' : '#64748b', boxShadow: active ? '0 4px 12px rgba(59,130,246,0.3)' : 'none' });
  const submitBtn = (bg) => ({ width: '100%', padding: 15, borderRadius: 10, border: 'none', background: loading ? '#94a3b8' : bg, color: '#fff', fontWeight: 700, fontSize: 16, cursor: loading ? 'not-allowed' : 'pointer', marginTop: 8 });

  return (
    <Layout>
      <h2 style={{ margin: '0 0 28px', color: '#1e293b', fontSize: 28, fontWeight: 700 }}>Fund Transfer</h2>
      {/* Tab buttons — wrap on mobile */}
      <div className="d-flex flex-wrap gap-2 mb-4">
        {[{ key: 'deposit', label: 'Deposit' }, { key: 'withdraw', label: 'Withdraw' }, { key: 'transfer', label: 'Transfer' }].map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key)} style={tabBtn(activeTab === t.key)}>{t.label}</button>
        ))}
      </div>
      {/* Form in responsive column */}
      <div className="row">
        <div className="col-12 col-md-8 col-lg-6 col-xl-5">
          <div style={{ background: '#fff', borderRadius: 16, padding: '32px 28px', boxShadow: '0 2px 12px rgba(0,0,0,0.07)' }}>
            {activeTab === 'deposit' && (
              <form onSubmit={depositFormik.handleSubmit}>
                <h3 style={{ margin: '0 0 24px', color: '#1e293b', fontSize: 19, fontWeight: 700 }}>Deposit Money</h3>
                <AccSelect formik={depositFormik} fieldName="accountNumber" list={depositableAccounts} />
                <Field formik={depositFormik} name="amount" label="Amount (Rs.)" type="number" placeholder="Enter amount" />
                <Field formik={depositFormik} name="description" label="Description (optional)" placeholder="e.g. Salary credit" />
                <button type="submit" disabled={loading} style={submitBtn('#22c55e')}>{loading ? 'Processing...' : 'Deposit'}</button>
              </form>
            )}
            {activeTab === 'withdraw' && (
              <form onSubmit={withdrawFormik.handleSubmit}>
                <h3 style={{ margin: '0 0 24px', color: '#1e293b', fontSize: 19, fontWeight: 700 }}>Withdraw Money</h3>
                <AccSelect formik={withdrawFormik} fieldName="accountNumber" list={activeAccounts} />
                <Field formik={withdrawFormik} name="amount" label="Amount (Rs.)" type="number" placeholder="Enter amount" />
                <Field formik={withdrawFormik} name="description" label="Description (optional)" placeholder="e.g. ATM withdrawal" />
                <button type="submit" disabled={loading} style={submitBtn('#ef4444')}>{loading ? 'Processing...' : 'Withdraw'}</button>
              </form>
            )}
            {activeTab === 'transfer' && (
              <form onSubmit={transferFormik.handleSubmit}>
                <h3 style={{ margin: '0 0 24px', color: '#1e293b', fontSize: 19, fontWeight: 700 }}>Transfer Money</h3>
                <AccSelect formik={transferFormik} fieldName="fromAccountNumber" list={activeAccounts} />
                {beneficiaries.filter(b => b.status === 'ACTIVE').length > 0 && (
                  <div className="mb-3">
                    <label style={lbl}>Select Saved Beneficiary</label>
                    <select style={{ ...inp, cursor: 'pointer' }} value="" onChange={e => { if (e.target.value) transferFormik.setFieldValue('toAccountNumber', e.target.value); }}>
                      <option value="">Select beneficiary</option>
                      {beneficiaries.filter(b => b.status === 'ACTIVE').map(b => <option key={b.beneficiaryId} value={b.accountNumber}>{b.beneficiaryName} — {b.accountNumber}</option>)}
                    </select>
                  </div>
                )}
                <Field formik={transferFormik} name="toAccountNumber" label="Recipient Account Number" placeholder="e.g. 00000002" />
                <Field formik={transferFormik} name="amount" label="Amount (Rs.)" type="number" placeholder="Enter amount" />
                <Field formik={transferFormik} name="description" label="Description (optional)" placeholder="e.g. Transfer to Rahul" />
                <button type="submit" disabled={loading} style={submitBtn('#3b82f6')}>{loading ? 'Processing...' : 'Send Money'}</button>
              </form>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
