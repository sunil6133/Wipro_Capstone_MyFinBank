import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useFormik } from 'formik';
import { toast } from 'react-toastify';
import axiosInstance from '../utils/axiosInstance';
import { forgotPasswordSchema, resetPasswordSchema } from '../schemas';

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [emailForReset, setEmailForReset] = useState('');

  const inp = { padding: '12px 14px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 15, width: '100%', boxSizing: 'border-box', marginBottom: 4, outline: 'none', fontFamily: 'inherit' };
  const err = { color: '#ef4444', fontSize: 12, marginBottom: 12 };

  const step1 = useFormik({
    initialValues: { email: '' },
    validationSchema: forgotPasswordSchema,
    onSubmit: async ({ email }) => {
      try {
        await axiosInstance.post('/auth/forgot-password', { email });
        setEmailForReset(email);
        toast.success('OTP sent to your email');
        setStep(2);
      } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    }
  });

  const step2 = useFormik({
    initialValues: { otp: '', newPassword: '' },
    validationSchema: resetPasswordSchema,
    onSubmit: async (values) => {
      try {
        await axiosInstance.post('/auth/reset-password', { email: emailForReset, ...values });
        toast.success('Password reset successful');
        navigate('/login');
      } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    }
  });

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center"
      style={{ background: '#f1f5f9', padding: '24px 16px' }}>
      <div className="w-100" style={{ maxWidth: 420 }}>
        <div className="bg-white rounded-4 p-4 p-sm-5" style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.09)' }}>
          <h2 style={{ margin: '0 0 8px', color: '#1e293b', fontSize: 24 }}>Reset Password</h2>
          {step === 1 ? (
            <form onSubmit={step1.handleSubmit}>
              <p style={{ color: '#64748b', fontSize: 14, margin: '0 0 20px' }}>Enter your registered email to receive an OTP.</p>
              <div className="mb-3">
                <input type="email" style={{ ...inp, marginBottom: 4 }} placeholder="Email" {...step1.getFieldProps('email')} />
                {step1.touched.email && step1.errors.email && <div style={err}>{step1.errors.email}</div>}
              </div>
              <button type="submit" className="btn w-100"
                style={{ padding: 13, borderRadius: 8, border: 'none', background: '#3b82f6', color: '#fff', fontWeight: 700, fontSize: 15 }}>
                Send OTP
              </button>
            </form>
          ) : (
            <form onSubmit={step2.handleSubmit}>
              <p style={{ color: '#64748b', fontSize: 14, margin: '0 0 20px' }}>Enter the OTP sent to <strong>{emailForReset}</strong></p>
              <div className="mb-3">
                <input style={inp} placeholder="6-digit OTP" maxLength={6} {...step2.getFieldProps('otp')} />
                {step2.touched.otp && step2.errors.otp && <div style={err}>{step2.errors.otp}</div>}
              </div>
              <div className="mb-4">
                <input type="password" style={{ ...inp, marginBottom: 4 }} placeholder="New Password" {...step2.getFieldProps('newPassword')} />
                {step2.touched.newPassword && step2.errors.newPassword && <div style={err}>{step2.errors.newPassword}</div>}
              </div>
              <button type="submit" className="btn w-100"
                style={{ padding: 13, borderRadius: 8, border: 'none', background: '#3b82f6', color: '#fff', fontWeight: 700, fontSize: 15 }}>
                Reset Password
              </button>
            </form>
          )}
          <p className="text-center mt-4" style={{ fontSize: 14 }}>
            <Link to="/login" style={{ color: '#3b82f6' }}>Back to Login</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
