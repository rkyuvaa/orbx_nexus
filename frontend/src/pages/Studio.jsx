import React, { useState, useEffect, useCallback } from 'react';
import Layout from '../components/Layout';
import { Modal, Confirm, Badge, Loader } from '../components/Shared';
import { FieldModal, TabModal } from '../components/StudioModals';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { Plus, Pencil, Trash2, RotateCw, Settings, Layers, FileText, ChevronRight } from 'lucide-react';
import DocumentManagement from './DocumentManagement';

const MODULES = ['crm', 'installation', 'service', 'warranty', 'konwertcare'];
const FIELD_TYPES = ['text', 'number', 'date', 'textarea', 'selection', 'multiple-selection', 'boolean', 'checkbox', 'file', 'form', 'button'];

const emptyTab = { name: '', sort_order: 0 };
const emptyField = { field_name: '', field_label: '', field_type: 'text', placeholder: '', options: [], required: false, width: 'full', visibility_rule: null, sort_order: 0 };
const emptyStage = { module: 'crm', name: '', color: '#6366f1', sort_order: 0, is_final_win: false, is_final_lost: false };
const emptySeq = { module: 'crm', prefix: '', suffix: '', padding: 4 };

// ── Modals ───────────────────────────────────────────────────

function StageModal({ initial, onSave, onClose }) {
  const [form, setForm] = useState(initial);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  return (
    <Modal title={form.id ? 'Edit Stage' : 'New Stage'} onClose={onClose}
      footer={<><button className="btn btn-ghost" onClick={onClose}>Cancel</button><button className="btn btn-primary" onClick={() => onSave(form)}>Save</button></>}>
      <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
        <div className="form-group">
          <label className="form-label">Stage Name</label>
          <input className="input" value={form.name} onChange={e => set('name', e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">Color</label>
          <div className="flex gap-2 items-center">
            <input type="color" value={form.color} onChange={e => set('color', e.target.value)} style={{ width: 40, height: 36, border: 'none', background: 'none', cursor: 'pointer' }} />
            <input className="input" value={form.color} onChange={e => set('color', e.target.value)} style={{ flex: 1 }} />
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Sort Order</label>
          <input className="input" type="number" value={form.sort_order} onChange={e => set('sort_order', parseInt(e.target.value) || 0)} />
        </div>
        <div className="form-group">
            <label className="form-label">Stage Type</label>
            <div className="flex gap-4 mt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={form.is_final_win} onChange={e => set('is_final_win', e.target.checked)} />
                    <span className="text-sm font-bold">Win Stage</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={form.is_final_lost} onChange={e => set('is_final_lost', e.target.checked)} />
                    <span className="text-sm font-bold">Lost Stage</span>
                </label>
            </div>
        </div>
      </div>
    </Modal>
  );
}

// ── Main Page ────────────────────────────────────────────────

export default function Studio() {
  const [tab, setTab] = useState('layout');
  const [module, setModule] = useState('crm');
  const [tabs, setTabs] = useState([]);
  const [stages, setStages] = useState([]);
  const [stageRules, setStageRules] = useState([]);
  const [sequence, setSequence] = useState(null);
  const [documentTemplates, setDocumentTemplates] = useState([]);
  const [loading, setLoading] = useState(true);

  const [activeTabIdx, setActiveTabIdx] = useState(0);
  const [tabModal, setTabModal] = useState(null);
  const [fieldModal, setFieldModal] = useState(null);
  const [stageModal, setStageModal] = useState(null);
  const [deleting, setDeleting] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [tabsRes, stagesRes, rulesRes, seqRes] = await Promise.all([
        api.get(`/studio/layout/${module}/tabs`),
        api.get(`/studio/stages/${module}`),
        api.get(`/studio/layout/${module}/stage-rules`).catch(() => ({ data: [] })),
        api.get(`/studio/sequence/${module}`)
      ]);
      setTabs(tabsRes.data);
      setStages(stagesRes.data);
      setStageRules(rulesRes.data);
      setSequence(seqRes.data);
      // setDocumentTemplates(docsRes.data); // Pending forms module
      if (activeTabIdx >= tabsRes.data.length && tabsRes.data.length > 0) setActiveTabIdx(0);
    } catch (e) {
      toast.error('Studio sync ready (Backend tables created)');
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [module, activeTabIdx]);

  useEffect(() => { loadData(); }, [loadData]);

  const saveTab = async (form) => {
    try {
      const payload = { ...form, module };
      if (form.id) await api.put(`/studio/layout/${module}/tabs/${form.id}`, payload);
      else await api.post(`/studio/layout/${module}/tabs`, payload);
      toast.success('Tab updated'); setTabModal(null); loadData();
    } catch { toast.error('Check server logs'); }
  };

  const saveField = async (f) => {
    const sr = f._stageRule; const sro = f._stageRuleOp; const srv = f._stageRuleVal;
    const payload = { ...f, module }; delete payload._stageRule; delete payload._stageRuleOp; delete payload._stageRuleVal;
    try {
      let savedF;
      if (f.id) savedF = (await api.post(`/studio/layout/${module}/fields/${f.id}`, payload)).data; // Using POST for both in the original code logic but checking if edit
      else savedF = (await api.post(`/studio/layout/${module}/fields`, payload)).data;

      if (sr) {
        try {
          await api.post(`/studio/layout/${module}/stage-rules`, {
            field_name: savedF.field_name, stage_id: parseInt(sr),
            condition_operator: sro, condition_value: sro === 'equals' ? srv : null
          });
        } catch (ruleErr) {
          console.error("Rule save failed", ruleErr);
          toast.error("Field saved, but automation rule failed");
        }
      } else {
        const existing = stageRules.find(r => r.field_name === savedF.field_name);
        if (existing && module) await api.delete(`/studio/layout/${module}/stage-rules/${existing.id}`);
      }
      toast.success('Field saved'); 
      setFieldModal(null); 
      loadData();
    } catch (e) { 
      const msg = e.response?.data?.detail || 'Error saving field';
      toast.error(msg); 
      console.error(e);
    }
  };

  const saveStage = async (form) => {
    try {
      if (form.id) await api.put(`/studio/stages/${form.id}`, form);
      else await api.post('/studio/stages', { ...form, module });
      toast.success('Stage updated'); setStageModal(null); loadData();
    } catch { toast.error('Error'); }
  };

  const saveSequence = async () => {
    try {
      await api.post(`/studio/sequence/${module}`, sequence);
      toast.success('Sequence saved');
    } catch { toast.error('Error'); }
  };

  const confirmDelete = async () => {
    const { type, id } = deleting;
    try {
      if (type === 'tab') await api.delete(`/studio/layout/${module}/tabs/${id}`);
      else if (type === 'field') await api.delete(`/studio/layout/${module}/fields/${id}`);
      else if (type === 'stage') await api.delete(`/studio/stages/${id}`);
      else if (type === 'document') await api.delete(`/forms/studio/forms/${id}`);
      toast.success('Deleted'); setDeleting(null); loadData();
    } catch { toast.error('Cannot delete: record in use'); setDeleting(null); }
  };

  const currentTab = tabs[activeTabIdx];

  return (
    <>
      <div className="flex gap-2 mb-6 items-center bg-white p-2 rounded-xl shadow-sm border border-border">
        <div style={{ display: 'flex', gap: 4, background: 'var(--bg-light)', padding: 4, borderRadius: 10 }}>
          {MODULES.map(m => (
            <button key={m} className={`btn btn-sm ${module === m ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setModule(m)}>
              {m.toUpperCase()}
            </button>
          ))}
        </div>
        <div className="ml-auto flex gap-2">
          {['layout', 'stages', 'sequences', 'documents'].map(t => (
            <button key={t} className={`btn btn-ghost btn-sm ${tab === t ? 'bg-primary/10 text-primary' : ''}`} onClick={() => setTab(t)}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
          <button className="btn btn-ghost btn-sm" onClick={loadData} title="Refresh Tables"><RotateCw size={14} /></button>
        </div>
      </div>

      {loading ? <div className="card p-12 text-center flex items-center justify-center"><Loader /></div> : (
        <>
          {tab === 'layout' && (
            <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: 24 }}>
              {/* Tabs sidebar */}
              <div className="flex flex-col gap-4">
                <div className="flex justify-between items-center px-2">
                  <span className="text-[10px] font-black uppercase text-muted tracking-widest">Tabs & Forms</span>
                  <button className="btn btn-ghost btn-sm p-1" onClick={() => setTabModal({})}><Plus size={14} /></button>
                </div>
                <div className="flex flex-col gap-1">
                  {(tabs || []).map((t, i) => (
                    <div key={t.id} className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all ${activeTabIdx === i ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'hover:bg-gray-50'}`}
                        onClick={() => setActiveTabIdx(i)}>
                      <span className="flex items-center gap-2 text-sm font-bold"><Layers size={14} /> {t.name}</span>
                      <div className="flex gap-1">
                        <button className={`p-1 rounded-lg hover:bg-white/20 ${activeTabIdx === i ? 'text-white' : 'text-muted'}`} onClick={e => { e.stopPropagation(); setTabModal(t); }}><Pencil size={11} /></button>
                        <button className={`p-1 rounded-lg hover:bg-white/20 ${activeTabIdx === i ? 'text-white' : 'text-danger'}`} onClick={e => { e.stopPropagation(); setDeleting({ type: 'tab', id: t.id, name: t.name }); }}><Trash2 size={11} /></button>
                      </div>
                    </div>
                  ))}
                  {tabs.length === 0 && <div className="p-8 text-center text-xs text-muted font-bold italic border-2 border-dashed border-border rounded-2xl">No tabs created</div>}
                </div>
              </div>

              {/* Fields area */}
              <div className="card">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-black text-lg">{currentTab ? `Fields in "${currentTab.name}"` : 'Form Layout'}</h3>
                  {currentTab && <button className="btn btn-primary btn-sm" onClick={() => setFieldModal({ tab_id: currentTab.id })}><Plus size={14} /> Add Field</button>}
                </div>
                {!currentTab ? <div className="p-12 text-center text-muted font-bold italic">Select or create a tab to manage its fields</div> : (
                  <div className="table-wrap">
                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="py-3 px-2 text-[10px] font-black uppercase text-muted">Label</th>
                          <th className="py-3 px-2 text-[10px] font-black uppercase text-muted">Field Key</th>
                          <th className="py-3 px-2 text-[10px] font-black uppercase text-muted">Type</th>
                          <th className="py-3 px-2 text-[10px] font-black uppercase text-muted">Width</th>
                          <th className="py-3 px-2 text-[10px] font-black uppercase text-muted">Automation</th>
                          <th className="py-3 px-2"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/50">
                        {currentTab.fields.map(f => (
                          <tr key={f.id} className="hover:bg-gray-50/50">
                            <td className="py-4 px-2 font-bold">{f.field_label} {f.required && <span className="text-danger">*</span>}</td>
                            <td className="py-4 px-2 font-mono text-xs text-muted"><code>{f.field_name}</code></td>
                            <td className="py-4 px-2">
                                <Badge color="var(--primary-light)">{f.field_type.replace('-', ' ')}</Badge>
                            </td>
                            <td className="py-4 px-2 text-xs font-bold text-muted capitalize">{f.width}</td>
                            <td className="py-4 px-2">{f.visibility_rule && f.visibility_rule !== 'null' ? <Badge color="var(--warning)">Condition</Badge> : '—'}</td>
                            <td className="py-4 px-2">
                              <div className="flex gap-2 justify-end">
                                <button className="btn btn-ghost btn-sm p-2" onClick={() => setFieldModal(f)}><Pencil size={12} /></button>
                                <button className="btn btn-ghost btn-sm p-2 text-danger hover:bg-danger/10" onClick={() => setDeleting({ type: 'field', id: f.id, name: f.field_label })}><Trash2 size={12} /></button>
                              </div>
                            </td>
                          </tr>
                        ))}
                        {currentTab.fields.length === 0 && <tr><td colSpan="6" className="text-center py-12 text-muted font-bold italic">No fields in this tab</td></tr>}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {tab === 'stages' && (
            <div className="card">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="font-black text-lg">Workflow Stages — {module.toUpperCase()}</h3>
                    <button className="btn btn-primary btn-sm" onClick={() => setStageModal({ module })}><Plus size={14} /> Add Stage</button>
                </div>
                <div className="table-wrap">
                    <table className="w-full text-left text-sm">
                        <thead>
                            <tr className="border-b border-border">
                                <th className="py-3 px-2 text-[10px] font-black uppercase text-muted">Order</th>
                                <th className="py-3 px-2 text-[10px] font-black uppercase text-muted">Stage Name</th>
                                <th className="py-3 px-2 text-[10px] font-black uppercase text-muted">Color Code</th>
                                <th className="py-3 px-2 text-[10px] font-black uppercase text-muted">Flags</th>
                                <th className="py-3 px-2"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/50">
                            {stages.map(s => (
                                <tr key={s.id} className="hover:bg-gray-50/50">
                                    <td className="py-4 px-2 font-mono text-xs">{s.sort_order}</td>
                                    <td className="py-4 px-2">
                                        <Badge color={s.color}>{s.name}</Badge>
                                    </td>
                                    <td className="py-4 px-2 font-mono text-xs text-muted">{s.color}</td>
                                    <td className="py-4 px-2">
                                        {s.is_final_win && <Badge color="var(--success)">Win</Badge>}
                                        {s.is_final_lost && <Badge color="var(--danger)">Lost</Badge>}
                                        {!s.is_final_win && !s.is_final_lost && <span className="text-muted text-xs font-bold">—</span>}
                                    </td>
                                    <td className="py-4 px-2">
                                        <div className="flex gap-2 justify-end">
                                            <button className="btn btn-ghost btn-sm p-2" onClick={() => setStageModal(s)}><Pencil size={12} /></button>
                                            <button className="btn btn-ghost btn-sm p-2 text-danger hover:bg-danger/10" onClick={() => setDeleting({ type: 'stage', id: s.id, name: s.name })}><Trash2 size={12} /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
          )}

          {tab === 'sequences' && (
            <div className="card max-w-lg">
                <h3 className="font-black text-lg mb-6">Numbering Sequence — {module.toUpperCase()}</h3>
                <div className="grid grid-cols-2 gap-6 mb-8">
                    <div className="form-group">
                        <label className="form-label">Prefix</label>
                        <input className="input" value={sequence?.prefix || ''} onChange={e => setSequence({ ...sequence, prefix: e.target.value })} placeholder="e.g. KIM-" />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Suffix</label>
                        <input className="input" value={sequence?.suffix || ''} onChange={e => setSequence({ ...sequence, suffix: e.target.value })} placeholder="e.g. -2026" />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Leading Zeros</label>
                        <input className="input" type="number" value={sequence?.padding || 4} onChange={e => setSequence({ ...sequence, padding: parseInt(e.target.value) || 4 })} />
                    </div>
                    <div className="flex items-end">
                        <button className="btn btn-primary w-full py-3" onClick={saveSequence}>Save Rules</button>
                    </div>
                </div>
                <div className="p-6 bg-gray-50 rounded-2xl border border-border">
                    <p className="text-[10px] font-black uppercase text-muted tracking-widest mb-2">Real-time Preview</p>
                    <span className="text-2xl font-black text-primary tracking-tighter">
                        {sequence?.prefix || ''}{'1'.padStart(sequence?.padding || 4, '0')}{sequence?.suffix || ''}
                    </span>
                </div>
            </div>
          )}

          {tab === 'documents' && (
            <DocumentManagement />
          )}
        </>
      )}

      {tabModal && <TabModal initial={tabModal} stages={stages} onSave={saveTab} onClose={() => setTabModal(null)} />}
      {fieldModal && <FieldModal initial={fieldModal} tabs={tabs} stages={stages} stageRules={stageRules} onSave={saveField} onClose={() => setFieldModal(null)} />}
      {stageModal && <StageModal initial={stageModal} onSave={saveStage} onClose={() => setStageModal(null)} />}
      {deleting && <Confirm message={`Delete ${deleting.name}?`} onConfirm={confirmDelete} onCancel={() => setDeleting(null)} />}
    </>
  );
}
