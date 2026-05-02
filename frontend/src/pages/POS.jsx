import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import Icon from '../components/Icon';
import { tokens } from '../design/tokens';
import { db, queueForSync } from '../utils/db';
import toast from 'react-hot-toast';

const API_URL = '/api';

const MOCK_PRODUCTS = [
  { id: 'P001', name: 'Basmati Rice 5kg',      sku: 'RICE-BAS-5K', barcode: '8901234567890', price: 425, tax: 5,  stock: 142, category: 'Grocery' },
  { id: 'P002', name: 'Sunflower Oil 1L',       sku: 'OIL-SUN-1L',  barcode: '8901234567891', price: 185, tax: 5,  stock: 87,  category: 'Grocery' },
  { id: 'P003', name: 'Tata Tea Premium 500g',  sku: 'TEA-TAT-500', barcode: '8901234567892', price: 265, tax: 5,  stock: 56,  category: 'Beverage' },
  { id: 'P004', name: 'Amul Butter 500g',       sku: 'BTR-AML-500', barcode: '8901234567893', price: 280, tax: 12, stock: 34,  category: 'Dairy' },
  { id: 'P005', name: 'Colgate MaxFresh 150g',  sku: 'TBR-COL-150', barcode: '8901234567894', price: 95,  tax: 18, stock: 201, category: 'Personal Care' },
  { id: 'P006', name: 'Surf Excel 1kg',         sku: 'DET-SRF-1K',  barcode: '8901234567895', price: 220, tax: 18, stock: 73,  category: 'Household' },
  { id: 'P007', name: 'Parle-G 800g',           sku: 'BSC-PAR-800', barcode: '8901234567896', price: 75,  tax: 5,  stock: 315, category: 'Snacks' },
  { id: 'P008', name: 'Maggi Noodles 12pk',     sku: 'NDL-MAG-12',  barcode: '8901234567897', price: 180, tax: 5,  stock: 128, category: 'Snacks' },
  { id: 'P009', name: 'Dettol Handwash 250ml',  sku: 'HWS-DET-250', barcode: '8901234567898', price: 95,  tax: 18, stock: 92,  category: 'Personal Care' },
  { id: 'P010', name: 'Haldiram Bhujia 400g',   sku: 'SNK-HAL-400', barcode: '8901234567899', price: 135, tax: 12, stock: 67,  category: 'Snacks' },
  { id: 'P011', name: 'Vim Dishwash Bar 500g',  sku: 'DWS-VIM-500', barcode: '8901234567900', price: 45,  tax: 18, stock: 210, category: 'Household' },
  { id: 'P012', name: 'Nescafe Classic 200g',   sku: 'COF-NES-200', barcode: '8901234567901', price: 460, tax: 5,  stock: 29,  category: 'Beverage' },
];

const MOCK_CUSTOMERS = [
  { id: 'C001', name: 'Rajesh Kumar',  phone: '9876543210', points: 480,  credit: 2500 },
  { id: 'C002', name: 'Priya Sharma',  phone: '9876543211', points: 1200, credit: 0 },
  { id: 'C003', name: 'Anil Mehta',    phone: '9876543212', points: 320,  credit: 5000 },
  { id: 'C004', name: 'Sunita Patel',  phone: '9876543213', points: 750,  credit: 1200 },
];

