import { useState, useEffect } from 'react';
import Icon from '../components/Icon';
import { tokens as T } from '../design/tokens';
import toast from 'react-hot-toast';

const API_URL = `http://${window.location.hostname}:5050`;

const MOCK = [
  { id: 'P001', name: 'Basmati Rice 5kg',     category: 'Grocery',       stock: 142, minStock: 50, price: 425, status: 'ok' },
  { id: 'P002', name: 'Sunflower Oil 1L',      category: 'Grocery',       stock: 87,  minStock: 30, price: 185, status: 'ok' },
  { id: 'P003', name: 'Tata Tea Premium 500g', category: 'Beverage',      stock: 12,  minStock: 20, price: 265, status: 'low' },
  { id: 'P004', name: 'Amul Butter 500g',      category: 'Dairy',         stock: 5,   minStock: 15, price: 280, status: 'critical' },
  { id: 'P012', name: 'Nescafe Classic 200g',  category: 'Beverage',      stock: 8,   minStock: 20, price: 460, status: 'low' },
  { id: 'P005', name: 'Colgate MaxFresh 150g', category: 'Personal Care', stock: 201, minStock: 40, price: 95,  status: 'ok' },
  { id: 'P007', name: 'Parle-G 800g',          category: 'Snacks',        stock: 315, minStock: 60, price: 75,  status: 'ok' },
];

export default function Inventory() {
  const [items,   setItems]   = useState(MOCK);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch(`${API_URL}/api/inventory`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    })
      .then(r => r.ok ? r.json() : null)
      .then(d => d?.length && setItems(d))
      .catch(() => {});
  }, []);

  const statusOf = (stock, min) => stock < min * 0.3 ? 'critical' : stock < min ? 'low' : 'ok';
  const badgeClass = s => s === 'critical' ? 'orbx-badge-danger' : s === 'low' ? 'orbx-badge-warning' : 'orbx-badge-success';
  const badgeLabel = s => s === 'critical' ? 'Critical' : s === 'low' ? 'Low Stock' : 'In Stock';
  const barColor   = s => s === 'critical' ? T.colors.danger : s === 'low' ? T.colors.warning : T.colors.success;

  const critical = items.filter(i => (i.status || statusOf(i.stock, i.minStock || 20)) === 'critical').length;
  const low      = items.filter(i => (i.status || statusOf(i.stock, i.minStock || 20)) === 'low').length;

  const statCards = [
    { label: 'Total Products', value: items.length, icon: 'products', color: T.colors.info },
    { label: 'In Stock',       value: items.filter(i => (i.status || statusOf(i.stock, i.minStock || 20)) === 'ok').length, icon: 'check', color: T.colors.success },
    { label: 'Low Stock',      value: low,      icon: 'warning', color: T.colors.warning },
    { label: 'Critical',       value: critical, icon: 'x',       color: T.colors.danger },
  ];

  return (
    <div className="orbx-page-enter" style={{ padding: 24 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700 }}>Inventory Management</h2>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="orbx-btn orbx-btn-secondary"><Icon name="filter" size={14} /> Filter</button>
          <button className="orbx-btn orbx-btn-primary"><Icon name="plus" size={14} /> Stock Adjustment</button>
        </div>
      </div>

      {/* Alert banner */}
      {(critical + low) > 0 && (
        <div style={{ background: T.colors.dangerSoft, border: `1px solid ${T.colors.danger}40`, borderRadius: T.radius.md, padding: '12px 16px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
          <Icon name="warning" size={16} color={T.colors.danger} />
          <span style={{ fontSize: 13, color: T.colors.danger, fontWeight: 500 }}>
            {critical + low} products are running low on stock. Raise a purchase order or transfer request.
          </span>
        </div>
      )}

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 24 }}>
        {statCards.map((s, i) => (
          <div key={i} className="orbx-stat-card" style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 42, height: 42, borderRadius: T.radius.md, background: `${s.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name={s.icon} size={18} color={s.color} />
            </div>
            <div>
              <div style={{ fontSize: 22, fontWeight: 800 }}>{s.value}</div>
              <div style={{ fontSize: 12, color: T.colors.textMuted }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="orbx-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '14px 20px', borderBottom: `1px solid ${T.colors.border}`, fontSize: 14, fontWeight: 700 }}>Stock Levels</div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: T.colors.bgMuted }}>
              {['Product', 'Category', 'Current Stock', 'Min Stock', 'Status', 'Action'].map(h => (
                <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: T.colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: `1px solid ${T.colors.border}` }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.map(p => {
              const s = p.status || statusOf(p.stock, p.minStock || 20);
              const barPct = Math.min(100, (p.stock / (p.minStock || 20)) * 50);
              return (
                <tr key={p.id} className="orbx-table-row">
                  <td style={{ padding: '13px 16px' }}>
                    <div style={{ fontSize: 13.5, fontWeight: 600 }}>{p.name}</div>
                    <div style={{ fontSize: 11, color: T.colors.textMuted }}>{p.id}</div>
                  </td>
                  <td style={{ padding: '13px 16px' }}><span className="orbx-badge orbx-badge-neutral">{p.category}</span></td>
                  <td style={{ padding: '13px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 80, height: 6, background: T.colors.bgMuted, borderRadius: 99 }}>
                        <div style={{ height: '100%', width: `${barPct}%`, background: barColor(s), borderRadius: 99, transition: 'width 0.5s' }} />
                      </div>
                      <span style={{ fontSize: 14, fontWeight: 700, color: barColor(s) }}>{p.stock}</span>
                    </div>
                  </td>
                  <td style={{ padding: '13px 16px', fontSize: 13, color: T.colors.textMid }}>{p.minStock || 20}</td>
                  <td style={{ padding: '13px 16px' }}><span className={`orbx-badge ${badgeClass(s)}`}>{badgeLabel(s)}</span></td>
                  <td style={{ padding: '13px 16px' }}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="orbx-btn orbx-btn-secondary" style={{ padding: '4px 10px', fontSize: 11 }}>Adjust</button>
                      <button className="orbx-btn" style={{ padding: '4px 10px', fontSize: 11, background: T.colors.infoSoft, color: T.colors.info }}>Order</button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
