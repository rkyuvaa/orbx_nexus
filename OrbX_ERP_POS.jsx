import { useState, useEffect, useRef, useCallback, useMemo } from "react";

// ─── DESIGN TOKENS ────────────────────────────────────────────────────────────
const tokens = {
  colors: {
    // Brand palette — deep navy + electric amber
    brand: "#0F172A",
    brandMid: "#1E293B",
    brandSurface: "#243044",
    accent: "#F59E0B",
    accentHover: "#D97706",
    accentSoft: "rgba(245,158,11,0.12)",
    // Semantic
    success: "#10B981",
    successSoft: "rgba(16,185,129,0.12)",
    danger: "#EF4444",
    dangerSoft: "rgba(239,68,68,0.12)",
    info: "#3B82F6",
    infoSoft: "rgba(59,130,246,0.12)",
    warning: "#F59E0B",
    warningSoft: "rgba(245,158,11,0.12)",
    // Neutral
    bg: "#F8FAFC",
    bgCard: "#FFFFFF",
    bgMuted: "#F1F5F9",
    border: "#E2E8F0",
    borderDark: "#CBD5E1",
    text: "#0F172A",
    textMid: "#475569",
    textMuted: "#94A3B8",
    white: "#FFFFFF",
  },
  shadows: {
    sm: "0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)",
    md: "0 4px 12px rgba(0,0,0,0.08), 0 2px 6px rgba(0,0,0,0.04)",
    lg: "0 10px 30px rgba(0,0,0,0.1), 0 4px 12px rgba(0,0,0,0.06)",
    xl: "0 20px 50px rgba(0,0,0,0.12), 0 8px 20px rgba(0,0,0,0.06)",
  },
  radius: { sm: "6px", md: "10px", lg: "14px", xl: "20px", full: "9999px" },
  font: { sans: "'DM Sans', 'Inter', system-ui, sans-serif" },
};

// ─── MOCK DATA ─────────────────────────────────────────────────────────────────
const PRODUCTS_DB = [
  { id: "P001", name: "Basmati Rice 5kg", sku: "RICE-BAS-5K", barcode: "8901234567890", price: 425, tax: 5, stock: 142, category: "Grocery" },
  { id: "P002", name: "Sunflower Oil 1L", sku: "OIL-SUN-1L", barcode: "8901234567891", price: 185, tax: 5, stock: 87, category: "Grocery" },
  { id: "P003", name: "Tata Tea Premium 500g", sku: "TEA-TAT-500", barcode: "8901234567892", price: 265, tax: 5, stock: 56, category: "Beverage" },
  { id: "P004", name: "Amul Butter 500g", sku: "BTR-AML-500", barcode: "8901234567893", price: 280, tax: 12, stock: 34, category: "Dairy" },
  { id: "P005", name: "Colgate MaxFresh 150g", sku: "TBR-COL-150", barcode: "8901234567894", price: 95, tax: 18, stock: 201, category: "Personal Care" },
  { id: "P006", name: "Surf Excel 1kg", sku: "DET-SRF-1K", barcode: "8901234567895", price: 220, tax: 18, stock: 73, category: "Household" },
  { id: "P007", name: "Parle-G 800g", sku: "BSC-PAR-800", barcode: "8901234567896", price: 75, tax: 5, stock: 315, category: "Snacks" },
  { id: "P008", name: "Maggi Noodles 12pk", sku: "NDL-MAG-12", barcode: "8901234567897", price: 180, tax: 5, stock: 128, category: "Snacks" },
  { id: "P009", name: "Dettol Handwash 250ml", sku: "HWS-DET-250", barcode: "8901234567898", price: 95, tax: 18, stock: 92, category: "Personal Care" },
  { id: "P010", name: "Haldiram Bhujia 400g", sku: "SNK-HAL-400", barcode: "8901234567899", price: 135, tax: 12, stock: 67, category: "Snacks" },
  { id: "P011", name: "Vim Dishwash Bar 500g", sku: "DWS-VIM-500", barcode: "8901234567900", price: 45, tax: 18, stock: 210, category: "Household" },
  { id: "P012", name: "Nescafe Classic 200g", sku: "COF-NES-200", barcode: "8901234567901", price: 460, tax: 5, stock: 29, category: "Beverage" },
];

const CUSTOMERS_DB = [
  { id: "C001", name: "Rajesh Kumar", phone: "9876543210", email: "rajesh@email.com", credit: 2500, points: 480 },
  { id: "C002", name: "Priya Sharma", phone: "9876543211", email: "priya@email.com", credit: 0, points: 1200 },
  { id: "C003", name: "Anil Mehta", phone: "9876543212", email: "anil@email.com", credit: 5000, points: 320 },
  { id: "C004", name: "Sunita Patel", phone: "9876543213", email: "sunita@email.com", credit: 1200, points: 750 },
];

const ORDERS_RECENT = [
  { id: "INV-2024-0892", customer: "Rajesh Kumar", amount: 1245, items: 6, time: "10:32 AM", status: "paid", payMode: "UPI" },
  { id: "INV-2024-0891", customer: "Walk-in", amount: 385, items: 3, time: "10:15 AM", status: "paid", payMode: "Cash" },
  { id: "INV-2024-0890", customer: "Priya Sharma", amount: 2140, items: 9, time: "09:58 AM", status: "paid", payMode: "Card" },
  { id: "INV-2024-0889", customer: "Walk-in", amount: 560, items: 4, time: "09:40 AM", status: "paid", payMode: "Cash" },
];

const INVENTORY_DATA = [
  { id: "P001", name: "Basmati Rice 5kg", category: "Grocery", stock: 142, minStock: 50, price: 425, status: "ok" },
  { id: "P002", name: "Sunflower Oil 1L", category: "Grocery", stock: 87, minStock: 30, price: 185, status: "ok" },
  { id: "P003", name: "Tata Tea Premium 500g", category: "Beverage", stock: 12, minStock: 20, price: 265, status: "low" },
  { id: "P004", name: "Amul Butter 500g", category: "Dairy", stock: 5, minStock: 15, price: 280, status: "critical" },
  { id: "P012", name: "Nescafe Classic 200g", category: "Beverage", stock: 8, minStock: 20, price: 460, status: "low" },
];

const TRANSFERS_DATA = [
  { id: "TRF-001", from: "Warehouse", to: "Main Branch", items: 24, status: "shipped", date: "May 2, 2026" },
  { id: "TRF-002", from: "Main Branch", to: "Warehouse", items: 6, status: "pending", date: "May 1, 2026" },
  { id: "TRF-003", from: "Warehouse", to: "Sub Branch", items: 18, status: "received", date: "Apr 30, 2026" },
];

// ─── ICONS ────────────────────────────────────────────────────────────────────
const Icon = ({ name, size = 18, color = "currentColor", strokeWidth = 1.8 }) => {
  const paths = {
    dashboard: <><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/></>,
    pos: <><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></>,
    products: <><path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></>,
    inventory: <><path d="M21 8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16V8z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></>,
    transfers: <><path d="M5 12h14M12 5l7 7-7 7"/></>,
    customers: <><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></>,
    reports: <><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></>,
    settings: <><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/></>,
    menu: <><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></>,
    x: <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>,
    plus: <><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></>,
    minus: <line x1="5" y1="12" x2="19" y2="12"/>,
    trash: <><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></>,
    search: <><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></>,
    barcode: <><path d="M3 5v14M6 5v14M9 5v14M12 5v14M15 5v14M19 5v7M19 16v3M22 5v14"/></>,
    cart: <><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6"/></>,
    check: <polyline points="20 6 9 17 4 12"/>,
    arrow_down: <polyline points="6 9 12 15 18 9"/>,
    arrow_up: <polyline points="18 15 12 9 6 15"/>,
    sync: <><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/></>,
    warning: <><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></>,
    print: <><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></>,
    whatsapp: <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"/>,
    user: <><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></>,
    tag: <><path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></>,
    package: <><path d="M16.5 9.4l-9-5.19M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></>,
    truck: <><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></>,
    bell: <><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0"/></>,
    moon: <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/>,
    sun: <><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></>,
    logout: <><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/></>,
    filter: <><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></>,
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      {paths[name]}
    </svg>
  );
};

