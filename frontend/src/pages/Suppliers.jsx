import React, { useState, useEffect } from 'react';
import Icon from '../components/Icon';
import { tokens as T } from '../design/tokens';
import toast from 'react-hot-toast';

export default function Suppliers() {
    const [suppliers, setSuppliers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState(null);

    const token = localStorage.getItem('token');

    useEffect(() => {
        fetchSuppliers();
    }, []);

    const fetchSuppliers = async () => {
        try {
            const res = await fetch('/api/suppliers', {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            setSuppliers(data);
        } catch (err) {
            toast.error('Failed to load suppliers');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData);
        
        try {
            const url = editing ? `/api/suppliers/${editing.id}` : '/api/suppliers';
            const method = editing ? 'PUT' : 'POST';
            
            const res = await fetch(url, {
                method,
                headers: { 
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ ...data, is_active: editing ? editing.is_active : true })
            });
            
            if (res.ok) {
                toast.success(`Supplier ${editing ? 'updated' : 'created'} successfully`);
                setShowModal(false);
                setEditing(null);
                fetchSuppliers();
            }
        } catch (err) {
            toast.error('Error saving supplier');
        }
    };

    return (
        <div className="orbx-page-enter" style={{ padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
                <div>
                    <h2 style={{ fontSize: 24, fontWeight: 800, color: T.colors.text }}>Suppliers</h2>
                    <p style={{ fontSize: 14, color: T.colors.textMuted }}>Manage your vendors and procurement partners</p>
                </div>
                <button className="orbx-btn orbx-btn-primary" onClick={() => { setEditing(null); setShowModal(true); }}>
                    + New Supplier
                </button>
            </div>

            <div className="orbx-card" style={{ padding: 0, overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ background: T.colors.bgMuted, borderBottom: `1px solid ${T.colors.border}` }}>
                            <th style={{ textAlign: 'left', padding: '12px 20px', fontSize: 12, color: T.colors.textMuted }}>SUPPLIER NAME</th>
                            <th style={{ textAlign: 'left', padding: '12px 20px', fontSize: 12, color: T.colors.textMuted }}>CONTACT</th>
                            <th style={{ textAlign: 'left', padding: '12px 20px', fontSize: 12, color: T.colors.textMuted }}>PHONE / EMAIL</th>
                            <th style={{ textAlign: 'left', padding: '12px 20px', fontSize: 12, color: T.colors.textMuted }}>GSTIN</th>
                            <th style={{ textAlign: 'right', padding: '12px 20px', fontSize: 12, color: T.colors.textMuted }}>ACTIONS</th>
                        </tr>
                    </thead>
                    <tbody>
                        {suppliers.map(s => (
                            <tr key={s.id} className="orbx-table-row">
                                <td style={{ padding: '16px 20px' }}>
                                    <div style={{ fontSize: 14, fontWeight: 700 }}>{s.name}</div>
                                    <div style={{ fontSize: 11, color: T.colors.textMuted }}>ID: SUP-{String(s.id).padStart(4, '0')}</div>
                                </td>
                                <td style={{ padding: '16px 20px', fontSize: 13, color: T.colors.textMid }}>{s.contact_person || '—'}</td>
                                <td style={{ padding: '16px 20px' }}>
                                    <div style={{ fontSize: 13, fontWeight: 600 }}>{s.phone}</div>
                                    <div style={{ fontSize: 12, color: T.colors.textMuted }}>{s.email}</div>
                                </td>
                                <td style={{ padding: '16px 20px', fontSize: 13, color: T.colors.accent, fontWeight: 600 }}>{s.gstin || '—'}</td>
                                <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                                    <button className="orbx-btn orbx-btn-ghost" onClick={() => { setEditing(s); setShowModal(true); }}>
                                        <Icon name="edit" size={16} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {loading && <div style={{ padding: 48, textAlign: 'center', color: T.colors.textMuted }}>Loading suppliers...</div>}
                {!loading && suppliers.length === 0 && (
                    <div style={{ padding: 48, textAlign: 'center', color: T.colors.textMuted }}>No suppliers found. Click "New Supplier" to get started.</div>
                )}
            </div>

            {showModal && (
                <div className="orbx-modal-overlay">
                    <div className="orbx-modal" style={{ maxWidth: 500, padding: 32 }}>
                        <h3 style={{ fontSize: 20, fontWeight: 800, marginBottom: 24 }}>{editing ? 'Edit Supplier' : 'New Supplier'}</h3>
                        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 20 }}>
                            <div>
                                <label style={{ fontSize: 12, fontWeight: 700, color: T.colors.textMid, marginBottom: 8, display: 'block' }}>SUPPLIER NAME</label>
                                <input name="name" className="orbx-input" required defaultValue={editing?.name} />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                <div>
                                    <label style={{ fontSize: 12, fontWeight: 700, color: T.colors.textMid, marginBottom: 8, display: 'block' }}>CONTACT PERSON</label>
                                    <input name="contact_person" className="orbx-input" defaultValue={editing?.contact_person} />
                                </div>
                                <div>
                                    <label style={{ fontSize: 12, fontWeight: 700, color: T.colors.textMid, marginBottom: 8, display: 'block' }}>GSTIN</label>
                                    <input name="gstin" className="orbx-input" defaultValue={editing?.gstin} />
                                </div>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                <div>
                                    <label style={{ fontSize: 12, fontWeight: 700, color: T.colors.textMid, marginBottom: 8, display: 'block' }}>PHONE</label>
                                    <input name="phone" className="orbx-input" defaultValue={editing?.phone} />
                                </div>
                                <div>
                                    <label style={{ fontSize: 12, fontWeight: 700, color: T.colors.textMid, marginBottom: 8, display: 'block' }}>EMAIL</label>
                                    <input name="email" type="email" className="orbx-input" defaultValue={editing?.email} />
                                </div>
                            </div>
                            <div>
                                <label style={{ fontSize: 12, fontWeight: 700, color: T.colors.textMid, marginBottom: 8, display: 'block' }}>ADDRESS</label>
                                <textarea name="address" className="orbx-input" style={{ height: 80, resize: 'none' }} defaultValue={editing?.address} />
                            </div>
                            <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
                                <button type="submit" className="orbx-btn orbx-btn-primary" style={{ flex: 1 }}>{editing ? 'Update' : 'Create'}</button>
                                <button type="button" className="orbx-btn orbx-btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
