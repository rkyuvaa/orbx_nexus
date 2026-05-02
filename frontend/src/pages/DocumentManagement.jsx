import React, { useState } from 'react';
import { Plus, Pencil, Trash2, FileText, Settings, Database, Layout as LayoutIcon, Image as ImageIcon } from 'lucide-react';
import { Modal, Badge } from '../components/Shared';
import api from '../utils/api';
import toast from 'react-hot-toast';

export default function DocumentManagement({ module, templates = [], onDataChange, onDelete, parentFields = [] }) {
  const [modal, setModal] = useState(null);

  const save = async (data) => {
    try {
      if (data.id) await api.put(`/forms/studio/forms/${data.id}`, data);
      else await api.post(`/forms/studio/forms/${module}`, data);
      toast.success('Template saved');
      setModal(null);
      onDataChange();
    } catch {
      toast.error('Error saving template');
    }
  };

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-black text-lg">Document Templates — {module.toUpperCase()}</h3>
        <button className="btn btn-primary btn-sm" onClick={() => setModal({ name: '', prefix_template: 'DOC-', suffix_template: '-{YYYY}', reset_cycle: 'monthly', fields_config: [], mapping_config: {}, pdf_config: {}, last_number: 0 })}>
          <Plus size={14}/> Create Template
        </button>
      </div>
      
      <div className="table-wrap">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="py-3 px-2 text-[10px] font-black uppercase text-muted">Template Name</th>
              <th className="py-3 px-2 text-[10px] font-black uppercase text-muted">Serial Format</th>
              <th className="py-3 px-2 text-[10px] font-black uppercase text-muted">Reset</th>
              <th className="py-3 px-2 text-[10px] font-black uppercase text-muted">Fields</th>
              <th className="py-3 px-2"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {templates.map(t => (
              <tr key={t.id} className="hover:bg-gray-50/50">
                <td className="py-4 px-2 font-bold"><div className="flex items-center gap-2"><FileText size={16} className="text-muted"/> {t.name}</div></td>
                <td className="py-4 px-2 font-mono text-xs"><code>{t.prefix_template}NNNN{t.suffix_template}</code></td>
                <td className="py-4 px-2"><Badge color="var(--bg-light)">{t.reset_cycle}</Badge></td>
                <td className="py-4 px-2"><Badge color="var(--primary-light)">{t.fields_config?.length || 0} fields</Badge></td>
                <td className="py-4 px-2">
                  <div className="flex gap-2 justify-end">
                    <button className="btn btn-ghost btn-sm p-2" onClick={() => setModal(t)}><Settings size={14}/></button>
                    <button className="btn btn-ghost btn-sm p-2 text-danger hover:bg-danger/10" onClick={() => onDelete(t.id, t.name)}><Trash2 size={14}/></button>
                  </div>
                </td>
              </tr>
            ))}
            {templates.length === 0 && <tr><td colSpan="5" className="text-center py-12 text-muted font-bold italic">No document templates created yet.</td></tr>}
          </tbody>
        </table>
      </div>

      {modal && <TemplateModal initial={modal} parentFields={parentFields} onSave={save} onClose={() => setModal(null)} />}
    </div>
  );
}

