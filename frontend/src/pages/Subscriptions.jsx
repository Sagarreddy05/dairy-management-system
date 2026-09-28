import { useCallback, useEffect, useState } from 'react';
import api from '../api/axios';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import StatusBadge from '../components/StatusBadge';

const empty = {
  customerId: '',
  milkType: 'COW',
  quantityPerDay: '',
  deliveryShift: 'MORNING',
  startDate: new Date().toISOString().slice(0, 10),
  status: 'ACTIVE',
};

export default function Subscriptions() {
  const [rows, setRows] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [meta, setMeta] = useState({ page: 1, totalPages: 1 });
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(empty);
  const [editId, setEditId] = useState(null);

  const load = useCallback(async () => {
    const [{ data }, custRes] = await Promise.all([
      api.get('/subscriptions', { params: { page, limit: 10, search } }),
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
      customerId: row.customerId,
      milkType: row.milkType,
      quantityPerDay: row.quantityPerDay,
      deliveryShift: row.deliveryShift,
      startDate: row.startDate.slice(0, 10),
      status: row.status,
    });
    setOpen(true);
  };

  const save = async (e) => {
    e.preventDefault();
    const payload = { ...form, quantityPerDay: Number(form.quantityPerDay) };
    if (editId) await api.put(`/subscriptions/${editId}`, payload);
    else await api.post('/subscriptions', payload);
    setOpen(false);
    load();
  };

  const remove = async (id) => {
    if (!confirm('Deactivate this subscription?')) return;
    await api.delete(`/subscriptions/${id}`);
    load();
  };

  const columns = [
    { key: 'customer', label: 'Customer', render: (r) => r.customer?.customerName },
    { key: 'milkType', label: 'Milk Type' },
    { key: 'quantityPerDay', label: 'Qty/Day' },
    { key: 'deliveryShift', label: 'Shift' },
    { key: 'startDate', label: 'Start', render: (r) => new Date(r.startDate).toLocaleDateString() },
    { key: 'status', label: 'Status', render: (r) => <StatusBadge status={r.status} /> },
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
        <div><h1>Subscriptions</h1><p>Daily milk delivery plans</p></div>
        <button className="btn btn-primary" onClick={openCreate}>Add Subscription</button>
      </div>
      <div className="toolbar">
        <input className="search-input" placeholder="Search subscriptions..." value={search} onChange={(e) => { setPage(1); setSearch(e.target.value); }} />
      </div>
      <div className="panel">
        <DataTable columns={columns} rows={rows} />
        <div className="pagination">
          <button className="btn btn-outline btn-sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Prev</button>
          <span>Page {meta.page} / {meta.totalPages || 1}</span>
          <button className="btn btn-outline btn-sm" disabled={page >= (meta.totalPages || 1)} onClick={() => setPage((p) => p + 1)}>Next</button>
        </div>
      </div>
      <Modal title={editId ? 'Edit Subscription' : 'Add Subscription'} open={open} onClose={() => setOpen(false)}>
        <form onSubmit={save} className="form-grid">
          <div className="form-group"><label>Customer</label>
            <select required value={form.customerId} onChange={(e) => setForm({ ...form, customerId: e.target.value })}>
              <option value="">Select</option>
              {customers.map((c) => <option key={c.id} value={c.id}>{c.customerName}</option>)}
            </select>
          </div>
          <div className="form-group"><label>Milk Type</label>
            <select value={form.milkType} onChange={(e) => setForm({ ...form, milkType: e.target.value })}>
              <option value="COW">COW</option>
              <option value="BUFFALO">BUFFALO</option>
            </select>
          </div>
          <div className="form-group"><label>Qty / Day</label><input type="number" step="0.1" required value={form.quantityPerDay} onChange={(e) => setForm({ ...form, quantityPerDay: e.target.value })} /></div>
          <div className="form-group"><label>Shift</label>
            <select value={form.deliveryShift} onChange={(e) => setForm({ ...form, deliveryShift: e.target.value })}>
              <option value="MORNING">MORNING</option>
              <option value="EVENING">EVENING</option>
            </select>
          </div>
          <div className="form-group"><label>Start Date</label><input type="date" required value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} /></div>
          <div className="form-group"><label>Status</label>
            <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              <option value="ACTIVE">ACTIVE</option>
              <option value="INACTIVE">INACTIVE</option>
            </select>
          </div>
          <div className="form-actions full"><button type="button" className="btn btn-outline" onClick={() => setOpen(false)}>Cancel</button><button className="btn btn-primary" type="submit">Save</button></div>
        </form>
      </Modal>
    </div>
  );
}
 
