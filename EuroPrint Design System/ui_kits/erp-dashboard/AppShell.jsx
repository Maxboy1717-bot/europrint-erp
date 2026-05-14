/* AppShell — Sidebar + Topbar (SHIPNOW-inspired layout)
   - Full EuroPrint logo at top
   - User profile pill below
   - Grouped nav with pill active states + 3px slide indicator
   - "Go Pro" promo card at bottom
   - Topbar: greeting/title on left, search + icon buttons on right
*/
const { useState } = React;

function Icon({ name, size = 16, stroke = 1.7 }) {
  const paths = {
    'home':       'M3 9l9-7 9 7v11a2 2 0 0 1-2 2h-4v-7H10v7H6a2 2 0 0 1-2-2z',
    'chart':      'M3 3v18h18M7 16l4-4 4 4 5-5M15 11l5-5',
    'calendar':   'M19 4H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2zM16 2v4M8 2v4M3 10h18',
    'package':    'M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16zM3.27 6.96 12 12.01l8.73-5.05M12 22.08V12',
    'route':      'M9 18l6-12M6 18a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM18 12a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
    'warehouse':  'M22 8.35V20a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8.35a2 2 0 0 1 1.26-1.86l8-3.2a2 2 0 0 1 1.48 0l8 3.2A2 2 0 0 1 22 8.35zM6 18h12M6 14h12M6 10h12',
    'truck':      'M1 3h15v13H1zM16 8h4l3 3v5h-7zM5.5 21a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5zM18.5 21a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z',
    'users':      'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z',
    'doc':        'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M16 13H8M16 17H8M10 9H8',
    'mail':       'M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zM22 6l-10 7L2 6',
    'bell':       'M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9M13.73 21a2 2 0 0 1-3.46 0',
    'cog':        'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z',
    'message':    'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z',
    'search':     'M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM21 21l-4.35-4.35',
    'plus':       'M12 5v14M5 12h14',
    'chev-rt':    'M9 18l6-6-6-6',
    'chev-dn':    'M6 9l6 6 6-6',
    'check':      'M20 6L9 17l-5-5',
    'x':          'M18 6L6 18M6 6l12 12',
    'eye':        'M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
    'edit':       'M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4z',
    'filter':     'M3 4h18l-7 9v6l-4 2v-8z',
    'more':       'M12 6h.01M12 12h.01M12 18h.01',
    'dots':       'M5 12h.01M12 12h.01M19 12h.01',
    'tag':        'M20.59 13.41 13.42 20.58a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82zM7 7h.01',
    'factory':    'M2 20h20V12l-6 3-6-6-6 3v8zM6 16h2M11 16h2M16 16h2',
    'arrow-up-r': 'M7 17 17 7M7 7h10v10',
    'arrow-up':   'M12 19V5M5 12l7-7 7 7',
    'arrow-dn':   'M12 5v14M5 12l7 7 7-7',
    'cash':       'M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6',
    'pin':        'M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0zM12 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
    'clock':      'M12 22a10 10 0 1 1 0-20 10 10 0 0 1 0 20zM12 6v6l4 2',
    'globe':      'M12 22a10 10 0 1 1 0-20 10 10 0 0 1 0 20zM2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z',
    'shield':     'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z',
    'star':       'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z',
    'sparkle':    'M12 3 14 9 20 11 14 13 12 19 10 13 4 11 10 9zM5 3v4M3 5h4M19 17v4M17 19h4',
    'log-out':    'M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9',
    'briefcase':  'M20 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2zM16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16',
    'minus':      'M5 12h14',
    'credit-card':'M2 7h20v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2zM2 11h20M6 16h4',
    'scan':       'M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2M7 8v8M11 8v8M16 8v8',
    'phone':      'M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.37 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z',
    'download':   'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3',
    'award':      'M12 15a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM8.21 13.89 7 23l5-3 5 3-1.21-9.11',
    'trash':      'M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6',
    'grip':       'M9 5h.01M9 12h.01M9 19h.01M15 5h.01M15 12h.01M15 19h.01',
    'wallet':     'M21 12V7H5a2 2 0 0 1 0-4h14v4M3 5v14a2 2 0 0 0 2 2h16v-5M18 12a2 2 0 0 0 0 4h4v-4z',
    'gift':       'M20 12v10H4V12M2 7h20v5H2zM12 22V7M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7zM12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z',
    'pdf':        'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M9 13h6M9 17h6M9 9h1',
    'percent':    'M19 5L5 19M6.5 6.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5zM17.5 12.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5z',
  };
  const d = paths[name];
  if (!d) return null;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round">
      <path d={d}/>
    </svg>
  );
}

