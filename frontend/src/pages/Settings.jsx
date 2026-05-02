import React, { useState, useEffect } from 'react';
import Icon from '../components/Icon';
import { tokens as T } from '../design/tokens';
import toast from 'react-hot-toast';

// ─── SUB-COMPONENTS ──────────────────────────────────────────────────────────

const TabButton = ({ active, label, icon, onClick }) => (
  <button
    onClick={onClick}
    style={{
      display: 'flex', alignItems: 'center', gap: 8, padding: '12px 20px', border: 'none',
      background: active ? T.colors.bgCard : 'transparent',
      color: active ? T.colors.accent : T.colors.textMuted,
      fontSize: 13, fontWeight: 700, cursor: 'pointer', borderRadius: `${T.radius.md} ${T.radius.md} 0 0`,
      transition: 'all 0.2s', borderBottom: active ? `2px solid ${T.colors.accent}` : '2px solid transparent',
    }}
  >
    <Icon name={icon} size={16} />
    {label}
  </button>
);

const SectionHeader = ({ title, subtitle, action }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 24 }}>
    <div>
      <h3 style={{ fontSize: 18, fontWeight: 800, color: T.colors.text }}>{title}</h3>
      <p style={{ fontSize: 13, color: T.colors.textMuted, marginTop: 2 }}>{subtitle}</p>
    </div>
    {action && action}
  </div>
);

// ─── MAIN SETTINGS PAGE ───────────────────────────────────────────────────────

