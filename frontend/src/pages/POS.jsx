import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import Icon from '../components/Icon';
import { tokens } from '../design/tokens';
import { db, queueForSync } from '../utils/db';
import toast from 'react-hot-toast';

const API_URL = '/api';

export default function POS() {
  const [products,     setProducts]     = useState([]);
  const [cart,         setCart]         = useState([]);
  const [search,       setSearch]       = useState('');
  const [customer,     setCustomer]     = useState({ name: 'Walk-in', phone: '', address: '' });
  const [globalDisc,   setGlobalDisc]   = useState({ value: 0, type: '%' });
  const [payMode,      setPayMode]      = useState('Cash');
  const [loading,      setLoading]      = useState(false);
  
  const [formItem, setFormItem] = useState(null); 
  
  const searchRef = useRef(null);
  const qtyRef = useRef(null);
  const T = tokens;

  useEffect(() => {
    fetch(`${API_URL}/products`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    }).then(r => r.ok ? r.json() : []).then(d => setProducts(d)).catch(() => {});
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'F1') { e.preventDefault(); searchRef.current?.focus(); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const handleProductSelect = (p) => {
    const price = Number(p.price) || 0;
    setFormItem({
      id: p.id,
      name: p.name,
      qty: 1,
      rate: price,
      discount: { value: 0, type: '₹' },
      amount: price,
      sku: p.sku,
      barcode: p.barcode,
      tax: Number(p.tax_percent) || 0
    });
    setSearch('');
    setTimeout(() => qtyRef.current?.focus(), 50);
  };

  const updateFormItem = (updates) => {
    setFormItem(prev => {
      const next = { ...prev, ...updates };
      const rate = Number(next.rate) || 0;
      const qty = Number(next.qty) || 0;
      const discVal = Number(next.discount.value) || 0;
      
      const discAmt = next.discount.type === '%' 
        ? (rate * qty * discVal / 100)
        : discVal;
      next.amount = (rate * qty) - discAmt;
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
    const subtotal = cart.reduce((s, i) => s + (Number(i.amount) || 0), 0);
    const gDiscVal = Number(globalDisc.value) || 0;
    const discAmt = globalDisc.type === '%' ? (subtotal * gDiscVal / 100) : gDiscVal;
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
    <div className="orbx-pos-container orbx-page-enter" style={{ background: '#fff' }}>
      
      {/* ── Section 1: Top Panel ── */}
      <div className="orbx-pos-section-top" style={{ height: 120 }}>
        <div style={{ flex: 1, padding: '20px 30px', display: 'flex', gap: 40, borderRight: `1px solid ${T.colors.border}` }}>
          <div className="orbx-pos-input-group" style={{ flex: 1.5 }}>
            <label className="orbx-pos-label">Customer Name</label>
            <input 
              className="orbx-input" 
              style={{ fontSize: 16, height: 42 }}
              placeholder="Search or Enter Name" 
              value={customer.name} 
              onChange={e => setCustomer({...customer, name: e.target.value})}
            />
          </div>
          <div className="orbx-pos-input-group" style={{ width: 220 }}>
            <label className="orbx-pos-label">Phone Number</label>
            <input 
              className="orbx-input" 
              style={{ fontSize: 16, height: 42 }}
              placeholder="98765..." 
              value={customer.phone} 
              onChange={e => setCustomer({...customer, phone: e.target.value})}
            />
          </div>
          <div className="orbx-pos-input-group" style={{ flex: 1 }}>
            <label className="orbx-pos-label">Address</label>
            <input 
              className="orbx-input" 
              style={{ fontSize: 16, height: 42 }}
              placeholder="Billing Address" 
              value={customer.address} 
              onChange={e => setCustomer({...customer, address: e.target.value})}
            />
          </div>
        </div>

        <div className="orbx-pos-summary-box" style={{ padding: '0 30px', gap: 30, minWidth: 'fit-content' }}>
          <div style={{ textAlign: 'center' }}>
            <div className="orbx-pos-label" style={{ color: T.colors.textMuted, marginBottom: 8 }}>Total Qty</div>
            <div style={{ fontSize: 30, fontWeight: 800 }}>{totals.qty}</div>
          </div>
          <div style={{ height: 60, width: 1, background: 'rgba(255,255,255,0.1)' }} />
          <div>
            <div className="orbx-pos-label" style={{ color: T.colors.textMuted, marginBottom: 8 }}>Gross Amount</div>
            <div style={{ fontSize: 42, fontWeight: 900, color: T.colors.accent }}>₹{(Number(totals.gross) || 0).toFixed(2)}</div>
          </div>
          <div className="orbx-pos-input-group" style={{ width: 140 }}>
            <label className="orbx-pos-label" style={{ color: T.colors.textMuted }}>Global Disc</label>
            <div style={{ display: 'flex', gap: 4 }}>
              <input 
                className="orbx-input" 
                style={{ background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', width: 80, height: 38, fontSize: 18 }}
                value={globalDisc.value}
                onChange={e => setGlobalDisc({...globalDisc, value: e.target.value})}
              />
              <select 
                style={{ background: 'transparent', color: '#fff', border: 'none', fontSize: 20, fontWeight: 700, cursor: 'pointer' }}
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
      <div className="orbx-pos-section-mid" style={{ height: 100, background: '#f8fafc', padding: '0 30px' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 250, maxWidth: 450 }}>
          <Icon name="search" size={20} color={T.colors.textMuted} style={{ position: 'absolute', left: 16, top: 15 }} />
          <input 
            ref={searchRef}
            className="orbx-input" 
            style={{ paddingLeft: 48, height: 50, borderRadius: 12, fontSize: 17, boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}
            placeholder="Scan Barcode or Search Product (F1)"
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={async e => {
              if (e.key === 'Enter' && search) {
                const p = products.find(p => p.barcode === search);
                if (p) {
                  const price = Number(p.price) || 0;
                  const newItem = {
                    id: p.id, name: p.name, qty: 1, rate: price,
                    discount: { value: 0, type: '₹' }, amount: price,
                    tempId: Date.now(), tax: Number(p.tax_percent) || 0
                  };
                  setCart(prev => [...prev, newItem]);
                  setSearch('');
                  toast.success(`Added ${p.name}`, { duration: 1000, position: 'bottom-center' });
                } else {
                  const found = products.find(p => p.name.toLowerCase().includes(search.toLowerCase()) || p.sku === search);
                  if (found) handleProductSelect(found);
                }
              }
            }}
          />
          {search && (
            <div style={{ position: 'absolute', top: 58, left: 0, right: 0, background: '#fff', border: `1px solid ${T.colors.border}`, borderRadius: T.radius.md, boxShadow: T.shadows.lg, zIndex: 100, maxHeight: 250, overflowY: 'auto' }}>
              {products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()) || p.barcode?.includes(search)).map(p => (
                <div key={p.id} style={{ padding: '12px 20px', cursor: 'pointer', borderBottom: `1px solid ${T.colors.bgMuted}` }} onClick={() => handleProductSelect(p)}>
                  <div style={{ fontWeight: 600, fontSize: 15 }}>{p.name}</div>
                  <div style={{ fontSize: 12, color: T.colors.textMuted }}>SKU: {p.sku} | Price: ₹{p.price}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {formItem && (
          <div style={{ display: 'flex', gap: 15, marginLeft: 20, alignItems: 'center', animation: 'orbx-fadeIn 0.2s ease', background: '#fff', padding: '12px 20px', borderRadius: 12, border: `1px solid ${T.colors.accentSoft}`, boxShadow: T.shadows.sm, flexWrap: 'wrap' }}>
            <div className="orbx-pos-input-group">
              <label className="orbx-pos-label">Product Name</label>
              <div style={{ fontWeight: 800, fontSize: 17, color: T.colors.brand }}>{formItem.name}</div>
            </div>
            <div className="orbx-pos-input-group" style={{ width: 90 }}>
              <label className="orbx-pos-label">Qty</label>
              <input 
                ref={qtyRef}
                className="orbx-input" 
                style={{ fontSize: 18, height: 42, textAlign: 'center' }}
                type="number" 
                value={formItem.qty} 
                onChange={e => updateFormItem({ qty: e.target.value })}
                onKeyDown={e => e.key === 'Enter' && addItemToCart()}
              />
            </div>
            <div className="orbx-pos-input-group" style={{ width: 110 }}>
              <label className="orbx-pos-label">Rate</label>
              <input 
                className="orbx-input" 
                style={{ fontSize: 18, height: 42 }}
                type="number" 
                value={formItem.rate} 
                onChange={e => updateFormItem({ rate: e.target.value })}
              />
            </div>
            <div className="orbx-pos-input-group" style={{ width: 120 }}>
              <label className="orbx-pos-label">Item Discount</label>
              <div style={{ display: 'flex', gap: 4 }}>
                <input 
                  className="orbx-input" 
                  style={{ fontSize: 18, height: 42 }}
                  value={formItem.discount.value} 
                  onChange={e => updateFormItem({ discount: { ...formItem.discount, value: e.target.value } })}
                />
                <select 
                  className="orbx-select" 
                  style={{ width: 45, padding: 0, fontSize: 18 }}
                  value={formItem.discount.type}
                  onChange={e => updateFormItem({ discount: { ...formItem.discount, type: e.target.value } })}
                >
                  <option value="%">%</option>
                  <option value="₹">₹</option>
                </select>
              </div>
            </div>
            <div className="orbx-pos-input-group" style={{ width: 130 }}>
              <label className="orbx-pos-label">Net Amount</label>
              <div style={{ fontWeight: 900, fontSize: 20, color: T.colors.brand }}>₹{(Number(formItem.amount) || 0).toFixed(2)}</div>
            </div>
            <div style={{ display: 'flex', gap: 10, marginLeft: 10 }}>
              <button className="orbx-btn orbx-btn-primary" style={{ padding: '12px 25px', fontSize: 15 }} onClick={addItemToCart}>Add to Bill</button>
              <button className="orbx-btn orbx-btn-secondary" style={{ padding: '12px 20px' }} onClick={() => setFormItem(null)}>Clear</button>
            </div>
          </div>
        )}
      </div>

      {/* ── Section 3: Bill Items Table ── */}
      <div className="orbx-pos-section-bottom" style={{ padding: '0 30px' }}>
        <div className="orbx-pos-table-container" style={{ overflowY: 'auto' }}>
          <table className="orbx-pos-table">
            <thead>
              <tr style={{ height: 50 }}>
                <th style={{ width: 60 }}>#</th>
                <th>Product Name</th>
                <th style={{ width: 100 }}>Qty</th>
                <th style={{ width: 150 }}>Rate</th>
                <th style={{ width: 150 }}>Discount</th>
                <th style={{ textAlign: 'right', width: 180 }}>Amount</th>
                <th style={{ width: 70 }}></th>
              </tr>
            </thead>
            <tbody>
              {cart.map((item, idx) => (
                <tr key={item.tempId} style={{ height: 45 }}>
                  <td style={{ color: T.colors.textMuted }}>{idx + 1}</td>
                  <td style={{ fontWeight: 700, fontSize: 15 }}>{item.name}</td>
                  <td style={{ fontSize: 15 }}>{item.qty}</td>
                  <td style={{ fontSize: 15 }}>₹{(Number(item.rate) || 0).toFixed(2)}</td>
                  <td style={{ fontSize: 15, color: T.colors.success }}>{item.discount.value}{item.discount.type}</td>
                  <td style={{ textAlign: 'right', fontWeight: 800, fontSize: 16 }}>₹{(Number(item.amount) || 0).toFixed(2)}</td>
                  <td style={{ textAlign: 'center' }}>
                    <button onClick={() => setCart(cart.filter(i => i.tempId !== item.tempId))} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 8 }}>
                      <Icon name="trash" size={16} color={T.colors.danger} />
                    </button>
                  </td>
                </tr>
              ))}
              {cart.length === 0 && (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '120px 0', color: T.colors.textMuted }}>
                    <Icon name="cart" size={60} color={T.colors.bgMuted} />
                    <p style={{ marginTop: 15, fontSize: 16 }}>Your cart is empty. Scan products to begin billing.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Actions */}
        <div className="orbx-pos-footer" style={{ height: 100, padding: '0' }}>
          <div style={{ display: 'flex', gap: 15, marginRight: 'auto', alignItems: 'center' }}>
            <span className="orbx-pos-label" style={{ fontSize: 13 }}>PAYMENT METHOD</span>
            {['Cash', 'UPI', 'Card'].map(m => (
              <button 
                key={m} 
                onClick={() => setPayMode(m)}
                style={{ 
                  padding: '12px 30px', 
                  borderRadius: 10, 
                  border: `2px solid ${payMode === m ? T.colors.accent : T.colors.border}`,
                  background: payMode === m ? T.colors.accentSoft : 'transparent',
                  color: payMode === m ? T.colors.brand : T.colors.textMid,
                  fontWeight: payMode === m ? 800 : 600,
                  fontSize: 15,
                  cursor: 'pointer',
                  transition: '0.2s'
                }}
              >
                {m}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 15 }}>
            <button className="orbx-btn orbx-btn-secondary" style={{ padding: '15px 35px', fontSize: 16 }} onClick={() => setCart([])}>Clear Bill</button>
            <button className="orbx-btn orbx-btn-brand" style={{ padding: '15px 40px', fontSize: 16 }} onClick={() => handleSave(false)}>Save Bill</button>
            <button className="orbx-btn orbx-btn-primary" style={{ padding: '15px 50px', fontSize: 18, fontWeight: 800 }} onClick={() => handleSave(true)}>
              <Icon name="print" size={20} /> Save & Print
            </button>
          </div>
        </div>
      </div>

    </div>
  );
}
