import { useState, useEffect } from 'react';
import Icon from '../components/Icon';
import { tokens as T } from '../design/tokens';
import toast from 'react-hot-toast';

const API_URL = `http://${window.location.hostname}:5050`;

const CATEGORIES = ['All', 'Grocery', 'Beverage', 'Dairy', 'Personal Care', 'Household', 'Snacks'];

const EMPTY_FORM = { name: '', sku: '', barcode: '', price: '', tax: '5', stock: '', category: 'Grocery' };

export default function Products() {
  const [products, setProducts] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState('');
  const [catFilter,setCatFilter] = useState('All');
  const [showAdd,  setShowAdd]  = useState(false);
  const [form,     setForm]     = useState(EMPTY_FORM);
  const [saving,   setSaving]   = useState(false);

  const load = () => {
    setLoading(true);
    fetch(`${API_URL}/api/products`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    })
      .then(r => r.ok ? r.json() : [])
      .then(d => { setProducts(d || []); setLoading(false); })
      .catch(() => setLoading(false));
  };
  useEffect(load, []);

  const filtered = products.filter(p =>
    (catFilter === 'All' || p.category === catFilter) &&
    (!search || p.name?.toLowerCase().includes(search.toLowerCase()) || p.sku?.toLowerCase().includes(search.toLowerCase()))
  );

  const handleSave = async () => {
    if (!form.name || !form.price) { toast.error('Name and price are required'); return; }
    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/api/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify({ ...form, price: parseFloat(form.price), tax: parseFloat(form.tax), stock: parseInt(form.stock) || 0 }),
      });
      if (res.ok) { toast.success('Product added!'); setShowAdd(false); setForm(EMPTY_FORM); load(); }
      else { const e = await res.json(); toast.error(e.error || 'Failed to save'); }
    } catch { toast.error('Network error'); }
    setSaving(false);
  };

  const stockColor = (stock) => stock < 10 ? T.colors.danger : stock < 25 ? T.colors.warning : T.colors.success;
  const stockBadge = (stock) => stock < 10 ? 'orbx-badge-danger' : stock < 25 ? 'orbx-badge-warning' : 'orbx-badge-success';
  const stockLabel = (stock) => stock < 10 ? 'Critical' : stock < 25 ? 'Low Stock' : 'In Stock';

  return (
    <div className="orbx-page-enter" style={{ padding: 24 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 2 }}>Product Master</h2>
          <p style={{ fontSize: 12, color: T.colors.textMuted }}>{products.length} products across {CATEGORIES.length - 1} categories</p>
        </div>
        <button className="orbx-btn orbx-btn-primary" onClick={() => setShowAdd(true)}>
          <Icon name="plus" size={14} /> Add Product
        </button>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: '1 1 250px' }}>
          <div style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }}>
            <Icon name="search" size={14} color={T.colors.textMuted} />
          </div>
          <input className="orbx-input" style={{ paddingLeft: 32 }} placeholder="Search products..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {CATEGORIES.map(c => (
            <button key={c} onClick={() => setCatFilter(c)} className={`orbx-btn ${catFilter === c ? 'orbx-btn-primary' : 'orbx-btn-secondary'}`} style={{ padding: '7px 12px', fontSize: 12 }}>{c}</button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="orbx-card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: T.colors.textMuted }}>
            <div className="orbx-spin" style={{ width: 32, height: 32, border: `3px solid ${T.colors.border}`, borderTopColor: T.colors.accent, borderRadius: '50%', margin: '0 auto 12px' }} />
            Loading products...
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: T.colors.bgMuted }}>
                {['Product', 'SKU / Barcode', 'Category', 'Price', 'Tax', 'Stock', 'Status', ''].map(h => (
                  <th key={h} style={{ padding: '11px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: T.colors.textMuted, letterSpacing: '0.5px', textTransform: 'uppercase', borderBottom: `1px solid ${T.colors.border}`, whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={8} style={{ textAlign: 'center', padding: '40px', color: T.colors.textMuted, fontSize: 14 }}>No products found</td></tr>
              ) : filtered.map(p => (
                <tr key={p.id} className="orbx-table-row">
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ fontSize: 13.5, fontWeight: 600 }}>{p.name}</div>
                    <div style={{ fontSize: 11, color: T.colors.textMuted }}>{p.id}</div>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ fontSize: 12, fontWeight: 500 }}>{p.sku}</div>
                    <div style={{ fontSize: 10, color: T.colors.textMuted, fontFamily: 'monospace' }}>{p.barcode}</div>
                  </td>
                  <td style={{ padding: '12px 16px' }}><span className="orbx-badge orbx-badge-neutral">{p.category}</span></td>
                  <td style={{ padding: '12px 16px', fontSize: 14, fontWeight: 700 }}>₹{parseFloat(p.price || 0).toLocaleString()}</td>
                  <td style={{ padding: '12px 16px' }}><span className="orbx-badge orbx-badge-info">{p.tax || 0}%</span></td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: stockColor(p.stock || 0) }}>{p.stock ?? '—'}</span>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span className={`orbx-badge ${stockBadge(p.stock || 0)}`}>{stockLabel(p.stock || 0)}</span>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="orbx-btn orbx-btn-secondary" style={{ padding: '4px 10px', fontSize: 11 }}>Edit</button>
                      <button className="orbx-btn orbx-btn-danger" style={{ padding: '4px 10px', fontSize: 11 }}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Add Product Modal */}
      {showAdd && (
        <div className="orbx-modal-overlay">
          <div className="orbx-modal" style={{ maxWidth: 500, padding: 28 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
              <h3 style={{ fontSize: 17, fontWeight: 700 }}>Add New Product</h3>
              <button onClick={() => setShowAdd(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><Icon name="x" size={20} /></button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {[
                { label: 'Product Name', key: 'name', ph: 'Full product name', span: 2 },
                { label: 'SKU',          key: 'sku',  ph: 'e.g. RICE-BAS-5K' },
                { label: 'Barcode',      key: 'barcode', ph: '13-digit barcode' },
                { label: 'Price (₹)',    key: 'price', ph: '0.00', type: 'number' },
                { label: 'Tax %',        key: 'tax',   ph: '0 / 5 / 12 / 18 / 28', type: 'number' },
                { label: 'Stock Qty',    key: 'stock', ph: '0', type: 'number' },
              ].map(f => (
                <div key={f.key} style={f.span ? { gridColumn: `span ${f.span}` } : {}}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: T.colors.textMid, marginBottom: 5, display: 'block' }}>{f.label}</label>
                  <input className="orbx-input" type={f.type || 'text'} placeholder={f.ph} value={form[f.key]} onChange={e => setForm(v => ({ ...v, [f.key]: e.target.value }))} />
                </div>
              ))}
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: T.colors.textMid, marginBottom: 5, display: 'block' }}>Category</label>
                <select className="orbx-input orbx-select" value={form.category} onChange={e => setForm(v => ({ ...v, category: e.target.value }))}>
                  {CATEGORIES.filter(c => c !== 'All').map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 20 }}>
              <button className="orbx-btn orbx-btn-secondary" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setShowAdd(false)}>Cancel</button>
              <button className="orbx-btn orbx-btn-primary" style={{ flex: 1, justifyContent: 'center' }} onClick={handleSave} disabled={saving}>
                {saving ? 'Saving...' : 'Save Product'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
