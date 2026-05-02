import { useState, useEffect } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import Icon from './Icon';
import { tokens } from '../design/tokens';

// ─── NAV ITEMS ────────────────────────────────────────────────────────────────
const NAV_ITEMS = [
  { path: '/',          label: 'Dashboard',    icon: 'dashboard', module: null },
  { path: '/pos',       label: 'POS / Billing', icon: 'pos',      module: 'pos' },
  { path: '/products',  label: 'Products',     icon: 'products',  module: 'inventory' },
  { path: '/inventory', label: 'Inventory',    icon: 'inventory', module: 'inventory' },
  { path: '/transfers', label: 'Transfers',    icon: 'transfers', module: 'transfers' },
  { path: '/customers', label: 'Customers',    icon: 'customers', module: 'crm' },
  { path: '/reports',   label: 'Reports',      icon: 'reports',   module: 'reports' },
  { path: '/settings',  label: 'Settings',     icon: 'settings',  module: 'settings' },
];

const PAGE_SUBTITLES = {
  '/':          'Overview of your retail operations',
  '/pos':       'Fast billing with barcode & keyboard support',
  '/products':  'Manage your product catalog and pricing',
  '/inventory': 'Track stock levels across all branches',
  '/transfers': 'Inter-branch stock movement & dispatch',
  '/customers': 'Customer records, credit & loyalty accounts',
  '/reports':   'Sales analytics & performance insights',
  '/settings':  'Configure branch, sync & invoice settings',
};

// ─── GLOBAL ORBX STYLES ───────────────────────────────────────────────────────
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

