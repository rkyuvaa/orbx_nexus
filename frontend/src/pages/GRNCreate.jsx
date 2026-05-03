import React, { useState, useEffect } from 'react';
import Icon from '../components/Icon';
import { tokens as T } from '../design/tokens';
import toast from 'react-hot-toast';
import { useNavigate, useLocation } from 'react-router-dom';

export default function GRNCreate() {
    const navigate = useNavigate();
    const location = useLocation();
    const po = location.state?.po;
    
    const [items, setItems] = useState([]);
    const [barcodeConfig, setBarcodeConfig] = useState({ enabled: true, prefix: 'SAR' });
    const [loading, setLoading] = useState(false);
    const token = localStorage.getItem('token');

    useEffect(() => {
        if (!po) {
            toast.error('No Purchase Order selected');
            navigate('/purchases');
            return;
        }
        fetchPODetails();
    }, [po]);

    const fetchPODetails = async () => {
        try {
            const res = await fetch(`/api/purchases/${po.id}`, { headers: { Authorization: `Bearer ${token}` } });
            const data = await res.json();
            setItems(data.items.map(i => ({
                ...i,
                quantity: i.qty - i.received_qty, // Default to remaining qty
                attributes: i.attributes || {}
            })));
        } catch (err) { toast.error('Failed to load PO details'); }
    };

    const updateQty = (id, val) => {
        setItems(items.map(i => i.id === id ? { ...i, quantity: parseInt(val) || 0 } : i));
    };

    const handleCreateGRN = async () => {
        const validItems = items.filter(i => i.quantity > 0);
        if (validItems.length === 0) return toast.error('Enter received quantities');

        setLoading(true);
        try {
            const res = await fetch('/api/grns', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({
                    purchase_id: po.id,
                    items: validItems,
                    barcode_config: barcodeConfig
                })
            });
            if (res.ok) {
                toast.success('Goods Receipt Note created and pending approval');
                navigate('/grn');
            }
        } catch (err) { toast.error('Failed to create GRN'); }
        finally { setLoading(false); }
    };

    if (!po) return null;

    return (
        <div className="orbx-page-enter" style={{ padding: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 32 }}>
                <button className="orbx-btn orbx-btn-secondary" onClick={() => navigate('/purchases')}><Icon name="arrow-left" size={16} /></button>
                <div>
                    <h2 style={{ fontSize: 24, fontWeight: 800, color: T.colors.text }}>Receive Goods (GRN)</h2>
                    <p style={{ fontSize: 14, color: T.colors.textMuted }}>Processing receipt for {po.po_number} — {po.supplier_name}</p>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: 24 }}>
                <div className="orbx-card" style={{ padding: 0, overflow: 'hidden' }}>
                    <div style={{ padding: '16px 20px', borderBottom: `1px solid ${T.colors.border}`, fontWeight: 700 }}>Items Expected</div>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ background: T.colors.bgMuted, borderBottom: `1px solid ${T.colors.border}` }}>
                                <th style={{ textAlign: 'left', padding: '12px 20px', fontSize: 11, color: T.colors.textMuted }}>PRODUCT</th>
                                <th style={{ textAlign: 'left', padding: '12px 20px', fontSize: 11, color: T.colors.textMuted }}>ATTRIBUTES</th>
                                <th style={{ textAlign: 'left', padding: '12px 20px', fontSize: 11, color: T.colors.textMuted }}>PENDING</th>
                                <th style={{ textAlign: 'left', padding: '12px 20px', fontSize: 11, color: T.colors.textMuted }}>RECEIVED QTY</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map(item => (
                                <tr key={item.id} className="orbx-table-row">
                                    <td style={{ padding: '16px 20px' }}>
                                        <div style={{ fontSize: 14, fontWeight: 700 }}>{item.product_name}</div>
                                        <div style={{ fontSize: 11, color: T.colors.textMuted }}>{item.sku}</div>
                                    </td>
                                    <td style={{ padding: '16px 20px' }}>
                                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                            {Object.entries(item.attributes).map(([k, v]) => v && (
                                                <span key={k} style={{ fontSize: 10, background: T.colors.bgMuted, padding: '2px 6px', borderRadius: 4, textTransform: 'capitalize' }}>
                                                    {k}: {v}
                                                </span>
                                            ))}
                                        </div>
                                    </td>
                                    <td style={{ padding: '16px 20px', fontSize: 14, fontWeight: 600 }}>{item.qty - item.received_qty}</td>
                                    <td style={{ padding: '16px 20px' }}>
                                        <input 
                                            type="number" 
                                            className="orbx-input" 
                                            style={{ width: 100, border: item.quantity > (item.qty - item.received_qty) ? `1.5px solid ${T.colors.warning}` : '' }} 
                                            value={item.quantity} 
                                            onChange={e => updateQty(item.id, e.target.value)} 
                                        />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                    <div className="orbx-card">
                        <h4 style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>Barcode Options</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                                <input type="checkbox" checked={barcodeConfig.enabled} onChange={e => setBarcodeConfig({ ...barcodeConfig, enabled: e.target.checked })} />
                                <span style={{ fontSize: 13, fontWeight: 500 }}>Generate Unit Barcodes</span>
                            </label>

                            {barcodeConfig.enabled && (
                                <div>
                                    <label style={{ fontSize: 11, fontWeight: 700, color: T.colors.textMuted, display: 'block', marginBottom: 4 }}>PREFIX (e.g. SAR, MEN, FAB)</label>
                                    <input className="orbx-input" value={barcodeConfig.prefix} onChange={e => setBarcodeConfig({ ...barcodeConfig, prefix: e.target.value.toUpperCase() })} />
                                </div>
                            )}
                            
                            <div style={{ marginTop: 8, padding: 12, background: T.colors.bgMuted, borderRadius: T.radius.md, border: `1px solid ${T.colors.border}` }}>
                                <div style={{ fontSize: 11, color: T.colors.textMuted }}>PREVIEW</div>
                                <div style={{ fontSize: 14, fontWeight: 800, color: T.colors.brand, letterSpacing: 1 }}>
                                    {barcodeConfig.enabled ? `${barcodeConfig.prefix}-XXXXXX` : 'NO BARCODE'}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="orbx-card" style={{ background: T.colors.brand, color: 'white' }}>
                        <div style={{ marginBottom: 20 }}>
                            <div style={{ fontSize: 11, opacity: 0.8 }}>TOTAL ITEMS RECEIVING</div>
                            <div style={{ fontSize: 24, fontWeight: 900 }}>{items.reduce((sum, i) => sum + i.quantity, 0)} Units</div>
                        </div>
                        <button 
                            className="orbx-btn orbx-btn-primary" 
                            style={{ width: '100%', padding: '14px', justifyContent: 'center' }}
                            onClick={handleCreateGRN}
                            disabled={loading}
                        >
                            {loading ? 'Processing...' : 'Submit to Manager'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
