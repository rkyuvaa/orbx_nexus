import React, { useState, useEffect } from 'react';
import Icon from '../components/Icon';
import { tokens as T } from '../design/tokens';
import toast from 'react-hot-toast';

const API_URL = '/api';

export default function Inventory() {
  const [activeTab, setActiveTab] = useState('stock');
  const [items, setItems] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isWarehouse = user.is_superadmin || user.is_warehouse;

  const fetchData = async () => {
    setLoading(true);
    try {
      const endpoint = activeTab === 'stock' ? '/inventory' : '/inventory/logs';
      const res = await fetch(`${API_URL}${endpoint}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (activeTab === 'stock') setItems(data);
        else setLogs(data);
      }
    } catch (err) {
      toast.error('Failed to load inventory data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const statusOf = (stock, min) => stock < min * 0.3 ? 'critical' : stock < min ? 'low' : 'ok';
  const badgeClass = s => s === 'critical' ? 'orbx-badge-danger' : s === 'low' ? 'orbx-badge-warning' : 'orbx-badge-success';
  const badgeLabel = s => s === 'critical' ? 'Critical' : s === 'low' ? 'Low Stock' : 'In Stock';
  const barColor   = s => s === 'critical' ? T.colors.danger : s === 'low' ? T.colors.warning : T.colors.success;

  const critical = items.filter(i => (i.status || statusOf(i.stock, i.min_stock_level || 20)) === 'critical').length;
  const low      = items.filter(i => (i.status || statusOf(i.stock, i.min_stock_level || 20)) === 'low').length;

  const statCards = [
    { label: 'Total Products', value: items.length, icon: 'products', color: T.colors.info },
    { label: 'In Stock',       value: items.filter(i => (i.status || statusOf(i.stock, i.min_stock_level || 20)) === 'ok').length, icon: 'check', color: T.colors.success },
    { label: 'Low Stock',      value: low,      icon: 'warning', color: T.colors.warning },
    { label: 'Critical',       value: critical, icon: 'x',       color: T.colors.danger },
  ];

  return (
    <div className="orbx-page-enter" style={{ padding: 24 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
            <h2 style={{ fontSize: 24, fontWeight: 800 }}>Warehouse Inventory</h2>
            <p style={{ fontSize: 14, color: T.colors.textMuted }}>Real-time stock levels and movement audit trail</p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button className="orbx-btn orbx-btn-secondary" onClick={fetchData}><Icon name="sync" size={14} /> Refresh</button>
          {isWarehouse && (
            <button className="orbx-btn orbx-btn-primary"><Icon name="plus" size={14} /> Stock Adjustment</button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 32, borderBottom: `1px solid ${T.colors.border}`, marginBottom: 24 }}>
          <div 
            onClick={() => setActiveTab('stock')}
            style={{ padding: '12px 4px', fontSize: 14, fontWeight: 700, cursor: 'pointer', color: activeTab === 'stock' ? T.colors.brand : T.colors.textMuted, borderBottom: activeTab === 'stock' ? `2px solid ${T.colors.brand}` : 'none' }}
          >
            Current Stock
          </div>
          <div 
            onClick={() => setActiveTab('logs')}
            style={{ padding: '12px 4px', fontSize: 14, fontWeight: 700, cursor: 'pointer', color: activeTab === 'logs' ? T.colors.brand : T.colors.textMuted, borderBottom: activeTab === 'logs' ? `2px solid ${T.colors.brand}` : 'none' }}
          >
            Movement History
          </div>
      </div>

      {activeTab === 'stock' ? (
        <>
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

          <div className="orbx-card" style={{ padding: 0, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: T.colors.bgMuted }}>
                  {['Product', 'Category', 'Current Stock', 'Min Stock', 'Status', 'Action'].map(h => (
                    <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: T.colors.textMuted, textTransform: 'uppercase', borderBottom: `1px solid ${T.colors.border}` }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                    <tr><td colSpan={6} style={{ padding: 40, textAlign: 'center', color: T.colors.textMuted }}>Fetching real-time stock data...</td></tr>
                ) : items.length === 0 ? (
                    <tr><td colSpan={6} style={{ padding: 40, textAlign: 'center', color: T.colors.textMuted }}>No products in inventory.</td></tr>
                ) : items.map(p => {
                  const s = p.status || statusOf(p.stock, p.min_stock_level || 20);
                  const barPct = Math.min(100, (p.stock / (p.min_stock_level || 20)) * 50);
                  return (
                    <tr key={p.id} className="orbx-table-row">
                      <td style={{ padding: '13px 16px' }}>
                        <div style={{ fontSize: 13.5, fontWeight: 600 }}>{p.product_name || p.name}</div>
                        <div style={{ fontSize: 11, color: T.colors.textMuted }}>{p.sku}</div>
                      </td>
                      <td style={{ padding: '13px 16px' }}><span className="orbx-badge orbx-badge-neutral">{p.category || 'General'}</span></td>
                      <td style={{ padding: '13px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ width: 80, height: 6, background: T.colors.bgMuted, borderRadius: 99 }}>
                            <div style={{ height: '100%', width: `${barPct}%`, background: barColor(s), borderRadius: 99 }} />
                          </div>
                          <span style={{ fontSize: 14, fontWeight: 700, color: barColor(s) }}>{p.stock || p.quantity || 0}</span>
                        </div>
                      </td>
                      <td style={{ padding: '13px 16px', fontSize: 13, color: T.colors.textMid }}>{p.min_stock_level || 20}</td>
                      <td style={{ padding: '13px 16px' }}><span className={`orbx-badge ${badgeClass(s)}`}>{badgeLabel(s)}</span></td>
                      <td style={{ padding: '13px 16px' }}>
                        <div style={{ display: 'flex', gap: 6 }}>
                          {isWarehouse && <button className="orbx-btn orbx-btn-secondary" style={{ padding: '4px 10px', fontSize: 11 }}>Adjust</button>}
                          <button className="orbx-btn" style={{ padding: '4px 10px', fontSize: 11, background: T.colors.infoSoft, color: T.colors.info }}>Order</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <div className="orbx-card" style={{ padding: 0, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                    <tr style={{ background: T.colors.bgMuted }}>
                        <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: T.colors.textMuted }}>DATE & TIME</th>
                        <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: T.colors.textMuted }}>PRODUCT & CATEGORY</th>
                        <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: T.colors.textMuted }}>ACTION</th>
                        <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: T.colors.textMuted }}>CHANGE</th>
                        <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: T.colors.textMuted }}>REFERENCE</th>
                        <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: T.colors.textMuted }}>USER</th>
                    </tr>
                </thead>
                <tbody>
                    {loading ? (
                        <tr><td colSpan={6} style={{ padding: 40, textAlign: 'center' }}>Loading history...</td></tr>
                    ) : logs.length === 0 ? (
                        <tr><td colSpan={6} style={{ padding: 40, textAlign: 'center' }}>No movement history found.</td></tr>
                    ) : logs.map(l => (
                        <tr key={l.id} className="orbx-table-row">
                            <td style={{ padding: '13px 16px', fontSize: 12 }}>
                                {new Date(l.timestamp).toLocaleDateString()}<br/>
                                <span style={{ color: T.colors.textMuted }}>{new Date(l.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </td>
                            <td style={{ padding: '13px 16px' }}>
                                <div style={{ fontSize: 13, fontWeight: 600 }}>{l.product_name}</div>
                                <div style={{ fontSize: 10, color: T.colors.brand }}>{l.category_hierarchy || 'Uncategorized'}</div>
                            </td>
                            <td style={{ padding: '13px 16px' }}>
                                <span className={`orbx-badge ${l.qty_change > 0 ? 'orbx-badge-success' : 'orbx-badge-danger'}`}>
                                    {l.action_type.replace('_', ' ')}
                                </span>
                            </td>
                            <td style={{ padding: '13px 16px', fontSize: 14, fontWeight: 800, color: l.qty_change > 0 ? T.colors.success : T.colors.danger }}>
                                {l.qty_change > 0 ? '+' : ''}{l.qty_change}
                            </td>
                            <td style={{ padding: '13px 16px', fontSize: 12 }}>
                                <div style={{ fontWeight: 600 }}>{l.reference_type}</div>
                                <div style={{ fontSize: 11, color: T.colors.brand }}>#{l.ref_number || l.reference_id}</div>
                            </td>
                            <td style={{ padding: '13px 16px' }}>
                                <div style={{ fontSize: 12, fontWeight: 600 }}>{l.created_by_name}</div>
                                {l.approved_by_name && <div style={{ fontSize: 10, color: T.colors.success }}>Appr by: {l.approved_by_name}</div>}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
      )}
    </div>
  );
}
