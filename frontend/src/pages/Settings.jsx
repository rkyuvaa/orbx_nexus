import { useState } from 'react';
import Icon from '../components/Icon';
import { tokens as T } from '../design/tokens';
import toast from 'react-hot-toast';

export default function Settings() {
  const [saving, setSaving] = useState(false);

  const sections = [
    {
      title: 'Branch Information',
      fields: [
        { label: 'Branch Name', value: 'Main Branch — Coimbatore', key: 'branch_name' },
        { label: 'GSTIN',       value: '33AABCU9603R1ZX',         key: 'gstin' },
        { label: 'Address',     value: '123 RS Puram, Coimbatore, TN 641002', key: 'address' },
        { label: 'Phone',       value: '+91 422 4567890',         key: 'phone' },
      ]
    },
    {
      title: 'Sync Settings',
      fields: [
        { label: 'Sync Interval (seconds)', value: '30', key: 'sync_interval' },
        { label: 'Server URL',            value: 'https://api.orbxerp.com', key: 'server_url' },
      ]
    },
    {
      title: 'Invoice Settings',
      fields: [
        { label: 'Invoice Prefix', value: 'INV-2026-', key: 'invoice_prefix' },
        { label: 'Footer Text',   value: 'Thank you for shopping with us!', key: 'footer_text' },
      ]
    }
  ];

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      toast.success('Settings saved successfully!');
    }, 1000);
  };

  return (
    <div className="orbx-page-enter" style={{ padding: 24, maxWidth: 800 }}>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 18, fontWeight: 800, color: T.colors.text }}>Settings</h2>
        <p style={{ fontSize: 13, color: T.colors.textMuted }}>Manage branch details, synchronization, and document preferences</p>
      </div>

      {sections.map(section => (
        <div key={section.title} className="orbx-card" style={{ marginBottom: 24, padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <div style={{ width: 4, height: 18, background: T.colors.accent, borderRadius: 2 }} />
            <h3 style={{ fontSize: 15, fontWeight: 700, color: T.colors.brand }}>{section.title}</h3>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            {section.fields.map(f => (
              <div key={f.key}>
                <label style={{ fontSize: 12, fontWeight: 700, color: T.colors.textMid, marginBottom: 6, display: 'block', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{f.label}</label>
                <input className="orbx-input" defaultValue={f.value} />
              </div>
            ))}
          </div>
          
          <div style={{ marginTop: 24, display: 'flex', justifyContent: 'flex-end' }}>
            <button className="orbx-btn orbx-btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      ))}

      <div className="orbx-card" style={{ background: T.colors.dangerSoft, border: `1px solid ${T.colors.danger}20`, padding: 20 }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, color: T.colors.danger, marginBottom: 12 }}>Danger Zone</h3>
        <p style={{ fontSize: 13, color: T.colors.textMid, marginBottom: 16 }}>Actions here are irreversible and may affect your branch data.</p>
        <div style={{ display: 'flex', gap: 12 }}>
          <button className="orbx-btn orbx-btn-danger">Reset Sync Cache</button>
          <button className="orbx-btn orbx-btn-danger">Deactivate Branch</button>
        </div>
      </div>
    </div>
  );
}
