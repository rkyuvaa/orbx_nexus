import { useState, useEffect } from 'react';
import Icon from '../components/Icon';
import { tokens as T } from '../design/tokens';

const API_URL = `http://${window.location.hostname}:5050`;

const WEEK_DATA = [
  { day: 'Mon', sales: 38200, orders: 92 },  { day: 'Tue', sales: 42100, orders: 108 },
  { day: 'Wed', sales: 35800, orders: 89 },  { day: 'Thu', sales: 51200, orders: 131 },
  { day: 'Fri', sales: 48600, orders: 122 }, { day: 'Sat', sales: 62400, orders: 158 },
  { day: 'Sun', sales: 48240, orders: 127 },
];
const MAX_SALES = Math.max(...WEEK_DATA.map(d => d.sales));

export default function Reports() {
  const [period, setPeriod] = useState('This Week');
  const [data,   setData]   = useState(null);

  useEffect(() => {
    fetch(`${API_URL}/api/reports/dashboard`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    }).then(r => r.ok ? r.json() : null).then(setData).catch(() => {});
  }, []);

  const kpis = [
    { label: 'Total Revenue',  value: '₹3,26,540', sub: 'This week',           color: T.colors.brand },
    { label: 'Gross Profit',   value: '₹82,150',   sub: 'Margin: 25.2%',       color: T.colors.success },
    { label: 'Total Orders',   value: '827',        sub: 'Avg ₹395 / order',    color: T.colors.info },
    { label: 'Items Sold',     value: '6,248',      sub: 'Across 12 categories',color: T.colors.accent },
  ];

  const payModes = [
    { mode: 'UPI',  pct: 45, amt: '₹1,46,940', color: T.colors.accent },
    { mode: 'Cash', pct: 30, amt: '₹97,960',   color: T.colors.info },
    { mode: 'Card', pct: 25, amt: '₹81,640',   color: T.colors.success },
  ];

  const categories = [
    { cat: 'Grocery',       rev: '₹1,24,200', pct: 76 },
    { cat: 'Personal Care', rev: '₹64,400',   pct: 55 },
    { cat: 'Beverage',      rev: '₹48,200',   pct: 42 },
    { cat: 'Household',     rev: '₹36,800',   pct: 34 },
    { cat: 'Snacks',        rev: '₹28,400',   pct: 25 },
  ];

  return (
    <div className="orbx-page-enter" style={{ padding: 24 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700 }}>Reports & Analytics</h2>
        <div style={{ display: 'flex', gap: 8 }}>
          <select className="orbx-input orbx-select" style={{ width: 'auto', padding: '7px 32px 7px 12px' }} value={period} onChange={e => setPeriod(e.target.value)}>
            {['This Week', 'This Month', 'Last Month', 'Last 90 Days'].map(p => <option key={p}>{p}</option>)}
          </select>
          <button className="orbx-btn orbx-btn-secondary"><Icon name="download" size={14} /> Export</button>
          <button className="orbx-btn orbx-btn-secondary"><Icon name="print" size={14} /> Print</button>
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

      {/* Daily Chart */}
      <div className="orbx-card" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ fontSize: 15, fontWeight: 700 }}>Daily Sales Performance</div>
          <div style={{ fontSize: 12, color: T.colors.textMuted }}>Total: ₹3,26,540 this week</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 16, height: 160 }}>
          {WEEK_DATA.map((d, i) => (
            <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: T.colors.textMid }}>₹{(d.sales / 1000).toFixed(0)}k</div>
              <div style={{ width: '100%', position: 'relative', height: 110, display: 'flex', alignItems: 'flex-end' }}>
                <div
                  style={{ width: '100%', height: `${(d.sales / MAX_SALES) * 100}%`, background: i === 5 ? T.colors.accent : `${T.colors.accent}50`, borderRadius: '4px 4px 0 0', transition: 'height 0.6s ease' }}
                  title={`${d.day}: ₹${d.sales.toLocaleString()} · ${d.orders} orders`}
                />
              </div>
              <div style={{ fontSize: 11, color: T.colors.textMuted, fontWeight: 600 }}>{d.day}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Payment Mode + Category */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div className="orbx-card">
          <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>Payment Mode Split</div>
          {payModes.map((pm, i) => (
            <div key={i} style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: pm.color }} />
                  <span style={{ fontSize: 13, fontWeight: 500 }}>{pm.mode}</span>
                </div>
                <div style={{ display: 'flex', gap: 12 }}>
                  <span style={{ fontSize: 13, color: T.colors.textMuted }}>{pm.amt}</span>
                  <span style={{ fontSize: 13, fontWeight: 700 }}>{pm.pct}%</span>
                </div>
              </div>
              <div style={{ height: 7, background: T.colors.bgMuted, borderRadius: 99 }}>
                <div style={{ height: '100%', width: `${pm.pct}%`, background: pm.color, borderRadius: 99, transition: 'width 0.6s' }} />
              </div>
            </div>
          ))}
        </div>

        <div className="orbx-card">
          <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>Category Revenue</div>
          {categories.map((c, i) => (
            <div key={i} style={{ marginBottom: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                <span style={{ fontSize: 13, fontWeight: 500 }}>{c.cat}</span>
                <span style={{ fontSize: 13, fontWeight: 700 }}>{c.rev}</span>
              </div>
              <div style={{ height: 7, background: T.colors.bgMuted, borderRadius: 99 }}>
                <div style={{ height: '100%', width: `${c.pct}%`, background: `hsl(${210 + i * 28}, 70%, 55%)`, borderRadius: 99, transition: 'width 0.6s' }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
