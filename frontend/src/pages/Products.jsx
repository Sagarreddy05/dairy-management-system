import { useCallback, useEffect, useMemo, useState } from 'react';
import api from '../api/axios';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import {
  sanitizeName,
  sanitizeSku,
  sanitizePositiveNumber,
  validateName,
  validateSku,
  validatePrice,
  hasErrors,
} from '../utils/validation';

const empty = {
  productName: '',
  sku: '',
  category: 'MILK',
  unitPrice: '',
  currentStock: '',
  minStockAlertQty: 10,
};

const PLACEHOLDER =
  'data:image/svg+xml,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="84" height="84" viewBox="0 0 84 84"><rect width="84" height="84" rx="10" fill="#e8f5ee"/><text x="42" y="46" text-anchor="middle" fill="#52796f" font-size="11" font-family="sans-serif">No image</text></svg>`
  );

const isAllowedImage = (file) => {
  const okType = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file.type);
  const okSize = file.size <= 5 * 1024 * 1024;
  return okType && okSize;
};

export default function Products() {
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState({ page: 1, totalPages: 1 });
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState(false);
  const [stockOpen, setStockOpen] = useState(false);
  const [form, setForm] = useState(empty);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [stockForm, setStockForm] = useState({ quantityChanged: '', movementType: 'IN', reason: '' });
  const [editId, setEditId] = useState(null);
  const [stockId, setStockId] = useState(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const { data } = await api.get('/products', { params: { page, limit: 10, search } });
    setRows((data.data || []).map((p) => ({
      ...p,
      _rowClass: p.currentStock <= p.minStockAlertQty ? 'low-stock-row' : '',
    })));
    setMeta(data.meta || { page: 1, totalPages: 1 });
  }, [page, search]);

  useEffect(() => { load().catch(console.error); }, [load]);

  const errors = useMemo(
    () => ({
      productName: validateName(form.productName),
      sku: validateSku(form.sku),
      unitPrice: validatePrice(form.unitPrice),
    }),
    [form]
  );
  const invalid = hasErrors(errors);

  const openCreate = () => {
    setEditId(null);
    setForm(empty);
    setImageFile(null);
    setImagePreview('');
    setError('');
    setOpen(true);
  };

  const openEdit = (row) => {
    setEditId(row.id);
    setForm({
      productName: row.productName,
      sku: row.sku,
      category: row.category,
      unitPrice: row.unitPrice,
      currentStock: row.currentStock,
      minStockAlertQty: row.minStockAlertQty,
    });
    setImageFile(null);
    setImagePreview(row.imagePath || '');
    setError('');
    setOpen(true);
  };

  const onPickImage = (file) => {
    if (!file) return;
    if (!isAllowedImage(file)) {
      setError('Image must be JPG, JPEG, PNG, or WEBP and at most 5 MB');
      return;
    }
    setError('');
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const save = async (e) => {
    e.preventDefault();
    if (invalid) return;
    setSaving(true);
    setError('');
    try {
      const fd = new FormData();
      fd.append('productName', form.productName);
      fd.append('sku', form.sku);
      fd.append('category', form.category);
      fd.append('unitPrice', String(form.unitPrice));
      fd.append('currentStock', String(form.currentStock || 0));
      fd.append('minStockAlertQty', String(form.minStockAlertQty || 10));
      if (imageFile) fd.append('image', imageFile);

      if (editId) await api.put(`/products/${editId}`, fd);
      else await api.post('/products', fd);
      setOpen(false);
      load();
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.errors?.[0]?.message || 'Failed to save product');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id) => {
    if (!confirm('Delete this product?')) return;
    await api.delete(`/products/${id}`);
    load();
  };

  const uploadImage = async (id, file) => {
    if (!isAllowedImage(file)) {
      alert('Image must be JPG, JPEG, PNG, or WEBP and at most 5 MB');
      return;
    }
    const fd = new FormData();
    fd.append('image', file);
    try {
      await api.post(`/products/${id}/upload`, fd);
      load();
    } catch (err) {
      alert(err.response?.data?.message || 'S3 upload failed');
    }
  };

  const adjustStock = async (e) => {
    e.preventDefault();
    await api.post(`/products/${stockId}/stock`, {
      ...stockForm,
      quantityChanged: Number(stockForm.quantityChanged),
    });
    setStockOpen(false);
    load();
  };

  const columns = [
    {
      key: 'image',
      label: 'Image',
      render: (r) => (
        <img
          className="thumb"
          src={r.imagePath || PLACEHOLDER}
          alt={r.productName}
          onError={(e) => { e.currentTarget.src = PLACEHOLDER; }}
        />
      ),
    },
    { key: 'productName', label: 'Product' },
    { key: 'sku', label: 'SKU' },
    { key: 'category', label: 'Category' },
    { key: 'unitPrice', label: 'Price', render: (r) => `₹${r.unitPrice}` },
    { key: 'currentStock', label: 'Stock' },
    {
      key: 'actions',
      label: 'Actions',
      render: (r) => (
        <div className="row-actions">
          <button className="btn btn-outline btn-sm" onClick={() => openEdit(r)}>Edit</button>
          <button className="btn btn-outline btn-sm" onClick={() => { setStockId(r.id); setStockForm({ quantityChanged: '', movementType: 'IN', reason: '' }); setStockOpen(true); }}>Stock</button>
          <label className="btn btn-outline btn-sm">
            Image
            <input
              type="file"
              accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
              hidden
              onChange={(e) => e.target.files?.[0] && uploadImage(r.id, e.target.files[0])}
            />
          </label>
          <button className="btn btn-danger btn-sm" onClick={() => remove(r.id)}>Delete</button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="page-header">
        <div><h1>Products</h1><p>Inventory with S3 product images</p></div>
        <button className="btn btn-primary" onClick={openCreate}>Add Product</button>
      </div>
      <div className="toolbar">
        <input className="search-input" placeholder="Search products..." value={search} onChange={(e) => { setPage(1); setSearch(e.target.value); }} />
      </div>
      <div className="panel">
        <DataTable columns={columns} rows={rows} />
        <div className="pagination">
          <button className="btn btn-outline btn-sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Prev</button>
          <span>Page {meta.page} / {meta.totalPages || 1}</span>
          <button className="btn btn-outline btn-sm" disabled={page >= (meta.totalPages || 1)} onClick={() => setPage((p) => p + 1)}>Next</button>
        </div>
      </div>
      <Modal title={editId ? 'Edit Product' : 'Add Product'} open={open} onClose={() => setOpen(false)}>
        <form onSubmit={save} className="form-grid" encType="multipart/form-data">
          {error && <div className="alert alert-error full">{error}</div>}
          <div className="form-group">
            <label>Name</label>
            <input
              required
              value={form.productName}
              onChange={(e) => setForm({ ...form, productName: sanitizeName(e.target.value) })}
            />
            {errors.productName && <small className="field-error">{errors.productName}</small>}
          </div>
          <div className="form-group">
            <label>SKU</label>
            <input
              required
              value={form.sku}
              onChange={(e) => setForm({ ...form, sku: sanitizeSku(e.target.value) })}
            />
            {errors.sku && <small className="field-error">{errors.sku}</small>}
          </div>
          <div className="form-group"><label>Category</label>
            <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
              {['MILK', 'CURD', 'GHEE', 'BUTTER', 'PANEER'].map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Unit Price</label>
            <input
              required
              value={form.unitPrice}
              onChange={(e) => setForm({ ...form, unitPrice: sanitizePositiveNumber(e.target.value) })}
            />
            {errors.unitPrice && <small className="field-error">{errors.unitPrice}</small>}
          </div>
          <div className="form-group">
            <label>Current Stock</label>
            <input
              value={form.currentStock}
              onChange={(e) => setForm({ ...form, currentStock: sanitizePositiveNumber(e.target.value) })}
            />
          </div>
          <div className="form-group">
            <label>Min Alert Qty</label>
            <input
              value={form.minStockAlertQty}
              onChange={(e) => setForm({ ...form, minStockAlertQty: sanitizePositiveNumber(e.target.value) })}
            />
          </div>
          <div className="form-group full">
            <label>Product Image (JPG/PNG/WEBP, max 5 MB)</label>
            <input
              type="file"
              accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
              onChange={(e) => onPickImage(e.target.files?.[0])}
            />
            <img
              className="thumb"
              style={{ marginTop: '0.75rem', width: 84, height: 84 }}
              src={imagePreview || PLACEHOLDER}
              alt="Preview"
              onError={(e) => { e.currentTarget.src = PLACEHOLDER; }}
            />
          </div>
          <div className="form-actions full">
            <button type="button" className="btn btn-outline" onClick={() => setOpen(false)}>Cancel</button>
            <button className="btn btn-primary" type="submit" disabled={saving || invalid}>{saving ? 'Saving...' : 'Save'}</button>
          </div>
        </form>
      </Modal>
      <Modal title="Adjust Stock" open={stockOpen} onClose={() => setStockOpen(false)}>
        <form onSubmit={adjustStock} className="form-grid">
          <div className="form-group"><label>Quantity</label><input type="number" step="0.1" required value={stockForm.quantityChanged} onChange={(e) => setStockForm({ ...stockForm, quantityChanged: e.target.value })} /></div>
          <div className="form-group"><label>Type</label>
            <select value={stockForm.movementType} onChange={(e) => setStockForm({ ...stockForm, movementType: e.target.value })}>
              <option value="IN">IN</option>
              <option value="OUT">OUT</option>
            </select>
          </div>
          <div className="form-group full"><label>Reason</label><input required value={stockForm.reason} onChange={(e) => setStockForm({ ...stockForm, reason: e.target.value })} /></div>
          <div className="form-actions full"><button type="button" className="btn btn-outline" onClick={() => setStockOpen(false)}>Cancel</button><button className="btn btn-primary" type="submit">Apply</button></div>
        </form>
      </Modal>
    </div>
  );
}
 
