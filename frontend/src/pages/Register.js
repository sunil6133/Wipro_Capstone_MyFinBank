import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useFormik } from 'formik';
import { toast } from 'react-toastify';
import axiosInstance from '../utils/axiosInstance';
import { registerSchema } from '../schemas';

const inp = { padding: '13px 16px', borderRadius: 10, border: '1.5px solid #e2e8f0', fontSize: 15, width: '100%', boxSizing: 'border-box', outline: 'none', fontFamily: 'inherit' };
const lbl = { fontSize: 13, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 6 };
const errStyle = { color: '#ef4444', fontSize: 12, marginTop: 4 };

function FormField({ formik, name, type, placeholder, children }) {
  const label = name.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase());
  return (
    <div className="mb-3">
      <label style={lbl}>{label}</label>
      {children ? (
        <select style={{ ...inp, cursor: 'pointer' }} {...formik.getFieldProps(name)}>{children}</select>
      ) : (
        <input type={type || 'text'} style={inp} placeholder={placeholder} {...formik.getFieldProps(name)} />
      )}
      {formik.touched[name] && formik.errors[name] && <div style={errStyle}>{formik.errors[name]}</div>}
    </div>
  );
}

export default function Register() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState(null);

  const formik = useFormik({
    initialValues: { name: '', email: '', password: '', phone: '', address: '', govIdType: 'AADHAAR', govIdNumber: '', accountType: 'SAVINGS' },
    validationSchema: registerSchema,
    onSubmit: async (values) => {
      if (!file) return toast.error('Please upload your government ID document');
      setLoading(true);
      try {
        const fd = new FormData();
        Object.entries(values).forEach(([k, v]) => fd.append(k, v));
        fd.append('govIdDocument', file);
        await axiosInstance.post('/auth/register', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        toast.success('Registration submitted. Await KYC approval.');
        navigate('/login');
      } catch (err) { toast.error(err.response?.data?.message || 'Registration failed'); }
      finally { setLoading(false); }
    },
  });

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center"
      style={{ background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)', padding: '32px 16px' }}>
      <div className="w-100" style={{ maxWidth: 600 }}>
        <div className="bg-white rounded-4 p-4 p-sm-5" style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.25)' }}>
          <div className="mb-4">
            <h2 style={{ margin: '0 0 6px', color: '#1e293b', fontSize: 26, fontWeight: 800 }}>Open Account</h2>
            <p style={{ color: '#64748b', fontSize: 15 }}>Fill in your details. Admin will verify your KYC.</p>
          </div>
          <form onSubmit={formik.handleSubmit}>
            {/* Full-width name */}
            <FormField formik={formik} name="name" placeholder="Full name" />
            {/* Two-column grid on md+, stacks on mobile */}
            <div className="row g-3">
              <div className="col-12 col-md-6">
                <FormField formik={formik} name="email" type="email" placeholder="email@example.com" />
              </div>
              <div className="col-12 col-md-6">
                <FormField formik={formik} name="password" type="password" placeholder="Min 8 characters" />
              </div>
              <div className="col-12 col-md-6">
                <FormField formik={formik} name="phone" placeholder="10-digit mobile" />
              </div>
              <div className="col-12 col-md-6">
                <FormField formik={formik} name="address" placeholder="Full address" />
              </div>
              <div className="col-12 col-md-6">
                <FormField formik={formik} name="govIdType">
                  <option value="AADHAAR">Aadhaar</option>
                  <option value="PAN">PAN Card</option>
                </FormField>
              </div>
              <div className="col-12 col-md-6">
                <FormField formik={formik} name="govIdNumber" placeholder="ID number" />
              </div>
              <div className="col-12">
                <FormField formik={formik} name="accountType">
                  <option value="SAVINGS">Savings Account</option>
                  <option value="CURRENT">Current Account</option>
                </FormField>
              </div>
            </div>
            <div className="mb-4">
              <label style={lbl}>Government ID Document</label>
              <input type="file" accept="image/*,.pdf" onChange={e => setFile(e.target.files[0])} style={{ ...inp, padding: '11px 14px', cursor: 'pointer' }} />
              {file && <div style={{ fontSize: 13, color: '#22c55e', marginTop: 5 }}>Selected: {file.name}</div>}
            </div>
            <button type="submit" disabled={loading} className="btn w-100"
              style={{ padding: 15, borderRadius: 10, border: 'none', background: loading ? '#93c5fd' : '#3b82f6', color: '#fff', fontWeight: 700, fontSize: 16, cursor: loading ? 'not-allowed' : 'pointer' }}>
              {loading ? 'Submitting...' : 'Submit Registration'}
            </button>
          </form>
          <p className="text-center mt-4" style={{ fontSize: 15, color: '#64748b' }}>
            Already registered? <Link to="/login" style={{ color: '#3b82f6', fontWeight: 700 }}>Login</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
