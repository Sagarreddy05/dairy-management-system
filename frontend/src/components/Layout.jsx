import { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import { useAuth } from '../context/AuthContext';

export default function Layout() {
  const [open, setOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="app-shell">
      <Sidebar open={open} onClose={() => setOpen(false)} />
      <div className="main-area">
        <header className="topbar">
          <button className="menu-btn" onClick={() => setOpen(true)} aria-label="Open menu">
            ☰
          </button>
          <div className="topbar-title">Dairy Operations Console</div>
          <div className="topbar-actions">
            <span className="topbar-user">{user?.email}</span>
            <button className="btn btn-outline" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </header>
        <main className="page-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
