import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../components/Icon';
import { tokens } from '../design/tokens';

const API_URL = '/api';

const RECENT_ORDERS = [
  { id: 'INV-2026-0892', customer: 'Rajesh Kumar',  amount: 1245, items: 6, time: '10:32 AM', payMode: 'UPI' },
  { id: 'INV-2026-0891', customer: 'Walk-in',        amount: 385,  items: 3, time: '10:15 AM', payMode: 'Cash' },
  { id: 'INV-2026-0890', customer: 'Priya Sharma',   amount: 2140, items: 9, time: '09:58 AM', payMode: 'Card' },
  { id: 'INV-2026-0889', customer: 'Walk-in',        amount: 560,  items: 4, time: '09:40 AM', payMode: 'Cash' },
];

export default function Dashboard() {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetch(`${API_URL}/api/reports/dashboard`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
    })
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const chartData = [
    { day: 'Mon', rev: 38200 }, { day: 'Tue', rev: 42100 }, { day: 'Wed', rev: 35800 },
    { day: 'Thu', rev: 51200 }, { day: 'Fri', rev: 48600 }, { day: 'Sat', rev: 62400 }, { day: 'Sun', rev: 48240 },
  ];
  const maxRev = Math.max(...chartData.map(d => d.rev));

  const topProducts = [
    { name: 'Basmati Rice 5kg',  qty: 82,  rev: '₹34,850', pct: 88 },
    { name: 'Parle-G 800g',      qty: 154, rev: '₹11,550', pct: 72 },
    { name: 'Surf Excel 1kg',    qty: 47,  rev: '₹10,340', pct: 65 },
    { name: 'Maggi Noodles 12pk',qty: 63,  rev: '₹11,340', pct: 58 },
  ];

  const stats = [
    { label: "Today's Revenue",   value: data ? `₹${(data.stats?.todaySales || 0).toLocaleString()}` : '₹48,240', change: '+12.4%', up: true,  sub: 'vs yesterday' },
    { label: 'Transactions',      value: data ? (data.stats?.transactions || 0) : '127',    change: '+8.1%',  up: true,  sub: 'Daily target: 150' },
    { label: 'Items Sold',        value: '894',  change: '+5.3%',  up: true,  sub: 'Across all categories' },
    { label: 'Low Stock Alerts',  value: data ? (data.stats?.lowStock || 0) : '3', change: 'Needs attention', up: false, sub: 'Tap to view' },
  ];

  if (loading) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: 16 }}>
      <div className="orbx-spin" style={{ width: 40, height: 40, border: `3px solid ${tokens.colors.border}`, borderTopColor: tokens.colors.accent, borderRadius: '50%' }} />
      <p style={{ fontSize: 13, color: tokens.colors.textMuted, fontWeight: 500 }}>Loading Dashboard...</p>
    </div>
  );

  return (
    <div className="orbx-page-enter" style={{ padding: 24 }}>

      {/* ─── KPI Stats ─── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
        {stats.map((s, i) => (
          <div key={i} className="orbx-stat-card">
            <div style={{ fontSize: 12, color: tokens.colors.textMuted, fontWeight: 500, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{s.label}</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: tokens.colors.text, marginBottom: 6 }}>{s.value}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: s.up ? tokens.colors.success : tokens.colors.danger }}>{s.change}</span>
              <span style={{ fontSize: 11, color: tokens.colors.textMuted }}>{s.sub}</span>
            </div>
          </div>
        ))}
      </div>

      {/* ─── Chart + Quick Actions ─── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 16, marginBottom: 16 }}>

        {/* Revenue Bar Chart */}
        <div className="orbx-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 2 }}>Weekly Revenue</div>
              <div style={{ fontSize: 12, color: tokens.colors.textMuted }}>This week performance</div>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              {['7D', '30D', '90D'].map(p => (
                <button key={p} className="orbx-btn orbx-btn-secondary" style={{ padding: '4px 10px', fontSize: 11 }}>{p}</button>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, height: 140 }}>
            {chartData.map((d, i) => (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                <div style={{ width: '100%', position: 'relative', borderRadius: '4px 4px 0 0', overflow: 'hidden', height: 110 }}>
                  <div style={{
                    position: 'absolute', bottom: 0, left: 0, right: 0,
                    height: `${(d.rev / maxRev) * 100}%`,
                    background: i === 6 ? tokens.colors.accent : `${tokens.colors.accent}40`,
                    borderRadius: '4px 4px 0 0',
                    transition: 'height 0.6s ease',
                  }} />
                </div>
                <span style={{ fontSize: 11, color: tokens.colors.textMuted, fontWeight: i === 6 ? 700 : 400 }}>{d.day}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="orbx-card">
          <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>Quick Actions</div>
          {[
            { label: 'New Sale',       icon: 'pos',      color: tokens.colors.accent,   path: '/pos' },
            { label: 'Add Product',    icon: 'plus',     color: tokens.colors.info,      path: '/products' },
            { label: 'Stock Transfer', icon: 'truck',    color: tokens.colors.success,   path: '/transfers' },
            { label: 'View Reports',   icon: 'reports',  color: '#8B5CF6',              path: '/reports' },
          ].map((a, i) => (
            <button
              key={i}
              onClick={() => navigate(a.path)}
              style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', padding: '11px 14px', background: tokens.colors.bgMuted, border: 'none', borderRadius: tokens.radius.md, cursor: 'pointer', marginBottom: 8, transition: 'background 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.background = tokens.colors.border}
              onMouseLeave={e => e.currentTarget.style.background = tokens.colors.bgMuted}
            >
              <div style={{ width: 34, height: 34, borderRadius: tokens.radius.md, background: `${a.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon name={a.icon} size={16} color={a.color} />
              </div>
              <span style={{ fontSize: 13.5, fontWeight: 600, color: tokens.colors.text, flex: 1, textAlign: 'left' }}>{a.label}</span>
              <Icon name="arrow_right" size={14} color={tokens.colors.textMuted} />
            </button>
          ))}
        </div>
      </div>

      {/* ─── Top Products + Recent Orders ─── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Top Products */}
        <div className="orbx-card">
          <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>Top Products Today</div>
          {topProducts.map((p, i) => (
            <div key={i} style={{ marginBottom: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                <div>
                  <span style={{ fontSize: 13, fontWeight: 500 }}>{p.name}</span>
                  <span style={{ fontSize: 11, color: tokens.colors.textMuted, marginLeft: 8 }}>{p.qty} units</span>
                </div>
                <span style={{ fontSize: 13, fontWeight: 700 }}>{p.rev}</span>
              </div>
              <div style={{ height: 5, background: tokens.colors.bgMuted, borderRadius: 99 }}>
                <div style={{ height: '100%', width: `${p.pct}%`, background: tokens.colors.accent, borderRadius: 99, transition: 'width 0.6s ease' }} />
              </div>
            </div>
          ))}
        </div>

        {/* Recent Transactions */}
        <div className="orbx-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ fontSize: 15, fontWeight: 700 }}>Recent Transactions</div>
            <button className="orbx-btn orbx-btn-ghost" style={{ fontSize: 11, padding: '4px 8px' }}>View All</button>
          </div>
          {(data?.recentSales || RECENT_ORDERS).map((o, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: i < 3 ? `1px solid ${tokens.colors.border}` : 'none' }}>
              <div style={{ width: 36, height: 36, borderRadius: tokens.radius.md, background: tokens.colors.successSoft, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="check" size={16} color={tokens.colors.success} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{o.id || `#${o.id}`}</div>
                <div style={{ fontSize: 11, color: tokens.colors.textMuted }}>{o.customer || o.customer_name || 'Guest'} · {o.time}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 14, fontWeight: 700 }}>₹{(o.amount || o.total_amount || 0).toLocaleString()}</div>
                <span className="orbx-badge orbx-badge-neutral">{o.payMode || 'Cash'}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
