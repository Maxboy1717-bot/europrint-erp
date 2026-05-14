/* AnalyticsPage — top countries / top companies / busy heatmap / shipment stats
   WarehousePage — SKU stats, inventory bars, floor map, package status, activity log
*/

function AnalyticsPage() {
  const c_total = useCountUp(1284);
  const c_road  = useCountUp(1150);
  const c_ocean = useCountUp(425);
  const c_rail  = useCountUp(225);
  const c_air   = useCountUp(700);
  const fmt = (n) => n.toLocaleString('en-US');

  // 12-month busy periods heatmap (12 cols × 7 rows)
  const heat = Array.from({ length: 84 }, () => Math.random());

  return (
    <div data-screen-label="02 Analytics">
      <Topbar
        title="Analitika"
        breadcrumb={<><b>Dashboard</b> &nbsp;/&nbsp; Analitika</>}
        actions={
          <div className="seg" style={{ marginLeft: 8 }}>
            <button>Kun</button>
            <button>Hafta</button>
            <button className="active">Oy</button>
            <button>Yil</button>
          </div>
        }
      />

      <div className="page">
        {/* Top KPI row */}
        <div className="kpi-grid">
          <KpiCard label="Jami buyurtmalar"   value={fmt(c_total)} delta="8.7%"  deltaTrend="up" icon="package" iconBg="var(--ep-primary)"/>
          <KpiCard label="Yer transporti"     value={fmt(c_road)}  delta="4.37%" deltaTrend="up" icon="truck"   iconBg="#15171A"/>
          <KpiCard label="Havo yetkazish"     value={fmt(c_air)}   delta="3.45%" deltaTrend="up" icon="package" iconBg="var(--accent-coral)"/>
          <KpiCard label="Temir yoʻl"         value={fmt(c_rail)}  delta="1.28%" deltaTrend="dn" icon="route"   iconBg="#7A4FB1"/>
        </div>

        {/* Delivery time chart full width */}
        <div className="card hover-lift" style={{ marginBottom: 16 }}>
          <div className="card-head">
            <div>
              <div className="card-ttl">Oʻrtacha yetkazish vaqti</div>
              <div style={{ fontSize: 12, color: 'var(--fg2)', marginTop: 3 }}>
                <span style={{ fontSize: 22, fontWeight: 800, color: 'var(--fg1)', letterSpacing: '-.01em' }}>3.12 kun</span>
                <span style={{ color: 'var(--ep-green)', fontWeight: 600, marginLeft: 8 }}>↓ 0.85% tezroq</span>
              </div>
            </div>
            <div className="seg">
              <button>3 oy</button>
              <button>6 oy</button>
              <button className="active">Bu yil</button>
            </div>
          </div>
          <div className="card-body" style={{ paddingBottom: 32 }}>
            <BarChart
              calloutIndex={8}
              data={[
                { label:'Yan', a:42 }, { label:'Fev', a:58 }, { label:'Mar', a:46 },
                { label:'Apr', a:72 }, { label:'May', a:62 }, { label:'Iyn', a:80 },
                { label:'Iyl', a:55 }, { label:'Avg', a:68 }, { label:'Sen', a:96 },
                { label:'Okt', a:74 }, { label:'Noy', a:62 }, { label:'Dek', a:58 },
              ]}
            />
          </div>
        </div>

        {/* Top countries + top companies */}
        <div className="grid-1-1" style={{ marginBottom: 16 }}>
          <div className="card hover-lift">
            <div className="card-head">
              <div className="card-ttl">Eng faol viloyatlar</div>
              <button className="card-act"><Icon name="dots" size={14}/></button>
            </div>
            <div style={{ padding: '4px 22px 18px' }}>
              {[
                { name: 'Toshkent shahri',    flag: '🇺🇿', qty: 950, pct: '38%' },
                { name: 'Samarqand viloyati', flag: '🇺🇿', qty: 550, pct: '22%' },
                { name: 'Buxoro viloyati',    flag: '🇺🇿', qty: 380, pct: '15%' },
                { name: 'Fargʻona viloyati',  flag: '🇺🇿', qty: 290, pct: '12%' },
                { name: 'Andijon viloyati',   flag: '🇺🇿', qty: 210, pct:  '8%' },
              ].map((r, i) => (
                <div key={r.name} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '10px 0', borderBottom: i < 4 ? '1px solid var(--line-warm-dim)' : 'none' }}>
                  <div style={{ width: 32, height: 32, borderRadius: 9, background: 'var(--bg-blush-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>{r.flag}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{r.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--fg2)' }}>{r.qty} yetkazish</div>
                  </div>
                  <div style={{ width: 110 }}>
                    <div className="pbar"><i style={{ width: r.pct, animationDelay: (.08 * i) + 's' }}/></div>
                  </div>
                  <div style={{ width: 36, textAlign: 'right', fontWeight: 700, fontSize: 13 }}>{r.pct}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="card hover-lift">
            <div className="card-head">
              <div className="card-ttl">Eng yirik mijozlar</div>
              <button className="card-act"><Icon name="dots" size={14}/></button>
            </div>
            <div style={{ padding: '4px 22px 18px' }}>
              {[
                { name: 'Korzinka Online',  type: 'E-commerce',       qty: 620, color: '#FF902F' },
                { name: 'Artel Electronics',type: 'Ishlab chiqarish', qty: 480, color: '#15171A' },
                { name: 'Uzum Market',      type: 'Marketplace',      qty: 410, color: '#7A4FB1' },
                { name: 'Beeline',          type: 'Telekom',          qty: 320, color: '#E94560' },
                { name: 'Davr Mobile',      type: 'Riteyl',           qty: 290, color: '#2E8A5A' },
              ].map((r, i) => (
                <div key={r.name} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '10px 0', borderBottom: i < 4 ? '1px solid var(--line-warm-dim)' : 'none' }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: r.color, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700 }}>{r.name[0]}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{r.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--fg2)' }}>{r.type}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 13 }}>{r.qty}</div>
                    <div style={{ fontSize: 10.5, color: 'var(--fg2)' }}>buyurtma</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Heatmap + Donut */}
        <div className="grid-2-1">
          <div className="card hover-lift">
            <div className="card-head">
              <div>
                <div className="card-ttl">Band soatlar</div>
                <div style={{ fontSize: 12, color: 'var(--fg2)', marginTop: 3 }}>Eng faol vaqt: <b style={{ color: 'var(--fg1)' }}>12:00 – 15:00</b></div>
              </div>
              <div className="seg">
                <button>Hafta</button>
                <button className="active">Oy</button>
              </div>
            </div>
            <div style={{ padding: '6px 22px 22px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(24, 1fr)', gap: 4 }}>
                {heat.map((v, i) => {
                  // hot zone in middle-day (cols 6–14)
                  const col = i % 24;
                  const row = Math.floor(i / 24);
                  const hot = col >= 6 && col <= 14;
                  const intensity = hot ? Math.min(1, v + .35) : v * .8;
                  let bg = '#F3E6E1';
                  if (intensity > .85) bg = '#15171A';
                  else if (intensity > .7) bg = 'var(--ep-primary)';
                  else if (intensity > .5) bg = 'var(--accent-coral)';
                  else if (intensity > .3) bg = 'rgba(255,144,47,.45)';
                  else                     bg = 'rgba(255,144,47,.18)';
                  return <div key={i} style={{ aspectRatio: '1', borderRadius: 4, background: bg }}/>;
                })}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12, fontSize: 11, color: 'var(--fg2)', fontFamily: 'var(--font-mono)' }}>
                <span>12 AM</span><span>6 AM</span><span>12 PM</span><span>6 PM</span><span>11 PM</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 14, justifyContent: 'flex-end' }}>
                <span style={{ fontSize: 11, color: 'var(--fg2)' }}>Kam</span>
                {['rgba(255,144,47,.18)','rgba(255,144,47,.45)','var(--accent-coral)','var(--ep-primary)','#15171A'].map(c => (
                  <span key={c} style={{ width: 14, height: 14, borderRadius: 3, background: c }}/>
                ))}
                <span style={{ fontSize: 11, color: 'var(--fg2)' }}>Koʻp</span>
              </div>
            </div>
          </div>

          <div className="card hover-lift">
            <div className="card-head">
              <div className="card-ttl">Transport ulushi</div>
              <button className="card-act"><Icon name="dots" size={14}/></button>
            </div>
            <div className="donut-wrap">
              <Donut size={170} thickness={26}
                segments={[
                  { value: 46, color: 'var(--ep-primary)' },
                  { value: 17, color: 'var(--accent-coral)' },
                  { value: 28, color: '#15171A' },
                  { value:  9, color: '#E5D9D3' },
                ]}
                centerLabel="Jami"
                centerValue={fmt(c_total)}
              />
            </div>
            <div className="donut-legend">
              {[
                { color:'var(--ep-primary)',   name:'Yer',     qty: c_road,  pct:'46%' },
                { color:'var(--accent-coral)', name:'Havo',    qty: c_air,   pct:'17%' },
                { color:'#15171A',             name:'Dengiz',  qty: c_ocean, pct:'28%' },
                { color:'#E5D9D3',             name:'Temir yoʻl', qty: c_rail, pct:'9%' },
              ].map(s => (
                <div key={s.name} className="donut-leg-row">
                  <span className="swatch" style={{ background: s.color }}/>
                  <span className="name">{s.name}</span>
                  <span className="qty">{fmt(s.qty)} ta</span>
                  <span className="pct">{s.pct}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ==================== WAREHOUSE PAGE ==================== */
function WarehousePage() {
  const c_sku = useCountUp(285);
  const c_qty = useCountUp(12450);
  const c_cap = useCountUp(62.5, { decimals: 1 });

  return (
    <div data-screen-label="03 Warehouse">
      <Topbar
        title="Ombor"
        breadcrumb={<><b>Dashboard</b> &nbsp;/&nbsp; Ombor</>}
        actions={
          <div className="seg" style={{ marginLeft: 8 }}>
            <button className="active"><Icon name="truck" size={13}/> Yer</button>
            <button><Icon name="route" size={13}/> Temir yoʻl</button>
            <button>Havo</button>
          </div>
        }
      />

      <div className="page">
        {/* Top KPIs (3-up) */}
        <div className="kpi-grid cols-3" style={{ marginBottom: 16 }}>
          <KpiCard label="Jami SKU"        value={c_sku.toString()}    delta="2.56%" deltaTrend="up" icon="package"   iconBg="var(--ep-primary)"/>
          <KpiCard label="Qoldiq miqdori"  value={c_qty.toLocaleString('en-US')} suffix=" dona" delta="4.37%" deltaTrend="up" icon="warehouse" iconBg="#15171A"/>
          <KpiCard label="Sigʻim ishlatish" value={c_cap}                suffix="%"  delta="1.54%" deltaTrend="up" icon="chart"     iconBg="var(--accent-coral)"/>
        </div>

        {/* Inventory bars + Capacity donut */}
        <div className="grid-2-1" style={{ marginBottom: 16 }}>
          <div className="card hover-lift">
            <div className="card-head">
              <div>
                <div className="card-ttl">Ombor inventari</div>
                <div style={{ fontSize: 12, color: 'var(--fg2)', marginTop: 3 }}>
                  <span style={{ fontSize: 22, fontWeight: 800, color: 'var(--fg1)' }}>10,000</span>
                  <span style={{ marginLeft: 6 }}>paket toifa boʻyicha</span>
                </div>
              </div>
              <button className="card-act"><Icon name="dots" size={14}/></button>
            </div>
            <div className="card-body">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 18 }}>
                {[
                  { name: 'Bosma',     pct: 25, qty: 2500 },
                  { name: 'Qadoqlash', pct: 20, qty: 2000 },
                  { name: 'Reklama',   pct: 18, qty: 1800 },
                  { name: 'Stikerlar', pct: 15, qty: 1500 },
                  { name: 'Maxsus',    pct: 12, qty: 1200 },
                ].map((c, i) => (
                  <div key={c.name} style={{ textAlign:'center' }}>
                    <div style={{ height: 140, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', marginBottom: 10 }}>
                      <div className="bar solid stripe" style={{
                        width: 44,
                        height: (c.pct / 25 * 130) + 'px',
                        background: i === 0
                          ? 'repeating-linear-gradient(-45deg, var(--ep-primary) 0 5px, var(--ep-primary-dark) 5px 10px)'
                          : i === 1
                          ? 'repeating-linear-gradient(-45deg, #15171A 0 5px, #2A2D33 5px 10px)'
                          : i === 2
                          ? 'repeating-linear-gradient(-45deg, var(--accent-coral) 0 5px, #C73450 5px 10px)'
                          : i === 3
                          ? 'repeating-linear-gradient(-45deg, #E5D9D3 0 5px, #D4C7BF 5px 10px)'
                          : 'repeating-linear-gradient(-45deg, #7A4FB1 0 5px, #5E3E89 5px 10px)',
                        animationDelay: (.05 * i) + 's',
                      }}/>
                    </div>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>{c.pct}%</div>
                    <div style={{ fontSize: 11.5, color: 'var(--fg2)', marginTop: 2, fontFamily: 'var(--font-mono)' }}>{c.qty.toLocaleString('en-US')}</div>
                    <div style={{ fontSize: 12, fontWeight: 600, marginTop: 4 }}>{c.name}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="card hover-lift" style={{ background: '#15171A', borderColor: '#15171A', color: '#fff' }}>
            <div className="card-head" style={{ borderColor: 'rgba(255,255,255,.08)' }}>
              <div style={{ color: '#fff' }} className="card-ttl">Sigʻim ishlatish</div>
              <button className="card-act" style={{ background: 'transparent', borderColor: 'rgba(255,255,255,.15)', color: 'rgba(255,255,255,.65)' }}><Icon name="dots" size={14}/></button>
            </div>
            <div className="donut-wrap">
              <svg width="170" height="170" viewBox="0 0 170 170" style={{ transform: 'rotate(-90deg)' }}>
                <circle cx="85" cy="85" r="70" fill="none" stroke="#2A2D33" strokeWidth="22"/>
                <circle cx="85" cy="85" r="70" fill="none" stroke="var(--ep-primary)" strokeWidth="22" strokeDasharray={2 * Math.PI * 70 * 0.625 + ' ' + 2 * Math.PI * 70} strokeLinecap="round" style={{ animation: 'ep-fade-in 1s var(--ease-out-soft) backwards' }}/>
              </svg>
              <div className="donut-center" style={{ width: 170 }}>
                <div className="lbl" style={{ color: 'rgba(255,255,255,.6)' }}>Jami</div>
                <div className="val" style={{ color: '#fff' }}>{c_cap}%</div>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0 22px 22px' }}>
              <div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,.55)' }}>Band</div>
                <div style={{ fontSize: 18, fontWeight: 700, marginTop: 3 }}>40 javon</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,.55)' }}>Boʻsh</div>
                <div style={{ fontSize: 18, fontWeight: 700, marginTop: 3 }}>24 javon</div>
              </div>
            </div>
          </div>
        </div>

        {/* Storage list + Package status */}
        <div className="grid-2-1" style={{ marginBottom: 16 }}>
          <div className="card hover-lift">
            <div className="card-head">
              <div className="card-ttl">Ombor saqlash</div>
              <button className="card-act"><Icon name="filter" size={13}/> Filter</button>
            </div>
            <table className="tbl">
              <thead>
                <tr>
                  <th style={{ width: 50 }}>Qavat</th>
                  <th>Boʻlim</th>
                  <th>Toifa</th>
                  <th>Foiz</th>
                  <th style={{ textAlign: 'right' }}>Boʻsh joy</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { f: 1, sec: 'A1 – A10', cat: 'Bosma',      pct: 80, free: '20/100' },
                  { f: 2, sec: 'B1 – B10', cat: 'Qadoqlash',  pct: 60, free: '40/100' },
                  { f: 1, sec: 'C1 – C10', cat: 'Reklama',    pct: 90, free: '10/100' },
                  { f: 3, sec: 'D1 – D10', cat: 'Stikerlar',  pct: 50, free: '50/100' },
                  { f: 2, sec: 'E1 – E10', cat: 'Maxsus',     pct: 70, free: '30/100' },
                ].map((r, i) => (
                  <tr key={r.sec}>
                    <td><b>{r.f}</b></td>
                    <td style={{ fontFamily: 'var(--font-mono)' }}>{r.sec}</td>
                    <td>{r.cat}</td>
                    <td style={{ width: 200 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div className="pbar" style={{ flex: 1 }}>
                          <i style={{ width: r.pct + '%', animationDelay: (.08 * i) + 's', background: r.pct > 80 ? 'var(--accent-coral)' : 'var(--ep-primary)' }}/>
                        </div>
                        <span style={{ width: 36, textAlign: 'right', fontSize: 12, fontWeight: 700 }}>{r.pct}%</span>
                      </div>
                    </td>
                    <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)' }}>{r.free}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="card hover-lift">
            <div className="card-head">
              <div className="card-ttl">Paket holati</div>
              <button className="card-act"><Icon name="dots" size={14}/></button>
            </div>
            <div style={{ padding: '0 22px 14px' }}>
              <div className="seg" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)' }}>
                <button className="active">Hammasi</button>
                <button>Kutilmoqda</button>
                <button>Yetkazildi</button>
              </div>
            </div>
            {[
              { id: 'PKG-HK77420', date: '20 May · 17:30', status: 'sent',    pillCls: 'coral',   pillTxt: 'Yuborildi' },
              { id: 'PKG-AS0812',  date: '21 May · 13:45', status: 'arrived', pillCls: 'success', pillTxt: 'Yetib keldi' },
              { id: 'PKG-EI0293',  date: '22 May · 09:30', status: 'expect',  pillCls: 'warning', pillTxt: 'Kutilmoqda' },
              { id: 'PKG-FR2218',  date: '22 May · 11:15', status: 'expect',  pillCls: 'warning', pillTxt: 'Kutilmoqda' },
            ].map(p => (
              <div key={p.id} className="alert-row">
                <div className="alert-icn" style={{ background: 'var(--ep-primary)' }}><Icon name="package" size={16}/></div>
                <div className="alert-body">
                  <div className="alert-ttl">{p.id}</div>
                  <div className="alert-meta">{p.date}</div>
                </div>
                <span className={'pill ' + p.pillCls}>{p.pillTxt}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Activity log */}
        <div className="card hover-lift">
          <div className="card-head">
            <div className="card-ttl">Ombor faolligi</div>
            <button className="card-act">Hammasini koʻrish <Icon name="chev-rt" size={11}/></button>
          </div>
          {[
            { av:'L', avc:'#FF902F', name:'Lola Fernandez', txt:'B3 boʻlimida 40 ta qishki kurtka paketi kelganini tasdiqladi.', time:'01:45 PM' },
            { av:'A', avc:'#3563AC', name:'Akmal Martinez',  txt:'A1 boʻlimiga 25 ta Smart Router toʻplamini qoʻshdi.', time:'09:15 AM' },
            { av:'O', avc:'#7A4FB1', name:'Oybek Liem',      txt:'C5 boʻlimidan 18 ta zanglanmagan oshxona toʻplamini yetkazdi.', time:'01:30 PM' },
            { av:'D', avc:'#E94560', name:'Dilshod Choi',    txt:'D2 boʻlimiga "Brake Pads" yetkazib berildi.', time:'04:20 PM' },
          ].map((a, i) => (
            <div key={i} className="alert-row">
              <div className="av" style={{ background: a.avc, width: 36, height: 36 }}>{a.av}</div>
              <div className="alert-body">
                <div className="alert-ttl"><b>{a.name}</b> <span style={{ fontWeight: 400, color: 'var(--fg2)' }}>{a.txt}</span></div>
                <div className="alert-meta">{a.time}</div>
              </div>
              <span className="chev"><Icon name="chev-rt" size={15}/></span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

window.AnalyticsPage = AnalyticsPage;
window.WarehousePage = WarehousePage;
