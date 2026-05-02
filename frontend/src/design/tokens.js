// ─── ORBX ERP DESIGN TOKENS ───────────────────────────────────────────────────
// Single source of truth — mirrors OrbX_ERP_POS.jsx reference design
// Brand: Deep Navy + Electric Amber

export const tokens = {
  colors: {
    // Brand palette
    brand:        '#0F172A',
    brandMid:     '#1E293B',
    brandSurface: '#243044',
    accent:       '#F59E0B',
    accentHover:  '#D97706',
    accentSoft:   'rgba(245,158,11,0.12)',
    // Semantic
    success:      '#10B981',
    successSoft:  'rgba(16,185,129,0.12)',
    danger:       '#EF4444',
    dangerSoft:   'rgba(239,68,68,0.12)',
    info:         '#3B82F6',
    infoSoft:     'rgba(59,130,246,0.12)',
    warning:      '#F59E0B',
    warningSoft:  'rgba(245,158,11,0.12)',
    // Neutral
    bg:           '#F8FAFC',
    bgCard:       '#FFFFFF',
    bgMuted:      '#F1F5F9',
    border:       '#E2E8F0',
    borderDark:   '#CBD5E1',
    text:         '#0F172A',
    textMid:      '#475569',
    textMuted:    '#94A3B8',
    white:        '#FFFFFF',
  },
  shadows: {
    sm:  '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)',
    md:  '0 4px 12px rgba(0,0,0,0.08), 0 2px 6px rgba(0,0,0,0.04)',
    lg:  '0 10px 30px rgba(0,0,0,0.1), 0 4px 12px rgba(0,0,0,0.06)',
    xl:  '0 20px 50px rgba(0,0,0,0.12), 0 8px 20px rgba(0,0,0,0.06)',
  },
  radius: {
    sm:   '6px',
    md:   '10px',
    lg:   '14px',
    xl:   '20px',
    full: '9999px',
  },
  font: {
    sans: "'DM Sans', 'Inter', system-ui, sans-serif",
  },
};

export default tokens;
