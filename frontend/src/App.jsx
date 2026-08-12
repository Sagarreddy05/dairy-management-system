import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Farmers from './pages/Farmers';
import MilkCollections from './pages/MilkCollections';
import Customers from './pages/Customers';
import Subscriptions from './pages/Subscriptions';
import Products from './pages/Products';
import Deliveries from './pages/Deliveries';
import Invoices from './pages/Invoices';
import Payments from './pages/Payments';
import Reports from './pages/Reports';
import SalesChallans from './pages/SalesChallans';

function ProtectedRoute({ children, roles }) {
  const { isAuthenticated, loading, hasRole } = useAuth();
  if (loading) return <div className="page-content">Loading...</div>;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (roles && !hasRole(...roles)) return <Navigate to="/dashboard" replace />;
  return children;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="farmers" element={<ProtectedRoute roles={['ADMIN', 'SALES', 'FARMER']}><Farmers /></ProtectedRoute>} />
        <Route path="milk-collections" element={<ProtectedRoute roles={['ADMIN', 'SALES', 'FARMER']}><MilkCollections /></ProtectedRoute>} />
        <Route path="customers" element={<ProtectedRoute roles={['ADMIN', 'SALES']}><Customers /></ProtectedRoute>} />
        <Route path="subscriptions" element={<ProtectedRoute roles={['ADMIN', 'SALES']}><Subscriptions /></ProtectedRoute>} />
        <Route path="products" element={<ProtectedRoute roles={['ADMIN', 'SALES', 'DELIVERY']}><Products /></ProtectedRoute>} />
        <Route path="challans" element={<ProtectedRoute roles={['ADMIN', 'SALES']}><SalesChallans /></ProtectedRoute>} />
        <Route path="deliveries" element={<ProtectedRoute roles={['ADMIN', 'SALES', 'DELIVERY']}><Deliveries /></ProtectedRoute>} />
        <Route path="invoices" element={<ProtectedRoute roles={['ADMIN', 'SALES']}><Invoices /></ProtectedRoute>} />
        <Route path="payments" element={<ProtectedRoute roles={['ADMIN', 'SALES']}><Payments /></ProtectedRoute>} />
        <Route path="reports" element={<Reports />} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}
