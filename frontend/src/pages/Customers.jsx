import { useState, useEffect } from 'react';
import Icon from '../components/Icon';
import { tokens as T } from '../design/tokens';
import toast from 'react-hot-toast';

const API_URL = '/api';

const MOCK = [
  { id: 'C001', name: 'Rajesh Kumar', phone: '9876543210', email: 'rajesh@email.com', credit: 2500, points: 480 },
  { id: 'C002', name: 'Priya Sharma', phone: '9876543211', email: 'priya@email.com',  credit: 0,    points: 1200 },
  { id: 'C003', name: 'Anil Mehta',   phone: '9876543212', email: 'anil@email.com',   credit: 5000, points: 320 },
  { id: 'C004', name: 'Sunita Patel', phone: '9876543213', email: 'sunita@email.com', credit: 1200, points: 750 },
];

const EMPTY = { name: '', phone: '', email: '', address: '' };

export default function Customers() {
  const [customers, setCustomers] = useState(MOCK);
  const [search,    setSearch]    = useState('');
  const [showAdd,   setShowAdd]   = useState(false);
  const [form,      setForm]      = useState(EMPTY);
  const [saving,    setSaving]    = useState(false);

  useEffect(() => {
    fetch(`${API_URL}/api/customers`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    })
      .then(r => r.ok ? r.json() : null)
      .then(d => d?.length && setCustomers(d))
      .catch(() => {});
  }, []);

  const filtered = customers.filter(c =>
    !search || c.name?.toLowerCase().includes(search.toLowerCase()) || c.phone?.includes(search)
  );

  const handleSave = async () => {
    if (!form.name || !form.phone) { toast.error('Name and phone are required'); return; }
    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/api/customers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        const newC = await res.json();
        setCustomers(prev => [{ ...newC, credit: 0, points: 0 }, ...prev]);
        toast.success('Customer added!'); setShowAdd(false); setForm(EMPTY);
      } else toast.error('Failed to save');
    } catch {
      setCustomers(prev => [{ id: `C-${Date.now()}`, ...form, credit: 0, points: 0 }, ...prev]);
      toast.success('Saved locally'); setShowAdd(false); setForm(EMPTY);
    }
    setSaving(false);
  };

  return (
    <div className="orbx-page-enter" style={{ padding: 24 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 2 }}>Customer Management</h2>
          <p style={{ fontSize: 12, color: T.colors.textMuted }}>{customers.length} registered customers</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <div style={{ position: 'relative' }}>
            <div style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }}>
              <Icon name="search" size={14} color={T.colors.textMuted} />
            </div>
            <input className="orbx-input" style={{ paddingLeft: 32, width: 220 }} placeholder="Search customers..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <button className="orbx-btn orbx-btn-primary" onClick={() => setShowAdd(true)}>
            <Icon name="plus" size={14} /> Add Customer
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="orbx-card" style={{ padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: T.colors.bgMuted }}>
              {['Customer', 'Phone', 'Email', 'Credit Balance', 'Loyalty Points', 'Actions'].map(h => (
                <th key={h} style={{ padding: '11px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: T.colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: `1px solid ${T.colors.border}` }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: T.colors.textMuted }}>No customers found</td></tr>
            ) : filtered.map(c => (
              <tr key={c.id} className="orbx-table-row">
                <td style={{ padding: '13px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: T.colors.accentSoft, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: T.colors.accent, flexShrink: 0 }}>
                      {(c.name || '?')[0].toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontSize: 13.5, fontWeight: 600 }}>{c.name}</div>
                      <div style={{ fontSize: 11, color: T.colors.textMuted }}>{c.id}</div>
                    </div>
                  </div>
                </td>
                <td style={{ padding: '13px 16px', fontSize: 13 }}>{c.phone}</td>
                <td style={{ padding: '13px 16px', fontSize: 13, color: T.colors.info }}>{c.email}</td>
                <td style={{ padding: '13px 16px' }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: (c.credit || 0) > 0 ? T.colors.danger : T.colors.success }}>
                    ₹{(c.credit || 0).toLocaleString()}
                  </span>
                </td>
                <td style={{ padding: '13px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 60, height: 5, background: T.colors.bgMuted, borderRadius: 99 }}>
                      <div style={{ height: '100%', width: `${Math.min(100, ((c.points || 0) / 1500) * 100)}%`, background: T.colors.accent, borderRadius: 99 }} />
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 600 }}>{c.points || 0} pts</span>
                  </div>
                </td>
                <td style={{ padding: '13px 16px' }}>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button className="orbx-btn orbx-btn-secondary" style={{ padding: '4px 10px', fontSize: 11 }}>View</button>
                    <button className="orbx-btn orbx-btn-secondary" style={{ padding: '4px 10px', fontSize: 11 }}>Edit</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add Customer Modal */}
      {showAdd && (
        <div className="orbx-modal-overlay">
          <div className="orbx-modal" style={{ maxWidth: 440, padding: 28 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
              <h3 style={{ fontSize: 17, fontWeight: 700 }}>Add Customer</h3>
              <button onClick={() => setShowAdd(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><Icon name="x" size={20} /></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { label: 'Full Name', key: 'name', ph: 'Customer full name' },
                { label: 'Phone',     key: 'phone', ph: '10-digit mobile number' },
                { label: 'Email',     key: 'email', ph: 'email@example.com' },
                { label: 'Address',   key: 'address', ph: 'Street, City, PIN' },
              ].map(f => (
                <div key={f.key}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: T.colors.textMid, marginBottom: 5, display: 'block' }}>{f.label}</label>
                  <input className="orbx-input" placeholder={f.ph} value={form[f.key]} onChange={e => setForm(v => ({ ...v, [f.key]: e.target.value }))} />
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 20 }}>
              <button className="orbx-btn orbx-btn-secondary" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setShowAdd(false)}>Cancel</button>
              <button className="orbx-btn orbx-btn-primary" style={{ flex: 1, justifyContent: 'center' }} onClick={handleSave} disabled={saving}>
                {saving ? 'Saving...' : 'Add Customer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
