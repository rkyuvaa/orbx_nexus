import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../components/Icon';
import { tokens } from '../design/tokens';

const API_URL = '/api';

export default function Dashboard() {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const user        = JSON.parse(localStorage.getItem('user') || '{}');
  const isAdmin     = !!user.is_superadmin;
  const permissions = user.permissions || {};

  useEffect(() => {
    fetch(`${API_URL}/reports/dashboard`, {
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

  const stats = [
    { label: "Today's Revenue",   value: data ? `₹${(data.stats?.todaySales || 0).toLocaleString()}` : '₹0', change: '+12.4%', up: true,  sub: 'vs yesterday' },
    { label: 'Transactions',      value: data ? (data.stats?.transactions || 0) : '0',    change: '+8.1%',  up: true,  sub: 'Daily target: 150' },
    { label: 'Items Sold',        value: data?.stats?.itemsSold || '0',  change: '+5.3%',  up: true,  sub: 'Across all categories' },
    { label: 'Low Stock Alerts',  value: data ? (data.stats?.lowStock || 0) : '0', change: 'Needs attention', up: false, sub: 'Tap to view' },
  ];

  // RBAC Filtered Quick Actions
  const ACTIONS = [
    { label: 'New Sale',       icon: 'pos',      color: tokens.colors.accent,   path: '/pos',       group: 'billing',   action: 'create' },
    { label: 'Add Product',    icon: 'plus',     color: tokens.colors.info,      path: '/products',  group: 'products',  action: 'create' },
    { label: 'Stock Transfer', icon: 'truck',    color: tokens.colors.success,   path: '/transfers', group: 'transfers', action: 'create' },
    { label: 'View Reports',   icon: 'reports',  color: '#8B5CF6',              path: '/reports',   group: 'reports',   action: 'view_own' },
  ];

  const filteredActions = ACTIONS.filter(a => {
    if (isAdmin) return true;
    const groupPerms = permissions[a.group];
    return Array.isArray(groupPerms) && groupPerms.includes(a.action);
  });

  if (loading) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: 16 }}>
      <div className="orbx-spin" style={{ width: 40, height: 40, border: `3px solid ${tokens.colors.border}`, borderTopColor: tokens.colors.accent, borderRadius: '50%' }} />
      <p style={{ fontSize: 13, color: tokens.colors.textMuted, fontWeight: 500 }}>Loading Dashboard...</p>
    </div>
  );

  return (
    <div className="orbx-page-enter" style={{ padding: 24 }}>

      {/* KPI Stats */}
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

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 16, marginBottom: 16 }}>
        {/* Revenue Bar Chart */}
        <div className="orbx-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 2 }}>Weekly Revenue</div>
              <div style={{ fontSize: 12, color: tokens.colors.textMuted }}>This week performance</div>
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
          {filteredActions.length > 0 ? filteredActions.map((a, i) => (
            <button
              key={i}
              onClick={() => navigate(a.path)}
              style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', padding: '11px 14px', background: tokens.colors.bgMuted, border: 'none', borderRadius: tokens.radius.md, cursor: 'pointer', marginBottom: 8, transition: 'background 0.15s' }}
            >
              <div style={{ width: 34, height: 34, borderRadius: tokens.radius.md, background: `${a.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon name={a.icon} size={16} color={a.color} />
              </div>
              <span style={{ fontSize: 13.5, fontWeight: 600, color: tokens.colors.text, flex: 1, textAlign: 'left' }}>{a.label}</span>
              <Icon name="arrow_right" size={14} color={tokens.colors.textMuted} />
            </button>
          )) : (
              <div style={{ fontSize: 12, color: tokens.colors.textMuted, textAlign: 'center', padding: '20px 0' }}>No authorized quick actions</div>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div className="orbx-card">
          <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>Inventory Alerts</div>
          {(data?.inventoryHighlights || []).map((p, i) => (
            <div key={i} style={{ marginBottom: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                <div>
                  <span style={{ fontSize: 13, fontWeight: 500 }}>{p.name}</span>
                  <span style={{ fontSize: 11, color: tokens.colors.textMuted, marginLeft: 8 }}>{p.quantity} units</span>
                </div>
                <span style={{ fontSize: 11, color: tokens.colors.danger, fontWeight: 700 }}>Min: {p.min_stock_level}</span>
              </div>
              <div style={{ height: 5, background: tokens.colors.bgMuted, borderRadius: 99 }}>
                <div style={{ height: '100%', width: `${Math.min(100, (p.quantity / p.min_stock_level) * 100)}%`, background: p.quantity < p.min_stock_level ? tokens.colors.danger : tokens.colors.accent, borderRadius: 99 }} />
              </div>
            </div>
          ))}
        </div>

        <div className="orbx-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ fontSize: 15, fontWeight: 700 }}>Recent Transactions</div>
          </div>
          {(data?.recentSales || []).map((o, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: i < 3 ? `1px solid ${tokens.colors.border}` : 'none' }}>
              <div style={{ width: 36, height: 36, borderRadius: tokens.radius.md, background: tokens.colors.successSoft, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="check" size={16} color={tokens.colors.success} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{o.bill_number || `#${o.id}`}</div>
                <div style={{ fontSize: 11, color: tokens.colors.textMuted }}>{o.user_name} · {new Date(o.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 14, fontWeight: 700 }}>₹{parseFloat(o.total_amount).toLocaleString()}</div>
                <span className={`orbx-badge ${o.payment_method === 'Cash' ? 'orbx-badge-brand' : 'orbx-badge-info'}`}>{o.payment_method}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
