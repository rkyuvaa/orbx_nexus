import React, { useState, useEffect } from 'react';
import Icon from '../components/Icon';
import { tokens as T } from '../design/tokens';

const API_URL = '/api';

export default function Reports() {
  const [period, setPeriod] = useState('This Week');
  const [data,   setData]   = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_URL}/reports/dashboard`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    })
    .then(r => r.ok ? r.json() : null)
    .then(d => {
        setData(d);
        setLoading(false);
    })
    .catch(() => setLoading(false));
  }, []);

  const stats = data?.stats || {};
  
  const kpis = [
    { label: 'Today Revenue',  value: `₹${(stats.todaySales || 0).toLocaleString()}`, sub: 'Today',           color: T.colors.brand },
    { label: 'Transactions',   value: stats.transactions || 0,   sub: 'Daily count',       color: T.colors.success },
    { label: 'Low Stock',      value: stats.lowStock || 0,        sub: 'Needs attention',    color: T.colors.danger },
    { label: 'Active Transfers', value: stats.activeTransfers || 0,      sub: 'In transit',color: T.colors.info },
  ];

  // Dummy split data since backend doesn't provide detailed analytics yet
  const payModes = [
    { mode: 'UPI',  pct: 45, amt: '₹0', color: T.colors.accent },
    { mode: 'Cash', pct: 30, amt: '₹0',   color: T.colors.info },
    { mode: 'Card', pct: 25, amt: '₹0',   color: T.colors.success },
  ];

  if (loading) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: 16 }}>
      <div className="orbx-spin" style={{ width: 40, height: 40, border: `3px solid ${T.colors.border}`, borderTopColor: T.colors.accent, borderRadius: '50%' }} />
      <p style={{ fontSize: 13, color: T.colors.textMuted, fontWeight: 500 }}>Loading Reports...</p>
    </div>
  );

  return (
    <div className="orbx-page-enter" style={{ padding: 24 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
           <h2 style={{ fontSize: 16, fontWeight: 700 }}>Reports & Analytics</h2>
           <p style={{ fontSize: 12, color: T.colors.textMuted }}>{data?.stats?.todaySales ? 'Live data from your branch' : 'Historical performance insights'}</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <select className="orbx-input orbx-select" style={{ width: 'auto', padding: '7px 32px 7px 12px' }} value={period} onChange={e => setPeriod(e.target.value)}>
            {['This Week', 'This Month', 'Last Month', 'Last 90 Days'].map(p => <option key={p}>{p}</option>)}
          </select>
          <button className="orbx-btn orbx-btn-secondary"><Icon name="download" size={14} /> Export</button>
        </div>
      </div>

      {/* KPI Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 24 }}>
        {kpis.map((k, i) => (
          <div key={i} className="orbx-stat-card">
            <div style={{ fontSize: 12, color: T.colors.textMuted, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>{k.label}</div>
            <div style={{ fontSize: 26, fontWeight: 800, color: k.color, marginBottom: 4 }}>{k.value}</div>
            <div style={{ fontSize: 11, color: T.colors.textMuted }}>{k.sub}</div>
          </div>
        ))}
      </div>

      {/* Recent Sales List */}
      <div className="orbx-card" style={{ padding: 0, overflow: 'hidden', marginBottom: 16 }}>
        <div style={{ padding: '16px 20px', borderBottom: `1px solid ${T.colors.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: 15, fontWeight: 700 }}>Recent Transaction Details</h3>
          <span style={{ fontSize: 11, color: T.colors.textMuted }}>LAST 5 SALES</span>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: T.colors.bgMuted }}>
              {['Bill #', 'Branch', 'User', 'Mode', 'Amount', 'Time'].map(h => (
                <th key={h} style={{ padding: '12px 20px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: T.colors.textMuted, textTransform: 'uppercase' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(data?.recentSales || []).map((s, i) => (
              <tr key={i} className="orbx-table-row">
                <td style={{ padding: '14px 20px', fontSize: 13, fontWeight: 700 }}>{s.bill_number}</td>
                <td style={{ padding: '14px 20px', fontSize: 13 }}>{s.branch_name}</td>
                <td style={{ padding: '14px 20px', fontSize: 13 }}>{s.user_name}</td>
                <td style={{ padding: '14px 20px' }}>
                   <span className={`orbx-badge ${s.payment_method === 'Cash' ? 'orbx-badge-brand' : 'orbx-badge-info'}`}>{s.payment_method}</span>
                </td>
                <td style={{ padding: '14px 20px', fontSize: 13, fontWeight: 700 }}>₹{parseFloat(s.total_amount).toLocaleString()}</td>
                <td style={{ padding: '14px 20px', fontSize: 12, color: T.colors.textMuted }}>{new Date(s.created_at).toLocaleTimeString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
         <div className="orbx-card">
           <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>Inventory Critical List</div>
           {(data?.inventoryHighlights || []).map((p, i) => (
             <div key={i} style={{ marginBottom: 14 }}>
               <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                 <span style={{ fontSize: 13, fontWeight: 500 }}>{p.name} ({p.branch_name})</span>
                 <span style={{ fontSize: 13, fontWeight: 700, color: T.colors.danger }}>{p.quantity} Units</span>
               </div>
               <div style={{ height: 6, background: T.colors.bgMuted, borderRadius: 99 }}>
                 <div style={{ height: '100%', width: '15%', background: T.colors.danger, borderRadius: 99 }} />
               </div>
             </div>
           ))}
         </div>

         <div className="orbx-card">
           <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>Payment Distribution (Estimated)</div>
           {payModes.map((pm, i) => (
             <div key={i} style={{ marginBottom: 16 }}>
               <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                 <span style={{ fontSize: 13, fontWeight: 500 }}>{pm.mode}</span>
                 <span style={{ fontSize: 13, fontWeight: 700 }}>{pm.pct}%</span>
               </div>
               <div style={{ height: 7, background: T.colors.bgMuted, borderRadius: 99 }}>
                 <div style={{ height: '100%', width: `${pm.pct}%`, background: pm.color, borderRadius: 99 }} />
               </div>
             </div>
           ))}
         </div>
      </div>
    </div>
  );
}
