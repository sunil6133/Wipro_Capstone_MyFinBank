import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../../store/slices/authSlice';

const customerLinks = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/transactions', label: 'Transactions' },
  { to: '/transfer', label: 'Fund Transfer' },
  { to: '/investments', label: 'Investments' },
  { to: '/loans', label: 'Loans' },
  { to: '/chat', label: 'Chat Support' },
  { to: '/profile', label: 'My Profile' },
];

const adminLinks = [
  { to: '/admin/dashboard', label: 'Dashboard' },
  { to: '/admin/customers', label: 'Customers' },
  { to: '/admin/accounts', label: 'Accounts' },
  { to: '/admin/loans', label: 'Loans' },
  { to: '/admin/beneficiaries', label: 'Beneficiaries' },
  { to: '/admin/chat', label: 'Support' },
];

export default function Sidebar() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector(s => s.auth);
  const [mobileOpen, setMobileOpen] = useState(false);
  const links = user?.role === 'ADMIN' ? adminLinks : customerLinks;

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const initials = user?.name?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'U';

  const sidebarContent = (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ padding: '28px 20px 24px', borderBottom: '1px solid #2d3f57' }}>
        <div className="d-flex justify-content-between align-items-start">
          <h2 style={{ color: '#fff', margin: '0 0 20px', fontSize: 20, fontWeight: 800, letterSpacing: 0.3 }}>MyFin Bank</h2>
          {/* Close button — mobile only */}
          <button
            className="d-md-none btn p-0"
            onClick={() => setMobileOpen(false)}
            style={{ color: '#94a3b8', fontSize: 22, lineHeight: 1, background: 'none', border: 'none' }}
          >&#x2715;</button>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 42, height: 42, borderRadius: '50%', background: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 16, flexShrink: 0 }}>{initials}</div>
          <div style={{ minWidth: 0 }}>
            <p style={{ color: '#fff', fontSize: 14, margin: 0, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.name}</p>
            <p style={{ color: '#94a3b8', fontSize: 12, margin: '2px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.email}</p>
          </div>
        </div>
      </div>
      <nav style={{ flex: 1, padding: '16px 12px', overflowY: 'auto' }}>
        {links.map(l => (
          <NavLink
            key={l.to}
            to={l.to}
            onClick={() => setMobileOpen(false)}
            style={({ isActive }) => ({
              display: 'block', padding: '13px 16px', margin: '3px 0', borderRadius: 10,
              textDecoration: 'none', fontSize: 15, fontWeight: isActive ? 600 : 400,
              color: isActive ? '#fff' : '#94a3b8', background: isActive ? '#3b82f6' : 'transparent'
            })}
          >
            {l.label}
          </NavLink>
        ))}
      </nav>
      <div style={{ padding: '16px 12px 24px' }}>
        <button onClick={handleLogout} style={{ width: '100%', padding: '13px 16px', borderRadius: 10, border: 'none', background: '#2d3f57', color: '#94a3b8', cursor: 'pointer', fontWeight: 600, fontSize: 15, textAlign: 'left' }}>
          Logout
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* ── Desktop sidebar (md+) ── */}
      <div
        className="d-none d-md-flex flex-column"
        style={{ width: 240, minHeight: '100vh', background: '#1e293b', flexShrink: 0, position: 'sticky', top: 0, height: '100vh', overflowY: 'auto' }}
      >
        {sidebarContent}
      </div>

      {/* ── Mobile: hamburger button ── */}
      <button
        className="d-md-none"
        onClick={() => setMobileOpen(true)}
        style={{
          position: 'fixed', top: 14, left: 14, zIndex: 1100,
          background: '#1e293b', border: 'none', borderRadius: 8,
          color: '#fff', padding: '8px 12px', fontSize: 20,
          cursor: 'pointer', lineHeight: 1, boxShadow: '0 2px 8px rgba(0,0,0,0.25)'
        }}
        aria-label="Open menu"
      >&#9776;</button>

      {/* ── Mobile: backdrop ── */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1150 }}
        />
      )}

      {/* ── Mobile: slide-in drawer ── */}
      <div
        className="d-md-none"
        style={{
          position: 'fixed', top: 0, left: 0, width: 260, height: '100vh',
          background: '#1e293b', zIndex: 1200,
          transform: mobileOpen ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 0.25s ease', overflowY: 'auto'
        }}
      >
        {sidebarContent}
      </div>
    </>
  );
}
