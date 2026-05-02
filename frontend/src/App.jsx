import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { Package } from 'lucide-react';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import POS from './pages/POS';
import Products from './pages/Products';
import Inventory from './pages/Inventory';
import Transfers from './pages/Transfers';
import Customers from './pages/Customers';
import Reports from './pages/Reports';
import Login from './pages/Login';
import Setup from './pages/Setup';
import Settings from './pages/Settings';
import Studio from './pages/Studio';
import { startSyncEngine, fetchUpdates } from './utils/db';
import { tokens } from './design/tokens';

const OrbxGlobalStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700&display=swap');

    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: ${tokens.font.sans}; background: ${tokens.colors.bg}; color: ${tokens.colors.text}; -webkit-font-smoothing: antialiased; }

    /* Scrollbar */
    ::-webkit-scrollbar { width: 5px; height: 5px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: ${tokens.colors.border}; border-radius: 99px; }
    ::-webkit-scrollbar-thumb:hover { background: ${tokens.colors.borderDark}; }

    /* Buttons */
    .orbx-btn { display: inline-flex; align-items: center; gap: 6px; padding: 8px 16px; border-radius: ${tokens.radius.md}; font-size: 13px; font-weight: 500; cursor: pointer; border: none; transition: all 0.15s ease; font-family: ${tokens.font.sans}; }
    .orbx-btn:active { transform: scale(0.97); }
    .orbx-btn-primary { background: ${tokens.colors.accent}; color: ${tokens.colors.brand}; font-weight: 700; }
    .orbx-btn-primary:hover { background: ${tokens.colors.accentHover}; box-shadow: 0 4px 16px rgba(245,158,11,0.3); }
    .orbx-btn-secondary { background: ${tokens.colors.bgMuted}; color: ${tokens.colors.textMid}; border: 1px solid ${tokens.colors.border}; }
    .orbx-btn-secondary:hover { background: ${tokens.colors.border}; }
    .orbx-btn-ghost { background: transparent; color: ${tokens.colors.textMid}; }
    .orbx-btn-ghost:hover { background: ${tokens.colors.bgMuted}; }
    .orbx-btn-danger { background: ${tokens.colors.dangerSoft}; color: ${tokens.colors.danger}; }
    .orbx-btn-danger:hover { background: ${tokens.colors.danger}; color: white; }
    .orbx-btn-success { background: ${tokens.colors.successSoft}; color: ${tokens.colors.success}; }
    .orbx-btn-success:hover { background: ${tokens.colors.success}; color: white; }

    /* Inputs */
    .orbx-input { width: 100%; padding: 9px 12px; border: 1.5px solid ${tokens.colors.border}; border-radius: ${tokens.radius.md}; font-size: 13px; font-weight: 500; background: ${tokens.colors.bgCard}; color: ${tokens.colors.text}; outline: none; transition: border-color 0.15s; font-family: ${tokens.font.sans}; }
    .orbx-input:focus { border-color: ${tokens.colors.accent}; box-shadow: 0 0 0 3px ${tokens.colors.accentSoft}; }
    .orbx-input::placeholder { color: ${tokens.colors.textMuted}; font-weight: 400; }
    .orbx-select { appearance: none; background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%2394a3b8' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e"); background-repeat: no-repeat; background-position: right 8px center; background-size: 16px; padding-right: 32px !important; }

    /* Badges */
    .orbx-badge { display: inline-flex; align-items: center; gap: 4px; padding: 3px 8px; border-radius: ${tokens.radius.full}; font-size: 11px; font-weight: 600; letter-spacing: 0.3px; }
    .orbx-badge-success { background: ${tokens.colors.successSoft}; color: ${tokens.colors.success}; }
    .orbx-badge-danger  { background: ${tokens.colors.dangerSoft};  color: ${tokens.colors.danger};  }
    .orbx-badge-warning { background: ${tokens.colors.warningSoft}; color: ${tokens.colors.warning}; }
    .orbx-badge-info    { background: ${tokens.colors.infoSoft};    color: ${tokens.colors.info};    }
    .orbx-badge-neutral { background: ${tokens.colors.bgMuted};     color: ${tokens.colors.textMid}; border: 1px solid ${tokens.colors.border}; }
    .orbx-badge-brand   { background: ${tokens.colors.accentSoft};  color: ${tokens.colors.accent};  }

    /* Cards */
    .orbx-card { background: ${tokens.colors.bgCard}; border: 1px solid ${tokens.colors.border}; border-radius: ${tokens.radius.lg}; padding: 20px; transition: box-shadow 0.2s; }
    .orbx-card:hover { box-shadow: ${tokens.shadows.md}; }
    .orbx-stat-card { background: ${tokens.colors.bgCard}; border: 1px solid ${tokens.colors.border}; border-radius: ${tokens.radius.lg}; padding: 20px 24px; transition: all 0.2s; }
    .orbx-stat-card:hover { box-shadow: ${tokens.shadows.md}; transform: translateY(-1px); }

    /* Table rows */
    .orbx-table-row { border-bottom: 1px solid ${tokens.colors.border}; transition: background 0.1s; }
    .orbx-table-row:hover { background: ${tokens.colors.bgMuted}; }
    .orbx-table-row:last-child { border-bottom: none; }

    /* Sidebar items */
    .orbx-nav-item { display: flex; align-items: center; gap: 10px; padding: 9px 14px; border-radius: ${tokens.radius.md}; cursor: pointer; color: rgba(255,255,255,0.6); font-size: 13.5px; font-weight: 500; transition: all 0.15s; user-select: none; text-decoration: none; }
    .orbx-nav-item:hover { background: rgba(255,255,255,0.08); color: rgba(255,255,255,0.9); }
    .orbx-nav-item.active { background: ${tokens.colors.accentSoft}; color: ${tokens.colors.accent}; }

    /* Animations */
    @keyframes orbx-fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes orbx-slideIn { from { transform: translateX(-100%); } to { transform: translateX(0); } }
    @keyframes orbx-pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.4; } }
    @keyframes orbx-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

    .orbx-page-enter { animation: orbx-fadeIn 0.25s ease; }
    .orbx-pulse { animation: orbx-pulse 2s infinite; }
    .orbx-spin { animation: orbx-spin 1s linear infinite; }

    /* Modal */
    .orbx-modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 1000; display: flex; align-items: center; justify-content: center; padding: 16px; }
    .orbx-modal { background: white; border-radius: ${tokens.radius.xl}; box-shadow: ${tokens.shadows.xl}; width: 100%; }

    /* Divider */
    .orbx-divider { height: 1px; background: ${tokens.colors.border}; margin: 16px 0; }

    @media (max-width: 768px) { .orbx-hide-mobile { display: none !important; } }
    @media (min-width: 769px) { .orbx-hide-desktop { display: none !important; } }
  `}</style>
);

// Mock Branch ID for testing
const BRANCH_ID = 1;
// Dynamically set API URL based on current host
const API_URL = '/api';

function PrivateRoute({ children, module, title }) {
  const isAuthenticated = !!localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  if (!isAuthenticated) return <Navigate to="/login" />;

  // Superadmin has access to everything
  if (user.is_superadmin) return <Layout title={title}>{children}</Layout>;

  // Check module permission if specified
  if (module) {
    const allowedModules = user.allowed_modules || {};
    if (!allowedModules[module]) {
      return (
        <Layout title="Access Denied">
          <div className="orbx-page-enter" style={{ padding: 48, textAlign: 'center' }}>
            <div style={{ 
              width: 64, height: 64, 
              background: 'rgba(239, 68, 68, 0.1)', 
              color: '#ef4444', 
              borderRadius: '50%', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              margin: '0 auto 16px' 
            }}>
              <Package size={32} />
            </div>
            <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 8 }}>Access Denied</h2>
            <p style={{ color: '#64748b', fontWeight: 500, marginBottom: 24 }}>You don't have permission to access the {module.toUpperCase()} module.</p>
            <button className="orbx-btn orbx-btn-primary" onClick={() => window.location.href = '/'}>Return to Dashboard</button>
          </div>
        </Layout>
      );
    }
  }

  return <Layout title={title}>{children}</Layout>;
}

export default function App() {
  useEffect(() => {
    // Start the offline sync engine
    startSyncEngine(BRANCH_ID, API_URL);
    
    // Initial fetch of updates
    fetchUpdates(BRANCH_ID, API_URL);
  }, []);

  return (
    <BrowserRouter>
      <OrbxGlobalStyles />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/setup" element={<Setup />} />
        
         {/* Protected Routes */}
        <Route path="/" element={<PrivateRoute title="Dashboard"><Dashboard /></PrivateRoute>} />
        <Route path="/pos" element={<PrivateRoute module="pos" title="POS / Billing"><POS /></PrivateRoute>} />
        <Route path="/products" element={<PrivateRoute module="inventory" title="Products master"><Products /></PrivateRoute>} />
        <Route path="/inventory" element={<PrivateRoute module="inventory" title="Inventory Management"><Inventory /></PrivateRoute>} />
        <Route path="/transfers" element={<PrivateRoute module="transfers" title="Stock Transfers"><Transfers /></PrivateRoute>} />
        <Route path="/customers" element={<PrivateRoute module="crm" title="Customer Management"><Customers /></PrivateRoute>} />
        <Route path="/reports" element={<PrivateRoute module="reports" title="Reports & Analytics"><Reports /></PrivateRoute>} />
        <Route path="/settings" element={<PrivateRoute module="settings" title="Settings"><Settings /></PrivateRoute>} />
        <Route path="/studio" element={<PrivateRoute module="studio" title="Studio — Layout & Workflow"><Studio /></PrivateRoute>} />
        
        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>

      <Toaster position="bottom-right" />
    </BrowserRouter>
  );
}
