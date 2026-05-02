import { useState, useEffect } from 'react';
import Icon from '../components/Icon';
import { tokens as T } from '../design/tokens';
import toast from 'react-hot-toast';

export default function Transfers() {
  const [transfers, setTransfers] = useState([]);
  const [branches,  setBranches]  = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [showNew,   setShowNew]   = useState(false);
  const [form,      setForm]      = useState({ to_branch_id: '', items: [], notes: '' });
  const [saving,    setSaving]    = useState(false);

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isWarehouse = user.is_superadmin || user.is_warehouse;
  const token = localStorage.getItem('token');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [tRes, bRes] = await Promise.all([
        fetch('/api/transfers', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/branches', { headers: { Authorization: `Bearer ${token}` } })
      ]);
      setTransfers(await tRes.json());
      setBranches((await bRes.json()).filter(b => b.id !== user.branch_id));
    } catch (err) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleReceive = async (id) => {
    try {
      const res = await fetch(`/api/transfers/${id}/receive`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        toast.success('Stock received and inventory updated');
        loadData();
      } else {
        const err = await res.json();
        toast.error(err.error || 'Failed to receive');
      }
    } catch (err) {
      toast.error('Network error');
    }
  };

  const stats = [
    { label: 'Pending Receipt', value: transfers.filter(t => t.status === 'shipped' && t.to_branch_id === user.branch_id).length,  color: T.colors.warning },
    { label: 'In Transit',       value: transfers.filter(t => t.status === 'shipped').length,  color: T.colors.info },
    { label: 'Completed Today',  value: transfers.filter(t => t.status === 'received').length, color: T.colors.success },
  ];

  return (
    <div className="orbx-page-enter" style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: 16, fontWeight: 700 }}>Stock Transfers</h2>
          <p style={{ fontSize: 12, color: T.colors.textMuted }}>Centralized stock distribution control</p>
        </div>
        {isWarehouse && (
          <button className="orbx-btn orbx-btn-primary" onClick={() => setShowNew(true)}>
            <Icon name="plus" size={14} /> New Stock Dispatch
          </button>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 24 }}>
        {stats.map((s, i) => (
          <div key={i} className="orbx-stat-card">
            <div style={{ fontSize: 30, fontWeight: 800, color: s.color, marginBottom: 4 }}>{s.value}</div>
            <div style={{ fontSize: 13, color: T.colors.textMuted }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div className="orbx-card" style={{ padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: T.colors.bgMuted }}>
              {['Transfer Info', 'From', 'To', 'Status', 'Date', 'Action'].map(h => (
                <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: T.colors.textMuted, textTransform: 'uppercase', borderBottom: `1px solid ${T.colors.border}` }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} style={{ padding: 40, textAlign: 'center', color: T.colors.textMuted }}>Loading transfers...</td></tr>
            ) : transfers.length === 0 ? (
              <tr><td colSpan={6} style={{ padding: 40, textAlign: 'center', color: T.colors.textMuted }}>No transfers found</td></tr>
            ) : transfers.map(t => (
              <tr key={t.id} className="orbx-table-row">
                <td style={{ padding: '14px 16px' }}>
                  <div style={{ fontWeight: 700, fontSize: 13, color: T.colors.brand }}>TRF-{String(t.id).padStart(4, '0')}</div>
                  <div style={{ fontSize: 11, color: T.colors.textMuted }}>{t.items_count || 0} Products</div>
                </td>
                <td style={{ padding: '14px 16px', fontSize: 13 }}>{t.from_branch_name}</td>
                <td style={{ padding: '14px 16px', fontSize: 13, fontWeight: 600 }}>{t.to_branch_name}</td>
                <td style={{ padding: '14px 16px' }}>
                  <span className={`orbx-badge ${t.status === 'received' ? 'orbx-badge-success' : 'orbx-badge-info'}`}>
                    {t.status.toUpperCase()}
                  </span>
                </td>
                <td style={{ padding: '14px 16px', fontSize: 12, color: T.colors.textMuted }}>{new Date(t.created_at).toLocaleDateString()}</td>
                <td style={{ padding: '14px 16px' }}>
                  {t.status === 'shipped' && (t.to_branch_id === user.branch_id || user.is_superadmin) && (
                    <button className="orbx-btn orbx-btn-success" style={{ padding: '6px 12px', fontSize: 11 }} onClick={() => handleReceive(t.id)}>
                      Confirm Receipt
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* New Transfer Modal - Placeholder for now as it needs a product picker */}
      {showNew && (
        <div className="orbx-modal-overlay">
          <div className="orbx-modal" style={{ maxWidth: 460, padding: 28 }}>
             <h3 style={{ marginBottom: 16 }}>New Stock Dispatch</h3>
             <p style={{ color: T.colors.textMuted, fontSize: 14, marginBottom: 24 }}>Please select products from the Inventory module to initiate a transfer.</p>
             <button className="orbx-btn orbx-btn-secondary" style={{ width: '100%' }} onClick={() => setShowNew(false)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}
