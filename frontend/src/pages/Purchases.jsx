import React, { useState, useEffect } from 'react';
import Icon from '../components/Icon';
import { tokens as T } from '../design/tokens';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

export default function Purchases() {
    const navigate = useNavigate();
    const [purchases, setPurchases] = useState([]);
    const [suppliers, setSuppliers] = useState([]);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    
    // New PO Form State
    const [selectedSupplier, setSelectedSupplier] = useState('');
    const [cart, setCart] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');

    const token = localStorage.getItem('token');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [pRes, sRes, prRes] = await Promise.all([
                fetch('/api/purchases', { headers: { Authorization: `Bearer ${token}` } }),
                fetch('/api/suppliers', { headers: { Authorization: `Bearer ${token}` } }),
                fetch('/api/products',  { headers: { Authorization: `Bearer ${token}` } })
            ]);
            setPurchases(await pRes.json());
            setSuppliers(await sRes.json());
            setProducts(await prRes.json());
        } catch (err) {
            toast.error('Failed to load data');
        } finally {
            setLoading(false);
        }
    };

    const addToCart = (product) => {
        const existing = cart.find(item => item.product_id === product.id);
        if (existing) {
            setCart(cart.map(item => item.product_id === product.id ? { ...item, qty: item.qty + 1 } : item));
        } else {
            setCart([...cart, { 
                product_id: product.id, 
                name: product.name, 
                sku: product.sku,
                qty: 1, 
                cost_price: product.base_price || 0,
                tax_percent: product.tax_percent || 0,
                attributes: { size: '', color: '', fabric: '', design: '' }
            }]);
        }
        setSearchTerm('');
    };

    const removeFromCart = (id) => setCart(cart.filter(i => i.product_id !== id));

    const updateCartItem = (id, field, value) => {
        setCart(cart.map(i => i.product_id === id ? { ...i, [field]: value } : i));
    };

    const updateAttribute = (id, attr, value) => {
        setCart(cart.map(i => i.product_id === id ? { ...i, attributes: { ...i.attributes, [attr]: value } } : i));
    };

    const calculateTotals = () => {
        const subtotal = cart.reduce((sum, item) => sum + (parseFloat(item.qty) * parseFloat(item.cost_price)), 0);
        const tax_total = cart.reduce((sum, item) => sum + (parseFloat(item.qty) * parseFloat(item.cost_price) * (parseFloat(item.tax_percent) / 100)), 0);
        return { subtotal, tax_total, total_amount: subtotal + tax_total };
    };

    const handleCreatePO = async () => {
        if (!selectedSupplier) return toast.error('Select a supplier');
        if (cart.length === 0) return toast.error('Add items to purchase');

        const { subtotal, tax_total, total_amount } = calculateTotals();
        const items = cart.map(i => ({
            product_id: i.product_id,
            qty: i.qty,
            cost_price: i.cost_price,
            tax_percent: i.tax_percent,
            attributes: i.attributes,
            total: (parseFloat(i.qty) * parseFloat(i.cost_price)) * (1 + parseFloat(i.tax_percent) / 100)
        }));

        try {
            const res = await fetch('/api/purchases', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ 
                    supplier_id: selectedSupplier, 
                    branch_id: 1, // Default to main branch for now
                    items, subtotal, tax_total, total_amount 
                })
            });
            if (res.ok) {
                toast.success('Purchase Order created');
                setShowModal(false);
                setCart([]);
                fetchData();
            }
        } catch (err) { toast.error('Failed to create PO'); }
    };

    const handleCancelPO = async (id) => {
        if (!window.confirm('Cancel this PO?')) return;
        try {
            const res = await fetch(`/api/purchases/${id}/cancel`, {
                method: 'PUT',
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                toast.success('PO Cancelled');
                fetchData();
            } else {
                const data = await res.json();
                toast.error(data.error);
            }
        } catch (err) { toast.error('Failed to cancel PO'); }
    };

    const filteredProducts = searchTerm.length > 1 
        ? products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.sku.toLowerCase().includes(searchTerm.toLowerCase()))
        : [];

    return (
        <div className="orbx-page-enter" style={{ padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
                <div>
                    <h2 style={{ fontSize: 24, fontWeight: 800, color: T.colors.text }}>Warehouse Procurement</h2>
                    <p style={{ fontSize: 14, color: T.colors.textMuted }}>Create Purchase Orders and manage Goods Receipt Notes (GRN)</p>
                </div>
                <div style={{ display: 'flex', gap: 12 }}>
                    <button className="orbx-btn orbx-btn-secondary" onClick={() => navigate('/grn')}>
                        <Icon name="check" size={14} /> GRN Approval
                    </button>
                    <button className="orbx-btn orbx-btn-primary" onClick={() => setShowModal(true)}>
                        <Icon name="plus" size={14} /> New Purchase Order
                    </button>
                </div>
            </div>

            <div className="orbx-card" style={{ padding: 0, overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ background: T.colors.bgMuted, borderBottom: `1px solid ${T.colors.border}` }}>
                            <th style={{ textAlign: 'left', padding: '12px 20px', fontSize: 11, color: T.colors.textMuted, textTransform: 'uppercase' }}>PO Details</th>
                            <th style={{ textAlign: 'left', padding: '12px 20px', fontSize: 11, color: T.colors.textMuted, textTransform: 'uppercase' }}>Supplier</th>
                            <th style={{ textAlign: 'left', padding: '12px 20px', fontSize: 11, color: T.colors.textMuted, textTransform: 'uppercase' }}>Amount</th>
                            <th style={{ textAlign: 'left', padding: '12px 20px', fontSize: 11, color: T.colors.textMuted, textTransform: 'uppercase' }}>Status</th>
                            <th style={{ textAlign: 'right', padding: '12px 20px', fontSize: 11, color: T.colors.textMuted, textTransform: 'uppercase' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {purchases.map(p => (
                            <tr key={p.id} className="orbx-table-row">
                                <td style={{ padding: '16px 20px' }}>
                                    <div style={{ fontSize: 14, fontWeight: 700, color: T.colors.brand }}>{p.po_number}</div>
                                    <div style={{ fontSize: 11, color: T.colors.textMuted }}>{new Date(p.created_at).toLocaleDateString()}</div>
                                </td>
                                <td style={{ padding: '16px 20px', fontSize: 14, fontWeight: 600 }}>{p.supplier_name}</td>
                                <td style={{ padding: '16px 20px', fontSize: 14, fontWeight: 700 }}>₹{parseFloat(p.total_amount).toLocaleString()}</td>
                                <td style={{ padding: '16px 20px' }}>
                                    <span className={`orbx-badge ${
                                        p.status === 'received' ? 'orbx-badge-success' : 
                                        p.status === 'partial' ? 'orbx-badge-info' :
                                        p.status === 'cancelled' ? 'orbx-badge-danger' : 'orbx-badge-warning'
                                    }`}>
                                        {p.status.toUpperCase()}
                                    </span>
                                </td>
                                <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                                    <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                                        {(p.status === 'pending' || p.status === 'partial') && (
                                            <button className="orbx-btn orbx-btn-success" style={{ padding: '6px 12px', fontSize: 11 }} onClick={() => navigate('/grn/create', { state: { po: p } })}>
                                                Create GRN
                                            </button>
                                        )}
                                        {p.status === 'pending' && (
                                            <button className="orbx-btn" style={{ padding: '6px 12px', fontSize: 11, background: T.colors.dangerSoft, color: T.colors.danger }} onClick={() => handleCancelPO(p.id)}>
                                                Cancel
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {purchases.length === 0 && (
                            <tr>
                                <td colSpan={5} style={{ padding: 40, textAlign: 'center', color: T.colors.textMuted }}>No purchase orders found.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {showModal && (
                <div className="orbx-modal-overlay">
                    <div className="orbx-modal" style={{ maxWidth: 1000, width: '95%', padding: 0 }}>
                        <div style={{ padding: '20px 24px', borderBottom: `1px solid ${T.colors.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: T.colors.bgMuted }}>
                            <h3 style={{ fontSize: 18, fontWeight: 800 }}>Draft Purchase Order</h3>
                            <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><Icon name="x" size={20} /></button>
                        </div>
                        
                        <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', height: '70vh' }}>
                            {/* Left Sidebar: Settings */}
                            <div style={{ padding: 20, borderRight: `1px solid ${T.colors.border}`, background: T.colors.bgMuted }}>
                                <div style={{ marginBottom: 20 }}>
                                    <label style={{ fontSize: 11, fontWeight: 700, color: T.colors.textMuted, marginBottom: 6, display: 'block' }}>SUPPLIER</label>
                                    <select className="orbx-input" value={selectedSupplier} onChange={e => setSelectedSupplier(e.target.value)}>
                                        <option value="">Choose Supplier...</option>
                                        {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                    </select>
                                </div>

                                <div>
                                    <label style={{ fontSize: 11, fontWeight: 700, color: T.colors.textMuted, marginBottom: 6, display: 'block' }}>ADD PRODUCTS</label>
                                    <div style={{ position: 'relative' }}>
                                        <div style={{ position: 'absolute', left: 12, top: 10, color: T.colors.textMuted }}><Icon name="search" size={14} /></div>
                                        <input className="orbx-input" style={{ paddingLeft: 36 }} placeholder="Search SKU or Name..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                                        {filteredProducts.length > 0 && (
                                            <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'white', boxShadow: T.shadows.lg, borderRadius: T.radius.md, zIndex: 100, marginTop: 4, maxHeight: 300, overflowY: 'auto', border: `1px solid ${T.colors.border}` }}>
                                                {filteredProducts.map(p => (
                                                    <div key={p.id} className="orbx-list-item" style={{ padding: '10px 14px', cursor: 'pointer' }} onClick={() => addToCart(p)}>
                                                        <div style={{ fontWeight: 600, fontSize: 13 }}>{p.name}</div>
                                                        <div style={{ fontSize: 11, color: T.colors.textMuted }}>{p.sku} | ₹{p.price}</div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Right Side: Cart Table with Attributes */}
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                        <thead>
                                            <tr style={{ borderBottom: `2px solid ${T.colors.border}` }}>
                                                <th style={{ textAlign: 'left', paddingBottom: 10, fontSize: 11, color: T.colors.textMuted }}>PRODUCT / DETAILS</th>
                                                <th style={{ textAlign: 'left', paddingBottom: 10, fontSize: 11, color: T.colors.textMuted }}>TEXTILE ATTRIBUTES</th>
                                                <th style={{ textAlign: 'left', paddingBottom: 10, fontSize: 11, color: T.colors.textMuted }}>COST</th>
                                                <th style={{ textAlign: 'left', paddingBottom: 10, fontSize: 11, color: T.colors.textMuted }}>QTY</th>
                                                <th style={{ textAlign: 'right', paddingBottom: 10, fontSize: 11, color: T.colors.textMuted }}>TOTAL</th>
                                                <th style={{ width: 40 }}></th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {cart.map(item => (
                                                <tr key={item.product_id} style={{ borderBottom: `1px solid ${T.colors.border}` }}>
                                                    <td style={{ padding: '12px 0' }}>
                                                        <div style={{ fontWeight: 600, fontSize: 13 }}>{item.name}</div>
                                                        <div style={{ fontSize: 11, color: T.colors.textMuted }}>{item.sku}</div>
                                                    </td>
                                                    <td style={{ padding: '12px 0' }}>
                                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
                                                            <input placeholder="Size" className="orbx-input" style={{ padding: '2px 8px', fontSize: 11 }} value={item.attributes.size} onChange={e => updateAttribute(item.product_id, 'size', e.target.value)} />
                                                            <input placeholder="Color" className="orbx-input" style={{ padding: '2px 8px', fontSize: 11 }} value={item.attributes.color} onChange={e => updateAttribute(item.product_id, 'color', e.target.value)} />
                                                            <input placeholder="Fabric" className="orbx-input" style={{ padding: '2px 8px', fontSize: 11 }} value={item.attributes.fabric} onChange={e => updateAttribute(item.product_id, 'fabric', e.target.value)} />
                                                            <input placeholder="Pattern" className="orbx-input" style={{ padding: '2px 8px', fontSize: 11 }} value={item.attributes.design} onChange={e => updateAttribute(item.product_id, 'design', e.target.value)} />
                                                        </div>
                                                    </td>
                                                    <td style={{ padding: '12px 0' }}>
                                                        <input type="number" className="orbx-input" style={{ width: 80, padding: 4 }} value={item.cost_price} onChange={e => updateCartItem(item.product_id, 'cost_price', e.target.value)} />
                                                    </td>
                                                    <td style={{ padding: '12px 0' }}>
                                                        <input type="number" className="orbx-input" style={{ width: 60, padding: 4 }} value={item.qty} onChange={e => updateCartItem(item.product_id, 'qty', e.target.value)} />
                                                    </td>
                                                    <td style={{ textAlign: 'right', fontWeight: 700, padding: '12px 0' }}>₹{((parseFloat(item.qty) * parseFloat(item.cost_price)) * (1 + parseFloat(item.tax_percent) / 100)).toFixed(2)}</td>
                                                    <td style={{ textAlign: 'right' }}>
                                                        <button onClick={() => removeFromCart(item.product_id)} style={{ color: T.colors.danger, background: 'none', border: 'none', cursor: 'pointer' }}><Icon name="x" size={14} /></button>
                                                    </td>
                                                </tr>
                                            ))}
                                            {cart.length === 0 && (
                                                <tr><td colSpan={6} style={{ padding: 40, textAlign: 'center', color: T.colors.textMuted }}>No products added.</td></tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                                
                                <div style={{ padding: 20, borderTop: `1px solid ${T.colors.border}`, background: T.colors.bgMuted, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <div style={{ fontSize: 11, color: T.colors.textMuted, fontWeight: 700 }}>ESTIMATED TOTAL</div>
                                        <div style={{ fontSize: 20, fontWeight: 900, color: T.colors.brand }}>₹{calculateTotals().total_amount.toLocaleString()}</div>
                                    </div>
                                    <div style={{ display: 'flex', gap: 10 }}>
                                        <button className="orbx-btn orbx-btn-secondary" onClick={() => setShowModal(false)}>Discard</button>
                                        <button className="orbx-btn orbx-btn-primary" style={{ padding: '10px 30px' }} onClick={handleCreatePO}>Confirm Purchase Order</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