const NAV = [
  { sec: 'Asosiy', items: [
    { id: 'dashboard',  ic: 'home',     lbl: 'Bosh sahifa' },
    { id: 'analytics',  ic: 'chart',    lbl: 'Analitika' },
    { id: 'calendar',   ic: 'calendar', lbl: 'Kalendar' },
  ]},
  { sec: 'Operatsiyalar', items: [
    { id: 'orders',     ic: 'package',   lbl: 'Buyurtmalar', bdg: 24 },
    { id: 'tracking',   ic: 'route',     lbl: 'Kuzatuv (detail)' },
    { id: 'fleets',     ic: 'plus',      lbl: 'Yangi buyurtma' },
    { id: 'warehouse',  ic: 'warehouse', lbl: 'Ombor' },
    { id: 'drivers',    ic: 'users',     lbl: 'Haydovchilar' },
    { id: 'pos',        ic: 'wallet',    lbl: 'POS Monitor' },
  ]},
  { sec: 'CRM & Moliya', items: [
    { id: 'kanban',     ic: 'briefcase', lbl: 'CRM Pipeline' },
    { id: 'invoices',   ic: 'doc',       lbl: 'Hisob-faktura & toʻlov' },
  ]},
  { sec: 'HR', items: [
    { id: 'employee',   ic: 'users',     lbl: 'Xodim profili' },
  ]},
  { sec: 'Tizim', items: [
    { id: 'messages',   ic: 'message',   lbl: 'Xabarlar', bdg: 19, bdgMuted: true },
    { id: 'notif',      ic: 'bell',      lbl: 'Bildirishnomalar', bdg: 5 },
    { id: 'settings',   ic: 'cog',       lbl: 'Sozlamalar' },
  ]},
];

function Sidebar({ active, onChange }) {
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <img src="../../assets/europrint-logo-full.png" alt="EuroPrint"/>
      </div>

      <div className="sb-user">
        <div className="av">AK</div>
        <div>
          <div className="who">Alisher Karimov</div>
          <div className="who-sub">Super Admin</div>
        </div>
        <span className="chev"><Icon name="chev-dn" size={14}/></span>
      </div>

      <nav className="sb-nav">
        {NAV.map(g => (
          <React.Fragment key={g.sec}>
            <div className="sb-section">{g.sec}</div>
            {g.items.map(it => (
              <div key={it.id}
                   className={'sb-item' + (it.id === active ? ' active' : '')}
                   onClick={() => onChange(it.id)}>
                <span className="sb-ic"><Icon name={it.ic} size={17}/></span>
                <span>{it.lbl}</span>
                {it.bdg && <span className={'sb-bdg' + (it.bdgMuted ? ' muted' : '')}>{it.bdg}</span>}
              </div>
            ))}
          </React.Fragment>
        ))}
      </nav>

      <div className="sb-promo">
        <h5>EuroPrint Pro <br/>imkoniyatlari?</h5>
        <p>AI-prognoz, realtime IoT va kengaytirilgan hisobotlar uchun Pro versiyaga oʻting.</p>
        <button>Pro versiya</button>
      </div>
    </aside>
  );
}

function Topbar({ greet, title, breadcrumb, actions }) {
  return (
    <header className="topbar">
      <div>
        {greet && <div className="greet">{greet}</div>}
        {title && <h1 className="page-title">{title}</h1>}
        {breadcrumb && <div className="page-bc">{breadcrumb}</div>}
      </div>
      <div className="search-box">
        <Icon name="search" size={15}/>
        <input placeholder="Buyurtma, mijoz, hujjat qidirish…"/>
      </div>
      <div className="tb-actions">
        <button className="ibtn"><Icon name="message" size={17}/><span className="dot"></span></button>
        <button className="ibtn"><Icon name="bell" size={17}/><span className="dot"></span></button>
        {actions}
      </div>
    </header>
  );
}

/* Count-up hook */
function useCountUp(target, { duration = 1100, decimals = 0 } = {}) {
  const [v, setV] = React.useState(0);
  React.useEffect(() => {
    const t0 = performance.now();
    let raf;
    const tick = (t) => {
      const p = Math.min(1, (t - t0) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setV(target * eased);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return decimals === 0 ? Math.round(v) : Number(v.toFixed(decimals));
}

window.Icon = Icon;
window.Sidebar = Sidebar;
window.Topbar = Topbar;
window.useCountUp = useCountUp;
