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
  const [traceData, setTraceData] = useState(null);
  const [traceLoading, setTraceLoading] = useState(false);
  const [activeTraceTab, setActiveTraceTab] = useState('ledger');

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const token = localStorage.getItem('token');
  const isWarehouse = user.is_superadmin || user.is_warehouse;

  const fetchData = async () => {
    setLoading(true);
    try {
      const endpoint = activeTab === 'stock' ? '/inventory' : '/inventory/logs';
      const res = await fetch(`${API_URL}${endpoint}`, {
        headers: { Authorization: `Bearer ${token}` }
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

  const openTraceability = async (productId) => {
    setTraceLoading(true);
    try {
      const res = await fetch(`${API_URL}/inventory/trace/${productId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setTraceData(await res.json());
      }
    } catch (err) {
      toast.error('Failed to load traceability data');
    } finally {
      setTraceLoading(false);
    }
  };

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
                    <tr key={p.id} className="orbx-table-row" style={{ cursor: 'pointer' }} onClick={() => openTraceability(p.id)}>
                      <td style={{ padding: '13px 16px' }}>
                        <div style={{ fontSize: 13.5, fontWeight: 700, color: T.colors.brand }}>{p.product_name || p.name}</div>
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
                          <button className="orbx-btn" style={{ padding: '4px 10px', fontSize: 11, background: T.colors.brandSoft, color: T.colors.brand }}>Trace</button>
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

      {/* Product Traceability Modal */}
      {traceData && (
        <div className="orbx-modal-overlay">
          <div className="orbx-modal" style={{ maxWidth: 1100, width: '95%', padding: 0 }}>
            {/* Modal Header */}
            <div style={{ padding: '20px 24px', borderBottom: `1px solid ${T.colors.border}`, background: T.colors.bgMuted, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: T.colors.textMuted, textTransform: 'uppercase' }}>PRODUCT TRACEABILITY VIEW</div>
                    <h3 style={{ fontSize: 18, fontWeight: 800 }}>{traceData.product.name}</h3>
                </div>
                <button onClick={() => setTraceData(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><Icon name="x" size={24} /></button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', height: '75vh' }}>
                {/* Left Side: Summary & Filters */}
                <div style={{ padding: 24, borderRight: `1px solid ${T.colors.border}`, background: T.colors.bgMuted, overflowY: 'auto' }}>
                    <div className="orbx-card" style={{ marginBottom: 20, background: 'white' }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: T.colors.textMuted, marginBottom: 4 }}>HIERARCHY</div>
                        <div style={{ fontSize: 12, color: T.colors.brand, fontWeight: 600, lineHeight: 1.4 }}>{traceData.product.category_hierarchy || 'N/A'}</div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 }}>
                        <div className="orbx-card" style={{ background: 'white', padding: 12 }}>
                            <div style={{ fontSize: 11, color: T.colors.textMuted }}>CURRENT STOCK</div>
                            <div style={{ fontSize: 18, fontWeight: 800, color: T.colors.success }}>{traceData.product.quantity || 0}</div>
                        </div>
                        <div className="orbx-card" style={{ background: 'white', padding: 12 }}>
                            <div style={{ fontSize: 11, color: T.colors.textMuted }}>MIN STOCK</div>
                            <div style={{ fontSize: 18, fontWeight: 800, color: T.colors.danger }}>{traceData.product.min_stock_level || 0}</div>
                        </div>
                    </div>

                    <div style={{ marginBottom: 24 }}>
                        <label style={{ fontSize: 11, fontWeight: 700, color: T.colors.textMuted, display: 'block', marginBottom: 8 }}>QUICK FILTERS</label>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            <button className="orbx-btn orbx-btn-secondary" style={{ justifyContent: 'flex-start' }}><Icon name="calendar" size={14} /> Last 30 Days</button>
                            <button className="orbx-btn orbx-btn-secondary" style={{ justifyContent: 'flex-start' }}><Icon name="sync" size={14} /> Receipts Only</button>
                            <button className="orbx-btn orbx-btn-secondary" style={{ justifyContent: 'flex-start' }}><Icon name="products" size={14} /> Sales History</button>
                        </div>
                    </div>

                    <div style={{ padding: 16, background: T.colors.infoSoft, borderRadius: T.radius.md, border: `1px solid ${T.colors.info}40` }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: T.colors.info, display: 'flex', alignItems: 'center', gap: 6 }}>
                            <Icon name="check" size={14} /> AUDIT READY
                        </div>
                        <p style={{ fontSize: 11, color: T.colors.textMid, marginTop: 4 }}>This view is read-only and serves as the official traceability record for this product.</p>
                    </div>
                </div>

                {/* Right Side: Tabs Content */}
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', gap: 24, padding: '0 24px', borderBottom: `1px solid ${T.colors.border}`, background: 'white' }}>
                        <div 
                            onClick={() => setActiveTraceTab('ledger')}
                            style={{ padding: '16px 4px', fontSize: 13, fontWeight: 700, cursor: 'pointer', color: activeTraceTab === 'ledger' ? T.colors.brand : T.colors.textMuted, borderBottom: activeTraceTab === 'ledger' ? `2px solid ${T.colors.brand}` : 'none' }}
                        >
                            Barcode Ledger
                        </div>
                        <div 
                            onClick={() => setActiveTraceTab('history')}
                            style={{ padding: '16px 4px', fontSize: 13, fontWeight: 700, cursor: 'pointer', color: activeTraceTab === 'history' ? T.colors.brand : T.colors.textMuted, borderBottom: activeTraceTab === 'history' ? `2px solid ${T.colors.brand}` : 'none' }}
                        >
                            Movement Timeline
                        </div>
                    </div>

                    <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
                        {activeTraceTab === 'ledger' ? (
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ borderBottom: `2px solid ${T.colors.border}` }}>
                                        <th style={{ textAlign: 'left', paddingBottom: 12, fontSize: 11, color: T.colors.textMuted }}>BARCODE</th>
                                        <th style={{ textAlign: 'left', paddingBottom: 12, fontSize: 11, color: T.colors.textMuted }}>LOCATION</th>
                                        <th style={{ textAlign: 'left', paddingBottom: 12, fontSize: 11, color: T.colors.textMuted }}>STATUS</th>
                                        <th style={{ textAlign: 'left', paddingBottom: 12, fontSize: 11, color: T.colors.textMuted }}>SOURCE GRN</th>
                                        <th style={{ textAlign: 'right', paddingBottom: 12, fontSize: 11, color: T.colors.textMuted }}>RECEIVED ON</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {traceData.ledger.map(b => (
                                        <tr key={b.barcode} style={{ borderBottom: `1px solid ${T.colors.border}` }}>
                                            <td style={{ padding: '12px 0' }}>
                                                <div style={{ fontWeight: 800, color: T.colors.brand, letterSpacing: 0.5 }}>{b.barcode}</div>
                                            </td>
                                            <td style={{ padding: '12px 0', fontSize: 13 }}>{b.branch_name}</td>
                                            <td style={{ padding: '12px 0' }}>
                                                <span className={`orbx-badge ${b.status === 'available' ? 'orbx-badge-success' : 'orbx-badge-danger'}`}>
                                                    {b.status.toUpperCase()}
                                                </span>
                                            </td>
                                            <td style={{ padding: '12px 0', fontSize: 12, fontWeight: 600, color: T.colors.info }}>#{b.grn_number}</td>
                                            <td style={{ padding: '12px 0', textAlign: 'right', fontSize: 12, color: T.colors.textMuted }}>{new Date(b.created_at).toLocaleDateString()}</td>
                                        </tr>
                                    ))}
                                    {traceData.ledger.length === 0 && (
                                        <tr><td colSpan={5} style={{ padding: 40, textAlign: 'center', color: T.colors.textMuted }}>No barcode data for this product.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        ) : (
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ borderBottom: `2px solid ${T.colors.border}` }}>
                                        <th style={{ textAlign: 'left', paddingBottom: 12, fontSize: 11, color: T.colors.textMuted }}>DATE</th>
                                        <th style={{ textAlign: 'left', paddingBottom: 12, fontSize: 11, color: T.colors.textMuted }}>TYPE</th>
                                        <th style={{ textAlign: 'left', paddingBottom: 12, fontSize: 11, color: T.colors.textMuted }}>CHANGE</th>
                                        <th style={{ textAlign: 'left', paddingBottom: 12, fontSize: 11, color: T.colors.textMuted }}>SOURCE / DRILL-BACK</th>
                                        <th style={{ textAlign: 'right', paddingBottom: 12, fontSize: 11, color: T.colors.textMuted }}>ACTION BY</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {traceData.history.map(h => (
                                        <tr key={h.id} style={{ borderBottom: `1px solid ${T.colors.border}` }}>
                                            <td style={{ padding: '14px 0', fontSize: 12 }}>{new Date(h.timestamp).toLocaleDateString()}</td>
                                            <td style={{ padding: '14px 0' }}>
                                                <span className={`orbx-badge ${h.qty_change > 0 ? 'orbx-badge-success' : 'orbx-badge-danger'}`} style={{ fontSize: 10 }}>
                                                    {h.action_type}
                                                </span>
                                            </td>
                                            <td style={{ padding: '14px 0', fontSize: 15, fontWeight: 800, color: h.qty_change > 0 ? T.colors.success : T.colors.danger }}>
                                                {h.qty_change > 0 ? '+' : ''}{h.qty_change}
                                            </td>
                                            <td style={{ padding: '14px 0' }}>
                                                {h.action_type === 'GRN_RECEIPT' ? (
                                                    <div style={{ background: T.colors.bgMuted, padding: '8px 12px', borderRadius: 8, border: `1px solid ${T.colors.border}` }}>
                                                        <div style={{ fontSize: 11, color: T.colors.textMuted }}>{h.supplier_name || 'N/A'}</div>
                                                        <div style={{ fontSize: 12, fontWeight: 700, color: T.colors.brand }}>PO: {h.po_number || 'N/A'}</div>
                                                        <div style={{ fontSize: 10, color: T.colors.info }}>GRN: {h.grn_number}</div>
                                                    </div>
                                                ) : (
                                                    <div style={{ fontSize: 13 }}>{h.reference_type} #{h.reference_id}</div>
                                                )}
                                            </td>
                                            <td style={{ padding: '14px 0', textAlign: 'right' }}>
                                                <div style={{ fontSize: 12, fontWeight: 600 }}>{h.created_by_name}</div>
                                                {h.approved_by_name && <div style={{ fontSize: 10, color: T.colors.success }}>Appr: {h.approved_by_name}</div>}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
