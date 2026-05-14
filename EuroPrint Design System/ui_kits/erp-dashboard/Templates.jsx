/* Templates.jsx — Universal page templates
   ---------------------------------------------
   Har bir 260 sahifa shu 5 ta shablondan birini ishlatadi:

     1. ListPage      — CRUD ro'yxat (xodimlar, mijozlar, mahsulotlar, ...)
     2. DetailPage    — yagona yozuv (buyurtma, mijoz tafsiloti, ...)
     3. FormPage      — yaratish/tahrirlash
     4. SettingsPage  — sozlamalar (chap menyu + o'ng kontent)
     5. EmptyState    — ma'lumot yo'q

   Har bir shablon Sidebar + Topbar + bir xil komponentlar (card, btn, pill,
   tbl, kpi, …) ishlatadi. Yangi modul = yangi PROPS, yangi dizayn EMAS.
*/

/* ================================================================= */
/*  1) LIST PAGE — eng ko'p ishlatiladigan shablon (~60% sahifalar)  */
/* ================================================================= */
function ListPage({ title, breadcrumb, kpis, columns, rows, statusKey = 'status', statusMap, primaryAction }) {
  const [tab, setTab] = React.useState('all');
  const tabs = [
    { id: 'all',      label: 'Hammasi',    n: rows.length },
    { id: 'active',   label: 'Faol',       n: rows.filter(r => r[statusKey] === 'active' || r[statusKey] === 'progress').length },
    { id: 'pending',  label: 'Kutilmoqda', n: rows.filter(r => r[statusKey] === 'new' || r[statusKey] === 'pending').length },
    { id: 'closed',   label: 'Yopilgan',   n: rows.filter(r => r[statusKey] === 'done' || r[statusKey] === 'closed').length },
  ];
  const filtered = rows.filter(r => {
    if (tab === 'all') return true;
    if (tab === 'active')  return r[statusKey] === 'active'  || r[statusKey] === 'progress';
    if (tab === 'pending') return r[statusKey] === 'new'     || r[statusKey] === 'pending';
    if (tab === 'closed')  return r[statusKey] === 'done'    || r[statusKey] === 'closed';
    return true;
  });

  return (
    <div data-screen-label={'LIST · ' + title}>
      <Topbar title={title} breadcrumb={breadcrumb}
        actions={
          <>
            <button className="btn btn-secondary"><Icon name="doc" size={14}/> Eksport</button>
            <button className="btn btn-primary"><Icon name="plus" size={14}/> {primaryAction || 'Yangi qoʻshish'}</button>
          </>
        }
      />

      <div className="page">
        {/* Mini KPI row */}
        {kpis && (
          <div className="kpi-grid" style={{ marginBottom: 16 }}>
            {kpis.map(k => (
              <KpiCard key={k.label} {...k}/>
            ))}
          </div>
        )}

        {/* Card with tabs, search/filter row, table, pagination */}
        <div className="card hover-lift">
          <div style={{ padding: '4px 22px 0', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', borderBottom: '1px solid var(--line-warm)', flexWrap: 'wrap', gap: 12 }}>
            <div className="tabs" style={{ marginBottom: 0, padding: 0, border: 'none' }}>
              {tabs.map(t => (
                <button key={t.id} className={'tab' + (tab === t.id ? ' active' : '')} onClick={() => setTab(t.id)}>
                  {t.label} <span style={{ color: 'var(--fg2)', fontWeight: 500, marginLeft: 4 }}>· {t.n}</span>
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 8, paddingBottom: 14 }}>
              <div className="search-box" style={{ height: 36, width: 240 }}>
                <Icon name="search" size={14}/>
                <input placeholder="Qidirish…"/>
              </div>
              <button className="btn btn-secondary btn-sm"><Icon name="filter" size={13}/> Filter</button>
            </div>
          </div>

          <table className="tbl">
            <thead>
              <tr>
                <th style={{ width: 32 }}><input type="checkbox"/></th>
                {columns.map(c => <th key={c.key} style={c.headStyle}>{c.label}</th>)}
                <th style={{ width: 60 }}></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r, i) => (
                <tr key={r.id || i}>
                  <td><input type="checkbox"/></td>
                  {columns.map(c => (
                    <td key={c.key} style={c.cellStyle}>
                      {c.render
                        ? c.render(r, { statusMap })
                        : c.key === statusKey
                          ? (statusMap && statusMap[r[c.key]]) || r[c.key]
                          : r[c.key]}
                    </td>
                  ))}
                  <td style={{ textAlign: 'right' }}>
                    <button className="ibtn" style={{ width: 32, height: 32, borderRadius: 9 }}><Icon name="more" size={14}/></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 22px', borderTop: '1px solid var(--line-warm-dim)' }}>
            <div style={{ fontSize: 12, color: 'var(--fg2)' }}>Koʻrsatilmoqda <b style={{ color: 'var(--fg1)' }}>1–{filtered.length}</b> / {rows.length}</div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button className="btn btn-sm btn-secondary">‹</button>
              <button className="btn btn-sm" style={{ background: 'var(--ep-primary)', color: '#fff' }}>1</button>
              <button className="btn btn-sm btn-secondary">2</button>
              <button className="btn btn-sm btn-secondary">3</button>
              <button className="btn btn-sm btn-secondary">…</button>
              <button className="btn btn-sm btn-secondary">›</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ================================================================= */
/*  2) DETAIL PAGE — yagona yozuvni ko'rish (~25% sahifalar)         */
/* ================================================================= */
function DetailPage({ title, subtitle, breadcrumb, status, statusCls = 'success', meta, sections, sidePanel }) {
  const [tab, setTab] = React.useState(0);
  return (
    <div data-screen-label={'DETAIL · ' + title}>
      <Topbar
        breadcrumb={breadcrumb}
        title={
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 14 }}>
            {title}
            <span className={'pill ' + statusCls} style={{ fontSize: 12 }}>{status}</span>
          </span>
        }
        actions={
          <>
            <button className="btn btn-secondary"><Icon name="edit" size={13}/> Tahrirlash</button>
            <button className="btn btn-secondary"><Icon name="doc" size={13}/> Chop etish</button>
            <button className="btn btn-primary"><Icon name="check" size={13}/> Tasdiqlash</button>
          </>
        }
      />

      <div className="page">
        {/* Hero meta strip */}
        {meta && (
          <div className="card hover-lift" style={{ padding: '18px 22px', marginBottom: 16, display: 'grid', gridTemplateColumns: `repeat(${meta.length}, 1fr)`, gap: 22 }}>
            {meta.map((m, i) => (
              <div key={i} style={{ borderLeft: i > 0 ? '1px solid var(--line-warm)' : 'none', paddingLeft: i > 0 ? 22 : 0 }}>
                <div style={{ fontSize: 11.5, color: 'var(--fg2)', textTransform: 'uppercase', letterSpacing: .5, fontWeight: 600 }}>{m.label}</div>
                <div style={{ fontSize: 18, fontWeight: 700, marginTop: 4, letterSpacing: '-.01em' }}>{m.value}</div>
                {m.sub && <div style={{ fontSize: 11.5, color: 'var(--fg2)', marginTop: 2 }}>{m.sub}</div>}
              </div>
            ))}
          </div>
        )}

        <div className="grid-2-1">
          {/* Main column */}
          <div>
            <div className="card hover-lift">
              <div className="tabs" style={{ padding: '12px 22px 0', border: 'none' }}>
                {['Umumiy maʼlumot', 'Hujjatlar', 'Tarix', 'Sharhlar'].map((t, i) => (
                  <button key={t} className={'tab' + (i === tab ? ' active' : '')} onClick={() => setTab(i)}>{t}</button>
                ))}
              </div>
              <div style={{ borderTop: '1px solid var(--line-warm)' }}>
                {(sections || []).map((s, i) => (
                  <div key={s.title} style={{ padding: '18px 22px', borderBottom: i < sections.length - 1 ? '1px solid var(--line-warm-dim)' : 'none' }}>
                    <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12, color: 'var(--fg1)' }}>{s.title}</div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: '12px 32px' }}>
                      {s.fields.map(f => (
                        <div key={f.label} style={{ display: 'grid', gridTemplateColumns: '160px 1fr', gap: 12, alignItems: 'baseline' }}>
                          <span style={{ fontSize: 12.5, color: 'var(--fg2)' }}>{f.label}</span>
                          <span style={{ fontSize: 13, fontWeight: 500 }}>{f.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Side panel */}
          <div>{sidePanel}</div>
        </div>
      </div>
    </div>
  );
}

/* ================================================================= */
/*  3) FORM PAGE — yaratish / tahrirlash                              */
/* ================================================================= */
function FormField({ label, hint, required, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--fg1)' }}>
        {label} {required && <span style={{ color: 'var(--accent-coral)' }}>*</span>}
      </label>
      {children}
      {hint && <span style={{ fontSize: 11, color: 'var(--fg2)' }}>{hint}</span>}
    </div>
  );
}
function FormInput(props) {
  return <input {...props} style={{
    padding: '10px 14px', border: '1px solid var(--line-warm)', borderRadius: 10,
    background: '#fff', color: 'var(--fg1)', fontSize: 13, fontFamily: 'inherit',
    outline: 'none', width: '100%', boxSizing: 'border-box',
    ...props.style,
  }}/>;
}

function FormPage({ title, breadcrumb, groups }) {
  return (
    <div data-screen-label={'FORM · ' + title}>
      <Topbar
        breadcrumb={breadcrumb}
        title={title}
        actions={
          <>
            <button className="btn btn-secondary">Bekor qilish</button>
            <button className="btn btn-secondary">Qoralama saqlash</button>
            <button className="btn btn-primary"><Icon name="check" size={13}/> Saqlash & yuborish</button>
          </>
        }
      />

      <div className="page">
        <div className="grid-2-1">
          <div className="row-gap">
            {groups.map((g, gi) => (
              <div key={g.title} className="card hover-lift">
                <div className="card-head" style={{ padding: '18px 22px 8px' }}>
                  <div>
                    <div className="card-ttl">{g.title}</div>
                    {g.sub && <div style={{ fontSize: 12, color: 'var(--fg2)', marginTop: 3 }}>{g.sub}</div>}
                  </div>
                </div>
                <div className="card-body" style={{ padding: '8px 22px 22px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: g.columns === 1 ? '1fr' : 'repeat(2,1fr)', gap: '18px 22px' }}>
                    {g.fields.map(f => (
                      <FormField key={f.label} label={f.label} hint={f.hint} required={f.required}>
                        {f.type === 'textarea'
                          ? <textarea rows={f.rows || 3} placeholder={f.placeholder} defaultValue={f.value} style={{ padding: '10px 14px', border: '1px solid var(--line-warm)', borderRadius: 10, background: '#fff', fontSize: 13, fontFamily: 'inherit', outline: 'none', resize: 'vertical' }}/>
                          : f.type === 'select'
                          ? <select defaultValue={f.value} style={{ padding: '10px 14px', border: '1px solid var(--line-warm)', borderRadius: 10, background: '#fff', fontSize: 13, fontFamily: 'inherit', outline: 'none' }}>
                              {(f.options || []).map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                            </select>
                          : <FormInput type={f.type || 'text'} placeholder={f.placeholder} defaultValue={f.value}/>
                        }
                      </FormField>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Side hint panel */}
          <div className="row-gap">
            <div className="card hover-lift">
              <div className="card-head" style={{ padding: '18px 22px 10px' }}>
                <div className="card-ttl">Maslahat</div>
              </div>
              <div className="card-body" style={{ padding: '0 22px 22px' }}>
                <ul style={{ paddingLeft: 18, margin: 0, fontSize: 12.5, color: 'var(--fg2)', lineHeight: 1.65 }}>
                  <li>★ majburiy maydonlarni toʻldiring.</li>
                  <li>Hujjatlarni PDF/JPG koʻrinishida yuklang (max 10 MB).</li>
                  <li>Saqlashdan oldin tekshiring — saqlangach yuboriladi.</li>
                </ul>
              </div>
            </div>
            <div className="card hover-lift" style={{ background: '#15171A', borderColor: '#15171A', color: '#fff' }}>
              <div style={{ padding: '20px 22px' }}>
                <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 6 }}>Avtomatik saqlash</div>
                <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,.55)', marginBottom: 12 }}>Har 30 soniyada qoralamani saqlaymiz.</div>
                <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,.85)', fontFamily: 'var(--font-mono)' }}>Oxirgi: 14:23:45</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ================================================================= */
/*  4) SETTINGS PAGE — chap menyu + o'ng kontent                      */
/* ================================================================= */
function SettingsPage() {
  const [section, setSection] = React.useState('profile');
  const groups = [
    { sec: 'Hisob', items: [
      { id: 'profile',  ic: 'users',   lbl: 'Profil' },
      { id: 'security', ic: 'shield',  lbl: 'Xavfsizlik' },
      { id: 'notif',    ic: 'bell',    lbl: 'Bildirishnomalar' },
    ]},
    { sec: 'Tashkilot', items: [
      { id: 'company',  ic: 'briefcase', lbl: 'Kompaniya' },
      { id: 'team',     ic: 'users',     lbl: 'Jamoa & ruxsatlar' },
      { id: 'billing',  ic: 'cash',      lbl: 'Toʻlov & obuna' },
    ]},
    { sec: 'Integratsiya', items: [
      { id: 'api',      ic: 'cog',     lbl: 'API kalitlar' },
      { id: 'webhook',  ic: 'globe',   lbl: 'Webhook' },
      { id: 'telegram', ic: 'message', lbl: 'Telegram bot' },
    ]},
  ];
  return (
    <div data-screen-label="SETTINGS · Sozlamalar">
      <Topbar title="Sozlamalar" breadcrumb={<><b>Dashboard</b> &nbsp;/&nbsp; Sozlamalar</>}/>

      <div className="page">
        <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: 16 }}>
          {/* Left mini-nav */}
          <div className="card" style={{ padding: 10, alignSelf: 'start' }}>
            {groups.map(g => (
              <div key={g.sec}>
                <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--fg3)', letterSpacing: .8, padding: '12px 10px 6px', textTransform: 'uppercase' }}>{g.sec}</div>
                {g.items.map(it => (
                  <div key={it.id}
                       className={'sb-item' + (section === it.id ? ' active' : '')}
                       style={{ margin: 0, paddingLeft: 12, paddingRight: 12 }}
                       onClick={() => setSection(it.id)}>
                    <span className="sb-ic"><Icon name={it.ic} size={15}/></span>
                    <span>{it.lbl}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>

          {/* Right content */}
          <div className="row-gap">
            <div className="card hover-lift">
              <div className="card-head">
                <div>
                  <div className="card-ttl">Profil maʼlumotlari</div>
                  <div style={{ fontSize: 12, color: 'var(--fg2)', marginTop: 3 }}>Bu maʼlumotlar boshqa xodimlarga koʻrinadi.</div>
                </div>
              </div>
              <div className="card-body" style={{ display: 'flex', gap: 22 }}>
                <div style={{ width: 96, height: 96, borderRadius: '50%', background: 'linear-gradient(135deg, #FF902F, #EE6A1B)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, fontWeight: 800, flexShrink: 0 }}>AK</div>
                <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: '18px 22px' }}>
                  <FormField label="Ism" required><FormInput defaultValue="Alisher"/></FormField>
                  <FormField label="Familiya" required><FormInput defaultValue="Karimov"/></FormField>
                  <FormField label="Lavozim"><FormInput defaultValue="Super Admin"/></FormField>
                  <FormField label="Boʻlim"><FormInput defaultValue="Boshqaruv"/></FormField>
                  <FormField label="Elektron pochta" required><FormInput type="email" defaultValue="alisher@europrint.uz"/></FormField>
                  <FormField label="Telefon"><FormInput defaultValue="+998 90 123 45 67"/></FormField>
                </div>
              </div>
            </div>

            <div className="card hover-lift">
              <div className="card-head">
                <div className="card-ttl">Bildirishnomalar</div>
              </div>
              <div className="card-body" style={{ paddingTop: 0 }}>
                {[
                  { ttl: 'Yangi buyurtma kelganda', sub: 'Email + ilovada bildirish', on: true },
                  { ttl: 'Buyurtma kechiksa',       sub: 'Telegram + ilovada',         on: true },
                  { ttl: 'Hisobot tayyor boʻlsa',   sub: 'Email',                       on: false },
                  { ttl: 'Tizim yangilanishi',      sub: 'Faqat ilovada',               on: true },
                ].map(t => (
                  <div key={t.ttl} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 0', borderBottom: '1px solid var(--line-warm-dim)' }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{t.ttl}</div>
                      <div style={{ fontSize: 11.5, color: 'var(--fg2)', marginTop: 2 }}>{t.sub}</div>
                    </div>
                    <div style={{ width: 44, height: 24, background: t.on ? 'var(--ep-primary)' : '#E5D9D3', borderRadius: 12, position: 'relative', cursor: 'pointer', transition: 'background .2s' }}>
                      <div style={{ width: 18, height: 18, borderRadius: '50%', background: '#fff', position: 'absolute', top: 3, left: t.on ? 23 : 3, transition: 'left .2s', boxShadow: '0 1px 3px rgba(0,0,0,.15)' }}/>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button className="btn btn-secondary">Bekor qilish</button>
              <button className="btn btn-primary"><Icon name="check" size={13}/> Oʻzgarishlarni saqlash</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ================================================================= */
/*  5) EMPTY STATE — ma'lumot yo'q                                    */
/* ================================================================= */
function EmptyStatePage({ title, breadcrumb, icon = 'package', emptyTitle, emptyText, ctaLabel }) {
  return (
    <div data-screen-label={'EMPTY · ' + title}>
      <Topbar title={title} breadcrumb={breadcrumb}
        actions={<button className="btn btn-primary"><Icon name="plus" size={14}/> {ctaLabel || 'Yangi qoʻshish'}</button>}
      />

      <div className="page">
        <div className="card hover-lift" style={{ padding: '60px 22px', textAlign: 'center' }}>
          <div style={{ width: 120, height: 120, margin: '0 auto 22px', borderRadius: 28, background: 'linear-gradient(135deg, var(--bg-blush) 0%, var(--accent-coral-soft) 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ep-primary)', boxShadow: 'inset 0 0 0 1px var(--line-warm)' }}>
            <Icon name={icon} size={56} stroke={1.4}/>
          </div>
          <h2 style={{ fontSize: 22, fontWeight: 800, margin: '0 0 8px', letterSpacing: '-.01em' }}>{emptyTitle || 'Hali maʼlumot yoʻq'}</h2>
          <p style={{ fontSize: 14, color: 'var(--fg2)', maxWidth: 460, margin: '0 auto 24px', lineHeight: 1.55 }}>{emptyText || 'Birinchi yozuvni qoʻshib boshlang. Yaratish oson va bir necha daqiqada tugaydi.'}</p>
          <div style={{ display: 'inline-flex', gap: 10 }}>
            <button className="btn btn-secondary"><Icon name="doc" size={13}/> Excel'dan import</button>
            <button className="btn btn-primary"><Icon name="plus" size={13}/> {ctaLabel || 'Yangi qoʻshish'}</button>
          </div>
        </div>
      </div>
    </div>
  );
}

window.ListPage = ListPage;
window.DetailPage = DetailPage;
window.FormPage = FormPage;
window.SettingsPage = SettingsPage;
window.EmptyStatePage = EmptyStatePage;
window.FormField = FormField;
window.FormInput = FormInput;