export default function POS() {
  const [products,     setProducts]     = useState(MOCK_PRODUCTS);
  const [cart,         setCart]         = useState([]);
  const [search,       setSearch]       = useState('');
  const [discount,     setDiscount]     = useState(0);
  const [customer,     setCustomer]     = useState(null);
  const [payMode,      setPayMode]      = useState('Cash');
  const [barcodeMode,  setBarcodeMode]  = useState(false);
  const [showInvoice,  setShowInvoice]  = useState(false);
  const [showSuccess,  setShowSuccess]  = useState(false);
  const [lastInvNo,    setLastInvNo]    = useState('');
  const searchRef = useRef(null);

  // Load products from IndexedDB (offline) or API
  useEffect(() => {
    db.products.count().then(c => {
      if (c > 0) db.products.toArray().then(p => p.length && setProducts(p));
    });
    fetch(`${API_URL}/api/products`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    }).then(r => r.ok ? r.json() : null).then(d => d?.length && setProducts(d)).catch(() => {});
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'F1') { e.preventDefault(); searchRef.current?.focus(); }
      if (e.key === 'Escape') { setSearch(''); searchRef.current?.focus(); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const filtered = useMemo(() =>
    products.filter(p =>
      search ? (
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.sku?.toLowerCase().includes(search.toLowerCase()) ||
        p.barcode?.includes(search)
      ) : true
    ), [search, products]);

  const addToCart = useCallback((product) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === product.id);
      if (existing) return prev.map(i => i.id === product.id ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { ...product, qty: 1 }];
    });
    setSearch('');
    searchRef.current?.focus();
  }, []);

  const updateQty = (id, delta) => {
    setCart(prev => prev.map(i => i.id === id ? { ...i, qty: Math.max(1, i.qty + delta) } : i));
  };
  const removeItem = (id) => setCart(prev => prev.filter(i => i.id !== id));

  const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const taxTotal = cart.reduce((s, i) => s + (i.price * i.qty * i.tax / 100), 0);
  const discAmt  = subtotal * discount / 100;
  const total    = subtotal + taxTotal - discAmt;

  const handleCheckout = async () => {
    if (cart.length === 0) { toast.error('Cart is empty'); return; }
    const invNo = `INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    setLastInvNo(invNo);

    const saleData = {
      offline_id:    invNo,
      customer_name: customer?.name || 'Walk-in',
      customer_id:   customer?.id || null,
      items:         cart.map(i => ({ product_id: i.id, product_name: i.name, qty: i.qty, price: i.price, tax: i.tax })),
      subtotal, tax_total: taxTotal, discount_pct: discount, discount_amt: discAmt,
      total_amount: total, payment_mode: payMode,
      synced: false, timestamp: new Date().toISOString(),
    };

    try {
      await db.sales.add(saleData);
      await queueForSync('sale', saleData);
    } catch (e) { console.error('IndexedDB save failed', e); }

    setShowSuccess(true);
    setTimeout(() => { setShowSuccess(false); setCart([]); setDiscount(0); setCustomer(null); }, 2800);
  };

  const T = tokens;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', height: 'calc(100vh - 61px)', gap: 0 }}>

      {/* ── Left: Product Grid ── */}
      <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* Search bar */}
        <div style={{ padding: 16, background: T.colors.bgCard, borderBottom: `1px solid ${T.colors.border}`, display: 'flex', gap: 10 }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <div style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)' }}>
              <Icon name={barcodeMode ? 'barcode' : 'search'} size={16} color={T.colors.textMuted} />
            </div>
            <input
              ref={searchRef}
              className="orbx-input"
              style={{ paddingLeft: 36 }}
              placeholder={barcodeMode ? 'Scan barcode... (F1)' : 'Search by name, SKU or barcode... (F1)'}
              value={search}
              onChange={e => setSearch(e.target.value)}
              autoFocus
            />
          </div>
          <button
            className={`orbx-btn ${barcodeMode ? 'orbx-btn-primary' : 'orbx-btn-secondary'}`}
            onClick={() => setBarcodeMode(!barcodeMode)}
            title="Toggle barcode mode"
          >
            <Icon name="barcode" size={16} />
          </button>
        </div>

        {/* Customer selector */}
        <div style={{ padding: '8px 16px', background: T.colors.bgMuted, borderBottom: `1px solid ${T.colors.border}`, display: 'flex', alignItems: 'center', gap: 10 }}>
          <Icon name="user" size={15} color={T.colors.textMuted} />
          <span style={{ fontSize: 12, color: T.colors.textMuted }}>Customer:</span>
          <select
            className="orbx-select"
            style={{ border: 'none', background: 'transparent', fontSize: 13, fontWeight: 600, color: T.colors.text, cursor: 'pointer', outline: 'none' }}
            value={customer?.id || ''}
            onChange={e => setCustomer(MOCK_CUSTOMERS.find(c => c.id === e.target.value) || null)}
          >
            <option value="">Walk-in Customer</option>
            {MOCK_CUSTOMERS.map(c => <option key={c.id} value={c.id}>{c.name} — {c.phone}</option>)}
          </select>
          {customer && <span className="orbx-badge orbx-badge-success">{customer.points} pts</span>}
        </div>

        {/* Product cards */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(155px, 1fr))', gap: 10 }}>
            {filtered.map(p => {
              const inCart = cart.find(i => i.id === p.id);
              return (
                <div
                  key={p.id}
                  onClick={() => addToCart(p)}
                  style={{ background: T.colors.bgCard, border: `1px solid ${T.colors.border}`, borderRadius: T.radius.lg, padding: '14px 12px', cursor: 'pointer', transition: 'all 0.15s', position: 'relative', overflow: 'hidden' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = T.colors.accent; e.currentTarget.style.boxShadow = T.shadows.md; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = T.colors.border; e.currentTarget.style.boxShadow = 'none'; }}
                >
                  {inCart && (
                    <div style={{ position: 'absolute', top: 8, right: 8, width: 20, height: 20, borderRadius: '50%', background: T.colors.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800, color: T.colors.brand }}>
                      {inCart.qty}
                    </div>
                  )}
                  <div style={{ width: 40, height: 40, background: T.colors.accentSoft, borderRadius: T.radius.md, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
                    <Icon name="package" size={18} color={T.colors.accent} />
                  </div>
                  <div style={{ fontSize: 12.5, fontWeight: 600, color: T.colors.text, marginBottom: 4, lineHeight: 1.3 }}>{p.name}</div>
                  <div style={{ fontSize: 11, color: T.colors.textMuted, marginBottom: 8 }}>{p.category}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 15, fontWeight: 800, color: T.colors.brand }}>₹{p.price}</span>
                    <span style={{ fontSize: 10, color: p.stock < 20 ? T.colors.danger : T.colors.textMuted }}>{p.stock} left</span>
                  </div>
                </div>
              );
            })}
          </div>
          {filtered.length === 0 && (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: T.colors.textMuted }}>
              <Icon name="search" size={36} color={T.colors.borderDark} />
              <p style={{ marginTop: 12, fontSize: 14 }}>No products found</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Right: Cart & Checkout ── */}
      <div style={{ background: T.colors.bgCard, borderLeft: `1px solid ${T.colors.border}`, display: 'flex', flexDirection: 'column' }}>

        {/* Cart header */}
        <div style={{ padding: '16px 20px', borderBottom: `1px solid ${T.colors.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Icon name="cart" size={17} color={T.colors.accent} />
            <span style={{ fontSize: 15, fontWeight: 700 }}>Cart</span>
            {cart.length > 0 && <span className="orbx-badge orbx-badge-brand">{cart.reduce((s, i) => s + i.qty, 0)} items</span>}
          </div>
          {cart.length > 0 && (
            <button className="orbx-btn orbx-btn-danger" style={{ padding: '5px 10px', fontSize: 12 }} onClick={() => setCart([])}>
              Clear All
            </button>
          )}
        </div>

        {/* Cart items */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px' }}>
          {cart.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: T.colors.textMuted }}>
              <Icon name="cart" size={40} color={T.colors.borderDark} />
              <p style={{ marginTop: 12, fontSize: 13 }}>Cart is empty</p>
              <p style={{ fontSize: 11, marginTop: 4 }}>Click products or scan barcode to add</p>
            </div>
          ) : (
            cart.map(item => (
              <div key={item.id} style={{ display: 'flex', gap: 10, padding: '10px 0', borderBottom: `1px solid ${T.colors.border}` }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</div>
                  <div style={{ fontSize: 11, color: T.colors.textMuted }}>₹{item.price} × {item.qty} = <strong style={{ color: T.colors.text }}>₹{item.price * item.qty}</strong></div>
                  <div style={{ fontSize: 10, color: T.colors.textMuted }}>GST {item.tax}%</div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                  <button onClick={() => removeItem(item.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                    <Icon name="x" size={14} color={T.colors.textMuted} />
                  </button>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {[[-1, 'minus'], [1, 'plus']].map(([d, ic]) => (
                      <button key={d} onClick={() => updateQty(item.id, d)} style={{ width: 22, height: 22, borderRadius: '50%', border: `1px solid ${T.colors.border}`, background: T.colors.bgMuted, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Icon name={ic} size={12} />
                      </button>
                    ))}
                    <span style={{ fontSize: 13, fontWeight: 700, minWidth: 20, textAlign: 'center' }}>{item.qty}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Totals & Checkout */}
        {cart.length > 0 && (
          <div style={{ padding: '16px 20px', borderTop: `1px solid ${T.colors.border}` }}>
            {/* Discount */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <Icon name="tag" size={14} color={T.colors.textMuted} />
              <span style={{ fontSize: 12, color: T.colors.textMuted, flex: 1 }}>Discount</span>
              <div style={{ display: 'flex', border: `1px solid ${T.colors.border}`, borderRadius: T.radius.md, overflow: 'hidden' }}>
                {[0, 5, 10, 15, 20].map(d => (
                  <button key={d} onClick={() => setDiscount(d)} style={{ padding: '4px 8px', background: discount === d ? T.colors.accent : 'transparent', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: discount === d ? 700 : 400, color: discount === d ? T.colors.brand : T.colors.textMid }}>
                    {d === 0 ? 'None' : `${d}%`}
                  </button>
                ))}
              </div>
            </div>

            {/* Bill summary */}
            <div style={{ background: T.colors.bgMuted, borderRadius: T.radius.md, padding: '12px 14px', marginBottom: 12 }}>
              {[
                { label: 'Subtotal', value: `₹${subtotal.toFixed(2)}` },
                { label: 'GST', value: `₹${taxTotal.toFixed(2)}` },
                discount > 0 && { label: `Discount (${discount}%)`, value: `-₹${discAmt.toFixed(2)}`, color: T.colors.success },
              ].filter(Boolean).map((row, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 12.5, color: T.colors.textMid }}>{row.label}</span>
                  <span style={{ fontSize: 12.5, fontWeight: 500, color: row.color || T.colors.text }}>{row.value}</span>
                </div>
              ))}
              <div style={{ borderTop: `1px solid ${T.colors.border}`, paddingTop: 8, display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 15, fontWeight: 700 }}>Total</span>
                <span style={{ fontSize: 18, fontWeight: 800, color: T.colors.brand }}>₹{total.toFixed(2)}</span>
              </div>
            </div>

            {/* Payment mode */}
            <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
              {['Cash', 'Card', 'UPI'].map(m => (
                <button key={m} onClick={() => setPayMode(m)} style={{ flex: 1, padding: '8px', border: `1.5px solid ${payMode === m ? T.colors.accent : T.colors.border}`, borderRadius: T.radius.md, background: payMode === m ? T.colors.accentSoft : 'transparent', cursor: 'pointer', fontSize: 13, fontWeight: payMode === m ? 700 : 500, color: payMode === m ? T.colors.brand : T.colors.textMid, transition: 'all 0.15s' }}>
                  {m}
                </button>
              ))}
            </div>

            <button className="orbx-btn orbx-btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '13px', fontSize: 15, fontWeight: 700, borderRadius: T.radius.md }} onClick={handleCheckout}>
              Collect ₹{total.toFixed(2)} — {payMode}
            </button>

            <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
              <button className="orbx-btn orbx-btn-secondary" style={{ flex: 1, justifyContent: 'center', fontSize: 12 }} onClick={() => setShowInvoice(true)}>
                <Icon name="print" size={14} /> Preview Invoice
              </button>
              <button className="orbx-btn orbx-btn-secondary" style={{ flex: 1, justifyContent: 'center', fontSize: 12, color: '#25D366' }}>
                <Icon name="whatsapp" size={14} color="#25D366" /> WhatsApp
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Success Toast */}
      {showSuccess && (
        <div style={{ position: 'fixed', bottom: 24, right: 24, background: T.colors.success, color: 'white', padding: '14px 20px', borderRadius: T.radius.lg, display: 'flex', alignItems: 'center', gap: 10, boxShadow: T.shadows.xl, animation: 'orbx-fadeIn 0.3s ease', zIndex: 1000 }}>
          <Icon name="check" size={18} color="white" />
          <div>
            <div style={{ fontWeight: 700, fontSize: 14 }}>Payment Successful!</div>
            <div style={{ fontSize: 11, opacity: 0.85 }}>{lastInvNo} generated · Syncing...</div>
          </div>
        </div>
      )}

      {/* Invoice Modal */}
      {showInvoice && (
        <div className="orbx-modal-overlay">
          <div className="orbx-modal" style={{ maxWidth: 420, maxHeight: '85vh', overflowY: 'auto', padding: 28 }}>
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: T.colors.brand }}>OrbX ERP</div>
              <div style={{ fontSize: 11, color: T.colors.textMuted }}>Main Branch · GSTIN: 33AABCU9603R1ZX</div>
              <div style={{ fontSize: 13, fontWeight: 600, marginTop: 8 }}>{lastInvNo || 'INV-PREVIEW'}</div>
              <div style={{ fontSize: 11, color: T.colors.textMuted }}>{new Date().toLocaleString('en-IN')}</div>
            </div>
            <div style={{ borderTop: '1px dashed #ccc', borderBottom: '1px dashed #ccc', padding: '12px 0', marginBottom: 12 }}>
              {cart.map((item, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
                  <span>{item.name} × {item.qty}</span>
                  <span>₹{(item.price * item.qty).toFixed(2)}</span>
                </div>
              ))}
            </div>
            <div style={{ fontSize: 13, color: T.colors.textMid }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}><span>Subtotal</span><span>₹{subtotal.toFixed(2)}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}><span>GST</span><span>₹{taxTotal.toFixed(2)}</span></div>
              {discount > 0 && <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, color: T.colors.success }}><span>Discount</span><span>-₹{discAmt.toFixed(2)}</span></div>}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: 16, color: T.colors.text, borderTop: '1px solid #eee', paddingTop: 8, marginTop: 4 }}><span>TOTAL</span><span>₹{total.toFixed(2)}</span></div>
            </div>
            <div style={{ textAlign: 'center', marginTop: 16, fontSize: 11, color: T.colors.textMuted }}>Thank you for shopping · Powered by OrbX ERP</div>
            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <button className="orbx-btn orbx-btn-primary" style={{ flex: 1, justifyContent: 'center' }} onClick={handleCheckout}>
                <Icon name="check" size={14} /> Confirm & Pay
              </button>
              <button className="orbx-btn orbx-btn-secondary" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setShowInvoice(false)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
