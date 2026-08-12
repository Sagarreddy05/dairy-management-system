import { useCallback, useEffect, useState } from 'react';
import api from '../api/axios';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import StatusBadge from '../components/StatusBadge';

const empty = {
  invoiceNumber: '',
  customerId: '',
  billingMonth: new Date().toISOString().slice(0, 7),
  totalAmount: '',
  paidAmount: 0,
};

export default function Invoices() {
  const [rows, setRows] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [meta, setMeta] = useState({ page: 1, totalPages: 1 });
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(empty);
  const [editId, setEditId] = useState(null);
  const [message, setMessage] = useState('');

  const load = useCallback(async () => {
    const [{ data }, custRes] = await Promise.all([
      api.get('/invoices', { params: { page, limit: 10, search } }),
      api.get('/customers', { params: { limit: 100 } }),
    ]);
    setRows(data.data);
    setMeta(data.meta || { page: 1, totalPages: 1 });
    setCustomers(custRes.data.data || []);
  }, [page, search]);

  useEffect(() => { load().catch(console.error); }, [load]);

  const openCreate = () => {
    setEditId(null);
    setForm({ ...empty, customerId: customers[0]?.id || '' });
    setOpen(true);
  };

  const openEdit = (row) => {
    setEditId(row.id);
    setForm({
      invoiceNumber: row.invoiceNumber,
      customerId: row.customerId,
      billingMonth: row.billingMonth,
      totalAmount: row.totalAmount,
      paidAmount: row.paidAmount,
    });
    setOpen(true);
  };

  const save = async (e) => {
    e.preventDefault();
    const payload = {
      ...form,
      totalAmount: Number(form.totalAmount),
      paidAmount: Number(form.paidAmount || 0),
    };
    if (editId) await api.put(`/invoices/${editId}`, payload);
    else await api.post('/invoices', payload);
    setOpen(false);
    load();
  };

  const generate = async () => {
    const billingMonth = new Date().toISOString().slice(0, 7);
    const { data } = await api.post('/invoices/generate', { billingMonth });
    setMessage(`Generated ${data.data.created} invoices for ${billingMonth}`);
    load();
  };

  const remove = async (id) => {
    if (!confirm('Delete this invoice?')) return;
    await api.delete(`/invoices/${id}`);
    load();
  };

  const columns = [
    { key: 'invoiceNumber', label: 'Invoice #' },
    { key: 'customer', label: 'Customer', render: (r) => r.customer?.customerName },
    { key: 'billingMonth', label: 'Month' },
    { key: 'totalAmount', label: 'Total', render: (r) => `₹${r.totalAmount}` },
    { key: 'paidAmount', label: 'Paid', render: (r) => `₹${r.paidAmount}` },
    { key: 'balanceAmount', label: 'Balance', render: (r) => `₹${r.balanceAmount}` },
    { key: 'paymentStatus', label: 'Status', render: (r) => <StatusBadge status={r.paymentStatus} /> },
    {
      key: 'actions',
      label: 'Actions',
      render: (r) => (
        <div className="row-actions">
          <button className="btn btn-outline btn-sm" onClick={() => openEdit(r)}>Edit</button>
          <button className="btn btn-danger btn-sm" onClick={() => remove(r.id)}>Delete</button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="page-header">
        <div><h1>Invoices</h1><p>Monthly customer billing</p></div>
        <div className="row-actions">
          <button className="btn btn-outline" onClick={generate}>Generate Monthly</button>
          <button className="btn btn-primary" onClick={openCreate}>Add Invoice</button>
        </div>
      </div>
      {message && <div className="alert alert-success">{message}</div>}
      <div className="toolbar">
        <input className="search-input" placeholder="Search invoices..." value={search} onChange={(e) => { setPage(1); setSearch(e.target.value); }} />
      </div>
      <div className="panel">
        <DataTable columns={columns} rows={rows} />
        <div className="pagination">
          <button className="btn btn-outline btn-sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Prev</button>
          <span>Page {meta.page} / {meta.totalPages || 1}</span>
          <button className="btn btn-outline btn-sm" disabled={page >= (meta.totalPages || 1)} onClick={() => setPage((p) => p + 1)}>Next</button>
        </div>
      </div>
      <Modal title={editId ? 'Edit Invoice' : 'Add Invoice'} open={open} onClose={() => setOpen(false)}>
        <form onSubmit={save} className="form-grid">
          <div className="form-group"><label>Invoice Number</label><input required value={form.invoiceNumber} onChange={(e) => setForm({ ...form, invoiceNumber: e.target.value })} /></div>
          <div className="form-group"><label>Customer</label>
            <select required value={form.customerId} onChange={(e) => setForm({ ...form, customerId: e.target.value })}>
              <option value="">Select</option>
              {customers.map((c) => <option key={c.id} value={c.id}>{c.customerName}</option>)}
            </select>
          </div>
          <div className="form-group"><label>Billing Month</label><input type="month" required value={form.billingMonth} onChange={(e) => setForm({ ...form, billingMonth: e.target.value })} /></div>
          <div className="form-group"><label>Total Amount</label><input type="number" step="0.01" required value={form.totalAmount} onChange={(e) => setForm({ ...form, totalAmount: e.target.value })} /></div>
          <div className="form-group"><label>Paid Amount</label><input type="number" step="0.01" value={form.paidAmount} onChange={(e) => setForm({ ...form, paidAmount: e.target.value })} /></div>
          <div className="form-actions full"><button type="button" className="btn btn-outline" onClick={() => setOpen(false)}>Cancel</button><button className="btn btn-primary" type="submit">Save</button></div>
        </form>
      </Modal>
    </div>
  );
}
