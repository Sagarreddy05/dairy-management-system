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
  farmerName: '',
  mobileNumber: '',
  village: '',
  address: '',
  cattleCount: 0,
  status: 'ACTIVE',
};

export default function Farmers() {
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState({ page: 1, totalPages: 1 });
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(empty);
  const [editId, setEditId] = useState(null);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  const load = useCallback(async () => {
    const { data } = await api.get('/farmers', { params: { page, limit: 10, search } });
    setRows(data.data);
    setMeta(data.meta || { page: 1, totalPages: 1 });
  }, [page, search]);

  useEffect(() => {
    load().catch((err) => setError(err.response?.data?.message || 'Failed to load'));
  }, [load]);

  const errors = useMemo(
    () => ({
      farmerName: validateName(form.farmerName),
      mobileNumber: validateMobile(form.mobileNumber),
      village: form.village.trim() ? '' : 'Village is required',
      address: form.address.trim() ? '' : 'Address is required',
    }),
    [form]
  );

  const invalid = hasErrors(errors);

  const openCreate = () => {
    setEditId(null);
    setForm(empty);
    setFieldErrors({});
    setOpen(true);
  };

  const openEdit = (row) => {
    setEditId(row.id);
    setForm({
      farmerName: row.farmerName,
      mobileNumber: row.mobileNumber,
      village: row.village,
      address: row.address,
      cattleCount: row.cattleCount,
      status: row.status,
    });
    setFieldErrors({});
    setOpen(true);
  };

  const save = async (e) => {
    e.preventDefault();
    setFieldErrors(errors);
    if (invalid) return;
    const payload = { ...form, cattleCount: Number(form.cattleCount) };
    try {
      if (editId) await api.put(`/farmers/${editId}`, payload);
      else await api.post('/farmers', payload);
      setOpen(false);
      load();
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.errors?.[0]?.message || 'Save failed');
    }
  };

  const remove = async (id) => {
    if (!confirm('Deactivate this farmer?')) return;
    await api.delete(`/farmers/${id}`);
    load();
  };

  const columns = [
    { key: 'farmerName', label: 'Name' },
    { key: 'mobileNumber', label: 'Mobile' },
    { key: 'village', label: 'Village' },
    { key: 'cattleCount', label: 'Cattle' },
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
        <div>
          <h1>Farmers</h1>
          <p>Manage milk suppliers</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>Add Farmer</button>
      </div>
      {error && <div className="alert alert-error">{error}</div>}
      <div className="toolbar">
        <input className="search-input" placeholder="Search farmers..." value={search} onChange={(e) => { setPage(1); setSearch(e.target.value); }} />
      </div>
      <div className="panel">
        <DataTable columns={columns} rows={rows} />
        <div className="pagination">
          <button className="btn btn-outline btn-sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Prev</button>
          <span>Page {meta.page} / {meta.totalPages || 1}</span>
          <button className="btn btn-outline btn-sm" disabled={page >= (meta.totalPages || 1)} onClick={() => setPage((p) => p + 1)}>Next</button>
        </div>
      </div>
      <Modal title={editId ? 'Edit Farmer' : 'Add Farmer'} open={open} onClose={() => setOpen(false)}>
        <form onSubmit={save} className="form-grid">
          <div className="form-group">
            <label>Name</label>
            <input
              required
              value={form.farmerName}
              onChange={(e) => setForm({ ...form, farmerName: sanitizeName(e.target.value) })}
            />
            {(fieldErrors.farmerName || errors.farmerName) && open && (
              <small className="field-error">{fieldErrors.farmerName || errors.farmerName}</small>
            )}
          </div>
          <div className="form-group">
            <label>Mobile</label>
            <input
              required
              value={form.mobileNumber}
              onChange={(e) => setForm({ ...form, mobileNumber: sanitizeMobile(e.target.value) })}
              inputMode="numeric"
            />
            {(fieldErrors.mobileNumber || errors.mobileNumber) && (
              <small className="field-error">{fieldErrors.mobileNumber || errors.mobileNumber}</small>
            )}
          </div>
          <div className="form-group">
            <label>Village</label>
            <input required value={form.village} onChange={(e) => setForm({ ...form, village: e.target.value })} />
            {errors.village && <small className="field-error">{errors.village}</small>}
          </div>
          <div className="form-group">
            <label>Cattle Count</label>
            <input type="number" min="0" value={form.cattleCount} onChange={(e) => setForm({ ...form, cattleCount: e.target.value })} />
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
 
