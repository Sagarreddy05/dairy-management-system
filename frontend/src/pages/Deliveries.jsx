import { useCallback, useEffect, useState } from 'react';
import api from '../api/axios';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import StatusBadge from '../components/StatusBadge';

const empty = {
  customerId: '',
  deliveryDate: new Date().toISOString().slice(0, 10),
  deliveryShift: 'MORNING',
  productId: '',
  quantity: '',
  deliveryStatus: 'PENDING',
};

export default function Deliveries() {
  const [rows, setRows] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [meta, setMeta] = useState({ page: 1, totalPages: 1 });
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(empty);
  const [editId, setEditId] = useState(null);
  const [message, setMessage] = useState('');

  const load = useCallback(async () => {
    const [{ data }, custRes, prodRes] = await Promise.all([
      api.get('/deliveries', { params: { page, limit: 10, search } }),
      api.get('/customers', { params: { limit: 100 } }).catch(() => ({ data: { data: [] } })),
      api.get('/products', { params: { limit: 100 } }).catch(() => ({ data: { data: [] } })),
    ]);
    setRows(data.data);
    setMeta(data.meta || { page: 1, totalPages: 1 });
    setCustomers(custRes.data.data || []);
    setProducts(prodRes.data.data || []);
  }, [page, search]);

  useEffect(() => { load().catch(console.error); }, [load]);

  const openCreate = () => {
    setEditId(null);
    setForm({ ...empty, customerId: customers[0]?.id || '', productId: products[0]?.id || '' });
    setOpen(true);
  };

  const openEdit = (row) => {
    setEditId(row.id);
    setForm({
      customerId: row.customerId,
      deliveryDate: row.deliveryDate.slice(0, 10),
      deliveryShift: row.deliveryShift,
      productId: row.productId,
      quantity: row.quantity,
      deliveryStatus: row.deliveryStatus,
    });
    setOpen(true);
  };

  const save = async (e) => {
    e.preventDefault();
    const payload = { ...form, quantity: Number(form.quantity) };
    if (editId) await api.put(`/deliveries/${editId}`, payload);
    else await api.post('/deliveries', payload);
    setOpen(false);
    load();
  };

  const generate = async () => {
    const { data } = await api.post('/deliveries/generate', { date: new Date().toISOString().slice(0, 10) });
    setMessage(`Generated ${data.data.created} deliveries`);
    load();
  };

  const remove = async (id) => {
    if (!confirm('Delete this delivery?')) return;
    await api.delete(`/deliveries/${id}`);
    load();
  };

  const columns = [
    { key: 'customer', label: 'Customer', render: (r) => r.customer?.customerName },
    { key: 'product', label: 'Product', render: (r) => r.product?.productName },
    { key: 'quantity', label: 'Qty' },
    { key: 'deliveryShift', label: 'Shift' },
    { key: 'deliveryDate', label: 'Date', render: (r) => new Date(r.deliveryDate).toLocaleDateString() },
    { key: 'deliveryStatus', label: 'Status', render: (r) => <StatusBadge status={r.deliveryStatus} /> },
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
        <div><h1>Deliveries</h1><p>Daily route deliveries</p></div>
        <div className="row-actions">
          <button className="btn btn-outline" onClick={generate}>Generate Today</button>
          <button className="btn btn-primary" onClick={openCreate}>Add Delivery</button>
        </div>
      </div>
      {message && <div className="alert alert-success">{message}</div>}
      <div className="toolbar">
        <input className="search-input" placeholder="Search deliveries..." value={search} onChange={(e) => { setPage(1); setSearch(e.target.value); }} />
      </div>
      <div className="panel">
        <DataTable columns={columns} rows={rows} />
        <div className="pagination">
          <button className="btn btn-outline btn-sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Prev</button>
          <span>Page {meta.page} / {meta.totalPages || 1}</span>
          <button className="btn btn-outline btn-sm" disabled={page >= (meta.totalPages || 1)} onClick={() => setPage((p) => p + 1)}>Next</button>
        </div>
      </div>
      <Modal title={editId ? 'Edit Delivery' : 'Add Delivery'} open={open} onClose={() => setOpen(false)}>
        <form onSubmit={save} className="form-grid">
          <div className="form-group"><label>Customer</label>
            <select required value={form.customerId} onChange={(e) => setForm({ ...form, customerId: e.target.value })}>
              <option value="">Select</option>
              {customers.map((c) => <option key={c.id} value={c.id}>{c.customerName}</option>)}
            </select>
          </div>
          <div className="form-group"><label>Product</label>
            <select required value={form.productId} onChange={(e) => setForm({ ...form, productId: e.target.value })}>
              <option value="">Select</option>
              {products.map((p) => <option key={p.id} value={p.id}>{p.productName}</option>)}
            </select>
          </div>
          <div className="form-group"><label>Date</label><input type="date" required value={form.deliveryDate} onChange={(e) => setForm({ ...form, deliveryDate: e.target.value })} /></div>
          <div className="form-group"><label>Shift</label>
            <select value={form.deliveryShift} onChange={(e) => setForm({ ...form, deliveryShift: e.target.value })}>
              <option value="MORNING">MORNING</option>
              <option value="EVENING">EVENING</option>
            </select>
          </div>
          <div className="form-group"><label>Quantity</label><input type="number" step="0.1" required value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} /></div>
          <div className="form-group"><label>Status</label>
            <select value={form.deliveryStatus} onChange={(e) => setForm({ ...form, deliveryStatus: e.target.value })}>
              <option value="PENDING">PENDING</option>
              <option value="DELIVERED">DELIVERED</option>
              <option value="CANCELLED">CANCELLED</option>
            </select>
          </div>
          <div className="form-actions full"><button type="button" className="btn btn-outline" onClick={() => setOpen(false)}>Cancel</button><button className="btn btn-primary" type="submit">Save</button></div>
        </form>
      </Modal>
    </div>
  );
}