// ─── LAYOUT COMPONENT ─────────────────────────────────────────────────────────
export default function Layout({ children }) {
  const [collapsed,   setCollapsed]   = useState(false);
  const [mobileOpen,  setMobileOpen]  = useState(false);
  const [darkMode,    setDarkMode]    = useState(false);
  const [online,      setOnline]      = useState(navigator.onLine);
  const [syncPulse,   setSyncPulse]   = useState(false);
  const location  = useLocation();
  const navigate  = useNavigate();

  const user           = JSON.parse(localStorage.getItem('user') || '{}');
  const isAdmin        = !!user.is_superadmin;
  const allowedModules = user.allowed_modules || {};

  // Online/offline detection
  useEffect(() => {
    const onOnline  = () => setOnline(true);
    const onOffline = () => setOnline(false);
    window.addEventListener('online',  onOnline);
    window.addEventListener('offline', onOffline);
    return () => { window.removeEventListener('online', onOnline); window.removeEventListener('offline', onOffline); };
  }, []);

  // Sync pulse every 30s
  useEffect(() => {
    const interval = setInterval(() => {
      setSyncPulse(true);
      setTimeout(() => setSyncPulse(false), 1500);
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  // Dark mode
  const toggleDarkMode = () => {
    const next = !darkMode;
    setDarkMode(next);
    document.documentElement.setAttribute('data-theme', next ? 'dark' : 'light');
  };

  // Filter nav by permission
  const filteredNav = NAV_ITEMS.filter(item => {
    if (isAdmin || !item.module) return true;
    return !!allowedModules[item.module];
  });

  const currentPath  = location.pathname;
  const currentNav   = NAV_ITEMS.find(n => n.path === currentPath) || NAV_ITEMS[0];
  const pageTitle    = currentNav.label;
  const pageSubtitle = PAGE_SUBTITLES[currentPath] || 'OrbX ERP — Retail Suite';

  // ─── SIDEBAR CONTENT ────────────────────────────────────────────────
  const sidebarContent = (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '16px 12px' }}>
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '4px 2px 20px', borderBottom: '1px solid rgba(255,255,255,0.08)', marginBottom: 16 }}>
        <div style={{ width: 34, height: 34, background: tokens.colors.accent, borderRadius: tokens.radius.md, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <span style={{ fontSize: 16, fontWeight: 800, color: tokens.colors.brand }}>O</span>
        </div>
        {!collapsed && (
          <div style={{ overflow: 'hidden' }}>
            <div style={{ fontSize: 15, fontWeight: 800, color: 'white', lineHeight: 1.2, letterSpacing: '-0.02em' }}>OrbX ERP</div>
            <div style={{ fontSize: 10, color: tokens.colors.accent, fontWeight: 600, letterSpacing: '1px', marginTop: 1 }}>RETAIL SUITE</div>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav style={{ flex: 1 }}>
        {!collapsed && (
          <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.25)', letterSpacing: '1.2px', padding: '0 2px 8px', textTransform: 'uppercase' }}>
            Main Menu
          </div>
        )}
        {filteredNav.map(item => {
          const isActive = item.path === '/' ? currentPath === '/' : currentPath.startsWith(item.path);
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={`orbx-nav-item${isActive ? ' active' : ''}`}
              style={collapsed ? { justifyContent: 'center', padding: '10px' } : {}}
              onClick={() => setMobileOpen(false)}
              title={collapsed ? item.label : ''}
            >
              <Icon name={item.icon} size={17} />
              {!collapsed && <span>{item.label}</span>}
              {!collapsed && item.path === '/inventory' && (
                <span style={{ marginLeft: 'auto', background: tokens.colors.danger, color: 'white', borderRadius: '99px', fontSize: 10, padding: '1px 6px', fontWeight: 700 }}>3</span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Bottom */}
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 12 }}>
        <button
          className="orbx-nav-item"
          onClick={toggleDarkMode}
          style={{ width: '100%', border: 'none', background: 'transparent', cursor: 'pointer', ...(collapsed ? { justifyContent: 'center', padding: '10px' } : {}) }}
        >
          <Icon name={darkMode ? 'sun' : 'moon'} size={16} />
          {!collapsed && <span>{darkMode ? 'Light Mode' : 'Dark Mode'}</span>}
        </button>

        <button
          className="orbx-nav-item"
          onClick={() => { localStorage.removeItem('token'); localStorage.removeItem('user'); navigate('/login'); }}
          style={{ width: '100%', border: 'none', background: 'transparent', cursor: 'pointer', color: 'rgba(239,68,68,0.7)', ...(collapsed ? { justifyContent: 'center', padding: '10px' } : {}) }}
          title={collapsed ? 'Logout' : ''}
        >
          <Icon name="logout" size={16} />
          {!collapsed && <span>Logout</span>}
        </button>

        {/* User card */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: collapsed ? '10px' : '10px 14px', marginTop: 4, ...(collapsed ? { justifyContent: 'center' } : {}) }}>
          <div style={{ width: 30, height: 30, borderRadius: '50%', background: tokens.colors.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, color: tokens.colors.brand, flexShrink: 0 }}>
            {(user.name || 'U').charAt(0).toUpperCase()}
          </div>
          {!collapsed && (
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'white', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.name || 'Admin User'}</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{user.branch_name || (isAdmin ? 'Super Admin' : 'Branch User')}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <>
      <OrbxGlobalStyles />
      <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', fontFamily: tokens.font.sans }}>

        {/* ─── Desktop Sidebar ─── */}
        <aside
          className="orbx-hide-mobile"
          style={{
            width: collapsed ? 64 : 220,
            background: tokens.colors.brand,
            height: '100vh',
            position: 'sticky',
            top: 0,
            flexShrink: 0,
            transition: 'width 0.25s cubic-bezier(.4,0,.2,1)',
            overflow: 'hidden',
            zIndex: 100,
            boxShadow: '2px 0 20px rgba(0,0,0,0.15)',
          }}
        >
          {sidebarContent}
          {/* Collapse toggle */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            style={{
              position: 'absolute', top: 24, right: collapsed ? 12 : 16,
              background: 'rgba(255,255,255,0.1)', border: 'none', cursor: 'pointer',
              color: 'white', width: 24, height: 24, borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'right 0.25s',
            }}
          >
            <Icon name={collapsed ? 'arrow_right' : 'arrow_down'} size={12} strokeWidth={2.5} color="white" />
          </button>
        </aside>

        {/* ─── Mobile Drawer ─── */}
        {mobileOpen && (
          <div className="orbx-hide-desktop" style={{ position: 'fixed', inset: 0, zIndex: 1000 }}>
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)' }} onClick={() => setMobileOpen(false)} />
            <aside style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 240, background: tokens.colors.brand, animation: 'orbx-slideIn 0.25s ease', overflow: 'auto' }}>
              {sidebarContent}
            </aside>
          </div>
        )}

        {/* ─── Main Area ─── */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>

          {/* ─── Topbar ─── */}
          <header style={{
            background: tokens.colors.bgCard,
            borderBottom: `1px solid ${tokens.colors.border}`,
            padding: '12px 24px',
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            position: 'sticky',
            top: 0,
            zIndex: 50,
            flexShrink: 0,
            boxShadow: tokens.shadows.sm,
          }}>
            {/* Mobile menu toggle */}
            <button className="orbx-btn orbx-btn-ghost orbx-hide-desktop" onClick={() => setMobileOpen(true)} style={{ padding: 8 }}>
              <Icon name="menu" size={20} />
            </button>

            {/* Page Title */}
            <div style={{ flex: 1 }}>
              <h1 style={{ fontSize: 17, fontWeight: 700, color: tokens.colors.text, lineHeight: 1.2 }}>{pageTitle}</h1>
              <p style={{ fontSize: 11, color: tokens.colors.textMuted, marginTop: 1 }}>
                {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>

            {/* Right actions */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {/* Online/Offline status */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: online ? tokens.colors.successSoft : tokens.colors.dangerSoft, color: online ? tokens.colors.success : tokens.colors.danger, padding: '5px 10px', borderRadius: tokens.radius.full, fontSize: 12, fontWeight: 600 }}>
                <div className="orbx-pulse" style={{ width: 6, height: 6, borderRadius: '50%', background: online ? tokens.colors.success : tokens.colors.danger }} />
                {online ? 'Online' : 'Offline'}
              </div>

              {/* Bell */}
              <button className="orbx-btn orbx-btn-ghost" style={{ padding: 8, position: 'relative' }}>
                <Icon name="bell" size={18} />
                <span style={{ position: 'absolute', top: 4, right: 4, width: 8, height: 8, borderRadius: '50%', background: tokens.colors.danger, border: `2px solid ${tokens.colors.bgCard}` }} />
              </button>

              {/* Sync */}
              <button className="orbx-btn orbx-btn-ghost" style={{ padding: 8 }} title="Sync data">
                <Icon name="sync" size={18} color={syncPulse ? tokens.colors.accent : tokens.colors.textMuted} />
              </button>

              {/* User chip */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: tokens.colors.bgMuted, border: `1px solid ${tokens.colors.border}`, borderRadius: tokens.radius.md, padding: '4px 10px 4px 4px' }}>
                <div style={{ width: 26, height: 26, borderRadius: '50%', background: tokens.colors.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: tokens.colors.brand }}>
                  {(user.name || 'U').charAt(0).toUpperCase()}
                </div>
                <div style={{ lineHeight: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: tokens.colors.text }}>{user.name || 'Admin'}</div>
                  <div style={{ fontSize: 10, color: tokens.colors.textMuted }}>{isAdmin ? 'Super Admin' : (user.role_name || 'Staff')}</div>
                </div>
              </div>
            </div>
          </header>

          {/* ─── Page Content ─── */}
          <main style={{ flex: 1, overflowY: 'auto' }}>
            {children}
          </main>
        </div>
      </div>
    </>
  );
}