// ─── GLOBAL STYLES ─────────────────────────────────────────────────────────────
const GlobalStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&display=swap');
    
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    
    body { font-family: ${tokens.font.sans}; background: ${tokens.colors.bg}; color: ${tokens.colors.text}; }
    
    ::-webkit-scrollbar { width: 5px; height: 5px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: ${tokens.colors.border}; border-radius: 99px; }
    ::-webkit-scrollbar-thumb:hover { background: ${tokens.colors.borderDark}; }
    
    input, button, select, textarea { font-family: inherit; }
    
    .orbx-btn { display: inline-flex; align-items: center; gap: 6px; padding: 8px 16px; border-radius: ${tokens.radius.md}; font-size: 13px; font-weight: 500; cursor: pointer; border: none; transition: all 0.15s ease; }
    .orbx-btn:active { transform: scale(0.97); }
    .orbx-btn-primary { background: ${tokens.colors.accent}; color: ${tokens.colors.brand}; }
    .orbx-btn-primary:hover { background: ${tokens.colors.accentHover}; }
    .orbx-btn-secondary { background: ${tokens.colors.bgMuted}; color: ${tokens.colors.textMid}; border: 1px solid ${tokens.colors.border}; }
    .orbx-btn-secondary:hover { background: ${tokens.colors.border}; }
    .orbx-btn-ghost { background: transparent; color: ${tokens.colors.textMid}; }
    .orbx-btn-ghost:hover { background: ${tokens.colors.bgMuted}; }
    .orbx-btn-danger { background: ${tokens.colors.dangerSoft}; color: ${tokens.colors.danger}; }
    .orbx-btn-danger:hover { background: ${tokens.colors.danger}; color: white; }
    
    .orbx-input { width: 100%; padding: 9px 12px; border: 1.5px solid ${tokens.colors.border}; border-radius: ${tokens.radius.md}; font-size: 13px; background: ${tokens.colors.bgCard}; color: ${tokens.colors.text}; outline: none; transition: border-color 0.15s; }
    .orbx-input:focus { border-color: ${tokens.colors.accent}; box-shadow: 0 0 0 3px ${tokens.colors.accentSoft}; }
    .orbx-input::placeholder { color: ${tokens.colors.textMuted}; }
    
    .badge { display: inline-flex; align-items: center; gap: 4px; padding: 3px 8px; border-radius: ${tokens.radius.full}; font-size: 11px; font-weight: 600; letter-spacing: 0.3px; }
    .badge-success { background: ${tokens.colors.successSoft}; color: ${tokens.colors.success}; }
    .badge-danger { background: ${tokens.colors.dangerSoft}; color: ${tokens.colors.danger}; }
    .badge-warning { background: ${tokens.colors.warningSoft}; color: ${tokens.colors.warning}; }
    .badge-info { background: ${tokens.colors.infoSoft}; color: ${tokens.colors.info}; }
    .badge-neutral { background: ${tokens.colors.bgMuted}; color: ${tokens.colors.textMid}; }
    
    .card { background: ${tokens.colors.bgCard}; border: 1px solid ${tokens.colors.border}; border-radius: ${tokens.radius.lg}; padding: 20px; }
    
    .stat-card { background: ${tokens.colors.bgCard}; border: 1px solid ${tokens.colors.border}; border-radius: ${tokens.radius.lg}; padding: 20px 24px; transition: box-shadow 0.2s; }
    .stat-card:hover { box-shadow: ${tokens.shadows.md}; }
    
    .table-row { border-bottom: 1px solid ${tokens.colors.border}; transition: background 0.1s; }
    .table-row:hover { background: ${tokens.colors.bgMuted}; }
    .table-row:last-child { border-bottom: none; }
    
    .sidebar-item { display: flex; align-items: center; gap: 10px; padding: 9px 14px; border-radius: ${tokens.radius.md}; cursor: pointer; color: rgba(255,255,255,0.65); font-size: 13.5px; font-weight: 500; transition: all 0.15s; user-select: none; }
    .sidebar-item:hover { background: rgba(255,255,255,0.08); color: rgba(255,255,255,0.9); }
    .sidebar-item.active { background: ${tokens.colors.accentSoft}; color: ${tokens.colors.accent}; }
    
    @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes slideIn { from { transform: translateX(-100%); } to { transform: translateX(0); } }
    @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.5; } }
    
    .page-enter { animation: fadeIn 0.25s ease; }
    
    @media (max-width: 768px) {
      .hide-mobile { display: none !important; }
    }
    @media (min-width: 769px) {
      .hide-desktop { display: none !important; }
    }
  `}</style>
);

// ─── LAYOUT SHELL ──────────────────────────────────────────────────────────────
const NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard", icon: "dashboard" },
  { id: "pos", label: "POS / Billing", icon: "pos" },
  { id: "products", label: "Products", icon: "products" },
  { id: "inventory", label: "Inventory", icon: "inventory" },
  { id: "transfers", label: "Transfers", icon: "transfers" },
  { id: "customers", label: "Customers", icon: "customers" },
  { id: "reports", label: "Reports", icon: "reports" },
  { id: "settings", label: "Settings", icon: "settings" },
];

const Sidebar = ({ activePage, setActivePage, collapsed, setCollapsed, mobileOpen, setMobileOpen, darkMode, setDarkMode }) => {
  const sidebarContent = (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", padding: "16px 12px" }}>
      {/* Logo */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "4px 2px 20px", borderBottom: "1px solid rgba(255,255,255,0.08)", marginBottom: 16 }}>
        <div style={{ width: 34, height: 34, background: tokens.colors.accent, borderRadius: tokens.radius.md, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <span style={{ fontSize: 16, fontWeight: 700, color: tokens.colors.brand }}>O</span>
        </div>
        {!collapsed && (
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "white", lineHeight: 1.2 }}>OrbX ERP</div>
            <div style={{ fontSize: 10, color: tokens.colors.accent, fontWeight: 500, letterSpacing: "0.8px" }}>RETAIL SUITE</div>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav style={{ flex: 1 }}>
        {!collapsed && <div style={{ fontSize: 10, fontWeight: 600, color: "rgba(255,255,255,0.3)", letterSpacing: "1px", padding: "0 2px 8px", textTransform: "uppercase" }}>Main Menu</div>}
        {NAV_ITEMS.map(item => (
          <div
            key={item.id}
            className={`sidebar-item${activePage === item.id ? " active" : ""}`}
            onClick={() => { setActivePage(item.id); setMobileOpen(false); }}
            title={collapsed ? item.label : ""}
            style={collapsed ? { justifyContent: "center", padding: "10px" } : {}}
          >
            <Icon name={item.icon} size={17} />
            {!collapsed && <span>{item.label}</span>}
            {!collapsed && item.id === "inventory" && (
              <span style={{ marginLeft: "auto", background: tokens.colors.danger, color: "white", borderRadius: "99px", fontSize: 10, padding: "1px 6px", fontWeight: 600 }}>3</span>
            )}
          </div>
        ))}
      </nav>

      {/* Bottom */}
      <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: 12 }}>
        <div className="sidebar-item" onClick={() => setDarkMode(!darkMode)} style={collapsed ? { justifyContent: "center", padding: "10px" } : {}}>
          <Icon name={darkMode ? "sun" : "moon"} size={16} />
          {!collapsed && <span>{darkMode ? "Light Mode" : "Dark Mode"}</span>}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", marginTop: 4 }}>
          <div style={{ width: 30, height: 30, borderRadius: "50%", background: tokens.colors.accent, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: tokens.colors.brand, flexShrink: 0 }}>A</div>
          {!collapsed && (
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "white", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>Admin User</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>Main Branch</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hide-mobile" style={{
        width: collapsed ? 64 : 220,
        background: tokens.colors.brand,
        height: "100vh",
        position: "sticky",
        top: 0,
        flexShrink: 0,
        transition: "width 0.25s cubic-bezier(.4,0,.2,1)",
        overflow: "hidden",
        zIndex: 100,
        boxShadow: "2px 0 20px rgba(0,0,0,0.15)",
      }}>
        {sidebarContent}
        <button
          onClick={() => setCollapsed(!collapsed)}
          style={{ position: "absolute", top: 24, right: collapsed ? 12 : 16, background: "rgba(255,255,255,0.1)", border: "none", cursor: "pointer", color: "white", width: 24, height: 24, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}
        >
          <Icon name={collapsed ? "arrow_down" : "arrow_up"} size={12} strokeWidth={2.5} color="white" />
        </button>
      </aside>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="hide-desktop" style={{ position: "fixed", inset: 0, zIndex: 1000 }}>
          <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.5)" }} onClick={() => setMobileOpen(false)} />
          <aside style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 240, background: tokens.colors.brand, animation: "slideIn 0.25s ease", overflow: "auto" }}>
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
};

const Topbar = ({ title, mobileOpen, setMobileOpen }) => (
  <header style={{
    background: tokens.colors.bgCard,
    borderBottom: `1px solid ${tokens.colors.border}`,
    padding: "12px 24px",
    display: "flex",
    alignItems: "center",
    gap: 16,
    position: "sticky",
    top: 0,
    zIndex: 50,
  }}>
    <button className="hide-desktop orbx-btn orbx-btn-ghost" onClick={() => setMobileOpen(true)} style={{ padding: 8 }}>
      <Icon name="menu" size={20} />
    </button>
    <div style={{ flex: 1 }}>
      <h1 style={{ fontSize: 17, fontWeight: 700, color: tokens.colors.text }}>{title}</h1>
      <p style={{ fontSize: 11, color: tokens.colors.textMuted, marginTop: 1 }}>
        {new Date().toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
      </p>
    </div>
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 5, background: tokens.colors.successSoft, color: tokens.colors.success, padding: "5px 10px", borderRadius: tokens.radius.full, fontSize: 12, fontWeight: 600 }}>
        <div style={{ width: 6, height: 6, borderRadius: "50%", background: tokens.colors.success, animation: "pulse 2s infinite" }} />
        Online
      </div>
      <button className="orbx-btn orbx-btn-ghost" style={{ padding: 8, position: "relative" }}>
        <Icon name="bell" size={18} />
        <span style={{ position: "absolute", top: 4, right: 4, width: 8, height: 8, borderRadius: "50%", background: tokens.colors.danger, border: `2px solid ${tokens.colors.bgCard}` }} />
      </button>
      <button className="orbx-btn orbx-btn-ghost" style={{ padding: 8 }}>
        <Icon name="sync" size={18} />
      </button>
    </div>
  </header>
);

// ─── DASHBOARD PAGE ────────────────────────────────────────────────────────────
const DashboardPage = ({ setActivePage }) => {
  const stats = [
    { label: "Today's Revenue", value: "₹48,240", change: "+12.4%", up: true, sub: "vs yesterday ₹42,910" },
    { label: "Transactions", value: "127", change: "+8.1%", up: true, sub: "Daily target: 150" },
    { label: "Items Sold", value: "894", change: "+5.3%", up: true, sub: "Across all categories" },
    { label: "Low Stock Alerts", value: "3", change: "Needs attention", up: false, sub: "Tap to view details" },
  ];

  const chartData = [
    { day: "Mon", rev: 38200 }, { day: "Tue", rev: 42100 }, { day: "Wed", rev: 35800 },
    { day: "Thu", rev: 51200 }, { day: "Fri", rev: 48600 }, { day: "Sat", rev: 62400 }, { day: "Sun", rev: 48240 },
  ];
  const maxRev = Math.max(...chartData.map(d => d.rev));

  const topProducts = [
    { name: "Basmati Rice 5kg", qty: 82, rev: "₹34,850", pct: 88 },
    { name: "Parle-G 800g", qty: 154, rev: "₹11,550", pct: 72 },
    { name: "Surf Excel 1kg", qty: 47, rev: "₹10,340", pct: 65 },
    { name: "Maggi Noodles", qty: 63, rev: "₹11,340", pct: 58 },
  ];

  return (
    <div className="page-enter" style={{ padding: "24px" }}>
      {/* Stats Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 24 }}>
        {stats.map((s, i) => (
          <div key={i} className="stat-card">
            <div style={{ fontSize: 12, color: tokens.colors.textMuted, fontWeight: 500, marginBottom: 8 }}>{s.label}</div>
            <div style={{ fontSize: 26, fontWeight: 700, color: tokens.colors.text, marginBottom: 6 }}>{s.value}</div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: s.up ? tokens.colors.success : tokens.colors.danger }}>
                {s.change}
              </span>
              <span style={{ fontSize: 11, color: tokens.colors.textMuted }}>{s.sub}</span>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 16, marginBottom: 16 }}>
        {/* Revenue Chart */}
        <div className="card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 2 }}>Weekly Revenue</div>
              <div style={{ fontSize: 12, color: tokens.colors.textMuted }}>This week vs last week</div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              {["7D", "30D", "90D"].map(p => (
                <button key={p} className="orbx-btn orbx-btn-secondary" style={{ padding: "4px 10px", fontSize: 11 }}>{p}</button>
              ))}
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 12, height: 140 }}>
            {chartData.map((d, i) => (
              <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                <div style={{ width: "100%", position: "relative", borderRadius: "4px 4px 0 0", overflow: "hidden", height: 110 }}>
                  <div style={{
                    position: "absolute", bottom: 0, left: 0, right: 0,
                    height: `${(d.rev / maxRev) * 100}%`,
                    background: i === 6 ? tokens.colors.accent : `${tokens.colors.accent}40`,
                    borderRadius: "4px 4px 0 0",
                    transition: "height 0.5s ease",
                  }} />
                </div>
                <span style={{ fontSize: 11, color: tokens.colors.textMuted, fontWeight: i === 6 ? 700 : 400 }}>{d.day}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="card">
          <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>Quick Actions</div>
          {[
            { label: "New Sale", icon: "pos", color: tokens.colors.accent, page: "pos" },
            { label: "Add Product", icon: "plus", color: tokens.colors.info },
            { label: "Stock Transfer", icon: "truck", color: tokens.colors.success },
            { label: "View Reports", icon: "reports", color: "#8B5CF6", page: "reports" },
          ].map((a, i) => (
            <button key={i} onClick={() => a.page && setActivePage(a.page)} style={{ display: "flex", alignItems: "center", gap: 12, width: "100%", padding: "11px 14px", background: tokens.colors.bgMuted, border: "none", borderRadius: tokens.radius.md, cursor: "pointer", marginBottom: 8, transition: "background 0.15s" }}>
              <div style={{ width: 34, height: 34, borderRadius: tokens.radius.md, background: `${a.color}20`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Icon name={a.icon} size={16} color={a.color} />
              </div>
              <span style={{ fontSize: 13.5, fontWeight: 600, color: tokens.colors.text }}>{a.label}</span>
              <Icon name="arrow_down" size={14} color={tokens.colors.textMuted} style={{ marginLeft: "auto", transform: "rotate(-90deg)" }} />
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        {/* Top Products */}
        <div className="card">
          <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>Top Products Today</div>
          {topProducts.map((p, i) => (
            <div key={i} style={{ marginBottom: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                <div>
                  <span style={{ fontSize: 13, fontWeight: 500 }}>{p.name}</span>
                  <span style={{ fontSize: 11, color: tokens.colors.textMuted, marginLeft: 8 }}>{p.qty} units</span>
                </div>
                <span style={{ fontSize: 13, fontWeight: 600 }}>{p.rev}</span>
              </div>
              <div style={{ height: 5, background: tokens.colors.bgMuted, borderRadius: 99 }}>
                <div style={{ height: "100%", width: `${p.pct}%`, background: tokens.colors.accent, borderRadius: 99, transition: "width 0.5s ease" }} />
              </div>
            </div>
          ))}
        </div>

        {/* Recent Orders */}
        <div className="card">
          <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>Recent Transactions</div>
          {ORDERS_RECENT.map((o, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: i < ORDERS_RECENT.length - 1 ? `1px solid ${tokens.colors.border}` : "none" }}>
              <div style={{ width: 36, height: 36, borderRadius: tokens.radius.md, background: tokens.colors.successSoft, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Icon name="check" size={16} color={tokens.colors.success} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{o.id}</div>
                <div style={{ fontSize: 11, color: tokens.colors.textMuted }}>{o.customer} · {o.time}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 14, fontWeight: 700 }}>₹{o.amount}</div>
                <span className="badge badge-neutral">{o.payMode}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ─── POS PAGE ──────────────────────────────────────────────────────────────────
const POSPage = () => {
  const [cart, setCart] = useState([]);
  const [search, setSearch] = useState("");
  const [discount, setDiscount] = useState(0);
  const [customer, setCustomer] = useState(null);
  const [payMode, setPayMode] = useState("Cash");
  const [showInvoice, setShowInvoice] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [barcodeMode, setBarcodeMode] = useState(false);
  const searchRef = useRef(null);

  const filtered = useMemo(() =>
    PRODUCTS_DB.filter(p =>
      search ? (p.name.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase()) || p.barcode.includes(search)) : true
    ), [search]);

  const addToCart = useCallback((product) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === product.id);
      if (existing) return prev.map(i => i.id === product.id ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { ...product, qty: 1 }];
    });
    setSearch("");
  }, []);

  const updateQty = (id, delta) => {
    setCart(prev => prev.map(i => i.id === id ? { ...i, qty: Math.max(1, i.qty + delta) } : i).filter(i => i.qty > 0));
  };

  const removeItem = (id) => setCart(prev => prev.filter(i => i.id !== id));

  const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const taxTotal = cart.reduce((s, i) => s + (i.price * i.qty * i.tax / 100), 0);
  const discAmt = (subtotal * discount / 100);
  const total = subtotal + taxTotal - discAmt;

  const handleCheckout = () => {
    if (cart.length === 0) return;
    setShowSuccess(true);
    setTimeout(() => { setShowSuccess(false); setCart([]); setDiscount(0); setCustomer(null); }, 2500);
  };

  const invNo = `INV-2026-${Math.floor(1000 + Math.random() * 9000)}`;

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", height: "calc(100vh - 60px)", gap: 0 }}>
      {/* Left: Product Grid */}
      <div style={{ display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* Search Bar */}
        <div style={{ padding: "16px", background: tokens.colors.bgCard, borderBottom: `1px solid ${tokens.colors.border}`, display: "flex", gap: 10 }}>
          <div style={{ position: "relative", flex: 1 }}>
            <div style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)" }}>
              <Icon name={barcodeMode ? "barcode" : "search"} size={16} color={tokens.colors.textMuted} />
            </div>
            <input
              ref={searchRef}
              className="orbx-input"
              style={{ paddingLeft: 36 }}
              placeholder={barcodeMode ? "Scan barcode..." : "Search products by name, SKU, barcode..."}
              value={search}
              onChange={e => setSearch(e.target.value)}
              autoFocus
            />
          </div>
          <button className={`orbx-btn ${barcodeMode ? "orbx-btn-primary" : "orbx-btn-secondary"}`} onClick={() => setBarcodeMode(!barcodeMode)} title="Toggle barcode scan mode">
            <Icon name="barcode" size={16} />
          </button>
        </div>

        {/* Customer Selection */}
        <div style={{ padding: "8px 16px", background: tokens.colors.bgMuted, borderBottom: `1px solid ${tokens.colors.border}`, display: "flex", alignItems: "center", gap: 10 }}>
          <Icon name="user" size={15} color={tokens.colors.textMuted} />
          <span style={{ fontSize: 12, color: tokens.colors.textMuted }}>Customer:</span>
          <select
            style={{ border: "none", background: "transparent", fontSize: 13, fontWeight: 600, color: tokens.colors.text, cursor: "pointer", outline: "none" }}
            value={customer?.id || ""}
            onChange={e => setCustomer(CUSTOMERS_DB.find(c => c.id === e.target.value) || null)}
          >
            <option value="">Walk-in Customer</option>
            {CUSTOMERS_DB.map(c => <option key={c.id} value={c.id}>{c.name} — {c.phone}</option>)}
          </select>
          {customer && <span className="badge badge-success">{customer.points} pts</span>}
        </div>

        {/* Product Grid */}
        <div style={{ flex: 1, overflowY: "auto", padding: 16 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 10 }}>
            {filtered.map(p => (
              <div
                key={p.id}
                onClick={() => addToCart(p)}
                style={{
                  background: tokens.colors.bgCard,
                  border: `1px solid ${tokens.colors.border}`,
                  borderRadius: tokens.radius.lg,
                  padding: "14px 12px",
                  cursor: "pointer",
                  transition: "all 0.15s",
                  position: "relative",
                  overflow: "hidden",
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = tokens.colors.accent; e.currentTarget.style.boxShadow = tokens.shadows.md; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = tokens.colors.border; e.currentTarget.style.boxShadow = "none"; }}
              >
                {cart.find(i => i.id === p.id) && (
                  <div style={{ position: "absolute", top: 8, right: 8, width: 18, height: 18, borderRadius: "50%", background: tokens.colors.accent, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, color: tokens.colors.brand }}>
                    {cart.find(i => i.id === p.id).qty}
                  </div>
                )}
                <div style={{ width: 40, height: 40, background: tokens.colors.accentSoft, borderRadius: tokens.radius.md, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 10 }}>
                  <Icon name="package" size={18} color={tokens.colors.accent} />
                </div>
                <div style={{ fontSize: 12.5, fontWeight: 600, color: tokens.colors.text, marginBottom: 4, lineHeight: 1.3 }}>{p.name}</div>
                <div style={{ fontSize: 11, color: tokens.colors.textMuted, marginBottom: 8 }}>{p.category}</div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 15, fontWeight: 700, color: tokens.colors.brand }}>₹{p.price}</span>
                  <span style={{ fontSize: 10, color: p.stock < 20 ? tokens.colors.danger : tokens.colors.textMuted }}>
                    {p.stock} left
                  </span>
                </div>
              </div>
            ))}
          </div>
          {filtered.length === 0 && (
            <div style={{ textAlign: "center", padding: "60px 20px", color: tokens.colors.textMuted }}>
              <Icon name="search" size={36} color={tokens.colors.borderDark} />
              <p style={{ marginTop: 12, fontSize: 14 }}>No products found</p>
            </div>
          )}
        </div>
      </div>

      {/* Right: Cart & Checkout */}
      <div style={{ background: tokens.colors.bgCard, borderLeft: `1px solid ${tokens.colors.border}`, display: "flex", flexDirection: "column" }}>
        {/* Cart Header */}
        <div style={{ padding: "16px 20px", borderBottom: `1px solid ${tokens.colors.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Icon name="cart" size={17} color={tokens.colors.accent} />
            <span style={{ fontSize: 15, fontWeight: 700 }}>Cart</span>
            {cart.length > 0 && <span className="badge badge-warning">{cart.reduce((s, i) => s + i.qty, 0)} items</span>}
          </div>
          {cart.length > 0 && (
            <button className="orbx-btn orbx-btn-danger" style={{ padding: "5px 10px", fontSize: 12 }} onClick={() => setCart([])}>
              Clear All
            </button>
          )}
        </div>

        {/* Cart Items */}
        <div style={{ flex: 1, overflowY: "auto", padding: "12px 16px" }}>
          {cart.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px 20px", color: tokens.colors.textMuted }}>
              <Icon name="cart" size={40} color={tokens.colors.borderDark} />
              <p style={{ marginTop: 12, fontSize: 13 }}>Cart is empty</p>
              <p style={{ fontSize: 11, marginTop: 4 }}>Click products to add</p>
            </div>
          ) : (
            cart.map(item => (
              <div key={item.id} style={{ display: "flex", gap: 10, padding: "10px 0", borderBottom: `1px solid ${tokens.colors.border}` }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.name}</div>
                  <div style={{ fontSize: 11, color: tokens.colors.textMuted }}>₹{item.price} × {item.qty} = <strong style={{ color: tokens.colors.text }}>₹{item.price * item.qty}</strong></div>
                  <div style={{ fontSize: 10, color: tokens.colors.textMuted }}>GST {item.tax}%</div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
                  <button onClick={() => removeItem(item.id)} style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                    <Icon name="x" size={14} color={tokens.colors.textMuted} />
                  </button>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <button onClick={() => updateQty(item.id, -1)} style={{ width: 22, height: 22, borderRadius: "50%", border: `1px solid ${tokens.colors.border}`, background: tokens.colors.bgMuted, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Icon name="minus" size={12} />
                    </button>
                    <span style={{ fontSize: 13, fontWeight: 600, minWidth: 20, textAlign: "center" }}>{item.qty}</span>
                    <button onClick={() => updateQty(item.id, 1)} style={{ width: 22, height: 22, borderRadius: "50%", border: `1px solid ${tokens.colors.border}`, background: tokens.colors.bgMuted, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Icon name="plus" size={12} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Totals & Checkout */}
        {cart.length > 0 && (
          <div style={{ padding: "16px 20px", borderTop: `1px solid ${tokens.colors.border}` }}>
            {/* Discount */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
              <Icon name="tag" size={14} color={tokens.colors.textMuted} />
              <span style={{ fontSize: 12, color: tokens.colors.textMuted, flex: 1 }}>Discount</span>
              <div style={{ display: "flex", alignItems: "center", border: `1px solid ${tokens.colors.border}`, borderRadius: tokens.radius.md, overflow: "hidden" }}>
                {[0, 5, 10, 15, 20].map(d => (
                  <button key={d} onClick={() => setDiscount(d)} style={{ padding: "4px 8px", background: discount === d ? tokens.colors.accent : "transparent", border: "none", cursor: "pointer", fontSize: 12, fontWeight: discount === d ? 700 : 400, color: discount === d ? tokens.colors.brand : tokens.colors.textMid }}>
                    {d === 0 ? "None" : `${d}%`}
                  </button>
                ))}
              </div>
            </div>

            {/* Bill Summary */}
            <div style={{ background: tokens.colors.bgMuted, borderRadius: tokens.radius.md, padding: "12px 14px", marginBottom: 12 }}>
              {[
                { label: "Subtotal", value: `₹${subtotal.toFixed(2)}` },
                { label: `GST`, value: `₹${taxTotal.toFixed(2)}` },
                discount > 0 && { label: `Discount (${discount}%)`, value: `-₹${discAmt.toFixed(2)}`, color: tokens.colors.success },
              ].filter(Boolean).map((row, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <span style={{ fontSize: 12.5, color: tokens.colors.textMid }}>{row.label}</span>
                  <span style={{ fontSize: 12.5, fontWeight: 500, color: row.color || tokens.colors.text }}>{row.value}</span>
                </div>
              ))}
              <div style={{ borderTop: `1px solid ${tokens.colors.border}`, paddingTop: 8, display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: 15, fontWeight: 700 }}>Total</span>
                <span style={{ fontSize: 18, fontWeight: 800, color: tokens.colors.brand }}>₹{total.toFixed(2)}</span>
              </div>
            </div>

            {/* Payment Mode */}
            <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
              {["Cash", "Card", "UPI"].map(m => (
                <button key={m} onClick={() => setPayMode(m)} style={{ flex: 1, padding: "8px", border: `1.5px solid ${payMode === m ? tokens.colors.accent : tokens.colors.border}`, borderRadius: tokens.radius.md, background: payMode === m ? tokens.colors.accentSoft : "transparent", cursor: "pointer", fontSize: 13, fontWeight: payMode === m ? 700 : 500, color: payMode === m ? tokens.colors.brand : tokens.colors.textMid, transition: "all 0.15s" }}>
                  {m}
                </button>
              ))}
            </div>

            <button className="orbx-btn orbx-btn-primary" style={{ width: "100%", justifyContent: "center", padding: "13px", fontSize: 15, fontWeight: 700, borderRadius: tokens.radius.md }} onClick={handleCheckout}>
              Collect ₹{total.toFixed(2)} — {payMode}
            </button>

            <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
              <button className="orbx-btn orbx-btn-secondary" style={{ flex: 1, justifyContent: "center", fontSize: 12 }} onClick={() => setShowInvoice(true)}>
                <Icon name="print" size={14} /> Preview Invoice
              </button>
              <button className="orbx-btn orbx-btn-secondary" style={{ flex: 1, justifyContent: "center", fontSize: 12, color: "#25D366" }}>
                <Icon name="whatsapp" size={14} color="#25D366" /> WhatsApp
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Success Toast */}
      {showSuccess && (
        <div style={{ position: "fixed", bottom: 24, right: 24, background: tokens.colors.success, color: "white", padding: "14px 20px", borderRadius: tokens.radius.lg, display: "flex", alignItems: "center", gap: 10, boxShadow: tokens.shadows.xl, animation: "fadeIn 0.3s ease", zIndex: 1000 }}>
          <Icon name="check" size={18} color="white" />
          <div>
            <div style={{ fontWeight: 700, fontSize: 14 }}>Payment Successful!</div>
            <div style={{ fontSize: 11, opacity: 0.85 }}>Invoice {invNo} generated · Syncing...</div>
          </div>
        </div>
      )}

      {/* Invoice Preview Modal */}
      {showInvoice && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: "white", borderRadius: tokens.radius.xl, padding: 28, width: 420, maxHeight: "80vh", overflowY: "auto", boxShadow: tokens.shadows.xl }}>
            <div style={{ textAlign: "center", marginBottom: 20 }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: tokens.colors.brand }}>OrbX ERP</div>
              <div style={{ fontSize: 11, color: tokens.colors.textMuted }}>Main Branch · GSTIN: 33AABCU9603R1ZX</div>
              <div style={{ fontSize: 13, fontWeight: 600, marginTop: 8 }}>{invNo}</div>
              <div style={{ fontSize: 11, color: tokens.colors.textMuted }}>{new Date().toLocaleString("en-IN")}</div>
            </div>
            <div style={{ borderTop: "1px dashed #ccc", borderBottom: "1px dashed #ccc", padding: "12px 0", marginBottom: 12 }}>
              {cart.map((item, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 6 }}>
                  <span>{item.name} × {item.qty}</span>
                  <span>₹{(item.price * item.qty).toFixed(2)}</span>
                </div>
              ))}
            </div>
            <div style={{ fontSize: 13, color: tokens.colors.textMid }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}><span>Subtotal</span><span>₹{subtotal.toFixed(2)}</span></div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}><span>GST</span><span>₹{taxTotal.toFixed(2)}</span></div>
              {discount > 0 && <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4, color: tokens.colors.success }}><span>Discount</span><span>-₹{discAmt.toFixed(2)}</span></div>}
              <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700, fontSize: 16, color: tokens.colors.text, borderTop: "1px solid #eee", paddingTop: 8, marginTop: 4 }}><span>TOTAL</span><span>₹{total.toFixed(2)}</span></div>
            </div>
            <div style={{ textAlign: "center", marginTop: 16, fontSize: 11, color: tokens.colors.textMuted }}>
              Thank you for shopping with us! · Powered by OrbX ERP
            </div>
            <button className="orbx-btn orbx-btn-secondary" style={{ width: "100%", justifyContent: "center", marginTop: 16 }} onClick={() => setShowInvoice(false)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── PRODUCTS PAGE ─────────────────────────────────────────────────────────────
const ProductsPage = () => {
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("All");
  const [showAdd, setShowAdd] = useState(false);

  const cats = ["All", ...new Set(PRODUCTS_DB.map(p => p.category))];
  const filtered = PRODUCTS_DB.filter(p =>
    (catFilter === "All" || p.category === catFilter) &&
    (search === "" || p.name.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="page-enter" style={{ padding: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 2 }}>Product Master</h2>
          <p style={{ fontSize: 12, color: tokens.colors.textMuted }}>{PRODUCTS_DB.length} products across {cats.length - 1} categories</p>
        </div>
        <button className="orbx-btn orbx-btn-primary" onClick={() => setShowAdd(true)}>
          <Icon name="plus" size={14} /> Add Product
        </button>
      </div>

      <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
        <div style={{ position: "relative", flex: "1 1 250px" }}>
          <div style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)" }}>
            <Icon name="search" size={14} color={tokens.colors.textMuted} />
          </div>
          <input className="orbx-input" style={{ paddingLeft: 32 }} placeholder="Search products..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {cats.map(c => (
            <button key={c} onClick={() => setCatFilter(c)} className={`orbx-btn ${catFilter === c ? "orbx-btn-primary" : "orbx-btn-secondary"}`} style={{ padding: "7px 12px", fontSize: 12 }}>{c}</button>
          ))}
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: tokens.colors.bgMuted }}>
              {["Product", "SKU / Barcode", "Category", "Price", "Tax", "Stock", "Status", ""].map(h => (
                <th key={h} style={{ padding: "11px 16px", textAlign: "left", fontSize: 11, fontWeight: 700, color: tokens.colors.textMuted, letterSpacing: "0.5px", textTransform: "uppercase", borderBottom: `1px solid ${tokens.colors.border}`, whiteSpace: "nowrap" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(p => (
              <tr key={p.id} className="table-row">
                <td style={{ padding: "12px 16px" }}>
                  <div style={{ fontSize: 13.5, fontWeight: 600 }}>{p.name}</div>
                  <div style={{ fontSize: 11, color: tokens.colors.textMuted }}>{p.id}</div>
                </td>
                <td style={{ padding: "12px 16px" }}>
                  <div style={{ fontSize: 12, fontWeight: 500 }}>{p.sku}</div>
                  <div style={{ fontSize: 10, color: tokens.colors.textMuted, fontFamily: "monospace" }}>{p.barcode}</div>
                </td>
                <td style={{ padding: "12px 16px" }}><span className="badge badge-neutral">{p.category}</span></td>
                <td style={{ padding: "12px 16px", fontSize: 14, fontWeight: 700 }}>₹{p.price}</td>
                <td style={{ padding: "12px 16px" }}><span className="badge badge-info">{p.tax}%</span></td>
                <td style={{ padding: "12px 16px" }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: p.stock < 20 ? tokens.colors.danger : tokens.colors.text }}>{p.stock}</span>
                </td>
                <td style={{ padding: "12px 16px" }}>
                  <span className={`badge ${p.stock < 10 ? "badge-danger" : p.stock < 25 ? "badge-warning" : "badge-success"}`}>
                    {p.stock < 10 ? "Critical" : p.stock < 25 ? "Low Stock" : "In Stock"}
                  </span>
                </td>
                <td style={{ padding: "12px 16px" }}>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button className="orbx-btn orbx-btn-secondary" style={{ padding: "4px 10px", fontSize: 11 }}>Edit</button>
                    <button className="orbx-btn" style={{ padding: "4px 10px", fontSize: 11, background: tokens.colors.dangerSoft, color: tokens.colors.danger }}>Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showAdd && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: "white", borderRadius: tokens.radius.xl, padding: 28, width: 480, boxShadow: tokens.shadows.xl }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
              <h3 style={{ fontSize: 17, fontWeight: 700 }}>Add New Product</h3>
              <button onClick={() => setShowAdd(false)} style={{ background: "none", border: "none", cursor: "pointer" }}><Icon name="x" size={20} /></button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              {[["Product Name", "Full product name"], ["SKU", "e.g. RICE-BAS-5K"], ["Barcode", "13-digit barcode"], ["Price (₹)", "0.00"], ["Tax %", "0, 5, 12, 18, 28"], ["Stock", "0"]].map(([label, ph]) => (
                <div key={label}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: tokens.colors.textMid, marginBottom: 5, display: "block" }}>{label}</label>
                  <input className="orbx-input" placeholder={ph} />
                </div>
              ))}
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: tokens.colors.textMid, marginBottom: 5, display: "block" }}>Category</label>
                <select className="orbx-input">
                  {cats.filter(c => c !== "All").map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 20 }}>
              <button className="orbx-btn orbx-btn-secondary" style={{ flex: 1, justifyContent: "center" }} onClick={() => setShowAdd(false)}>Cancel</button>
              <button className="orbx-btn orbx-btn-primary" style={{ flex: 1, justifyContent: "center" }}>Save Product</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── INVENTORY PAGE ────────────────────────────────────────────────────────────
