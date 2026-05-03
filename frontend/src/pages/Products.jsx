import React, { useState, useEffect } from 'react';
import Icon from '../components/Icon';
import { tokens as T } from '../design/tokens';
import toast from 'react-hot-toast';

const API_URL = '/api';

const EMPTY_FORM = { name: '', sku: '', barcode: '', price: '', tax: '5', stock: '', category_id: '' };

const SectionHeader = ({ title, subtitle, action }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 24 }}>
    <div>
      <h3 style={{ fontSize: 18, fontWeight: 800, color: T.colors.text }}>{title}</h3>
      <p style={{ fontSize: 13, color: T.colors.textMuted, marginTop: 2 }}>{subtitle}</p>
    </div>
    {action && action}
  </div>
);

export default function Products() {
  const [activeTab, setActiveTab] = useState('products');
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState('');
  const [catFilter,setCatFilter] = useState('All');
  
  // Product Modals
  const [showAdd,  setShowAdd]  = useState(false);
  const [form,     setForm]     = useState(EMPTY_FORM);
  const [saving,   setSaving]   = useState(false);

  // Category Modals & Breadcrumbs
  const [showCatModal, setShowCatModal] = useState(false);
  const [editingCat, setEditingCat] = useState(null);
  const [categoryPath, setCategoryPath] = useState([]); // Array of {id, name}
  
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const token = localStorage.getItem('token');
  const canCreate = user.is_superadmin || (user.permissions?.products?.includes('create'));
  const canEdit   = user.is_superadmin || (user.permissions?.products?.includes('edit'));

  const loadData = async () => {
    setLoading(true);
    try {
      const [pRes, cRes] = await Promise.all([
        fetch(`${API_URL}/products`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_URL}/categories`, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      const [pData, cData] = await Promise.all([pRes.json(), cRes.json()]);
      setProducts(Array.isArray(pData) ? pData : []);
      setCategories(Array.isArray(cData) ? cData : []);
    } catch (err) {
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDeleteProduct = async (id) => {
      if (!window.confirm('Delete this product?')) return;
      try {
          const res = await fetch(`${API_URL}/products/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
          if (res.ok) { toast.success('Deleted'); loadData(); }
      } catch (err) { toast.error('Delete failed'); }
  }

  // ─── PRODUCT ACTIONS ────────────────────────────────────────────────────────

  const handleSaveProduct = async () => {
    if (!form.name || !form.price) { toast.error('Name and price are required'); return; }
    setSaving(true);
    const isEdit = !!form.id;
    try {
      const res = await fetch(`${API_URL}/products${isEdit ? '/' + form.id : ''}`, {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ...form, price: parseFloat(form.price), tax: parseFloat(form.tax), stock: parseInt(form.stock) || 0 }),
      });
      if (res.ok) { 
        toast.success(`Product ${isEdit ? 'updated' : 'added'}!`); 
        setShowAdd(false); setForm(EMPTY_FORM); loadData(); 
      }
      else { const e = await res.json(); toast.error(e.error || 'Failed to save'); }
    } catch { toast.error('Network error'); }
    setSaving(false);
  };

  const traceParents = (catId) => {
      let path = [];
      let currentId = parseInt(catId);
      while (currentId) {
          const cat = categories.find(c => c.id === currentId);
          if (!cat) break;
          path.unshift(cat);
          currentId = cat.parent_id;
      }
      return path;
  };

  const handleEdit = (p) => {
      const path = traceParents(p.category_id);
      const levels = ['main_cat', 'cat', 'sub_cat', 'group', 'sub_group'];
      let catState = {};
      path.forEach((cat, i) => {
          if (i < levels.length) catState[levels[i]] = cat.id.toString();
      });

      setForm({ 
          ...p, 
          tax: p.tax_percent || p.tax,
          ...catState
      });
      setShowAdd(true);
  }

  const handleSaveCategory = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData);
    const isEdit = !!editingCat?.id;
    try {
      const res = await fetch(`${API_URL}/categories${isEdit ? '/' + editingCat.id : ''}`, {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ...data, is_active: data.is_active === 'on' })
      });
      if (res.ok) {
        toast.success(`Category ${isEdit ? 'updated' : 'created'} successfully`);
        setShowCatModal(false); setEditingCat(null); loadData();
      }
    } catch (err) { toast.error('Error saving category'); }
  };

  const deleteCategory = async (id) => {
      if (!window.confirm('Delete this category and all its sub-items?')) return;
      try {
          const res = await fetch(`${API_URL}/categories/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
          if (res.ok) { toast.success('Deleted'); loadData(); }
      } catch (err) { toast.error('Delete failed'); }
  }

  // ─── RENDERERS ──────────────────────────────────────────────────────────────

  const renderProductMaster = () => {
      const filtered = products.filter(p =>
        (catFilter === 'All' || p.category_id === parseInt(catFilter)) &&
        (!search || p.name?.toLowerCase().includes(search.toLowerCase()) || p.sku?.toLowerCase().includes(search.toLowerCase()))
      );

      return (
        <div className="orbx-page-enter">
            <SectionHeader 
                title="Inventory Catalog" 
                subtitle={`${products.length} products total across all categories`}
                action={canCreate && (
                  <button className="orbx-btn orbx-btn-primary" onClick={() => { setForm(EMPTY_FORM); setShowAdd(true); }}>
                    <Icon name="plus" size={14} /> Add Product
                  </button>
                )}
            />

            <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
                <div style={{ position: 'relative', flex: '1 1 250px' }}>
                <div style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }}>
                    <Icon name="search" size={14} color={T.colors.textMuted} />
                </div>
                <input className="orbx-input" style={{ paddingLeft: 32 }} placeholder="Search products..." value={search} onChange={e => setSearch(e.target.value)} />
                </div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                <button onClick={() => setCatFilter('All')} className={`orbx-btn ${catFilter === 'All' ? 'orbx-btn-primary' : 'orbx-btn-secondary'}`} style={{ padding: '7px 12px', fontSize: 12 }}>All</button>
                {categories.filter(c => c.level === 1).map(c => (
                    <button key={c.id} onClick={() => setCatFilter(c.id.toString())} className={`orbx-btn ${catFilter === c.id.toString() ? 'orbx-btn-primary' : 'orbx-btn-secondary'}`} style={{ padding: '7px 12px', fontSize: 12 }}>{c.name}</button>
                ))}
                </div>
            </div>

            <div className="orbx-card" style={{ padding: 0, overflow: 'hidden' }}>
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
                    ) : filtered.map(p => {
                    const cat = categories.find(c => c.id === p.category_id);
                    return (
                        <tr key={p.id} className="orbx-table-row">
                        <td style={{ padding: '12px 16px' }}>
                            <div style={{ fontSize: 13.5, fontWeight: 600 }}>{p.name}</div>
                            <div style={{ fontSize: 11, color: T.colors.textMuted }}>ID: {p.id}</div>
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                            <div style={{ fontSize: 12, fontWeight: 500 }}>{p.sku}</div>
                            <div style={{ fontSize: 10, color: T.colors.textMuted, fontFamily: 'monospace' }}>{p.barcode}</div>
                        </td>
                        <td style={{ padding: '12px 16px' }}><span className="orbx-badge orbx-badge-neutral">{cat?.name || 'Uncategorized'}</span></td>
                        <td style={{ padding: '12px 16px', fontSize: 14, fontWeight: 700 }}>₹{parseFloat(p.price || 0).toLocaleString()}</td>
                        <td style={{ padding: '12px 16px' }}><span className="orbx-badge orbx-badge-info">{p.tax_percent || 0}%</span></td>
                        <td style={{ padding: '12px 16px' }}>
                            <span style={{ fontSize: 13, fontWeight: 700, color: p.stock < 10 ? T.colors.danger : T.colors.success }}>{p.stock ?? '—'}</span>
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                            <span className={`orbx-badge ${p.stock < 10 ? 'orbx-badge-danger' : 'orbx-badge-success'}`}>{p.stock < 10 ? 'Low' : 'In Stock'}</span>
                        </td>
                        <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                            {canEdit && (
                            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                                <button className="orbx-btn orbx-btn-ghost" onClick={() => handleEdit(p)} style={{ padding: 6 }}><Icon name="edit" size={14} /></button>
                                <button className="orbx-btn orbx-btn-ghost" onClick={() => handleDeleteProduct(p.id)} style={{ padding: 6, color: T.colors.danger }}><Icon name="trash" size={14} /></button>
                            </div>
                            )}
                        </td>
                        </tr>
                    );
                    })}
                </tbody>
                </table>
            </div>
        </div>
      )
  };

  const renderCategoryMaster = () => {
    const currentParentId = categoryPath.length > 0 ? categoryPath[categoryPath.length - 1].id : null;
    const currentLevel = categoryPath.length + 1;
    const levelNames = ['Main Category', 'Category', 'Sub Category', 'Group', 'Sub Group'];
    const currentLevelName = levelNames[currentLevel - 1];
    const filteredCats = categories.filter(c => c.parent_id === currentParentId);

    return (
      <div className="orbx-page-enter">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <button className="orbx-btn orbx-btn-ghost" style={{ padding: '4px 8px' }} onClick={() => setCategoryPath([])}><Icon name="dashboard" size={14} /> Root</button>
            {categoryPath.map((p, i) => (
                <React.Fragment key={p.id}>
                    <Icon name="plus" size={10} style={{ transform: 'rotate(90deg)', opacity: 0.5 }} />
                    <button className="orbx-btn orbx-btn-ghost" style={{ padding: '4px 8px' }} onClick={() => setCategoryPath(categoryPath.slice(0, i + 1))}>{p.name}</button>
                </React.Fragment>
            ))}
        </div>

        <SectionHeader 
          title={`${currentLevelName} Taxonomy`} 
          subtitle={categoryPath.length > 0 ? `Defining segments under ${categoryPath[categoryPath.length - 1].name}` : `Defining top-level global departments`} 
          action={currentLevel <= 5 && <button className="orbx-btn orbx-btn-primary" onClick={() => { setEditingCat({ parent_id: currentParentId }); setShowCatModal(true); }}>+ Add {currentLevelName}</button>}
        />
        <div className="orbx-card" style={{ padding: 0, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: T.colors.bgMuted, borderBottom: `1px solid ${T.colors.border}` }}>
                <th style={{ textAlign: 'left', padding: '12px 20px', fontSize: 12, color: T.colors.textMuted }}>NAME</th>
                <th style={{ textAlign: 'left', padding: '12px 20px', fontSize: 12, color: T.colors.textMuted }}>DESCRIPTION</th>
                <th style={{ textAlign: 'left', padding: '12px 20px', fontSize: 12, color: T.colors.textMuted }}>STATUS</th>
                <th style={{ textAlign: 'right', padding: '12px 20px', fontSize: 12, color: T.colors.textMuted }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {filteredCats.length === 0 ? (
                <tr><td colSpan={4} style={{ padding: 40, textAlign: 'center', color: T.colors.textMuted }}>No sub-items found. Add one to expand this branch.</td></tr>
              ) : filteredCats.map(c => (
                <tr key={c.id} className="orbx-table-row">
                  <td style={{ padding: '16px 20px', fontSize: 14, fontWeight: 600 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <Icon name="inventory" size={16} color={T.colors.textMuted} />
                        <span style={{ color: T.colors.text }}>{c.name}</span>
                        {(c.level || 1) < 5 && (
                             <button 
                                className="orbx-btn orbx-btn-secondary" 
                                style={{ padding: '4px 10px', fontSize: 10, height: 'auto', background: T.colors.bgMuted }} 
                                onClick={() => setCategoryPath([...categoryPath, { id: c.id, name: c.name }])}
                            >
                                <Icon name="plus" size={10} style={{ marginRight: 4, transform: 'rotate(90deg)' }} />
                                Open {levelNames[c.level || 1]}s
                            </button>
                        )}
                      </div>
                  </td>
                  <td style={{ padding: '16px 20px', fontSize: 13, color: T.colors.textMid }}>{c.description || '—'}</td>
                  <td style={{ padding: '16px 20px' }}>
                    <span className={`orbx-badge ${c.is_active ? 'orbx-badge-success' : 'orbx-badge-danger'}`}>{c.is_active ? 'Active' : 'Inactive'}</span>
                  </td>
                  <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                        <button className="orbx-btn orbx-btn-ghost" onClick={() => { setEditingCat(c); setShowCatModal(true); }} style={{ padding: 6 }}><Icon name="edit" size={14} /></button>
                        <button className="orbx-btn orbx-btn-ghost" onClick={() => deleteCategory(c.id)} style={{ padding: 6, color: T.colors.danger }}><Icon name="trash" size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div style={{ padding: 24, background: T.colors.bg, minHeight: '100%' }}>
      {/* Module Tabs */}
      <div style={{ display: 'flex', borderBottom: `1px solid ${T.colors.border}`, marginBottom: 24, gap: 8 }}>
        <button 
          onClick={() => setActiveTab('products')}
          style={{ 
            padding: '12px 24px', border: 'none', background: 'none', cursor: 'pointer',
            fontSize: 14, fontWeight: 700, color: activeTab === 'products' ? T.colors.brand : T.colors.textMuted,
            borderBottom: activeTab === 'products' ? `3px solid ${T.colors.brand}` : '3px solid transparent',
            transition: 'all 0.2s'
          }}
        >
          Product Catalog
        </button>
        <button 
          onClick={() => setActiveTab('categories')}
          style={{ 
            padding: '12px 24px', border: 'none', background: 'none', cursor: 'pointer',
            fontSize: 14, fontWeight: 700, color: activeTab === 'categories' ? T.colors.brand : T.colors.textMuted,
            borderBottom: activeTab === 'categories' ? `3px solid ${T.colors.brand}` : '3px solid transparent',
            transition: 'all 0.2s'
          }}
        >
          Category Master (5-Level)
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: T.colors.textMuted }}>Loading module...</div>
      ) : (
        <>
            {activeTab === 'products' ? renderProductMaster() : renderCategoryMaster()}
        </>
      )}

      {/* PRODUCT MODAL */}
      {showAdd && (
        <div className="orbx-modal-overlay">
          <div className="orbx-modal" style={{ maxWidth: 500, padding: 28 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
              <h3 style={{ fontSize: 17, fontWeight: 700 }}>{form.id ? 'Edit Product' : 'Add New Product'}</h3>
              <button onClick={() => setShowAdd(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><Icon name="x" size={20} /></button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {[
                { label: 'Product Name', key: 'name', ph: 'Full product name', span: 2 },
                { label: 'SKU',          key: 'sku',  ph: 'e.g. RICE-BAS-5K' },
                { label: 'Barcode',      key: 'barcode', ph: '13-digit barcode' },
                { label: 'Price (₹)',    key: 'price', ph: '0.00', type: 'number' },
                { label: 'Tax %',        key: 'tax',   ph: '0 / 5 / 12 / 18 / 28', type: 'number' },
                { label: 'Initial Stock',key: 'stock', ph: '0', type: 'number', disabled: !!form.id },
              ].map(f => (
                <div key={f.key} style={f.span ? { gridColumn: `span ${f.span}` } : {}}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: T.colors.textMid, marginBottom: 5, display: 'block' }}>{f.label}</label>
                  <input className="orbx-input" disabled={f.disabled} type={f.type || 'text'} placeholder={f.ph} value={form[f.key]} onChange={e => setForm(v => ({ ...v, [f.key]: e.target.value }))} />
                </div>
              ))}
              <div style={{ gridColumn: 'span 2' }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: T.colors.brand, marginBottom: 10, display: 'block', textTransform: 'uppercase' }}>Taxonomy Classification</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <select 
                    className="orbx-input orbx-select" 
                    value={form.main_cat || ''} 
                    onChange={e => setForm(v => ({ ...v, main_cat: e.target.value, category_id: e.target.value, cat: '', sub_cat: '', group: '', sub_group: '' }))}
                  >
                    <option value="">-- Main Category --</option>
                    {categories.filter(c => !c.parent_id).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>

                  {form.main_cat && (
                    <select 
                        className="orbx-input orbx-select" 
                        value={form.cat || ''} 
                        onChange={e => setForm(v => ({ ...v, cat: e.target.value, category_id: e.target.value, sub_cat: '', group: '', sub_group: '' }))}
                    >
                        <option value="">-- Category --</option>
                        {categories.filter(c => c.parent_id === parseInt(form.main_cat)).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  )}

                  {form.cat && (
                    <select 
                        className="orbx-input orbx-select" 
                        value={form.sub_cat || ''} 
                        onChange={e => setForm(v => ({ ...v, sub_cat: e.target.value, category_id: e.target.value, group: '', sub_group: '' }))}
                    >
                        <option value="">-- Sub Category --</option>
                        {categories.filter(c => c.parent_id === parseInt(form.cat)).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  )}

                  {form.sub_cat && (
                    <select 
                        className="orbx-input orbx-select" 
                        value={form.group || ''} 
                        onChange={e => setForm(v => ({ ...v, group: e.target.value, category_id: e.target.value, sub_group: '' }))}
                    >
                        <option value="">-- Group --</option>
                        {categories.filter(c => c.parent_id === parseInt(form.sub_cat)).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  )}

                  {form.group && (
                    <select 
                        className="orbx-input orbx-select" 
                        value={form.sub_group || ''} 
                        onChange={e => setForm(v => ({ ...v, sub_group: e.target.value, category_id: e.target.value }))}
                    >
                        <option value="">-- Sub Group --</option>
                        {categories.filter(c => c.parent_id === parseInt(form.group)).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  )}
                </div>
                <p style={{ fontSize: 10, color: T.colors.textMuted, marginTop: 8, fontStyle: 'italic' }}>
                    Currently Selected: {categories.find(c => c.id === parseInt(form.category_id))?.name || 'Root'}
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 24 }}>
              <button className="orbx-btn orbx-btn-secondary" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setShowAdd(false)}>Cancel</button>
              <button className="orbx-btn orbx-btn-primary" style={{ flex: 1, justifyContent: 'center' }} onClick={handleSaveProduct} disabled={saving}>
                {saving ? 'Saving...' : 'Save Product'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CATEGORY MODAL */}
      {showCatModal && (
        <div className="orbx-modal-overlay">
          <div className="orbx-modal" style={{ maxWidth: 450, padding: 32 }}>
            <h3 style={{ fontSize: 20, fontWeight: 800, marginBottom: 8 }}>{editingCat?.id ? 'Edit Taxonomy Item' : 'New Taxonomy Item'}</h3>
            <p style={{ fontSize: 13, color: T.colors.textMuted, marginBottom: 24 }}>
                {editingCat?.id ? 'Updating classification details' : `Creating a new level under ${categoryPath[categoryPath.length - 1]?.name || 'Root'}`}
            </p>
            <form onSubmit={handleSaveCategory} style={{ display: 'grid', gap: 20 }}>
              <input type="hidden" name="parent_id" defaultValue={editingCat?.parent_id} />
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: T.colors.textMid, marginBottom: 8, display: 'block' }}>NAME</label>
                <input name="name" className="orbx-input" required defaultValue={editingCat?.name} placeholder="e.g. Dairy Products" />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: T.colors.textMid, marginBottom: 8, display: 'block' }}>DESCRIPTION</label>
                <input name="description" className="orbx-input" defaultValue={editingCat?.description} placeholder="Short notes..." />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <input type="checkbox" name="is_active" id="is_active" defaultChecked={editingCat ? editingCat.is_active : true} />
                <label htmlFor="is_active" style={{ fontSize: 13, fontWeight: 600 }}>Item Active</label>
              </div>
              <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
                <button type="submit" className="orbx-btn orbx-btn-primary" style={{ flex: 1 }}>Save Item</button>
                <button type="button" className="orbx-btn orbx-btn-secondary" onClick={() => { setShowCatModal(false); setEditingCat(null); }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