function TemplateModal({ initial, parentFields, onSave, onClose }) {
  const [form, setForm] = useState(initial);
  const [activeTab, setActiveTab] = useState('general'); // general, fields, mapping, pdf
  
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <Modal size="lg" title={form.id ? `Editing: ${form.name}` : 'New Document Template'} onClose={onClose}
      footer={<><button className="btn btn-ghost" onClick={onClose}>Cancel</button><button className="btn btn-primary" onClick={() => onSave(form)}>Save Template</button></>}>
      
      <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr', gap: 24, minHeight: 400 }}>
        {/* Sidebar Nav */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, borderRight: '1px solid var(--border)', paddingRight: 16 }}>
          <button className={`flex items-center gap-2 p-3 rounded-xl text-sm font-bold transition-all ${activeTab === 'general' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'hover:bg-gray-50'}`} onClick={() => setActiveTab('general')}><Settings size={14}/> General</button>
          <button className={`flex items-center gap-2 p-3 rounded-xl text-sm font-bold transition-all ${activeTab === 'fields' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'hover:bg-gray-50'}`} onClick={() => setActiveTab('fields')}><LayoutIcon size={14}/> Form Fields</button>
          <button className={`flex items-center gap-2 p-3 rounded-xl text-sm font-bold transition-all ${activeTab === 'mapping' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'hover:bg-gray-50'}`} onClick={() => setActiveTab('mapping')}><Database size={14}/> Data Mapping</button>
          <button className={`flex items-center gap-2 p-3 rounded-xl text-sm font-bold transition-all ${activeTab === 'pdf' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'hover:bg-gray-50'}`} onClick={() => setActiveTab('pdf')}><ImageIcon size={14}/> PDF Template</button>
        </div>

        {/* Content Area */}
        <div style={{ padding: '0 8px' }}>
          {activeTab === 'general' && (
            <div className="grid grid-cols-2 gap-6">
              <div className="form-group col-span-full">
                <label className="form-label">Template Name</label>
                <input className="input" value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Service Sign-off" />
              </div>
              <div className="form-group">
                <label className="form-label">Prefix Template</label>
                <input className="input" value={form.prefix_template} onChange={e => set('prefix_template', e.target.value)} placeholder="e.g. SRV-{YYYY}-" />
                <span className="text-muted text-[10px] font-bold uppercase mt-1 inline-block">Use {'{YYYY}'}, {'{MM}'}, {'{DD}'} for dates</span>
              </div>
              <div className="form-group">
                <label className="form-label">Suffix Template</label>
                <input className="input" value={form.suffix_template} onChange={e => set('suffix_template', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Reset Cycle</label>
                <select className="input" value={form.reset_cycle} onChange={e => set('reset_cycle', e.target.value)}>
                  <option value="none">Never Reset</option>
                  <option value="daily">Daily Reset</option>
                  <option value="weekly">Weekly Reset</option>
                  <option value="monthly">Monthly Reset</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Next Number</label>
                <input className="input bg-gray-50" type="number" value={(form.last_number || 0) + 1} disabled />
              </div>
            </div>
          )}

          {activeTab === 'fields' && (
            <div style={{ background: 'var(--bg-light)', padding: 24, borderRadius: 16, minHeight: '600px', display: 'flex', flexDirection: 'column', alignItems: 'center', overflowY: 'auto', maxHeight: '600px' }}>
              {/* A4 Sheet Preview */}
              <div className="a4-sheet" style={{ 
                width: '100%', maxWidth: '500px', minHeight: '700px', background: '#fff', boxShadow: '0 10px 30px rgba(0,0,0,0.05)',
                padding: '30px', position: 'relative', display: 'flex', flexDirection: 'column', borderRadius: '4px'
              }}>
                {/* Header Section */}
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #000', paddingBottom: 10, marginBottom: 20 }}>
                  <div style={{ fontWeight: 800, fontSize: 14 }}>{form.pdf_config.logo ? <img src={form.pdf_config.logo} style={{ height: 30 }} /> : 'COMPANY LOGO'}</div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 900, fontSize: 10 }}>{form.name.toUpperCase()}</div>
                    <div style={{ fontSize: 8, color: '#666' }}>{form.prefix_template}NNNN{form.suffix_template}</div>
                  </div>
                </div>

                {/* Sub-form Fields Designer */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px 8px', flex: 1 }}>
                  {(form.fields_config || []).map((f, i) => (
                    <div key={i} className="field-block" style={{ 
                      gridColumn: f.width === 'half' ? 'span 2' : f.width === 'quarter' ? 'span 1' : '1/-1',
                      border: '1px dashed #ddd', padding: 6, borderRadius: 4, position: 'relative', background: '#fafafa'
                    }}>
                      <div style={{ fontSize: 8, fontWeight: 700, color: '#999', marginBottom: 2, display: 'flex', justifyContent: 'space-between' }}>
                         {f.label.toUpperCase()}
                         <div className="flex gap-1">
                           <select value={f.type} onChange={e => {
                             const next = [...form.fields_config]; next[i].type = e.target.value; set('fields_config', next);
                           }} style={{ fontSize: 7, padding: '1px', background: '#eee', border: 'none', borderRadius: 2 }}>
                             <option value="text">text</option>
                             <option value="number">number</option>
                             <option value="date">date</option>
                             <option value="textarea">textarea</option>
                             <option value="selection">selection</option>
                             <option value="table">table</option>
                             <option value="signature">sign</option>
                             <option value="info">info</option>
                           </select>
                           <button onClick={() => {
                             const next = [...form.fields_config];
                             next[i].width = next[i].width === 'full' ? 'half' : next[i].width === 'half' ? 'quarter' : 'full';
                             set('fields_config', next);
                           }} style={{ fontSize: 7, padding: '1px 2px', background: '#eee', border: 'none', borderRadius: 2 }}>{f.width || 'full'}</button>
                           <button onClick={() => {
                             const next = form.fields_config.filter((_, idx) => idx !== i); set('fields_config', next);
                           }} style={{ color: 'red', fontSize: 8, border: 'none', background: 'none' }}>×</button>
                         </div>
                      </div>
                      <div style={{ fontSize: 9, color: '#ccc' }}>{f.type} area</div>
                    </div>
                  ))}

                  <button className="flex items-center justify-center gap-2 w-full py-4 border-2 border-dashed border-gray-200 rounded-xl text-muted hover:text-primary hover:border-primary transition-all text-xs font-bold" style={{ gridColumn: '1/-1' }}
                    onClick={() => {
                      const next = [...(form.fields_config || []), { label: 'New Field', key: 'f' + Date.now(), type: 'text', width: 'full' }];
                      set('fields_config', next);
                    }}>
                    <Plus size={14}/> Add Field to Document
                  </button>
                </div>

                {/* Footer Section */}
                <div style={{ marginTop: 20, borderTop: '1px solid #eee', paddingTop: 8, fontSize: 8, color: '#999' }}>
                  {form.pdf_config.footer || 'Footer / Terms and Conditions'}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'mapping' && (
            <div>
              <p className="text-muted text-xs font-bold uppercase tracking-widest mb-6">Auto-fill Mapping</p>
              <div className="flex flex-col gap-3">
                {(form.fields_config || []).map((f, i) => (
                  <div key={i} className="flex items-center gap-4 bg-gray-50 p-3 rounded-xl border border-border">
                    <div style={{ flex: 1, textAlign: 'right', fontWeight: 800, fontSize: 12 }}>{f.label}</div>
                    <ChevronRight size={14} className="text-muted" />
                    <select className="input" style={{ flex: 1.5, padding: '8px 12px' }} 
                      value={form.mapping_config[f.key] || ''} 
                      onChange={e => {
                        const next = { ...form.mapping_config, [f.key]: e.target.value };
                        set('mapping_config', next);
                      }}>
                      <option value="">— Don't Auto-fill —</option>
                      {(parentFields || []).map(pf => <option key={pf.id} value={pf.field_name}>{pf.field_label}</option>)}
                    </select>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'pdf' && (
            <div className="grid grid-cols-1 gap-6">
               <div className="form-group">
                <label className="form-label">Header Template (HTML/Text)</label>
                <textarea className="input" rows="3" value={form.pdf_config.header || ''} onChange={e => set('pdf_config', {...form.pdf_config, header: e.target.value})} placeholder="Company Name, Address, etc." />
              </div>
              <div className="form-group">
                <label className="form-label">Footer / Legal Terms</label>
                <textarea className="input" rows="4" value={form.pdf_config.footer || ''} onChange={e => set('pdf_config', {...form.pdf_config, footer: e.target.value})} placeholder="Terms and conditions..." />
              </div>
              <div className="form-group">
                <label className="form-label">Logo URL</label>
                <input className="input" value={form.pdf_config.logo || ''} onChange={e => set('pdf_config', {...form.pdf_config, logo: e.target.value})} placeholder="https://..." />
              </div>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}

function ChevronRight(props) {
  return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
}
