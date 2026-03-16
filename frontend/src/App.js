import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useSelector } from 'react-redux';

import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';

import CustomerDashboard from './pages/customer/Dashboard';
import TransactionsPage from './pages/customer/Transactions';
import TransferPage from './pages/customer/Transfer';
import InvestmentsPage from './pages/customer/Investments';
import LoanPage from './pages/customer/Loan';
import CustomerChat from './pages/customer/Chat';
import AdminBeneficiaries from './pages/admin/Beneficiaries';
import ProfilePage from './pages/customer/Profile';

import AdminDashboard from './pages/admin/Dashboard';
import AdminCustomers from './pages/admin/Customers';
import AdminAccounts from './pages/admin/Accounts';
import AdminLoans from './pages/admin/Loans';
import AdminChat from './pages/admin/Chat';

function ProtectedRoute({ children, role }) {
  const { user } = useSelector(s => s.auth);
  if (!user) return <Navigate to="/login" replace />;
  if (role && user.role !== role) return <Navigate to="/" replace />;
  return children;
}

function RootRedirect() {
  const { user } = useSelector(s => s.auth);
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'ADMIN') return <Navigate to="/admin/dashboard" replace />;
  return <Navigate to="/dashboard" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<RootRedirect />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />

        <Route path="/dashboard" element={<ProtectedRoute role="CUSTOMER"><CustomerDashboard /></ProtectedRoute>} />
        <Route path="/transactions" element={<ProtectedRoute role="CUSTOMER"><TransactionsPage /></ProtectedRoute>} />
        <Route path="/transfer" element={<ProtectedRoute role="CUSTOMER"><TransferPage /></ProtectedRoute>} />
        <Route path="/investments" element={<ProtectedRoute role="CUSTOMER"><InvestmentsPage /></ProtectedRoute>} />
        <Route path="/loans" element={<ProtectedRoute role="CUSTOMER"><LoanPage /></ProtectedRoute>} />
        <Route path="/chat" element={<ProtectedRoute role="CUSTOMER"><CustomerChat /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute role="CUSTOMER"><ProfilePage /></ProtectedRoute>} />

        <Route path="/admin/dashboard" element={<ProtectedRoute role="ADMIN"><AdminDashboard /></ProtectedRoute>} />
        <Route path="/admin/customers" element={<ProtectedRoute role="ADMIN"><AdminCustomers /></ProtectedRoute>} />
        <Route path="/admin/accounts" element={<ProtectedRoute role="ADMIN"><AdminAccounts /></ProtectedRoute>} />
        <Route path="/admin/loans" element={<ProtectedRoute role="ADMIN"><AdminLoans /></ProtectedRoute>} />
        <Route path="/admin/beneficiaries" element={<ProtectedRoute role="ADMIN"><AdminBeneficiaries /></ProtectedRoute>} />
        <Route path="/admin/chat" element={<ProtectedRoute role="ADMIN"><AdminChat /></ProtectedRoute>} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar />
    </BrowserRouter>
  );
}
