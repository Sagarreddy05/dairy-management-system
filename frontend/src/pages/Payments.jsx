import { useCallback, useEffect, useState } from 'react';
import api from '../api/axios';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import StatusBadge from '../components/StatusBadge';

const empty = {
  invoiceId: '',
  amount: '',
  paymentDate: new Date().toISOString().slice(0, 10),
  paymentMethod: 'UPI',
};

export default function Payments() {
  const [rows, setRows] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [meta, setMeta] = useState({ page: 1, totalPages: 1 });
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(empty);

  const load = useCallback(async () => {
    const [{ data }, invRes] = await Promise.all([
      api.get('/payments', { params: { page, limit: 10, search } }),
      api.get('/invoices', { params: { limit: 100 } }),
    ]);
    setRows(data.data);
    setMeta(data.meta || { page: 1, totalPages: 1 });
    setInvoices((invRes.data.data || []).filter((i) => i.paymentStatus !== 'PAID'));
  }, [page, search]);

  useEffect(() => { load().catch(console.error); }, [load]);

  const openCreate = () => {
    setForm({ ...empty, invoiceId: invoices[0]?.id || '' });
    setOpen(true);
  };

  const save = async (e) => {
    e.preventDefault();
    await api.post('/payments', { ...form, amount: Number(form.amount) });
    setOpen(false);
    load();
  };

  const remove = async (id) => {
    if (!confirm('Delete this payment?')) return;
    await api.delete(`/payments/${id}`);
    load();
  };

  const columns = [
    { key: 'invoice', label: 'Invoice', render: (r) => r.invoice?.invoiceNumber },
    { key: 'customer', label: 'Customer', render: (r) => r.invoice?.customer?.customerName },
    { key: 'amount', label: 'Amount', render: (r) => `₹${r.amount}` },
    { key: 'paymentMethod', label: 'Method' },
    { key: 'paymentDate', label: 'Date', render: (r) => new Date(r.paymentDate).toLocaleDateString() },
    { key: 'status', label: 'Invoice Status', render: (r) => <StatusBadge status={r.invoice?.paymentStatus} /> },
    {
      key: 'actions',
      label: 'Actions',
      render: (r) => (
        <button className="btn btn-danger btn-sm" onClick={() => remove(r.id)}>Delete</button>
      ),
    },
  ];

  return (
    <div>
      <div className="page-header">
        <div><h1>Payments</h1><p>Record invoice payments</p></div>
        <button className="btn btn-primary" onClick={openCreate}>Add Payment</button>
      </div>
      <div className="toolbar">
        <input className="search-input" placeholder="Search payments..." value={search} onChange={(e) => { setPage(1); setSearch(e.target.value); }} />
      </div>
      <div className="panel">
        <DataTable columns={columns} rows={rows} />
        <div className="pagination">
          <button className="btn btn-outline btn-sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Prev</button>
          <span>Page {meta.page} / {meta.totalPages || 1}</span>
          <button className="btn btn-outline btn-sm" disabled={page >= (meta.totalPages || 1)} onClick={() => setPage((p) => p + 1)}>Next</button>
        </div>
      </div>
      <Modal title="Record Payment" open={open} onClose={() => setOpen(false)}>
        <form onSubmit={save} className="form-grid">
          <div className="form-group full"><label>Invoice</label>
            <select required value={form.invoiceId} onChange={(e) => setForm({ ...form, invoiceId: e.target.value })}>
              <option value="">Select</option>
              {invoices.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.invoiceNumber} — {i.customer?.customerName} (Bal ₹{i.balanceAmount})
                </option>
              ))}
            </select>
          </div>
          <div className="form-group"><label>Amount</label><input type="number" step="0.01" required value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} /></div>
          <div className="form-group"><label>Date</label><input type="date" required value={form.paymentDate} onChange={(e) => setForm({ ...form, paymentDate: e.target.value })} /></div>
          <div className="form-group"><label>Method</label>
            <select value={form.paymentMethod} onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}>
              <option value="UPI">UPI</option>
              <option value="CASH">CASH</option>
              <option value="CARD">CARD</option>
              <option value="BANK_TRANSFER">BANK_TRANSFER</option>
            </select>
          </div>
          <div className="form-actions full"><button type="button" className="btn btn-outline" onClick={() => setOpen(false)}>Cancel</button><button className="btn btn-primary" type="submit">Save</button></div>
        </form>
      </Modal>
    </div>
  );
}
