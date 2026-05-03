import React, { useState, useEffect } from 'react';
import Icon from '../components/Icon';
import { tokens as T } from '../design/tokens';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

export default function GRN() {
    const navigate = useNavigate();
    const [grns, setGrns] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedGrn, setSelectedGrn] = useState(null);
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    useEffect(() => {
        fetchGrns();
    }, []);

    const fetchGrns = async () => {
        try {
            const res = await fetch('/api/grns', { headers: { Authorization: `Bearer ${token}` } });
            setGrns(await res.json());
        } catch (err) { toast.error('Failed to load GRNs'); }
        finally { setLoading(false); }
    };

    const handleApprove = async (id) => {
        if (!window.confirm('Approve this GRN? This will update warehouse inventory immediately.')) return;
        try {
            const res = await fetch(`/api/grns/${id}/approve`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                toast.success('GRN Approved and Stock Updated');
                fetchGrns();
                setSelectedGrn(null);
            } else {
                const data = await res.json();
                toast.error(data.error);
            }
        } catch (err) { toast.error('Approval failed'); }
    };

    const handleReject = async (id) => {
        const reason = window.prompt('Enter rejection reason:');
        if (!reason) return;
        try {
            const res = await fetch(`/api/grns/${id}/reject`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ reason })
            });
            if (res.ok) {
                toast.success('GRN Rejected');
                fetchGrns();
                setSelectedGrn(null);
            }
        } catch (err) { toast.error('Rejection failed'); }
    };

    const viewDetails = async (id) => {
        try {
            const res = await fetch(`/api/grns/${id}`, { headers: { Authorization: `Bearer ${token}` } });
            setSelectedGrn(await res.json());
        } catch (err) { toast.error('Failed to load details'); }
    };

    return (
        <div className="orbx-page-enter" style={{ padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
                <div>
                    <h2 style={{ fontSize: 24, fontWeight: 800, color: T.colors.text }}>GRN Approval</h2>
                    <p style={{ fontSize: 14, color: T.colors.textMuted }}>Review and approve goods receipt for warehouse stock entry</p>
                </div>
                <button className="orbx-btn orbx-btn-primary" onClick={() => navigate('/purchases')}>
                    <Icon name="plus" size={14} /> New Receipt (from PO)
                </button>
            </div>

            <div className="orbx-card" style={{ padding: 0, overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ background: T.colors.bgMuted, borderBottom: `1px solid ${T.colors.border}` }}>
                            <th style={{ textAlign: 'left', padding: '12px 20px', fontSize: 11, color: T.colors.textMuted }}>GRN NUMBER</th>
                            <th style={{ textAlign: 'left', padding: '12px 20px', fontSize: 11, color: T.colors.textMuted }}>PO REF</th>
                            <th style={{ textAlign: 'left', padding: '12px 20px', fontSize: 11, color: T.colors.textMuted }}>SUPPLIER</th>
                            <th style={{ textAlign: 'left', padding: '12px 20px', fontSize: 11, color: T.colors.textMuted }}>STATUS</th>
                            <th style={{ textAlign: 'left', padding: '12px 20px', fontSize: 11, color: T.colors.textMuted }}>CREATED BY</th>
                            <th style={{ textAlign: 'right', padding: '12px 20px', fontSize: 11, color: T.colors.textMuted }}>ACTIONS</th>
                        </tr>
                    </thead>
                    <tbody>
                        {grns.map(g => (
                            <tr key={g.id} className="orbx-table-row">
                                <td style={{ padding: '16px 20px' }}>
                                    <div style={{ fontSize: 14, fontWeight: 700, color: T.colors.brand }}>{g.grn_number}</div>
                                    <div style={{ fontSize: 11, color: T.colors.textMuted }}>{new Date(g.created_at).toLocaleDateString()}</div>
                                </td>
                                <td style={{ padding: '16px 20px', fontSize: 14, fontWeight: 600 }}>{g.po_number}</td>
                                <td style={{ padding: '16px 20px', fontSize: 14 }}>{g.supplier_name}</td>
                                <td style={{ padding: '16px 20px' }}>
                                    <span className={`orbx-badge ${
                                        g.status === 'approved' ? 'orbx-badge-success' : 
                                        g.status === 'rejected' ? 'orbx-badge-danger' : 'orbx-badge-warning'
                                    }`}>
                                        {g.status.toUpperCase()}
                                    </span>
                                </td>
                                <td style={{ padding: '16px 20px', fontSize: 13 }}>{g.created_by_name}</td>
                                <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                                    <button className="orbx-btn orbx-btn-secondary" style={{ padding: '6px 12px', fontSize: 11 }} onClick={() => viewDetails(g.id)}>
                                        View & Review
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {selectedGrn && (
                <div className="orbx-modal-overlay">
                    <div className="orbx-modal" style={{ maxWidth: 800, width: '90%', padding: 0 }}>
                        <div style={{ padding: '20px 24px', borderBottom: `1px solid ${T.colors.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3 style={{ fontSize: 18, fontWeight: 800 }}>Review Goods Receipt: {selectedGrn.grn_number}</h3>
                            <button onClick={() => setSelectedGrn(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><Icon name="x" size={20} /></button>
                        </div>
                        
                        <div style={{ padding: 24, maxHeight: '70vh', overflowY: 'auto' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
                                <div>
                                    <div style={{ fontSize: 11, color: T.colors.textMuted, fontWeight: 700 }}>PO REFERENCE</div>
                                    <div style={{ fontSize: 14, fontWeight: 700 }}>{selectedGrn.po_number}</div>
                                </div>
                                <div>
                                    <div style={{ fontSize: 11, color: T.colors.textMuted, fontWeight: 700 }}>SUPPLIER</div>
                                    <div style={{ fontSize: 14, fontWeight: 700 }}>{selectedGrn.supplier_name}</div>
                                </div>
                            </div>

                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ borderBottom: `1px solid ${T.colors.border}` }}>
                                        <th style={{ textAlign: 'left', paddingBottom: 8, fontSize: 11 }}>PRODUCT</th>
                                        <th style={{ textAlign: 'left', paddingBottom: 8, fontSize: 11 }}>ATTRIBUTES</th>
                                        <th style={{ textAlign: 'right', paddingBottom: 8, fontSize: 11 }}>RECEIVED QTY</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {selectedGrn.items.map(i => (
                                        <tr key={i.id} style={{ borderBottom: `1px solid ${T.colors.border}` }}>
                                            <td style={{ padding: '12px 0' }}>
                                                <div style={{ fontWeight: 600, fontSize: 13 }}>{i.product_name}</div>
                                                <div style={{ fontSize: 11, color: T.colors.textMuted }}>{i.sku}</div>
                                            </td>
                                            <td style={{ padding: '12px 0' }}>
                                                <div style={{ display: 'flex', gap: 6 }}>
                                                    {Object.entries(i.attributes || {}).map(([k, v]) => v && (
                                                        <span key={k} style={{ fontSize: 10, background: T.colors.bgMuted, padding: '2px 6px', borderRadius: 4, textTransform: 'capitalize' }}>
                                                            {k}: {v}
                                                        </span>
                                                    ))}
                                                </div>
                                            </td>
                                            <td style={{ textAlign: 'right', fontWeight: 700 }}>{i.quantity}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            {selectedGrn.barcode_config?.enabled && (
                                <div style={{ marginTop: 24, padding: 16, background: T.colors.accentSoft, borderRadius: T.radius.md, border: `1px solid ${T.colors.accent}40` }}>
                                    <div style={{ fontSize: 12, fontWeight: 700, color: T.colors.brand, display: 'flex', alignItems: 'center', gap: 6 }}>
                                        <Icon name="check" size={14} /> BARCODES GENERATED
                                    </div>
                                    <p style={{ fontSize: 11, color: T.colors.textMid, marginTop: 4 }}>Unique identifiers have been reserved for these items and will be active upon approval.</p>
                                </div>
                            )}
                        </div>

                        {selectedGrn.status === 'pending' && (
                            <div style={{ padding: '20px 24px', borderTop: `1px solid ${T.colors.border}`, background: T.colors.bgMuted, display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                                <button className="orbx-btn" style={{ background: T.colors.dangerSoft, color: T.colors.danger }} onClick={() => handleReject(selectedGrn.id)}>
                                    Reject
                                </button>
                                <button className="orbx-btn orbx-btn-success" style={{ padding: '10px 40px' }} onClick={() => handleApprove(selectedGrn.id)}>
                                    Approve & Update Stock
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
