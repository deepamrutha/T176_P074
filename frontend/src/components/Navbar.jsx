import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Shield, LayoutDashboard, CreditCard, ArrowLeftRight, Cpu, LogOut, User as UserIcon } from 'lucide-react';
import ComputeBadge from './ComputeBadge';

export default function Navbar({ user, onLogout }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    onLogout();
    navigate('/login');
  };

  return (
    <header className="navbar">
      <div className="navbar-inner">
        <NavLink to="/" className="brand-logo">
          <Shield size={24} className="brand-icon" style={{ color: 'var(--accent-blue)' }} />
          <span>SecureBank</span>
          <span className="brand-badge">Azure Study</span>
        </NavLink>

        {user ? (
          <nav className="nav-links">
            <NavLink
              to="/"
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              end
            >
              <LayoutDashboard size={16} />
              <span>Dashboard</span>
            </NavLink>

            <NavLink
              to="/accounts"
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <CreditCard size={16} />
              <span>Accounts</span>
            </NavLink>

            <NavLink
              to="/transactions"
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <ArrowLeftRight size={16} />
              <span>Transactions</span>
            </NavLink>

            <NavLink
              to="/compute-study"
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <Cpu size={16} />
              <span>Azure Compute Study</span>
            </NavLink>
          </nav>
        ) : (
          <div className="nav-links">
            <NavLink
              to="/compute-study"
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <Cpu size={16} />
              <span>Azure Compute Study</span>
            </NavLink>
          </div>
        )}

        <div className="user-menu">
          <ComputeBadge />

          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div className="user-badge" title={`Signed in as ${user.email} (${user.role})`}>
                <div className="user-avatar">
                  {user.full_name ? user.full_name.charAt(0).toUpperCase() : 'U'}
                </div>
                <span>{user.full_name || user.username}</span>
                {user.role === 'AUDITOR' && (
                  <span style={{ fontSize: '0.7rem', color: 'var(--status-amber)', marginLeft: '0.25rem' }}>[Auditor]</span>
                )}
              </div>
              <button
                onClick={handleLogout}
                className="btn btn-outline btn-sm"
                title="Sign out of SecureBank"
              >
                <LogOut size={14} />
                <span>Logout</span>
              </button>
            </div>
          ) : (
            <NavLink to="/login" className="btn btn-primary btn-sm">
              Sign In
            </NavLink>
          )}
        </div>
      </div>
    </header>
  );
}