const InventoryPage = () => (
  <div className="page-enter" style={{ padding: 24 }}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
      <h2 style={{ fontSize: 16, fontWeight: 700 }}>Inventory Management</h2>
      <div style={{ display: "flex", gap: 8 }}>
        <button className="orbx-btn orbx-btn-secondary"><Icon name="filter" size={14} /> Filter</button>
        <button className="orbx-btn orbx-btn-primary"><Icon name="plus" size={14} /> Stock Adjustment</button>
      </div>
    </div>

    {/* Alerts */}
    <div style={{ background: tokens.colors.dangerSoft, border: `1px solid ${tokens.colors.danger}40`, borderRadius: tokens.radius.md, padding: "12px 16px", marginBottom: 20, display: "flex", alignItems: "center", gap: 10 }}>
      <Icon name="warning" size={16} color={tokens.colors.danger} />
      <span style={{ fontSize: 13, color: tokens.colors.danger, fontWeight: 500 }}>3 products are running low on stock. Raise a purchase order or transfer request.</span>
    </div>

    {/* Stock Cards */}
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12, marginBottom: 24 }}>
      {[
        { label: "Total Products", value: "248", icon: "products", color: tokens.colors.info },
        { label: "In Stock", value: "231", icon: "check", color: tokens.colors.success },
        { label: "Low Stock", value: "14", icon: "warning", color: tokens.colors.warning },
        { label: "Out of Stock", value: "3", icon: "x", color: tokens.colors.danger },
      ].map((s, i) => (
        <div key={i} className="stat-card" style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 42, height: 42, borderRadius: tokens.radius.md, background: `${s.color}18`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Icon name={s.icon} size={18} color={s.color} />
          </div>
          <div>
            <div style={{ fontSize: 22, fontWeight: 800 }}>{s.value}</div>
            <div style={{ fontSize: 12, color: tokens.colors.textMuted }}>{s.label}</div>
          </div>
        </div>
      ))}
    </div>

    <div className="card" style={{ padding: 0, overflow: "hidden" }}>
      <div style={{ padding: "14px 20px", borderBottom: `1px solid ${tokens.colors.border}`, fontSize: 14, fontWeight: 700 }}>Stock Levels</div>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ background: tokens.colors.bgMuted }}>
            {["Product", "Category", "Current Stock", "Min Stock", "Status", "Action"].map(h => (
              <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontSize: 11, fontWeight: 700, color: tokens.colors.textMuted, textTransform: "uppercase", letterSpacing: "0.5px" }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {INVENTORY_DATA.map(p => (
            <tr key={p.id} className="table-row">
              <td style={{ padding: "13px 16px" }}>
                <div style={{ fontSize: 13.5, fontWeight: 600 }}>{p.name}</div>
                <div style={{ fontSize: 11, color: tokens.colors.textMuted }}>{p.id}</div>
              </td>
              <td style={{ padding: "13px 16px" }}><span className="badge badge-neutral">{p.category}</span></td>
              <td style={{ padding: "13px 16px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 80, height: 6, background: tokens.colors.bgMuted, borderRadius: 99 }}>
                    <div style={{ height: "100%", width: `${Math.min(100, (p.stock / p.minStock) * 50)}%`, background: p.status === "critical" ? tokens.colors.danger : p.status === "low" ? tokens.colors.warning : tokens.colors.success, borderRadius: 99 }} />
                  </div>
                  <span style={{ fontSize: 14, fontWeight: 700, color: p.status === "critical" ? tokens.colors.danger : p.status === "low" ? tokens.colors.warning : tokens.colors.success }}>{p.stock}</span>
                </div>
              </td>
              <td style={{ padding: "13px 16px", fontSize: 13, color: tokens.colors.textMid }}>{p.minStock}</td>
              <td style={{ padding: "13px 16px" }}>
                <span className={`badge ${p.status === "critical" ? "badge-danger" : p.status === "low" ? "badge-warning" : "badge-success"}`}>
                  {p.status === "critical" ? "Critical" : p.status === "low" ? "Low Stock" : "In Stock"}
                </span>
              </td>
              <td style={{ padding: "13px 16px" }}>
                <div style={{ display: "flex", gap: 6 }}>
                  <button className="orbx-btn orbx-btn-secondary" style={{ padding: "4px 10px", fontSize: 11 }}>Adjust</button>
                  <button className="orbx-btn" style={{ padding: "4px 10px", fontSize: 11, background: tokens.colors.infoSoft, color: tokens.colors.info }}>Order</button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

// ─── TRANSFERS PAGE ────────────────────────────────────────────────────────────
const TransfersPage = () => {
  const statusColor = { pending: "badge-warning", approved: "badge-info", shipped: "badge-info", received: "badge-success" };
  return (
    <div className="page-enter" style={{ padding: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700 }}>Stock Transfers</h2>
        <button className="orbx-btn orbx-btn-primary"><Icon name="plus" size={14} /> New Transfer Request</button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12, marginBottom: 24 }}>
        {[
          { label: "Pending Approval", value: "4", color: tokens.colors.warning },
          { label: "In Transit", value: "2", color: tokens.colors.info },
          { label: "Completed Today", value: "7", color: tokens.colors.success },
        ].map((s, i) => (
          <div key={i} className="stat-card">
            <div style={{ fontSize: 28, fontWeight: 800, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 13, color: tokens.colors.textMuted, marginTop: 4 }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ padding: "14px 20px", borderBottom: `1px solid ${tokens.colors.border}`, fontSize: 14, fontWeight: 700 }}>Transfer Log</div>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: tokens.colors.bgMuted }}>
              {["Transfer ID", "From", "To", "Items", "Date", "Status", "Action"].map(h => (
                <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontSize: 11, fontWeight: 700, color: tokens.colors.textMuted, textTransform: "uppercase", letterSpacing: "0.5px" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {TRANSFERS_DATA.map(t => (
              <tr key={t.id} className="table-row">
                <td style={{ padding: "13px 16px", fontSize: 13, fontWeight: 700 }}>{t.id}</td>
                <td style={{ padding: "13px 16px", fontSize: 13 }}>{t.from}</td>
                <td style={{ padding: "13px 16px", fontSize: 13 }}>{t.to}</td>
                <td style={{ padding: "13px 16px", fontSize: 13 }}>{t.items} items</td>
                <td style={{ padding: "13px 16px", fontSize: 12, color: tokens.colors.textMuted }}>{t.date}</td>
                <td style={{ padding: "13px 16px" }}><span className={`badge ${statusColor[t.status]}`}>{t.status.charAt(0).toUpperCase() + t.status.slice(1)}</span></td>
                <td style={{ padding: "13px 16px" }}>
                  <button className="orbx-btn orbx-btn-secondary" style={{ padding: "4px 10px", fontSize: 11 }}>View</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ─── CUSTOMERS PAGE ────────────────────────────────────────────────────────────
const CustomersPage = () => (
  <div className="page-enter" style={{ padding: 24 }}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
      <h2 style={{ fontSize: 16, fontWeight: 700 }}>Customer Management</h2>
      <button className="orbx-btn orbx-btn-primary"><Icon name="plus" size={14} /> Add Customer</button>
    </div>
    <div className="card" style={{ padding: 0, overflow: "hidden" }}>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ background: tokens.colors.bgMuted }}>
            {["Customer", "Phone", "Email", "Credit Balance", "Loyalty Points", "Action"].map(h => (
              <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontSize: 11, fontWeight: 700, color: tokens.colors.textMuted, textTransform: "uppercase", letterSpacing: "0.5px" }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {CUSTOMERS_DB.map(c => (
            <tr key={c.id} className="table-row">
              <td style={{ padding: "13px 16px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 34, height: 34, borderRadius: "50%", background: tokens.colors.accentSoft, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: tokens.colors.accent }}>{c.name[0]}</div>
                  <div>
                    <div style={{ fontSize: 13.5, fontWeight: 600 }}>{c.name}</div>
                    <div style={{ fontSize: 11, color: tokens.colors.textMuted }}>{c.id}</div>
                  </div>
                </div>
              </td>
              <td style={{ padding: "13px 16px", fontSize: 13 }}>{c.phone}</td>
              <td style={{ padding: "13px 16px", fontSize: 13, color: tokens.colors.info }}>{c.email}</td>
              <td style={{ padding: "13px 16px" }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: c.credit > 0 ? tokens.colors.danger : tokens.colors.success }}>
                  ₹{c.credit.toLocaleString()}
                </span>
              </td>
              <td style={{ padding: "13px 16px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <div style={{ width: 60, height: 5, background: tokens.colors.bgMuted, borderRadius: 99 }}>
                    <div style={{ height: "100%", width: `${(c.points / 1500) * 100}%`, background: tokens.colors.accent, borderRadius: 99 }} />
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 600 }}>{c.points}</span>
                </div>
              </td>
              <td style={{ padding: "13px 16px" }}>
                <div style={{ display: "flex", gap: 6 }}>
                  <button className="orbx-btn orbx-btn-secondary" style={{ padding: "4px 10px", fontSize: 11 }}>View</button>
                  <button className="orbx-btn orbx-btn-secondary" style={{ padding: "4px 10px", fontSize: 11 }}>Edit</button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

// ─── REPORTS PAGE ──────────────────────────────────────────────────────────────
const ReportsPage = () => {
  const salesByDay = [
    { day: "Mon", sales: 38200, orders: 92 }, { day: "Tue", sales: 42100, orders: 108 },
    { day: "Wed", sales: 35800, orders: 89 }, { day: "Thu", sales: 51200, orders: 131 },
    { day: "Fri", sales: 48600, orders: 122 }, { day: "Sat", sales: 62400, orders: 158 }, { day: "Sun", sales: 48240, orders: 127 },
  ];
  const maxSales = Math.max(...salesByDay.map(d => d.sales));

  return (
    <div className="page-enter" style={{ padding: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700 }}>Reports & Analytics</h2>
        <div style={{ display: "flex", gap: 8 }}>
          <select className="orbx-input" style={{ width: "auto", padding: "7px 12px" }}>
            <option>This Week</option>
            <option>This Month</option>
            <option>Last Month</option>
          </select>
          <button className="orbx-btn orbx-btn-secondary"><Icon name="print" size={14} /> Export</button>
        </div>
      </div>

      {/* KPI Row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12, marginBottom: 24 }}>
        {[
          { label: "Total Revenue", value: "₹3,26,540", sub: "This week", color: tokens.colors.brand },
          { label: "Gross Profit", value: "₹82,150", sub: "Margin: 25.2%", color: tokens.colors.success },
          { label: "Total Orders", value: "827", sub: "Avg ₹395 / order", color: tokens.colors.info },
          { label: "Items Sold", value: "6,248", sub: "Across 12 categories", color: tokens.colors.accent },
        ].map((s, i) => (
          <div key={i} className="stat-card">
            <div style={{ fontSize: 12, color: tokens.colors.textMuted, marginBottom: 6 }}>{s.label}</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: s.color, marginBottom: 4 }}>{s.value}</div>
            <div style={{ fontSize: 11, color: tokens.colors.textMuted }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Daily Chart */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 20 }}>Daily Sales Performance</div>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 16, height: 160 }}>
          {salesByDay.map((d, i) => (
            <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: tokens.colors.textMid }}>₹{(d.sales / 1000).toFixed(0)}k</div>
              <div style={{ width: "100%", position: "relative", height: 110, display: "flex", alignItems: "flex-end" }}>
                <div style={{ width: "100%", height: `${(d.sales / maxSales) * 100}%`, background: i === 5 ? tokens.colors.accent : `${tokens.colors.accent}50`, borderRadius: "4px 4px 0 0", transition: "height 0.5s" }} />
              </div>
              <div style={{ fontSize: 11, color: tokens.colors.textMuted, fontWeight: 600 }}>{d.day}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Payment Mode Breakdown */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div className="card">
          <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>Payment Mode Split</div>
          {[
            { mode: "UPI", pct: 45, amt: "₹1,46,940" },
            { mode: "Cash", pct: 30, amt: "₹97,960" },
            { mode: "Card", pct: 25, amt: "₹81,640" },
          ].map((pm, i) => (
            <div key={i} style={{ marginBottom: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                <span style={{ fontSize: 13, fontWeight: 500 }}>{pm.mode}</span>
                <div style={{ display: "flex", gap: 10 }}>
                  <span style={{ fontSize: 13, color: tokens.colors.textMuted }}>{pm.amt}</span>
                  <span style={{ fontSize: 13, fontWeight: 700 }}>{pm.pct}%</span>
                </div>
              </div>
              <div style={{ height: 7, background: tokens.colors.bgMuted, borderRadius: 99 }}>
                <div style={{ height: "100%", width: `${pm.pct}%`, background: [tokens.colors.accent, tokens.colors.info, tokens.colors.success][i], borderRadius: 99 }} />
              </div>
            </div>
          ))}
        </div>

        <div className="card">
          <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>Category Revenue</div>
          {[
            { cat: "Grocery", rev: "₹1,24,200", pct: 76 },
            { cat: "Personal Care", rev: "₹64,400", pct: 55 },
            { cat: "Beverage", rev: "₹48,200", pct: 42 },
            { cat: "Household", rev: "₹36,800", pct: 34 },
          ].map((c, i) => (
            <div key={i} style={{ marginBottom: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                <span style={{ fontSize: 13, fontWeight: 500 }}>{c.cat}</span>
                <span style={{ fontSize: 13, fontWeight: 700 }}>{c.rev}</span>
              </div>
              <div style={{ height: 7, background: tokens.colors.bgMuted, borderRadius: 99 }}>
                <div style={{ height: "100%", width: `${c.pct}%`, background: `hsl(${210 + i * 30}, 70%, 55%)`, borderRadius: 99 }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ─── SETTINGS PAGE ─────────────────────────────────────────────────────────────
const SettingsPage = () => (
  <div className="page-enter" style={{ padding: 24, maxWidth: 760 }}>
    <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>Settings</h2>
    {[
      {
        title: "Branch Information",
        fields: [
          { label: "Branch Name", value: "Main Branch — Coimbatore" },
          { label: "GSTIN", value: "33AABCU9603R1ZX" },
          { label: "Address", value: "123 RS Puram, Coimbatore, TN 641002" },
          { label: "Phone", value: "+91 422 4567890" },
        ]
      },
      {
        title: "Sync Settings",
        fields: [
          { label: "Sync Interval", value: "30 seconds" },
          { label: "Server URL", value: "https://api.orbxerp.com" },
        ]
      },
      {
        title: "Invoice Settings",
        fields: [
          { label: "Invoice Prefix", value: "INV-2026-" },
          { label: "Footer Text", value: "Thank you for shopping with us!" },
        ]
      }
    ].map(section => (
      <div key={section.title} className="card" style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 16, color: tokens.colors.brand }}>{section.title}</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          {section.fields.map(f => (
            <div key={f.label}>
              <label style={{ fontSize: 12, fontWeight: 600, color: tokens.colors.textMid, marginBottom: 5, display: "block" }}>{f.label}</label>
              <input className="orbx-input" defaultValue={f.value} />
            </div>
          ))}
        </div>
        <button className="orbx-btn orbx-btn-primary" style={{ marginTop: 16 }}>Save Changes</button>
      </div>
    ))}
  </div>
);

// ─── PAGE TITLES ───────────────────────────────────────────────────────────────
const PAGE_TITLES = {
  dashboard: "Dashboard", pos: "POS / Billing", products: "Products",
  inventory: "Inventory", transfers: "Transfers", customers: "Customers",
  reports: "Reports & Analytics", settings: "Settings",
};

// ─── ROOT APP ──────────────────────────────────────────────────────────────────
export default function OrbXERP() {
  const [activePage, setActivePage] = useState("dashboard");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  const pages = {
    dashboard: <DashboardPage setActivePage={setActivePage} />,
    pos: <POSPage />,
    products: <ProductsPage />,
    inventory: <InventoryPage />,
    transfers: <TransfersPage />,
    customers: <CustomersPage />,
    reports: <ReportsPage />,
    settings: <SettingsPage />,
  };

  return (
    <>
      <GlobalStyles />
      <div style={{ display: "flex", height: "100vh", overflow: "hidden", fontFamily: tokens.font.sans, background: tokens.colors.bg }}>
        <Sidebar
          activePage={activePage}
          setActivePage={setActivePage}
          collapsed={sidebarCollapsed}
          setCollapsed={setSidebarCollapsed}
          mobileOpen={mobileOpen}
          setMobileOpen={setMobileOpen}
          darkMode={darkMode}
          setDarkMode={setDarkMode}
        />
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <Topbar
            title={PAGE_TITLES[activePage]}
            mobileOpen={mobileOpen}
            setMobileOpen={setMobileOpen}
          />
          <main style={{ flex: 1, overflowY: "auto" }}>
            {pages[activePage]}
          </main>
        </div>
      </div>
    </>
  );
}