export default function Settings() {
  const [activeTab, setActiveTab] = useState('branches');
  const [branches,  setBranches]  = useState([]);
  const [users,     setUsers]     = useState([]);
  const [roles,     setRoles]     = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [showModal, setShowModal] = useState(null); // 'branch', 'user', 'role'

  const API_URL = '/api';
  const token   = localStorage.getItem('token');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [bRes, uRes, rRes] = await Promise.all([
        fetch(`${API_URL}/branches`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_URL}/users`,    { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_URL}/roles`,    { headers: { Authorization: `Bearer ${token}` } })
      ]);
      const [bData, uData, rData] = await Promise.all([bRes.json(), uRes.json(), rRes.json()]);
      setBranches(Array.isArray(bData) ? bData : []);
      setUsers(Array.isArray(uData) ? uData : []);
      setRoles(Array.isArray(rData) ? rData : []);
    } catch (err) {
      toast.error('Failed to load settings data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBranch = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData);
    try {
      const res = await fetch(`${API_URL}/branches`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ...data, is_warehouse: data.is_warehouse === 'on' })
      });
      if (res.ok) {
        toast.success('Branch created successfully');
        setShowModal(null);
        fetchData();
      }
    } catch (err) { toast.error('Error creating branch'); }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData);
    try {
      const res = await fetch(`${API_URL}/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(data)
      });
      if (res.ok) {
        toast.success('User created successfully');
        setShowModal(null);
        fetchData();
      } else {
        const err = await res.json();
        toast.error(err.error || 'Error creating user');
      }
    } catch (err) { toast.error('Error creating user'); }
  };

  // ─── RENDERERS ──────────────────────────────────────────────────────────────

  const renderBranches = () => (
    <div className="orbx-page-enter">
      <SectionHeader 
        title="Branch Management" 
        subtitle="Manage physical outlets, warehouses and service centers" 
        action={<button className="orbx-btn orbx-btn-primary" onClick={() => setShowModal('branch')}>+ Add Branch</button>}
      />
      <div className="orbx-card" style={{ padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: T.colors.bgMuted, borderBottom: `1px solid ${T.colors.border}` }}>
              <th style={{ textAlign: 'left', padding: '12px 20px', fontSize: 12, color: T.colors.textMuted }}>BRANCH NAME</th>
              <th style={{ textAlign: 'left', padding: '12px 20px', fontSize: 12, color: T.colors.textMuted }}>LOCATION</th>
              <th style={{ textAlign: 'left', padding: '12px 20px', fontSize: 12, color: T.colors.textMuted }}>TYPE</th>
              <th style={{ textAlign: 'left', padding: '12px 20px', fontSize: 12, color: T.colors.textMuted }}>STATUS</th>
              <th style={{ textAlign: 'right', padding: '12px 20px', fontSize: 12, color: T.colors.textMuted }}>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {branches.map(b => (
              <tr key={b.id} className="orbx-table-row">
                <td style={{ padding: '16px 20px', fontSize: 14, fontWeight: 600 }}>{b.name}</td>
                <td style={{ padding: '16px 20px', fontSize: 13, color: T.colors.textMid }}>{b.location || 'Not Set'}</td>
                <td style={{ padding: '16px 20px' }}>
                  <span className={`orbx-badge ${b.is_warehouse ? 'orbx-badge-info' : 'orbx-badge-brand'}`}>
                    {b.is_warehouse ? 'Warehouse' : 'Retail'}
                  </span>
                </td>
                <td style={{ padding: '16px 20px' }}>
                  <span className={`orbx-badge ${b.is_active ? 'orbx-badge-success' : 'orbx-badge-danger'}`}>
                    {b.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                  <button className="orbx-btn orbx-btn-ghost" style={{ padding: 6 }}><Icon name="edit" size={14} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderUsers = () => (
    <div className="orbx-page-enter">
      <SectionHeader 
        title="User Accounts" 
        subtitle="Manage staff access, roles and branch assignments" 
        action={<button className="orbx-btn orbx-btn-primary" onClick={() => setShowModal('user')}>+ Add Staff</button>}
      />
      <div className="orbx-card" style={{ padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: T.colors.bgMuted, borderBottom: `1px solid ${T.colors.border}` }}>
              <th style={{ textAlign: 'left', padding: '12px 20px', fontSize: 12, color: T.colors.textMuted }}>STAFF NAME</th>
              <th style={{ textAlign: 'left', padding: '12px 20px', fontSize: 12, color: T.colors.textMuted }}>EMAIL</th>
              <th style={{ textAlign: 'left', padding: '12px 20px', fontSize: 12, color: T.colors.textMuted }}>ROLE</th>
              <th style={{ textAlign: 'left', padding: '12px 20px', fontSize: 12, color: T.colors.textMuted }}>PRIMARY BRANCH</th>
              <th style={{ textAlign: 'right', padding: '12px 20px', fontSize: 12, color: T.colors.textMuted }}>STATUS</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id} className="orbx-table-row">
                <td style={{ padding: '16px 20px', fontSize: 14, fontWeight: 600 }}>{u.name}</td>
                <td style={{ padding: '16px 20px', fontSize: 13, color: T.colors.textMid }}>{u.email}</td>
                <td style={{ padding: '16px 20px' }}>
                  <span className="orbx-badge orbx-badge-neutral">{u.role_name || 'Staff'}</span>
                </td>
                <td style={{ padding: '16px 20px', fontSize: 13, color: T.colors.textMid }}>{u.branch_name || 'Global'}</td>
                <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                   <span className={`orbx-badge ${u.is_active ? 'orbx-badge-success' : 'orbx-badge-danger'}`}>
                    {u.is_active ? 'Active' : 'Locked'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderSync = () => (
    <div className="orbx-page-enter">
      <SectionHeader title="Synchronization Settings" subtitle="Configure how the offline engine talks to the cloud" />
      <div className="orbx-card" style={{ maxWidth: 600 }}>
        <div style={{ display: 'grid', gap: 20 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: T.colors.textMid, marginBottom: 8, display: 'block' }}>SYNC INTERVAL (SECONDS)</label>
            <input className="orbx-input" type="number" defaultValue="30" />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: T.colors.textMid, marginBottom: 8, display: 'block' }}>CLOUD API URL</label>
            <input className="orbx-input" defaultValue={window.location.origin + '/api'} />
          </div>
          <div style={{ display: 'flex', gap: 12, marginTop: 10 }}>
            <button className="orbx-btn orbx-btn-primary" onClick={() => toast.success('Sync settings updated')}>Save Settings</button>
            <button className="orbx-btn orbx-btn-danger" onClick={() => { if(window.confirm('Wipe local cache?')) toast.success('Cache cleared'); }}>Clear Local Cache</button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderInvoice = () => (
    <div className="orbx-page-enter">
      <SectionHeader title="Invoice & Branding" subtitle="Customize invoice prefixes and footer templates" />
      <div className="orbx-card" style={{ maxWidth: 600 }}>
        <div style={{ display: 'grid', gap: 20 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: T.colors.textMid, marginBottom: 8, display: 'block' }}>INVOICE PREFIX</label>
              <input className="orbx-input" defaultValue="INV-2026-" />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: T.colors.textMid, marginBottom: 8, display: 'block' }}>STARTING NUMBER</label>
              <input className="orbx-input" type="number" defaultValue="1001" />
            </div>
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: T.colors.textMid, marginBottom: 8, display: 'block' }}>INVOICE FOOTER MESSAGE</label>
            <textarea className="orbx-input" style={{ height: 80, resize: 'none' }} defaultValue="Thank you for shopping with OrbX Retail! Please visit again." />
          </div>
          <div style={{ display: 'flex', gap: 12, marginTop: 10 }}>
            <button className="orbx-btn orbx-btn-primary" onClick={() => toast.success('Branding updated')}>Save Branding</button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ padding: 24, background: T.colors.bg, minHeight: '100%' }}>
      {/* Tab Navigation */}
      <div style={{ display: 'flex', borderBottom: `1px solid ${T.colors.border}`, marginBottom: 32, gap: 4 }}>
        <TabButton active={activeTab === 'branches'} label="Branches" icon="inventory" onClick={() => setActiveTab('branches')} />
        <TabButton active={activeTab === 'users'}    label="Users"     icon="customers" onClick={() => setActiveTab('users')} />
        <TabButton active={activeTab === 'roles'}    label="Roles"     icon="settings"  onClick={() => setActiveTab('roles')} />
        <TabButton active={activeTab === 'sync'}     label="Sync"      icon="sync"      onClick={() => setActiveTab('sync')} />
        <TabButton active={activeTab === 'invoice'}  label="Invoice"   icon="reports"   onClick={() => setActiveTab('invoice')} />
      </div>

      {/* Content */}
      {loading ? (
        <div style={{ padding: 48, textAlign: 'center', color: T.colors.textMuted }}>Loading settings...</div>
      ) : (
        <>
          {activeTab === 'branches' && renderBranches()}
          {activeTab === 'users'    && renderUsers()}
          {activeTab === 'sync'     && renderSync()}
          {activeTab === 'invoice'  && renderInvoice()}
          {activeTab === 'roles'    && (
             <div className="orbx-page-enter">
               <SectionHeader title="Role Management" subtitle="Define permission sets for different staff tiers" />
               <div style={{ color: T.colors.textMuted, padding: 24 }}>Role matrix editor coming in next update. Use defaults for now.</div>
             </div>
          )}
        </>
      )}

      {/* Modals */}
      {showModal === 'branch' && (
        <div className="orbx-modal-overlay">
          <div className="orbx-modal" style={{ maxWidth: 450, padding: 32 }}>
            <h3 style={{ fontSize: 20, fontWeight: 800, marginBottom: 24 }}>New Branch</h3>
            <form onSubmit={handleCreateBranch} style={{ display: 'grid', gap: 20 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: T.colors.textMid, marginBottom: 8, display: 'block' }}>BRANCH NAME</label>
                <input name="name" className="orbx-input" required placeholder="e.g. RS Puram Outlet" />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: T.colors.textMid, marginBottom: 8, display: 'block' }}>LOCATION / CITY</label>
                <input name="location" className="orbx-input" placeholder="e.g. Coimbatore" />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <input type="checkbox" name="is_warehouse" id="is_warehouse" />
                <label htmlFor="is_warehouse" style={{ fontSize: 13, fontWeight: 600 }}>Mark as Warehouse</label>
              </div>
              <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
                <button type="submit" className="orbx-btn orbx-btn-primary" style={{ flex: 1 }}>Create Branch</button>
                <button type="button" className="orbx-btn orbx-btn-secondary" onClick={() => setShowModal(null)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showModal === 'user' && (
        <div className="orbx-modal-overlay">
          <div className="orbx-modal" style={{ maxWidth: 450, padding: 32 }}>
            <h3 style={{ fontSize: 20, fontWeight: 800, marginBottom: 24 }}>New Staff Account</h3>
            <form onSubmit={handleCreateUser} style={{ display: 'grid', gap: 20 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: T.colors.textMid, marginBottom: 8, display: 'block' }}>FULL NAME</label>
                <input name="name" className="orbx-input" required placeholder="e.g. Rajesh Kumar" />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: T.colors.textMid, marginBottom: 8, display: 'block' }}>EMAIL ADDRESS</label>
                <input name="email" type="email" className="orbx-input" required placeholder="rajesh@orbx.com" />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: T.colors.textMid, marginBottom: 8, display: 'block' }}>PASSWORD</label>
                <input name="password" type="password" className="orbx-input" required placeholder="••••••••" />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: T.colors.textMid, marginBottom: 8, display: 'block' }}>ROLE</label>
                  <select name="role_id" className="orbx-input orbx-select" required>
                    {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: T.colors.textMid, marginBottom: 8, display: 'block' }}>BRANCH</label>
                  <select name="branch_id" className="orbx-input orbx-select" required>
                    {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
                <button type="submit" className="orbx-btn orbx-btn-primary" style={{ flex: 1 }}>Create Account</button>
                <button type="button" className="orbx-btn orbx-btn-secondary" onClick={() => setShowModal(null)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
