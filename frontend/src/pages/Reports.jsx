import { useState } from 'react';
import api from '../api/axios';
import DataTable from '../components/DataTable';

const tabs = [
  { id: 'daily-milk', label: 'Daily Milk', endpoint: '/reports/daily-milk-collection', dateParam: 'date' },
  { id: 'farmer-payments', label: 'Farmer Payments', endpoint: '/reports/farmer-payments', fromTo: true },
  { id: 'customer-billing', label: 'Customer Billing', endpoint: '/reports/customer-billing', monthParam: 'month' },
  { id: 'deliveries', label: 'Deliveries', endpoint: '/reports/deliveries', dateParam: 'date' },
  { id: 'inventory', label: 'Inventory', endpoint: '/reports/inventory' },
];

export default function Reports() {
  const [tab, setTab] = useState(tabs[0]);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [from, setFrom] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10));
  const [to, setTo] = useState(new Date().toISOString().slice(0, 10));
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [rows, setRows] = useState([]);
  const [columns, setColumns] = useState([]);
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState('');

  const buildParams = (format) => {
    const params = {};
    if (format) params.format = format;
    if (tab.dateParam) params.date = date;
    if (tab.fromTo) {
      params.from = from;
      params.to = to;
    }
    if (tab.monthParam) params.month = month;
    return params;
  };

  const load = async () => {
    setError('');
    try {
      const { data } = await api.get(tab.endpoint, { params: buildParams() });
      const payload = data.data;
      setSummary(payload.summary || payload);

      if (tab.id === 'daily-milk') {
        setColumns([
          { key: 'farmer', label: 'Farmer', render: (r) => r.farmer?.farmerName },
          { key: 'milkType', label: 'Type' },
          { key: 'quantityLiters', label: 'Liters' },
          { key: 'totalAmount', label: 'Amount', render: (r) => `₹${r.totalAmount}` },
        ]);
        setRows(payload.collections || []);
      } else if (tab.id === 'farmer-payments') {
        setColumns([
          { key: 'farmerName', label: 'Farmer' },
          { key: 'village', label: 'Village' },
          { key: 'totalLiters', label: 'Liters' },
          { key: 'totalAmount', label: 'Amount', render: (r) => `₹${r.totalAmount}` },
          { key: 'collections', label: 'Collections' },
        ]);
        setRows(payload.farmers || []);
      } else if (tab.id === 'customer-billing') {
        setColumns([
          { key: 'invoiceNumber', label: 'Invoice' },
          { key: 'customer', label: 'Customer', render: (r) => r.customer?.customerName },
          { key: 'totalAmount', label: 'Total', render: (r) => `₹${r.totalAmount}` },
          { key: 'paidAmount', label: 'Paid', render: (r) => `₹${r.paidAmount}` },
          { key: 'balanceAmount', label: 'Balance', render: (r) => `₹${r.balanceAmount}` },
          { key: 'paymentStatus', label: 'Status' },
        ]);
        setRows(payload.invoices || []);
      } else if (tab.id === 'deliveries') {
        setColumns([
          { key: 'customer', label: 'Customer', render: (r) => r.customer?.customerName },
          { key: 'product', label: 'Product', render: (r) => r.product?.productName },
          { key: 'quantity', label: 'Qty' },
          { key: 'deliveryShift', label: 'Shift' },
          { key: 'deliveryStatus', label: 'Status' },
        ]);
        setRows(payload.deliveries || []);
      } else {
        setColumns([
          { key: 'productName', label: 'Product' },
          { key: 'sku', label: 'SKU' },
          { key: 'category', label: 'Category' },
          { key: 'currentStock', label: 'Stock' },
          { key: 'minStockAlertQty', label: 'Min Alert' },
          { key: 'isLowStock', label: 'Low Stock', render: (r) => (r.isLowStock ? 'Yes' : 'No') },
        ]);
        setRows(payload.products || []);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load report');
    }
  };

  const exportCsv = async () => {
    const res = await api.get(tab.endpoint, {
      params: buildParams('csv'),
      responseType: 'blob',
    });
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const a = document.createElement('a');
    a.href = url;
    a.download = `${tab.id}-report.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div>
      <div className="page-header">
        <div><h1>Reports</h1><p>Operational and financial reports</p></div>
        <div className="row-actions">
          <button className="btn btn-outline" onClick={exportCsv}>Export CSV</button>
          <button className="btn btn-primary" onClick={load}>Generate</button>
        </div>
      </div>
      <div className="tabs">
        {tabs.map((t) => (
          <button key={t.id} className={`tab-btn ${tab.id === t.id ? 'active' : ''}`} onClick={() => { setTab(t); setRows([]); setSummary(null); }}>
            {t.label}
          </button>
        ))}
      </div>
      <div className="toolbar">
        {tab.dateParam && <input type="date" className="search-input" value={date} onChange={(e) => setDate(e.target.value)} />}
        {tab.fromTo && (
          <>
            <input type="date" className="search-input" value={from} onChange={(e) => setFrom(e.target.value)} />
            <input type="date" className="search-input" value={to} onChange={(e) => setTo(e.target.value)} />
          </>
        )}
        {tab.monthParam && <input type="month" className="search-input" value={month} onChange={(e) => setMonth(e.target.value)} />}
      </div>
      {error && <div className="alert alert-error">{error}</div>}
      {summary && (
        <div className="panel" style={{ marginBottom: '1rem' }}>
          <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit', color: 'var(--text-muted)' }}>
            {JSON.stringify(
              Object.fromEntries(
                Object.entries(summary).filter(([k, v]) => !Array.isArray(v) && typeof v !== 'object')
              ),
              null,
              2
            )}
          </pre>
        </div>
      )}
      <div className="panel">
        <DataTable columns={columns} rows={rows} emptyMessage="Click Generate to load report data" />
      </div>
    </div>
  );
}
