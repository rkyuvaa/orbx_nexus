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
