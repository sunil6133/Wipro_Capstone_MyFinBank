import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { useFormik } from 'formik';
import { toast } from 'react-toastify';
import { loginCustomer, loginAdmin } from '../store/slices/authSlice';
import { loginSchema } from '../schemas';

export default function Login() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading } = useSelector(s => s.auth);
  const [isAdmin, setIsAdmin] = useState(false);

  const formik = useFormik({
    initialValues: { email: '', password: '' },
    validationSchema: loginSchema,
    onSubmit: async (values) => {
      const action = isAdmin ? loginAdmin(values) : loginCustomer(values);
      const result = await dispatch(action);
      if (result.meta.requestStatus === 'fulfilled') {
        toast.success('Login successful');
        navigate(isAdmin ? '/admin/dashboard' : '/dashboard');
      } else {
        toast.error(result.payload);
      }
    },
  });

  const inp = { padding: '14px 16px', borderRadius: 10, border: '1.5px solid #e2e8f0', fontSize: 16, width: '100%', boxSizing: 'border-box', outline: 'none', fontFamily: 'inherit', transition: 'border-color 0.15s' };
  const lbl = { fontSize: 14, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 7 };
  const err = { color: '#ef4444', fontSize: 13, marginTop: 5 };

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center"
      style={{ background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)', padding: '24px 16px' }}>
      <div className="w-100" style={{ maxWidth: 460 }}>
        <div className="bg-white rounded-4 p-4 p-sm-5" style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.25)' }}>
          <div className="text-center mb-4">
            <h1 style={{ color: '#1e293b', fontSize: 28, fontWeight: 800, margin: '0 0 6px' }}>MyFin Bank</h1>
            <p style={{ color: '#64748b', fontSize: 16 }}>Sign in to your account</p>
          </div>
          <div className="d-flex gap-2 mb-4 p-1 rounded-3" style={{ background: '#f1f5f9' }}>
            {['Customer', 'Admin'].map(role => (
              <button key={role} type="button" onClick={() => setIsAdmin(role === 'Admin')}
                className="btn flex-fill"
                style={{ borderRadius: 10, border: 'none', padding: '11px', fontSize: 15, fontWeight: 600, background: (isAdmin ? role === 'Admin' : role === 'Customer') ? '#3b82f6' : 'transparent', color: (isAdmin ? role === 'Admin' : role === 'Customer') ? '#fff' : '#64748b', transition: 'all 0.15s' }}>
                {role}
              </button>
            ))}
          </div>
          <form onSubmit={formik.handleSubmit}>
            <div className="mb-3">
              <label style={lbl}>Email Address</label>
              <input type="email" style={inp} placeholder="you@example.com" {...formik.getFieldProps('email')}
                onFocus={e => e.target.style.borderColor = '#3b82f6'} onBlur={e => { e.target.style.borderColor = '#e2e8f0'; formik.handleBlur(e); }} />
              {formik.touched.email && formik.errors.email && <div style={err}>{formik.errors.email}</div>}
            </div>
            <div className="mb-4">
              <label style={lbl}>Password</label>
              <input type="password" style={inp} placeholder="Your password" {...formik.getFieldProps('password')}
                onFocus={e => e.target.style.borderColor = '#3b82f6'} onBlur={e => { e.target.style.borderColor = '#e2e8f0'; formik.handleBlur(e); }} />
              {formik.touched.password && formik.errors.password && <div style={err}>{formik.errors.password}</div>}
            </div>
            <button type="submit" disabled={loading} className="btn w-100"
              style={{ padding: '15px', borderRadius: 10, border: 'none', background: loading ? '#93c5fd' : '#3b82f6', color: '#fff', fontWeight: 700, fontSize: 16, cursor: loading ? 'not-allowed' : 'pointer' }}>
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
          {!isAdmin && (
            <div className="text-center mt-4" style={{ fontSize: 15, color: '#64748b' }}>
              <Link to="/forgot-password" style={{ color: '#3b82f6', fontWeight: 600 }}>Forgot Password?</Link>
              <span className="mx-2" style={{ color: '#cbd5e1' }}>|</span>
              <Link to="/register" style={{ color: '#3b82f6', fontWeight: 600 }}>Create Account</Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
