import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import Icon from '../components/Icon';
import { tokens } from '../design/tokens';
import { db, queueForSync } from '../utils/db';
import toast from 'react-hot-toast';

const API_URL = '/api';

const MOCK_CUSTOMERS = [
  { id: 'C001', name: 'Rajesh Kumar',  phone: '9876543210', address: '123, Anna Salai, Chennai' },
  { id: 'C002', name: 'Priya Sharma',  phone: '9876543211', address: 'Flat 4B, Skyview Apts, Mumbai' },
  { id: 'C003', name: 'Anil Mehta',    phone: '9876543212', address: 'Plot 45, Jubilee Hills, Hyderabad' },
];

export default function POS() {
  const [products,     setProducts]     = useState([]);
  const [cart,         setCart]         = useState([]);
  const [search,       setSearch]       = useState('');
  const [customer,     setCustomer]     = useState({ name: 'Walk-in', phone: '', address: '' });
  const [globalDisc,   setGlobalDisc]   = useState({ value: 0, type: '%' });
  const [payMode,      setPayMode]      = useState('Cash');
  const [loading,      setLoading]      = useState(false);
  
  // Middle Section: Item Entry Form
  const [formItem, setFormItem] = useState(null); // { id, name, qty, rate, discount: {v, t}, amount }
  
  const searchRef = useRef(null);
  const qtyRef = useRef(null);
  const T = tokens;

  useEffect(() => {
    fetch(`${API_URL}/products`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    }).then(r => r.ok ? r.json() : []).then(d => setProducts(d)).catch(() => {});
  }, []);

  // Keyboard focus search on F1
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'F1') { e.preventDefault(); searchRef.current?.focus(); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const handleProductSelect = (p) => {
    setFormItem({
      id: p.id,
      name: p.name,
      qty: 1,
      rate: p.price,
      discount: { value: 0, type: '₹' },
      amount: p.price,
      sku: p.sku,
      barcode: p.barcode,
      tax: p.tax_percent || 0
    });
    setSearch('');
    setTimeout(() => qtyRef.current?.focus(), 50);
  };

  const updateFormItem = (updates) => {
    setFormItem(prev => {
      const next = { ...prev, ...updates };
      const discAmt = next.discount.type === '%' 
        ? (next.rate * next.qty * next.discount.value / 100)
        : next.discount.value;
      next.amount = (next.rate * next.qty) - discAmt;
      return next;
    });
  };

  const addItemToCart = () => {
    if (!formItem) return;
    setCart(prev => [...prev, { ...formItem, tempId: Date.now() }]);
    setFormItem(null);
    searchRef.current?.focus();
  };

  const totals = useMemo(() => {
    const qty = cart.reduce((s, i) => s + Number(i.qty), 0);
    const subtotal = cart.reduce((s, i) => s + i.amount, 0);
    const discAmt = globalDisc.type === '%' ? (subtotal * globalDisc.value / 100) : globalDisc.value;
    const gross = subtotal - discAmt;
    return { qty, subtotal, discAmt, gross };
  }, [cart, globalDisc]);

  const handleSave = async (print = false) => {
    if (cart.length === 0) { toast.error('Cart is empty'); return; }
    setLoading(true);
    const invNo = `INV-${Date.now().toString().slice(-6)}`;
    
    const saleData = {
      offline_id: invNo,
      customer_name: customer.name,
      customer_phone: customer.phone,
      items: cart,
      total_amount: totals.gross,
      payment_mode: payMode,
      timestamp: new Date().toISOString()
    };

    try {
      await db.sales.add(saleData);
      toast.success(`Bill ${invNo} saved!`);
      setCart([]);
      setCustomer({ name: 'Walk-in', phone: '', address: '' });
      setGlobalDisc({ value: 0, type: '%' });
    } catch (e) {
      toast.error('Save failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="orbx-pos-container orbx-page-enter">
      
      {/* ── Section 1: Top Panel (Customer + Summary) ── */}
      <div className="orbx-pos-section-top">
        <div style={{ flex: 1, padding: '15px 25px', display: 'flex', gap: 30, borderRight: `1px solid ${T.colors.border}` }}>
          <div className="orbx-pos-input-group" style={{ flex: 1 }}>
            <label className="orbx-pos-label">Customer Name</label>
            <input 
              className="orbx-input" 
              placeholder="Search or Enter Name" 
              value={customer.name} 
              onChange={e => setCustomer({...customer, name: e.target.value})}
            />
          </div>
          <div className="orbx-pos-input-group" style={{ width: 180 }}>
            <label className="orbx-pos-label">Phone Number</label>
            <input 
              className="orbx-input" 
              placeholder="98765..." 
              value={customer.phone} 
              onChange={e => setCustomer({...customer, phone: e.target.value})}
            />
          </div>
          <div className="orbx-pos-input-group" style={{ flex: 1 }}>
            <label className="orbx-pos-label">Address</label>
            <input 
              className="orbx-input" 
              placeholder="Billing Address" 
              value={customer.address} 
              onChange={e => setCustomer({...customer, address: e.target.value})}
            />
          </div>
        </div>

        <div className="orbx-pos-summary-box">
          <div style={{ textAlign: 'center' }}>
            <div className="orbx-pos-label" style={{ color: T.colors.textMuted }}>Total Qty</div>
            <div style={{ fontSize: 24, fontWeight: 800 }}>{totals.qty}</div>
          </div>
          <div style={{ height: 40, width: 1, background: 'rgba(255,255,255,0.1)' }} />
          <div>
            <div className="orbx-pos-label" style={{ color: T.colors.textMuted }}>Gross Amount</div>
            <div style={{ fontSize: 32, fontWeight: 900, color: T.colors.accent }}>₹{totals.gross.toFixed(2)}</div>
          </div>
          <div className="orbx-pos-input-group" style={{ width: 120 }}>
            <label className="orbx-pos-label" style={{ color: T.colors.textMuted }}>Global Disc</label>
            <div style={{ display: 'flex' }}>
              <input 
                className="orbx-input" 
                style={{ background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', width: 60, height: 32 }}
                value={globalDisc.value}
                onChange={e => setGlobalDisc({...globalDisc, value: Number(e.target.value)})}
              />
              <select 
                style={{ background: 'transparent', color: '#fff', border: 'none', fontSize: 14, fontWeight: 700 }}
                value={globalDisc.type}
                onChange={e => setGlobalDisc({...globalDisc, type: e.target.value})}
              >
                <option value="%">%</option>
                <option value="₹">₹</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* ── Section 2: Item Entry ── */}
      <div className="orbx-pos-section-mid">
        <div style={{ position: 'relative', width: 350 }}>
          <Icon name="search" size={16} color={T.colors.textMuted} style={{ position: 'absolute', left: 12, top: 12 }} />
          <input 
            ref={searchRef}
            className="orbx-input" 
            style={{ paddingLeft: 36, height: 44, borderRadius: T.radius.lg }}
            placeholder="Scan Barcode or Search Product (F1)"
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={async e => {
              if (e.key === 'Enter' && search) {
                // Exact barcode match -> Auto Add
                const p = products.find(p => p.barcode === search);
                if (p) {
                  const newItem = {
                    id: p.id,
                    name: p.name,
                    qty: 1,
                    rate: p.price,
                    discount: { value: 0, type: '₹' },
                    amount: p.price,
                    tempId: Date.now(),
                    tax: p.tax_percent || 0
                  };
                  setCart(prev => [...prev, newItem]);
                  setSearch('');
                  toast.success(`Added ${p.name}`, { duration: 1000, position: 'bottom-center' });
                } else {
                  // Search fallback -> Show form
                  const found = products.find(p => p.name.toLowerCase().includes(search.toLowerCase()) || p.sku === search);
                  if (found) handleProductSelect(found);
                }
              }
            }}
          />
          {search && (
            <div style={{ position: 'absolute', top: 50, left: 0, right: 0, background: '#fff', border: `1px solid ${T.colors.border}`, borderRadius: T.radius.md, boxShadow: T.shadows.lg, zIndex: 100, maxHeight: 200, overflowY: 'auto' }}>
              {products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()) || p.barcode?.includes(search)).map(p => (
                <div key={p.id} style={{ padding: '10px 15px', cursor: 'pointer', borderBottom: `1px solid ${T.colors.bgMuted}` }} onClick={() => handleProductSelect(p)}>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{p.name}</div>
                  <div style={{ fontSize: 11, color: T.colors.textMuted }}>SKU: {p.sku} | Price: ₹{p.price}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {formItem && (
          <div style={{ display: 'flex', gap: 15, marginLeft: 30, alignItems: 'center', animation: 'orbx-fadeIn 0.2s ease' }}>
            <div className="orbx-pos-input-group">
              <label className="orbx-pos-label">Product Name</label>
              <div style={{ fontWeight: 700, fontSize: 15, color: T.colors.brand }}>{formItem.name}</div>
            </div>
            <div className="orbx-pos-input-group" style={{ width: 80 }}>
              <label className="orbx-pos-label">Qty</label>
              <input 
                ref={qtyRef}
                className="orbx-input" 
                type="number" 
                value={formItem.qty} 
                onChange={e => updateFormItem({ qty: Number(e.target.value) })}
                onKeyDown={e => e.key === 'Enter' && addItemToCart()}
              />
            </div>
            <div className="orbx-pos-input-group" style={{ width: 100 }}>
              <label className="orbx-pos-label">Rate</label>
              <input 
                className="orbx-input" 
                type="number" 
                value={formItem.rate} 
                onChange={e => updateFormItem({ rate: Number(e.target.value) })}
              />
            </div>
            <div className="orbx-pos-input-group" style={{ width: 100 }}>
              <label className="orbx-pos-label">Discount</label>
              <div style={{ display: 'flex' }}>
                <input 
                  className="orbx-input" 
                  value={formItem.discount.value} 
                  onChange={e => updateFormItem({ discount: { ...formItem.discount, value: Number(e.target.value) } })}
                />
                <select 
                  className="orbx-select" 
                  style={{ width: 40, padding: 0 }}
                  value={formItem.discount.type}
                  onChange={e => updateFormItem({ discount: { ...formItem.discount, type: e.target.value } })}
                >
                  <option value="%">%</option>
                  <option value="₹">₹</option>
                </select>
              </div>
            </div>
            <div className="orbx-pos-input-group" style={{ width: 110 }}>
              <label className="orbx-pos-label">Amount</label>
              <div style={{ fontWeight: 800, fontSize: 16 }}>₹{formItem.amount.toFixed(2)}</div>
            </div>
            <div style={{ display: 'flex', gap: 8, marginLeft: 10 }}>
              <button className="orbx-btn orbx-btn-primary" onClick={addItemToCart}>Add Item</button>
              <button className="orbx-btn orbx-btn-secondary" onClick={() => setFormItem(null)}>Clear</button>
            </div>
          </div>
        )}
      </div>

      {/* ── Section 3: Bill Items Table ── */}
      <div className="orbx-pos-section-bottom">
        <div className="orbx-pos-table-container">
          <table className="orbx-pos-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Product Name</th>
                <th>Qty</th>
                <th>Rate</th>
                <th>Discount</th>
                <th style={{ textAlign: 'right' }}>Amount</th>
                <th style={{ width: 50 }}></th>
              </tr>
            </thead>
            <tbody>
              {cart.map((item, idx) => (
                <tr key={item.tempId}>
                  <td style={{ color: T.colors.textMuted }}>{idx + 1}</td>
                  <td style={{ fontWeight: 600 }}>{item.name}</td>
                  <td>{item.qty}</td>
                  <td>₹{item.rate}</td>
                  <td>{item.discount.value}{item.discount.type}</td>
                  <td style={{ textAlign: 'right', fontWeight: 700 }}>₹{item.amount.toFixed(2)}</td>
                  <td>
                    <button onClick={() => setCart(cart.filter(i => i.tempId !== item.tempId))} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                      <Icon name="trash" size={14} color={T.colors.danger} />
                    </button>
                  </td>
                </tr>
              ))}
              {cart.length === 0 && (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '100px 0', color: T.colors.textMuted }}>
                    <Icon name="cart" size={48} color={T.colors.bgMuted} />
                    <p style={{ marginTop: 10 }}>Your cart is empty. Scan products to begin billing.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Actions */}
        <div className="orbx-pos-footer">
          <div style={{ display: 'flex', gap: 10, marginRight: 'auto', alignItems: 'center' }}>
            <span className="orbx-pos-label">Payment Method</span>
            {['Cash', 'UPI', 'Card'].map(m => (
              <button 
                key={m} 
                onClick={() => setPayMode(m)}
                style={{ 
                  padding: '8px 18px', 
                  borderRadius: T.radius.md, 
                  border: `2px solid ${payMode === m ? T.colors.accent : T.colors.border}`,
                  background: payMode === m ? T.colors.accentSoft : 'transparent',
                  color: payMode === m ? T.colors.brand : T.colors.textMid,
                  fontWeight: payMode === m ? 700 : 500,
                  cursor: 'pointer',
                  transition: '0.2s'
                }}
              >
                {m}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 12 }}>
            <button className="orbx-btn orbx-btn-secondary" style={{ padding: '12px 25px' }} onClick={() => setCart([])}>Clear Bill</button>
            <button className="orbx-btn orbx-btn-brand" style={{ padding: '12px 30px' }} onClick={() => handleSave(false)}>Save Bill</button>
            <button className="orbx-btn orbx-btn-primary" style={{ padding: '12px 35px' }} onClick={() => handleSave(true)}>
              <Icon name="print" size={16} /> Save & Print
            </button>
          </div>
        </div>
      </div>

    </div>
  );
}
