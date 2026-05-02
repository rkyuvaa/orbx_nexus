import React from 'react';
import { X } from 'lucide-react';

export function Modal({ title, onClose, children, footer, large }) {
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={`modal-content ${large ? 'modal-lg' : ''}`} style={large ? { maxWidth: '1400px' } : {}}>
        <div className="modal-header">
          <h3 className="modal-title">{title}</h3>
          <button 
            className="btn-ghost" 
            onClick={onClose}
            style={{ 
                background: 'var(--primary-light)', color: 'var(--primary)', 
                border: 'none', width: '32px', height: '32px', borderRadius: '8px',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}
          >
            <X size={16} />
          </button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  );
}

export function Badge({ color, style, children }) {
  const bg = color ? (color.startsWith('var') ? color : color + '22') : 'transparent';
  return (
    <span className="badge" style={{ 
      background: bg, 
      color: color || 'inherit', 
      padding: '2px 8px',
      borderRadius: '6px',
      fontSize: '10px',
      fontWeight: 800,
      textTransform: 'uppercase',
      display: 'inline-flex',
      alignItems: 'center',
      ...style 
    }}>
      {children}
    </span>
  );
}

export function Loader() {
  return (
    <div className="flex items-center justify-center p-12 w-full">
      <div className="animate-pulse flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
        <span className="text-sm font-bold text-primary">Loading records...</span>
      </div>
    </div>
  );
}

export function Empty({ message = 'No records found' }) {
  return (
    <div className="flex flex-col items-center justify-center p-12 opacity-50">
      <div className="w-16 h-16 mb-4 text-muted">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
          <path d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0H4" />
        </svg>
      </div>
      <p className="text-sm font-medium">{message}</p>
    </div>
  );
}

export function Confirm({ title, message, onConfirm, onCancel }) {
  return (
    <div className="modal-overlay" style={{ zIndex: 10000, background: 'rgba(15, 23, 42, 0.4)' }}>
      <div className="card" style={{ maxWidth: 400, margin: 'auto', padding: '2rem', textAlign: 'center' }}>
        <h3 className="text-lg mb-2">{title || 'Are you sure?'}</h3>
        <p className="text-muted text-sm mb-8">{message}</p>
        <div className="flex gap-4 justify-center">
          <button className="btn btn-ghost" onClick={onCancel}>Cancel</button>
          <button className="btn btn-primary" style={{ background: 'var(--danger)' }} onClick={onConfirm}>Delete</button>
        </div>
      </div>
    </div>
  );
}
