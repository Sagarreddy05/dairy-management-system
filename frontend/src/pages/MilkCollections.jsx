import { useCallback, useEffect, useState } from 'react';
import api from '../api/axios';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';

const empty = {
  farmerId: '',
  collectionDate: new Date().toISOString().slice(0, 10),
  milkType: 'COW',
  quantityLiters: '',
  fatPercentage: '',
  ratePerLiter: '',
};

export default function MilkCollections() {
  const [rows, setRows] = useState([]);
  const [farmers, setFarmers] = useState([]);
  const [meta, setMeta] = useState({ page: 1, totalPages: 1 });
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(empty);
  const [editId, setEditId] = useState(null);

  const load = useCallback(async () => {
    const [{ data }, farmersRes] = await Promise.all([
      api.get('/milk-collections', { params: { page, limit: 10, search } }),
      api.get('/farmers', { params: { limit: 100 } }),
    ]);
    setRows(data.data);
    setMeta(data.meta || { page: 1, totalPages: 1 });
    setFarmers(farmersRes.data.data || []);
  }, [page, search]);

  useEffect(() => {
    load().catch(console.error);
  }, [load]);

  const openCreate = () => {
    setEditId(null);
    setForm({ ...empty, farmerId: farmers[0]?.id || '' });
    setOpen(true);
  };

  const openEdit = (row) => {
    setEditId(row.id);
    setForm({
      farmerId: row.farmerId,
      collectionDate: row.collectionDate.slice(0, 10),
      milkType: row.milkType,
      quantityLiters: row.quantityLiters,
      fatPercentage: row.fatPercentage,
      ratePerLiter: row.ratePerLiter,
    });
    setOpen(true);
  };

  const save = async (e) => {
    e.preventDefault();
    const payload = {
      ...form,
      quantityLiters: Number(form.quantityLiters),
      fatPercentage: Number(form.fatPercentage),
      ratePerLiter: Number(form.ratePerLiter),
    };
    if (editId) await api.put(`/milk-collections/${editId}`, payload);
    else await api.post('/milk-collections', payload);
    setOpen(false);
    load();
  };

  const remove = async (id) => {
    if (!confirm('Delete this collection?')) return;
    await api.delete(`/milk-collections/${id}`);
    load();
  };

  const columns = [
    { key: 'farmer', label: 'Farmer', render: (r) => r.farmer?.farmerName },
    { key: 'milkType', label: 'Type' },
    { key: 'quantityLiters', label: 'Liters' },
    { key: 'fatPercentage', label: 'Fat %' },
    { key: 'ratePerLiter', label: 'Rate', render: (r) => `₹${r.ratePerLiter}` },
    { key: 'totalAmount', label: 'Total', render: (r) => `₹${r.totalAmount}` },
    { key: 'collectionDate', label: 'Date', render: (r) => new Date(r.collectionDate).toLocaleDateString() },
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
        <div><h1>Milk Collections</h1><p>Record daily milk intake</p></div>
        <button className="btn btn-primary" onClick={openCreate}>Add Collection</button>
      </div>
      <div className="toolbar">
        <input className="search-input" placeholder="Search by farmer..." value={search} onChange={(e) => { setPage(1); setSearch(e.target.value); }} />
      </div>
      <div className="panel">
        <DataTable columns={columns} rows={rows} />
        <div className="pagination">
          <button className="btn btn-outline btn-sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Prev</button>
          <span>Page {meta.page} / {meta.totalPages || 1}</span>
          <button className="btn btn-outline btn-sm" disabled={page >= (meta.totalPages || 1)} onClick={() => setPage((p) => p + 1)}>Next</button>
        </div>
      </div>
      <Modal title={editId ? 'Edit Collection' : 'Add Collection'} open={open} onClose={() => setOpen(false)}>
        <form onSubmit={save} className="form-grid">
          <div className="form-group"><label>Farmer</label>
            <select required value={form.farmerId} onChange={(e) => setForm({ ...form, farmerId: e.target.value })}>
              <option value="">Select</option>
              {farmers.map((f) => <option key={f.id} value={f.id}>{f.farmerName}</option>)}
            </select>
          </div>
          <div className="form-group"><label>Date</label><input type="date" required value={form.collectionDate} onChange={(e) => setForm({ ...form, collectionDate: e.target.value })} /></div>
          <div className="form-group"><label>Milk Type</label>
            <select value={form.milkType} onChange={(e) => setForm({ ...form, milkType: e.target.value })}>
              <option value="COW">COW</option>
              <option value="BUFFALO">BUFFALO</option>
            </select>
          </div>
          <div className="form-group"><label>Quantity (L)</label><input type="number" step="0.1" required value={form.quantityLiters} onChange={(e) => setForm({ ...form, quantityLiters: e.target.value })} /></div>
          <div className="form-group"><label>Fat %</label><input type="number" step="0.1" required value={form.fatPercentage} onChange={(e) => setForm({ ...form, fatPercentage: e.target.value })} /></div>
          <div className="form-group"><label>Rate / Liter</label><input type="number" step="0.1" required value={form.ratePerLiter} onChange={(e) => setForm({ ...form, ratePerLiter: e.target.value })} /></div>
          <div className="form-actions full"><button type="button" className="btn btn-outline" onClick={() => setOpen(false)}>Cancel</button><button className="btn btn-primary" type="submit">Save</button></div>
        </form>
      </Modal>
    </div>
  );
}
