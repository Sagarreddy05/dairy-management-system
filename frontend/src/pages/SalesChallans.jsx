import { useCallback, useEffect, useMemo, useState } from 'react';
import api from '../api/axios';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import StatusBadge from '../components/StatusBadge';
import { sanitizePositiveInteger, validateQuantity, hasErrors } from '../utils/validation';

const PLACEHOLDER =
  'data:image/svg+xml,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40"><rect width="40" height="40" rx="6" fill="#e8f5ee"/><text x="20" y="24" text-anchor="middle" fill="#52796f" font-size="8" font-family="sans-serif">N/A</text></svg>`
  );

export default function SalesChallans() {
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState({ page: 1, totalPages: 1 });
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [customerId, setCustomerId] = useState('');
  const [productId, setProductId] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [items, setItems] = useState([]);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const { data } = await api.get('/challans', { params: { page, limit: 10, search } });
    setRows(data.data || []);
    setMeta(data.meta || { page: 1, totalPages: 1 });
  }, [page, search]);

  useEffect(() => {
    load().catch((err) => setError(err.response?.data?.message || 'Failed to load challans'));
  }, [load]);

  useEffect(() => {
    Promise.all([
      api.get('/customers', { params: { page: 1, limit: 100 } }),
      api.get('/products', { params: { page: 1, limit: 100 } }),
    ])
      .then(([c, p]) => {
        setCustomers(c.data.data || []);
        setProducts(p.data.data || []);
      })
      .catch(console.error);
  }, []);

  const totalQty = useMemo(() => items.reduce((s, i) => s + Number(i.quantity), 0), [items]);
  const totalAmt = useMemo(() => items.reduce((s, i) => s + Number(i.quantity) * Number(i.unitPrice), 0), [items]);

  const formValid = Boolean(customerId) && items.length > 0 && !hasErrors(fieldErrors);

  const openCreate = () => {
    setCustomerId('');
    setProductId('');
    setQuantity('1');
    setItems([]);
    setError('');
    setFieldErrors({});
    setOpen(true);
  };

  const addItem = () => {
    const qtyError = validateQuantity(quantity);
    if (!productId) {
      setFieldErrors({ productId: 'Select a product', quantity: qtyError });
      return;
    }
    if (qtyError) {
      setFieldErrors({ productId: '', quantity: qtyError });
      return;
    }
    const product = products.find((p) => p.id === productId);
    if (!product) return;
    setFieldErrors({});
    setItems((prev) => {
      const existing = prev.find((i) => i.productId === productId);
      if (existing) {
        return prev.map((i) =>
          i.productId === productId
            ? { ...i, quantity: Number(i.quantity) + Number(quantity) }
            : i
        );
      }
      return [
        ...prev,
        {
          productId: product.id,
          productName: product.productName,
          productSku: product.sku,
          unitPrice: product.unitPrice,
          imageUrl: product.imagePath,
          currentStock: product.currentStock,
          quantity: Number(quantity),
        },
      ];
    });
    setQuantity('1');
  };

  const removeItem = (id) => setItems((prev) => prev.filter((i) => i.productId !== id));

  const updateItemQty = (id, value) => {
    const cleaned = sanitizePositiveInteger(value);
    setItems((prev) =>
      prev.map((i) => (i.productId === id ? { ...i, quantity: cleaned === '' ? '' : Number(cleaned) } : i))
    );
  };

  const save = async (status) => {
    if (!formValid) return;
    const invalidQty = items.some((i) => validateQuantity(i.quantity));
    if (invalidQty) {
      setError('All item quantities must be positive integers');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await api.post('/challans', {
        customerId,
        status,
        items: items.map((i) => ({ productId: i.productId, quantity: Number(i.quantity) })),
      });
      setOpen(false);
      load();
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.errors?.[0]?.message ||
        'Failed to save challan';
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  const confirmRow = async (id) => {
    try {
      await api.post(`/challans/${id}/confirm`);
      load();
    } catch (err) {
      alert(err.response?.data?.message || 'Confirm failed');
    }
  };

  const cancelRow = async (id) => {
    if (!confirm('Cancel this draft challan?')) return;
    try {
      await api.post(`/challans/${id}/cancel`);
      load();
    } catch (err) {
      alert(err.response?.data?.message || 'Cancel failed');
    }
  };

  const columns = [
    { key: 'challanNumber', label: 'Challan #' },
    { key: 'customer', label: 'Customer', render: (r) => r.customer?.customerName },
    { key: 'totalQuantity', label: 'Total Qty' },
    {
      key: 'totalAmount',
      label: 'Amount',
      render: (r) => `₹${Number(r.totalAmount).toFixed(2)}`,
    },
    { key: 'status', label: 'Status', render: (r) => <StatusBadge status={r.status} /> },
    { key: 'creator', label: 'Created By', render: (r) => r.creator?.name },
    {
      key: 'createdAt',
      label: 'Date',
      render: (r) => new Date(r.createdAt).toLocaleString(),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (r) =>
        r.status === 'DRAFT' ? (
          <div className="row-actions">
            <button className="btn btn-primary btn-sm" onClick={() => confirmRow(r.id)}>Confirm</button>
            <button className="btn btn-outline btn-sm" onClick={() => cancelRow(r.id)}>Cancel</button>
          </div>
        ) : (
          <span className="muted">—</span>
        ),
    },
  ];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Sales Challans</h1>
          <p>Create draft or confirmed delivery challans</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>New Challan</button>
      </div>
      {error && !open && <div className="alert alert-error">{error}</div>}
      <div className="toolbar">
        <input
          className="search-input"
          placeholder="Search challans..."
          value={search}
          onChange={(e) => {
            setPage(1);
            setSearch(e.target.value);
          }}
        />
      </div>
      <div className="panel">
        <DataTable columns={columns} rows={rows} />
        <div className="pagination">
          <button className="btn btn-outline btn-sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Prev</button>
          <span>Page {meta.page} / {meta.totalPages || 1}</span>
          <button className="btn btn-outline btn-sm" disabled={page >= (meta.totalPages || 1)} onClick={() => setPage((p) => p + 1)}>Next</button>
        </div>
      </div>

      <Modal title="Create Sales Challan" open={open} onClose={() => setOpen(false)} wide>
        {error && <div className="alert alert-error">{error}</div>}
        <div className="form-grid">
          <div className="form-group full">
            <label>Customer</label>
            <select value={customerId} onChange={(e) => setCustomerId(e.target.value)}>
              <option value="">Select customer</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.customerName} ({c.mobileNumber})
                </option>
              ))}
            </select>
            {!customerId && <small className="field-error">Customer is required</small>}
          </div>

          <div className="form-group">
            <label>Product</label>
            <select value={productId} onChange={(e) => setProductId(e.target.value)}>
              <option value="">Select product</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.productName} — stock {p.currentStock}
                </option>
              ))}
            </select>
            {fieldErrors.productId && <small className="field-error">{fieldErrors.productId}</small>}
          </div>
          <div className="form-group">
            <label>Quantity</label>
            <input
              value={quantity}
              onChange={(e) => {
                const v = sanitizePositiveInteger(e.target.value);
                setQuantity(v);
                setFieldErrors((prev) => ({ ...prev, quantity: validateQuantity(v || '0') }));
              }}
            />
            {fieldErrors.quantity && <small className="field-error">{fieldErrors.quantity}</small>}
          </div>
          <div className="form-actions full">
            <button type="button" className="btn btn-outline" onClick={addItem}>Add Item</button>
          </div>
        </div>

        <div className="panel" style={{ marginTop: 12 }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Img</th>
                <th>Product</th>
                <th>SKU</th>
                <th>Price</th>
                <th>Qty</th>
                <th>Line</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr><td colSpan="7">No items added</td></tr>
              ) : (
                items.map((i) => (
                  <tr key={i.productId}>
                    <td>
                      <img
                        src={i.imageUrl || PLACEHOLDER}
                        alt=""
                        width="36"
                        height="36"
                        style={{ borderRadius: 6, objectFit: 'cover' }}
                        onError={(e) => { e.currentTarget.src = PLACEHOLDER; }}
                      />
                    </td>
                    <td>{i.productName}</td>
                    <td>{i.productSku}</td>
                    <td>₹{Number(i.unitPrice).toFixed(2)}</td>
                    <td>
                      <input
                        style={{ width: 72 }}
                        value={i.quantity}
                        onChange={(e) => updateItemQty(i.productId, e.target.value)}
                      />
                    </td>
                    <td>₹{(Number(i.quantity || 0) * Number(i.unitPrice)).toFixed(2)}</td>
                    <td>
                      <button type="button" className="btn btn-danger btn-sm" onClick={() => removeItem(i.productId)}>Remove</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          <div className="toolbar" style={{ justifyContent: 'flex-end', gap: 16 }}>
            <strong>Total Qty: {totalQty}</strong>
            <strong>Total Amount: ₹{totalAmt.toFixed(2)}</strong>
          </div>
        </div>

        <div className="form-actions" style={{ marginTop: 16 }}>
          <button type="button" className="btn btn-outline" onClick={() => setOpen(false)}>Close</button>
          <button type="button" className="btn btn-outline" disabled={!formValid || saving} onClick={() => save('DRAFT')}>
            Save Draft
          </button>
          <button type="button" className="btn btn-primary" disabled={!formValid || saving} onClick={() => save('CONFIRMED')}>
            Confirm
          </button>
        </div>
      </Modal>
    </div>
  );
}
 
