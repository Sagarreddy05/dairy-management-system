import { useCallback, useEffect, useMemo, useState } from 'react';
import api from '../api/axios';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import StatusBadge from '../components/StatusBadge';
import {
  sanitizeMobile,
  sanitizeName,
  validateMobile,
  validateName,
  hasErrors,
} from '../utils/validation';

const empty = {
  customerName: '',
  mobileNumber: '',
  address: '',
  area: '',
  customerType: 'HOME',
  status: 'ACTIVE',
};

export default function Customers() {
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState({ page: 1, totalPages: 1 });
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(empty);
  const [editId, setEditId] = useState(null);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    const { data } = await api.get('/customers', { params: { page, limit: 10, search } });
    setRows(data.data);
    setMeta(data.meta || { page: 1, totalPages: 1 });
  }, [page, search]);

  useEffect(() => { load().catch(console.error); }, [load]);

  const errors = useMemo(
    () => ({
      customerName: validateName(form.customerName),
      mobileNumber: validateMobile(form.mobileNumber),
      area: form.area.trim() ? '' : 'Area is required',
      address: form.address.trim() ? '' : 'Address is required',
    }),
    [form]
  );
  const invalid = hasErrors(errors);

  const openCreate = () => { setEditId(null); setForm(empty); setOpen(true); };
  const openEdit = (row) => {
    setEditId(row.id);
    setForm({
      customerName: row.customerName,
      mobileNumber: row.mobileNumber,
      address: row.address,
      area: row.area,
      customerType: row.customerType,
      status: row.status,
    });
    setOpen(true);
  };

  const save = async (e) => {
    e.preventDefault();
    if (invalid) return;
    try {
      if (editId) await api.put(`/customers/${editId}`, form);
      else await api.post('/customers', form);
      setOpen(false);
      load();
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.errors?.[0]?.message || 'Save failed');
    }
  };

  const remove = async (id) => {
    if (!confirm('Deactivate this customer?')) return;
    await api.delete(`/customers/${id}`);
    load();
  };

  const columns = [
    { key: 'customerName', label: 'Name' },
    { key: 'mobileNumber', label: 'Mobile' },
    { key: 'area', label: 'Area' },
    { key: 'customerType', label: 'Type' },
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
        <div><h1>Customers</h1><p>Home, shop and hotel accounts</p></div>
        <button className="btn btn-primary" onClick={openCreate}>Add Customer</button>
      </div>
      {error && <div className="alert alert-error">{error}</div>}
      <div className="toolbar">
        <input className="search-input" placeholder="Search customers..." value={search} onChange={(e) => { setPage(1); setSearch(e.target.value); }} />
      </div>
      <div className="panel">
        <DataTable columns={columns} rows={rows} />
        <div className="pagination">
          <button className="btn btn-outline btn-sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Prev</button>
          <span>Page {meta.page} / {meta.totalPages || 1}</span>
          <button className="btn btn-outline btn-sm" disabled={page >= (meta.totalPages || 1)} onClick={() => setPage((p) => p + 1)}>Next</button>
        </div>
      </div>
      <Modal title={editId ? 'Edit Customer' : 'Add Customer'} open={open} onClose={() => setOpen(false)}>
        <form onSubmit={save} className="form-grid">
          <div className="form-group">
            <label>Name</label>
            <input
              required
              value={form.customerName}
              onChange={(e) => setForm({ ...form, customerName: sanitizeName(e.target.value) })}
            />
            {errors.customerName && <small className="field-error">{errors.customerName}</small>}
          </div>
          <div className="form-group">
            <label>Mobile</label>
            <input
              required
              value={form.mobileNumber}
              onChange={(e) => setForm({ ...form, mobileNumber: sanitizeMobile(e.target.value) })}
              inputMode="numeric"
            />
            {errors.mobileNumber && <small className="field-error">{errors.mobileNumber}</small>}
          </div>
          <div className="form-group">
            <label>Area</label>
            <input required value={form.area} onChange={(e) => setForm({ ...form, area: e.target.value })} />
            {errors.area && <small className="field-error">{errors.area}</small>}
          </div>
          <div className="form-group">
            <label>Type</label>
            <select value={form.customerType} onChange={(e) => setForm({ ...form, customerType: e.target.value })}>
              <option value="HOME">HOME</option>
              <option value="SHOP">SHOP</option>
              <option value="HOTEL">HOTEL</option>
            </select>
          </div>
          <div className="form-group full">
            <label>Address</label>
            <textarea required rows="2" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
            {errors.address && <small className="field-error">{errors.address}</small>}
          </div>
          <div className="form-group">
            <label>Status</label>
            <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              <option value="ACTIVE">ACTIVE</option>
              <option value="INACTIVE">INACTIVE</option>
            </select>
          </div>
          <div className="form-actions full">
            <button type="button" className="btn btn-outline" onClick={() => setOpen(false)}>Cancel</button>
            <button className="btn btn-primary" type="submit" disabled={invalid}>Save</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
