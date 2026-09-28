import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { to: '/dashboard', label: 'Dashboard', roles: ['ADMIN', 'SALES', 'FARMER', 'DELIVERY'] },
  { to: '/farmers', label: 'Farmers', roles: ['ADMIN', 'SALES', 'FARMER'] },
  { to: '/milk-collections', label: 'Milk Collections', roles: ['ADMIN', 'SALES', 'FARMER'] },
  { to: '/customers', label: 'Customers', roles: ['ADMIN', 'SALES'] },
  { to: '/subscriptions', label: 'Subscriptions', roles: ['ADMIN', 'SALES'] },
  { to: '/products', label: 'Products', roles: ['ADMIN', 'SALES', 'DELIVERY'] },
  { to: '/challans', label: 'Sales Challans', roles: ['ADMIN', 'SALES'] },
  { to: '/deliveries', label: 'Deliveries', roles: ['ADMIN', 'SALES', 'DELIVERY'] },
  { to: '/invoices', label: 'Invoices', roles: ['ADMIN', 'SALES'] },
  { to: '/payments', label: 'Payments', roles: ['ADMIN', 'SALES'] },
  { to: '/reports', label: 'Reports', roles: ['ADMIN', 'SALES', 'FARMER', 'DELIVERY'] },
];

export default function Sidebar({ open, onClose }) {
  const { user, hasRole } = useAuth();
  const items = navItems.filter((item) => hasRole(...item.roles));

  return (
    <>
      <div className={`sidebar-overlay ${open ? 'show' : ''}`} onClick={onClose} />
      <aside className={`sidebar ${open ? 'open' : ''}`}>
        <div className="sidebar-brand">
          <span className="brand-mark">FF</span>
          <div>
            <strong>FarmFresh</strong>
            <small>Dairy Management</small>
          </div>
        </div>
        <nav className="sidebar-nav">
          {items.map((item) => (
            <NavLink key={item.to} to={item.to} onClick={onClose} className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-user">
          <div className="user-avatar">{user?.name?.charAt(0) || 'U'}</div>
          <div>
            <strong>{user?.name}</strong>
            <small>{user?.role?.replace('_', ' ')}</small>
          </div>
        </div>
      </aside>
    </>
  );
}
 
