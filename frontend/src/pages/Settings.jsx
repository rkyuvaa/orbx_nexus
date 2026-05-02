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

// ─── PERMISSION GROUPS ───────────────────────────────────────────────────────
const PERMISSION_GROUPS = [
  { 
    title: 'Product Permissions', 
    key: 'products',
    perms: [
      { id: 'view',   label: 'View Product' },
      { id: 'create', label: 'Create Product', warehouseOnly: true },
      { id: 'edit',   label: 'Edit Product',   warehouseOnly: true }
    ] 
  },
  { 
    title: 'Purchase Permissions', 
    key: 'purchases',
    perms: [
      { id: 'view',    label: 'View Purchase' },
      { id: 'create',  label: 'Create Purchase', warehouseOnly: true },
      { id: 'edit',    label: 'Edit Purchase',   warehouseOnly: true },
      { id: 'receive', label: 'Receive Goods',   warehouseOnly: true }
    ] 
  },
  { 
    title: 'Inventory Permissions', 
    key: 'inventory',
    perms: [
      { id: 'view',     label: 'View Stock' },
      { id: 'adjust',   label: 'Adjust Stock (Manual)', warehouseOnly: true },
      { id: 'transfer', label: 'Initiate Transfer',    warehouseOnly: true }
    ] 
  },
  { 
    title: 'Stock Transfer Permissions', 
    key: 'transfers',
    perms: [
      { id: 'view',     label: 'View Transfers' },
      { id: 'create',   label: 'Create Transfer Req' },
      { id: 'dispatch', label: 'Dispatch Transfer', warehouseOnly: true },
      { id: 'receive',  label: 'Receive Transfer' }
    ] 
  },
  { 
    title: 'Sales / Billing Permissions', 
    key: 'billing',
    perms: [
      { id: 'create', label: 'Create Bill' },
      { id: 'edit',   label: 'Edit Bill' },
      { id: 'cancel', label: 'Cancel Bill' }
    ] 
  },
  { 
    title: 'Reports Permissions', 
    key: 'reports',
    perms: [
      { id: 'view_own', label: 'View Own Branch Reports' },
      { id: 'view_all', label: 'View All Branch Reports', warehouseOnly: true }
    ] 
  },
  { 
    title: 'User Management Permissions', 
    key: 'users',
    perms: [
      { id: 'view',   label: 'View Users' },
      { id: 'create', label: 'Create Users' },
      { id: 'edit',   label: 'Edit Users' }
    ] 
  }
];

// ─── MAIN SETTINGS PAGE ───────────────────────────────────────────────────────

