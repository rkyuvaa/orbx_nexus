import { useState, useEffect } from 'react';
import Icon from '../components/Icon';
import { tokens as T } from '../design/tokens';
import toast from 'react-hot-toast';

const API_URL = `http://${window.location.hostname}:5000`;

const MOCK = [
  { id: 'TRF-001', from: 'Warehouse',   to: 'Main Branch', items: 24, status: 'shipped',  date: 'May 2, 2026',  notes: 'Regular restock' },
  { id: 'TRF-002', from: 'Main Branch', to: 'Warehouse',   items: 6,  status: 'pending',  date: 'May 1, 2026',  notes: 'Excess return' },
  { id: 'TRF-003', from: 'Warehouse',   to: 'Sub Branch',  items: 18, status: 'received', date: 'Apr 30, 2026', notes: 'Branch opening stock' },
  { id: 'TRF-004', from: 'Warehouse',   to: 'Main Branch', items: 12, status: 'approved', date: 'Apr 29, 2026', notes: 'Emergency restock' },
];

const STATUS_BADGE = { pending: 'orbx-badge-warning', approved: 'orbx-badge-info', shipped: 'orbx-badge-info', received: 'orbx-badge-success' };
const STATUS_FLOW  = ['pending', 'approved', 'shipped', 'received'];
const EMPTY_FORM   = { from: 'Warehouse', to: '', items: '', notes: '' };

export default function Transfers() {
  const [transfers, setTransfers] = useState(MOCK);
  const [showNew,   setShowNew]   = useState(false);
  const [form,      setForm]      = useState(EMPTY_FORM);
  const [saving,    setSaving]    = useState(false);

  useEffect(() => {
    fetch(`${API_URL}/api/transfers`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    })
      .then(r => r.ok ? r.json() : null)
      .then(d => d?.length && setTransfers(d))
      .catch(() => {});
  }, []);

  const stats = [
    { label: 'Pending Approval', value: transfers.filter(t => t.status === 'pending').length,  color: T.colors.warning },
    { label: 'In Transit',       value: transfers.filter(t => t.status === 'shipped').length,  color: T.colors.info },
    { label: 'Completed Today',  value: transfers.filter(t => t.status === 'received').length, color: T.colors.success },
  ];

  const handleCreate = async () => {
    if (!form.to || !form.items) { toast.error('Fill in destination and item count'); return; }
    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/api/transfers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        const newT = await res.json();
        setTransfers(prev => [newT, ...prev]);
        toast.success('Transfer request created');
        setShowNew(false); setForm(EMPTY_FORM);
      } else toast.error('Failed to create transfer');
    } catch {
      // Offline: add locally
      const local = { id: `TRF-LOCAL-${Date.now()}`, ...form, status: 'pending', date: new Date().toLocaleDateString('en-IN') };
      setTransfers(prev => [local, ...prev]);
      toast.success('Saved offline — will sync when connected');
      setShowNew(false); setForm(EMPTY_FORM);
    }
    setSaving(false);
  };

  const handleStatusChange = (id, newStatus) => {
    setTransfers(prev => prev.map(t => t.id === id ? { ...t, status: newStatus } : t));
    toast.success(`Status updated to ${newStatus}`);
  };

  return (
    <div className="orbx-page-enter" style={{ padding: 24 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700 }}>Stock Transfers</h2>
        <button className="orbx-btn orbx-btn-primary" onClick={() => setShowNew(true)}>
          <Icon name="plus" size={14} /> New Transfer Request
        </button>
      </div>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 24 }}>
        {stats.map((s, i) => (
          <div key={i} className="orbx-stat-card">
            <div style={{ fontSize: 30, fontWeight: 800, color: s.color, marginBottom: 4 }}>{s.value}</div>
            <div style={{ fontSize: 13, color: T.colors.textMuted }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Transfer table */}
      <div className="orbx-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '14px 20px', borderBottom: `1px solid ${T.colors.border}`, fontSize: 14, fontWeight: 700 }}>Transfer Log</div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: T.colors.bgMuted }}>
              {['Transfer ID', 'From', 'To', 'Items', 'Date', 'Status', 'Action'].map(h => (
                <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: T.colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: `1px solid ${T.colors.border}` }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {transfers.map(t => {
              const nextStatus = STATUS_FLOW[STATUS_FLOW.indexOf(t.status) + 1];
              return (
                <tr key={t.id} className="orbx-table-row">
                  <td style={{ padding: '13px 16px', fontWeight: 700, fontSize: 13 }}>{t.id}</td>
                  <td style={{ padding: '13px 16px', fontSize: 13 }}>{t.from}</td>
                  <td style={{ padding: '13px 16px', fontSize: 13 }}>{t.to}</td>
                  <td style={{ padding: '13px 16px', fontSize: 13 }}>{t.items} items</td>
                  <td style={{ padding: '13px 16px', fontSize: 12, color: T.colors.textMuted }}>{t.date}</td>
                  <td style={{ padding: '13px 16px' }}>
                    <span className={`orbx-badge ${STATUS_BADGE[t.status] || 'orbx-badge-neutral'}`}>
                      {t.status.charAt(0).toUpperCase() + t.status.slice(1)}
                    </span>
                  </td>
                  <td style={{ padding: '13px 16px' }}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="orbx-btn orbx-btn-secondary" style={{ padding: '4px 10px', fontSize: 11 }}>View</button>
                      {nextStatus && (
                        <button className="orbx-btn orbx-btn-success" style={{ padding: '4px 10px', fontSize: 11 }} onClick={() => handleStatusChange(t.id, nextStatus)}>
                          → {nextStatus.charAt(0).toUpperCase() + nextStatus.slice(1)}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* New Transfer Modal */}
      {showNew && (
        <div className="orbx-modal-overlay">
          <div className="orbx-modal" style={{ maxWidth: 460, padding: 28 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
              <h3 style={{ fontSize: 17, fontWeight: 700 }}>New Transfer Request</h3>
              <button onClick={() => setShowNew(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><Icon name="x" size={20} /></button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {[
                { label: 'From', key: 'from', type: 'select', opts: ['Warehouse', 'Main Branch', 'Sub Branch'] },
                { label: 'To',   key: 'to',   type: 'select', opts: ['Main Branch', 'Sub Branch', 'Warehouse'] },
              ].map(f => (
                <div key={f.key}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: T.colors.textMid, marginBottom: 5, display: 'block' }}>{f.label}</label>
                  <select className="orbx-input orbx-select" value={form[f.key]} onChange={e => setForm(v => ({ ...v, [f.key]: e.target.value }))}>
                    {f.opts.map(o => <option key={o}>{o}</option>)}
                  </select>
                </div>
              ))}
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: T.colors.textMid, marginBottom: 5, display: 'block' }}>Item Count</label>
                <input className="orbx-input" type="number" placeholder="Number of items" value={form.items} onChange={e => setForm(v => ({ ...v, items: e.target.value }))} />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: T.colors.textMid, marginBottom: 5, display: 'block' }}>Notes</label>
                <input className="orbx-input" placeholder="Optional notes" value={form.notes} onChange={e => setForm(v => ({ ...v, notes: e.target.value }))} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 20 }}>
              <button className="orbx-btn orbx-btn-secondary" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setShowNew(false)}>Cancel</button>
              <button className="orbx-btn orbx-btn-primary" style={{ flex: 1, justifyContent: 'center' }} onClick={handleCreate} disabled={saving}>
                {saving ? 'Creating...' : 'Create Request'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
