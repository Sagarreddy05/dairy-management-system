import { useEffect, useState } from 'react';
import api from '../api/axios';
import DashboardCard from '../components/DashboardCard';
import DataTable from '../components/DataTable';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get('/reports/dashboard')
      .then((res) => setStats(res.data.data))
      .catch((err) => setError(err.response?.data?.message || 'Failed to load dashboard'));
  }, []);

  const columns = [
    { key: 'farmer', label: 'Farmer', render: (r) => r.farmer?.farmerName },
    { key: 'milkType', label: 'Type' },
    { key: 'quantityLiters', label: 'Liters' },
    { key: 'totalAmount', label: 'Amount', render: (r) => `₹${r.totalAmount}` },
    {
      key: 'collectionDate',
      label: 'Date',
      render: (r) => new Date(r.collectionDate).toLocaleDateString(),
    },
  ];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Dashboard</h1>
          <p>Today&apos;s dairy farm overview</p>
        </div>
      </div>
      {error && <div className="alert alert-error">{error}</div>}
      {stats && (
        <>
          <div className="dash-grid">
            <DashboardCard title="Active Farmers" value={stats.farmers} />
            <DashboardCard title="Today's Milk" value={`${stats.todayMilkLiters} L`} subtitle={`₹${stats.todayMilkAmount}`} />
            <DashboardCard title="Pending Deliveries" value={stats.pendingDeliveries} accent="accent-warn" />
            <DashboardCard title="Unpaid Invoices" value={stats.unpaidInvoices} accent="accent-danger" />
            <DashboardCard title="Low Stock Items" value={stats.lowStockCount} accent="accent-warn" />
            <DashboardCard title="Customers" value={stats.customers} />
          </div>
          <div className="panel">
            <h2 className="section-title">Recent Collections</h2>
            <DataTable columns={columns} rows={stats.recentCollections || []} />
          </div>
        </>
      )}
    </div>
  );
}
 