export default function Settings() {
  const [activeTab, setActiveTab] = useState('branches');
  const [branches,  setBranches]  = useState([]);
  const [users,     setUsers]     = useState([]);
  const [roles,     setRoles]     = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [showModal, setShowModal] = useState(null); // 'branch', 'user', 'role'
  const [editingRole, setEditingRole] = useState(null);

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

  const handleSaveRole = async (e) => {
    if (e) e.preventDefault();
    const isEdit = !!editingRole.id;
    try {
      const res = await fetch(`${API_URL}/roles${isEdit ? '/' + editingRole.id : ''}`, {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(editingRole)
      });
      if (res.ok) {
        toast.success(`Role ${isEdit ? 'updated' : 'created'} successfully`);
        setEditingRole(null);
        fetchData();
      }
    } catch (err) { toast.error('Error saving role'); }
  };

  const togglePermission = (groupKey, permId) => {
    const current = Array.isArray(editingRole.permissions[groupKey]) ? editingRole.permissions[groupKey] : [];
    const updated = current.includes(permId) 
      ? current.filter(id => id !== permId)
      : [...current, permId];
    
    setEditingRole({
      ...editingRole,
      permissions: { ...editingRole.permissions, [groupKey]: updated }
    });
  };

  // ─── RENDERERS ──────────────────────────────────────────────────────────────

  const renderRoles = () => (
    <div className="orbx-page-enter">
      <SectionHeader 
        title="Role Management" 
        subtitle="Define permission sets for different staff tiers" 
        action={<button className="orbx-btn orbx-btn-primary" onClick={() => setEditingRole({ name: '', role_type: 'Branch', permissions: {} })}>+ Add Role</button>}
      />
      
      {editingRole ? (
        <div className="orbx-card" style={{ padding: 24, border: `2px solid ${T.colors.accent}40` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
            <h4 style={{ fontSize: 16, fontWeight: 700 }}>{editingRole.id ? 'Edit Role' : 'Create New Role'}</h4>
            <div style={{ display: 'flex', gap: 12 }}>
              <button className="orbx-btn orbx-btn-secondary" onClick={() => setEditingRole(null)}>Cancel</button>
              <button className="orbx-btn orbx-btn-primary" onClick={handleSaveRole}>Save Role Matrix</button>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 32 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: T.colors.textMid, marginBottom: 8, display: 'block' }}>ROLE NAME</label>
              <input 
                className="orbx-input" 
                value={editingRole.name} 
                onChange={e => setEditingRole({ ...editingRole, name: e.target.value })}
                placeholder="e.g. Senior Cashier" 
              />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: T.colors.textMid, marginBottom: 8, display: 'block' }}>ROLE TYPE</label>
              <select 
                className="orbx-input orbx-select" 
                value={editingRole.role_type}
                onChange={e => setEditingRole({ ...editingRole, role_type: e.target.value })}
              >
                <option value="Warehouse">Warehouse Role (Full Access Potential)</option>
                <option value="Branch">Branch Role (Strictly Restricted)</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 24 }}>
            {PERMISSION_GROUPS.map(group => (
              <div key={group.key} style={{ background: T.colors.bgMuted, padding: 16, borderRadius: T.radius.md, border: `1px solid ${T.colors.border}` }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: T.colors.brand, marginBottom: 12, borderBottom: `1px solid ${T.colors.border}`, paddingBottom: 8 }}>
                  {group.title}
                </div>
                <div style={{ display: 'grid', gap: 10 }}>
                  {group.perms.map(p => {
                    const isDisabled = editingRole.role_type === 'Branch' && p.warehouseOnly;
                    const groupPerms = editingRole.permissions[group.key];
                    const isChecked = Array.isArray(groupPerms) && groupPerms.includes(p.id);
                    return (
                      <label 
                        key={p.id} 
                        style={{ 
                          display: 'flex', alignItems: 'center', gap: 10, cursor: isDisabled ? 'not-allowed' : 'pointer',
                          opacity: isDisabled ? 0.4 : 1, fontSize: 13, color: T.colors.textMid
                        }}
                      >
                        <input 
                          type="checkbox" 
                          disabled={isDisabled}
                          checked={!isDisabled && isChecked}
                          onChange={() => togglePermission(group.key, p.id)}
                        />
                        {p.label}
                        {p.warehouseOnly && <span style={{ fontSize: 9, background: T.colors.dangerSoft, color: T.colors.danger, padding: '1px 4px', borderRadius: 4, fontWeight: 700 }}>WAREHOUSE ONLY</span>}
                      </label>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="orbx-card" style={{ padding: 0, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: T.colors.bgMuted, borderBottom: `1px solid ${T.colors.border}` }}>
                <th style={{ textAlign: 'left', padding: '12px 20px', fontSize: 12, color: T.colors.textMuted }}>ROLE NAME</th>
                <th style={{ textAlign: 'left', padding: '12px 20px', fontSize: 12, color: T.colors.textMuted }}>TYPE</th>
                <th style={{ textAlign: 'left', padding: '12px 20px', fontSize: 12, color: T.colors.textMuted }}>PERMISSIONS</th>
                <th style={{ textAlign: 'right', padding: '12px 20px', fontSize: 12, color: T.colors.textMuted }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {roles.map(r => (
                <tr key={r.id} className="orbx-table-row">
                  <td style={{ padding: '16px 20px', fontSize: 14, fontWeight: 600 }}>{r.name}</td>
                  <td style={{ padding: '16px 20px' }}>
                    <span className={`orbx-badge ${r.role_type === 'Warehouse' ? 'orbx-badge-info' : 'orbx-badge-brand'}`}>
                      {r.role_type}
                    </span>
                  </td>
                  <td style={{ padding: '16px 20px', fontSize: 12, color: T.colors.textMuted }}>
                    {Object.keys(r.permissions || {}).length} Permission Groups Configured
                  </td>
                  <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                    <button className="orbx-btn orbx-btn-ghost" onClick={() => setEditingRole(r)} style={{ padding: 6 }}>
                      <Icon name="edit" size={14} /> Edit Matrix
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  // ... (Keep other renderers: renderBranches, renderUsers, renderSync, renderInvoice)
  
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
      <div style={{ display: 'flex', borderBottom: `1px solid ${T.colors.border}`, marginBottom: 32, gap: 4 }}>
        <TabButton active={activeTab === 'branches'} label="Branches" icon="inventory" onClick={() => setActiveTab('branches')} />
        <TabButton active={activeTab === 'users'}    label="Users"     icon="customers" onClick={() => setActiveTab('users')} />
        <TabButton active={activeTab === 'roles'}    label="Roles"     icon="settings"  onClick={() => setActiveTab('roles')} />
        <TabButton active={activeTab === 'sync'}     label="Sync"      icon="sync"      onClick={() => setActiveTab('sync')} />
        <TabButton active={activeTab === 'invoice'}  label="Invoice"   icon="reports"   onClick={() => setActiveTab('invoice')} />
      </div>

      {loading ? (
        <div style={{ padding: 48, textAlign: 'center', color: T.colors.textMuted }}>Loading settings...</div>
      ) : (
        <>
          {activeTab === 'branches' && renderBranches()}
          {activeTab === 'users'    && renderUsers()}
          {activeTab === 'sync'     && renderSync()}
          {activeTab === 'invoice'  && renderInvoice()}
          {activeTab === 'roles'    && renderRoles()}
        </>
      )}

      {/* Modals for Branch/User - Keep existing logic but I've integrated Role editing inline above */}
      {/* ... (Existing Branch/User Modals) */}
    </div>
  );
}
