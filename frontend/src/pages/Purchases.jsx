import React, { useState, useEffect } from 'react';
import Icon from '../components/Icon';
import { tokens as T } from '../design/tokens';
import toast from 'react-hot-toast';

export default function Purchases() {
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
                tax_percent: product.tax_percent || 0 
            }]);
        }
        setSearchTerm('');
    };

    const removeFromCart = (id) => setCart(cart.filter(i => i.product_id !== id));

    const updateCartItem = (id, field, value) => {
        setCart(cart.map(i => i.product_id === id ? { ...i, [field]: parseFloat(value) || 0 } : i));
    };

    const calculateTotals = () => {
        const subtotal = cart.reduce((sum, item) => sum + (item.qty * item.cost_price), 0);
        const tax_total = cart.reduce((sum, item) => sum + (item.qty * item.cost_price * (item.tax_percent / 100)), 0);
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
            total: (i.qty * i.cost_price) * (1 + i.tax_percent / 100)
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

    const handleReceive = async (id) => {
        if (!window.confirm('Confirm receipt of goods? This will update inventory.')) return;
        try {
            const res = await fetch(`/api/purchases/${id}/receive`, {
                method: 'PUT',
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                toast.success('Goods received and inventory updated');
                fetchData();
            }
        } catch (err) { toast.error('Failed to receive goods'); }
    };

    const filteredProducts = searchTerm.length > 1 
        ? products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.sku.toLowerCase().includes(searchTerm.toLowerCase()))
        : [];

    return (
        <div className="orbx-page-enter" style={{ padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
                <div>
                    <h2 style={{ fontSize: 24, fontWeight: 800, color: T.colors.text }}>Purchase Orders</h2>
                    <p style={{ fontSize: 14, color: T.colors.textMuted }}>Manage procurement and track incoming stock</p>
                </div>
                <button className="orbx-btn orbx-btn-primary" onClick={() => setShowModal(true)}>
                    + New Purchase
                </button>
            </div>

            <div className="orbx-card" style={{ padding: 0, overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ background: T.colors.bgMuted, borderBottom: `1px solid ${T.colors.border}` }}>
                            <th style={{ textAlign: 'left', padding: '12px 20px', fontSize: 12, color: T.colors.textMuted }}>PO NUMBER</th>
                            <th style={{ textAlign: 'left', padding: '12px 20px', fontSize: 12, color: T.colors.textMuted }}>SUPPLIER</th>
                            <th style={{ textAlign: 'left', padding: '12px 20px', fontSize: 12, color: T.colors.textMuted }}>TOTAL AMOUNT</th>
                            <th style={{ textAlign: 'left', padding: '12px 20px', fontSize: 12, color: T.colors.textMuted }}>STATUS</th>
                            <th style={{ textAlign: 'right', padding: '12px 20px', fontSize: 12, color: T.colors.textMuted }}>ACTIONS</th>
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
                                    <span className={`orbx-badge ${p.status === 'received' ? 'orbx-badge-success' : 'orbx-badge-warning'}`}>
                                        {p.status.toUpperCase()}
                                    </span>
                                </td>
                                <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                                    {p.status === 'pending' && (
                                        <button className="orbx-btn orbx-btn-success" style={{ padding: '6px 12px', fontSize: 11 }} onClick={() => handleReceive(p.id)}>
                                            Mark Received
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {showModal && (
                <div className="orbx-modal-overlay">
                    <div className="orbx-modal" style={{ maxWidth: 900, width: '90%', padding: 0 }}>
                        <div style={{ padding: '24px 32px', borderBottom: `1px solid ${T.colors.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3 style={{ fontSize: 20, fontWeight: 800 }}>Create Purchase Order</h3>
                            <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><Icon name="x" size={24} /></button>
                        </div>
                        
                        <div style={{ display: 'grid', gridTemplateColumns: '350px 1fr', height: '600px' }}>
                            {/* Product Selection */}
                            <div style={{ padding: 24, borderRight: `1px solid ${T.colors.border}`, background: T.colors.bgMuted }}>
                                <label style={{ fontSize: 12, fontWeight: 700, color: T.colors.textMid, marginBottom: 8, display: 'block' }}>SELECT SUPPLIER</label>
                                <select className="orbx-input" style={{ marginBottom: 24 }} value={selectedSupplier} onChange={e => setSelectedSupplier(e.target.value)}>
                                    <option value="">Choose Supplier...</option>
                                    {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                </select>

                                <label style={{ fontSize: 12, fontWeight: 700, color: T.colors.textMid, marginBottom: 8, display: 'block' }}>SEARCH PRODUCTS</label>
                                <div style={{ position: 'relative' }}>
                                    <input className="orbx-input" placeholder="Search SKU or Name..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                                    {filteredProducts.length > 0 && (
                                        <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'white', boxShadow: T.shadows.lg, borderRadius: T.radius.md, zIndex: 10, marginTop: 4, maxHeight: 300, overflowY: 'auto' }}>
                                            {filteredProducts.map(p => (
                                                <div key={p.id} className="orbx-list-item" style={{ padding: '12px 16px', cursor: 'pointer' }} onClick={() => addToCart(p)}>
                                                    <div style={{ fontWeight: 600 }}>{p.name}</div>
                                                    <div style={{ fontSize: 11, color: T.colors.textMuted }}>SKU: {p.sku} | ₹{p.base_price}</div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Cart Grid */}
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                        <thead>
                                            <tr style={{ borderBottom: `2px solid ${T.colors.border}` }}>
                                                <th style={{ textAlign: 'left', paddingBottom: 12, fontSize: 12 }}>PRODUCT</th>
                                                <th style={{ textAlign: 'left', paddingBottom: 12, fontSize: 12 }}>COST</th>
                                                <th style={{ textAlign: 'left', paddingBottom: 12, fontSize: 12 }}>QTY</th>
                                                <th style={{ textAlign: 'left', paddingBottom: 12, fontSize: 12 }}>TAX%</th>
                                                <th style={{ textAlign: 'right', paddingBottom: 12, fontSize: 12 }}>TOTAL</th>
                                                <th style={{ width: 40 }}></th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {cart.map(item => (
                                                <tr key={item.product_id} style={{ borderBottom: `1px solid ${T.colors.border}` }}>
                                                    <td style={{ py: 12 }}>
                                                        <div style={{ fontWeight: 600, fontSize: 13 }}>{item.name}</div>
                                                        <div style={{ fontSize: 11, color: T.colors.textMuted }}>{item.sku}</div>
                                                    </td>
                                                    <td><input type="number" className="orbx-input" style={{ width: 80, padding: 4 }} value={item.cost_price} onChange={e => updateCartItem(item.product_id, 'cost_price', e.target.value)} /></td>
                                                    <td><input type="number" className="orbx-input" style={{ width: 60, padding: 4 }} value={item.qty} onChange={e => updateCartItem(item.product_id, 'qty', e.target.value)} /></td>
                                                    <td><input type="number" className="orbx-input" style={{ width: 50, padding: 4 }} value={item.tax_percent} onChange={e => updateCartItem(item.product_id, 'tax_percent', e.target.value)} /></td>
                                                    <td style={{ textAlign: 'right', fontWeight: 700 }}>₹{((item.qty * item.cost_price) * (1 + item.tax_percent / 100)).toFixed(2)}</td>
                                                    <td style={{ textAlign: 'right' }}><button onClick={() => removeFromCart(item.product_id)} style={{ color: T.colors.danger, background: 'none', border: 'none' }}><Icon name="close" size={14} /></button></td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                
                                <div style={{ padding: 24, borderTop: `1px solid ${T.colors.border}`, background: T.colors.bgMuted, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <div style={{ fontSize: 12, color: T.colors.textMuted }}>TOTAL AMOUNT</div>
                                        <div style={{ fontSize: 24, fontWeight: 900, color: T.colors.brand }}>₹{calculateTotals().total_amount.toLocaleString()}</div>
                                    </div>
                                    <div style={{ display: 'flex', gap: 12 }}>
                                        <button className="orbx-btn orbx-btn-secondary" style={{ padding: '12px 32px' }} onClick={() => setShowModal(false)}>
                                            Cancel
                                        </button>
                                        <button className="orbx-btn orbx-btn-primary" style={{ padding: '12px 48px' }} onClick={handleCreatePO}>
                                            Confirm Purchase Order
                                        </button>
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
