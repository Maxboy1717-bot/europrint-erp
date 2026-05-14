/* DashboardPage — SHIPNOW "Good Morning" inspired layout
   Sections (top to bottom):
   1. Greeting topbar with search + Add button
   2. 4-up KPI cards (large number + striped icon tile)
   3. Donut chart "Buyurtma turi" + Profit Summary bar chart
   4. Map card (Recent shipment) + Shipment alerts with 3 mini-stat tiles
   5. Recent orders table + Recent activity feed
*/

function KpiCard({ label, value, suffix, delta, deltaTrend, icon, iconBg, iconStripe = 'stripes' }) {
  return (
    <div className="kpi">
      <div>
        <div className="kpi-lbl">{label}</div>
        <div className="kpi-val">{value}<span className="small">{suffix}</span></div>
        {delta && (
          <span className={'kpi-delta ' + (deltaTrend === 'up' ? 'up' : 'dn')}>
            <Icon name={deltaTrend === 'up' ? 'arrow-up' : 'arrow-dn'} size={11}/> {delta} oʻtgan haftadan
          </span>
        )}
      </div>
      <div className={'kpi-icn bg-' + iconStripe + (iconBg ? '' : '')}
           style={{ background: iconBg }}>
        <Icon name={icon} size={28} stroke={2}/>
      </div>
    </div>
  );
}

/* Donut chart — multi-segment SVG donut using pathLength=100 for clean math */
function Donut({ size = 180, thickness = 28, segments, centerLabel, centerValue }) {
  const r = (size - thickness) / 2;
  let cumulative = 0;
  const total = segments.reduce((s, x) => s + x.value, 0);
  return (
    <div style={{ position:'relative', width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform:'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#F3E6E1" strokeWidth={thickness}/>
        {segments.map((s, i) => {
          const pct   = (s.value / total) * 100;
          const start = cumulative;
          cumulative += pct;
          return (
            <circle key={i}
              cx={size/2} cy={size/2} r={r}
              pathLength="100"
              fill="none" stroke={s.color} strokeWidth={thickness}
              strokeDasharray={`${pct} ${100 - pct}`}
              strokeDashoffset={-start}
              style={{
                transition: 'stroke-dasharray .9s var(--ease-out-soft)',
              }}
            />
          );
        })}
      </svg>
      <div className="donut-center" style={{ width: size }}>
        <div className="lbl">{centerLabel}</div>
        <div className="val">{centerValue}</div>
      </div>
    </div>
  );
}

/* Pattern-striped vertical bar chart */
function BarChart({ data, calloutIndex = -1, dual = false }) {
  const max = Math.max(...data.map(d => Math.max(d.a, d.b || 0)));
  return (
    <div className="chart-row">
      {data.map((d, i) => (
        <div key={d.label + i} className="bar-grp">
          {i === calloutIndex && <div className="bar-callout">{d.label} · {d.a}</div>}
          <div className="stack">
            <div className={'bar stripe' + (i === calloutIndex ? ' dark' : '')}
                 style={{ height: (d.a / max * 140) + 'px' }}/>
            {d.b !== undefined && (
              <div className={'bar coral stripe'}
                   style={{ height: (d.b / max * 140) + 'px' }}/>
            )}
          </div>
          <div className="lbl">{d.label}</div>
        </div>
      ))}
    </div>
  );
}

function DashboardPage() {
  const c_total   = useCountUp(1284);
  const c_perf    = useCountUp(94.3, { decimals: 1 });
  const c_revenue = useCountUp(82450);
  const c_orders  = useCountUp(2500);

  const fmt = (n) => n.toLocaleString('en-US');

  const months = [
    { label:'Yan', a: 38 },
    { label:'Fev', a: 52 },
    { label:'Mar', a: 31 },
    { label:'Apr', a: 64 },
    { label:'May', a: 95, b: 0 },
    { label:'Iyn', a: 48 },
    { label:'Iyl', a: 72 },
    { label:'Avg', a: 56 },
  ];
  const profitData = [
    { label:'Yan', a: 42, b: 36 },
    { label:'Fev', a: 58, b: 51 },
    { label:'Mar', a: 50, b: 44 },
    { label:'Apr', a: 65, b: 56 },
    { label:'May', a: 88, b: 72 },
    { label:'Iyn', a: 72, b: 58 },
    { label:'Iyl', a: 90, b: 78 },
    { label:'Avg', a: 100, b: 84 },
  ];

  const orderRows = [
    { id:'#EP-24108', av:'K', avc:'#3563AC', who:'Korzinka Online',  what:'Banner 5×3m',     qty:12,    status:'progress', total:'4 800 000', route:'TIY → MNZ' },
    { id:'#EP-24107', av:'A', avc:'#FF902F', who:'Artel Electronics', what:'Karton qutilar',  qty:240,   status:'done',     total:'18 200 000', route:'TIY → SAM' },
    { id:'#EP-24106', av:'U', avc:'#7A4FB1', who:'Uzum Market',       what:'Flayer A5',       qty:5000,  status:'new',      total:'2 100 000', route:'TIY → BUX' },
    { id:'#EP-24105', av:'B', avc:'#2E8A5A', who:'Beeline Uzbekistan',what:'Roll-up 2m',      qty:8,     status:'progress', total:'3 600 000', route:'TIY → AND' },
    { id:'#EP-24104', av:'D', avc:'#C45C7A', who:'Davr Mobile',       what:'Vizit kartochka', qty:2000,  status:'done',     total:'850 000',   route:'TIY → NAM' },
  ];
  const statusMap = {
    'new':       <span className="pill primary">Yangi</span>,
    'progress':  <span className="pill warning">Yoʻlda</span>,
    'done':      <span className="pill success">Yetkazildi</span>,
  };

  return (
    <div data-screen-label="01 Dashboard">
      <Topbar
        greet={<>Salom, <b>Alisher!</b></>}
        title="Xayrli tong 👋"
        actions={<button className="btn btn-primary"><Icon name="plus" size={15}/> Yangi buyurtma</button>}
      />

      <div className="page">
        {/* KPI row */}
        <div className="kpi-grid">
          <KpiCard label="Faol buyurtmalar"  value={fmt(c_total)}        delta="8.7%"  deltaTrend="up" icon="package" iconBg="var(--ep-primary)"/>
          <KpiCard label="Yetkazish samarasi" value={c_perf} suffix="%"   delta="1.2%"  deltaTrend="dn" icon="chart"   iconBg="#15171A"/>
          <KpiCard label="Bu oygi daromad"    value={'₿ ' + fmt(c_revenue)} delta="12.4%" deltaTrend="up" icon="cash"    iconBg="var(--accent-coral)"/>
          <KpiCard label="Jami mijozlar"      value={fmt(c_orders)}        delta="5.3%"  deltaTrend="up" icon="users"   iconBg="#7A4FB1"/>
        </div>

        {/* Charts row */}
        <div className="grid-2-1" style={{ marginBottom:16 }}>
          <div className="card hover-lift">
            <div className="card-head">
              <div>
                <div className="card-ttl">Buyurtma statistikasi</div>
                <div style={{ fontSize:12, color:'var(--fg2)', marginTop:3 }}>Oylik tirajlar · 8 oy</div>
              </div>
              <div className="seg">
                <button>1 oy</button>
                <button className="active">6 oy</button>
                <button>Yil</button>
              </div>
            </div>
            <div className="card-body" style={{ paddingBottom:32 }}>
              <BarChart data={months} calloutIndex={4}/>
            </div>
          </div>

          <div className="card hover-lift">
            <div className="card-head">
              <div className="card-ttl">Buyurtma turlari</div>
              <button className="card-act"><Icon name="dots" size={14}/></button>
            </div>
            <div className="donut-wrap" style={{ paddingTop:8 }}>
              <Donut
                size={170} thickness={26}
                segments={[
                  { value: 46, color: 'var(--ep-primary)',    label: 'Bosma',     qty: 1150 },
                  { value: 17, color: 'var(--accent-coral)',  label: 'Qadoqlash', qty: 425  },
                  { value: 28, color: '#15171A',              label: 'Reklama',   qty: 700  },
                  { value:  9, color: '#E5D9D3',              label: 'Maxsus',    qty: 225  },
                ]}
                centerLabel="Jami"
                centerValue={fmt(c_orders)}
              />
            </div>
            <div className="donut-legend">
              {[
                { color:'var(--ep-primary)',   name:'Bosma',     qty:1150, pct:'46%' },
                { color:'var(--accent-coral)', name:'Qadoqlash', qty:425,  pct:'17%' },
                { color:'#15171A',             name:'Reklama',   qty:700,  pct:'28%' },
                { color:'#E5D9D3',             name:'Maxsus',    qty:225,  pct:'9%'  },
              ].map(s => (
                <div key={s.name} className="donut-leg-row">
                  <span className="swatch" style={{ background: s.color }}/>
                  <span className="name">{s.name}</span>
                  <span className="qty">{s.qty} ta</span>
                  <span className="pct">{s.pct}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Profit chart full width */}
        <div className="card hover-lift" style={{ marginBottom:16 }}>
          <div className="card-head">
            <div>
              <div className="card-ttl">Foyda dinamikasi</div>
              <div style={{ fontSize:12, color:'var(--fg2)', marginTop:3 }}><span style={{ fontSize:22, fontWeight:800, color:'var(--fg1)', letterSpacing:'-.01em' }}>₿ 624,550</span> <span style={{ color:'var(--ep-green)', fontWeight:600 }}>↑ 5.62%</span> oʻtgan oydan</div>
            </div>
            <div style={{ display:'flex', gap:18, alignItems:'center' }}>
              <span style={{ fontSize:12, color:'var(--fg2)', display:'inline-flex', alignItems:'center', gap:6 }}><span style={{ width:12, height:12, borderRadius:3, background:'var(--ep-primary)' }}/> Daromad</span>
              <span style={{ fontSize:12, color:'var(--fg2)', display:'inline-flex', alignItems:'center', gap:6 }}><span style={{ width:12, height:12, borderRadius:3, background:'var(--accent-coral)' }}/> Xarajat</span>
              <div className="seg">
                <button className="active">8 oy</button>
                <button>Yil</button>
              </div>
            </div>
          </div>
          <div className="card-body" style={{ paddingBottom:32 }}>
            <BarChart data={profitData}/>
          </div>
        </div>

        {/* Map + Alerts row */}
        <div className="grid-2-1" style={{ marginBottom:16 }}>
          <div className="map-card">
            <div className="card-head">
              <div>
                <div className="card-ttl">Joriy yetkazish</div>
                <div style={{ fontSize:12, color:'var(--fg2)', marginTop:3, fontFamily:'var(--font-mono)' }}>#EP-24108 · Banner 5×3m</div>
              </div>
              <button className="card-act">Batafsil <Icon name="chev-rt" size={12}/></button>
            </div>
            <div className="map-canvas">
              <div className="map-route"></div>
              <div className="map-pin start"><Icon name="package" size={13}/></div>
              <div className="map-truck"><Icon name="truck" size={22}/></div>
              <div className="map-pin end"><Icon name="pin" size={13}/></div>
            </div>
            <div className="map-foot">
              <div className="leg">
                <b>Toshkent</b>
                <span>13 May · 10:30</span>
              </div>
              <div className="status">Yoʻlda · 65%</div>
              <div className="leg" style={{ textAlign:'right' }}>
                <b>Marg'ilon</b>
                <span>14 May · ~18:00</span>
              </div>
            </div>
          </div>

          <div className="card hover-lift">
            <div className="card-head">
              <div>
                <div className="card-ttl">Buyurtma ogohlantirishlari</div>
                <div style={{ fontSize:12, color:'var(--accent-coral)', marginTop:3, fontWeight:600 }}>12 ta kechikish aniqlandi</div>
              </div>
            </div>
            <div className="alert-tiles">
              <div className="alert-tile"><div className="v">5</div><div className="l">Bojxona<br/>kechikishi</div></div>
              <div className="alert-tile"><div className="v">4</div><div className="l">Noaniq<br/>manzil</div></div>
              <div className="alert-tile"><div className="v">3</div><div className="l">Ob-havo<br/>toʻxtashi</div></div>
            </div>
            <div>
              <div className="alert-row">
                <div className="alert-icn" style={{ background:'var(--accent-coral)' }}><Icon name="x" size={16}/></div>
                <div className="alert-body">
                  <div className="alert-ttl">Bojxona kechikishi</div>
                  <div className="alert-meta">#EP-24102 · Toshkent → Buxoro</div>
                </div>
                <span className="chev"><Icon name="chev-rt" size={15}/></span>
              </div>
              <div className="alert-row">
                <div className="alert-icn" style={{ background:'var(--ep-yellow)' }}><Icon name="pin" size={16}/></div>
                <div className="alert-body">
                  <div className="alert-ttl">Noaniq manzil maʼlumoti</div>
                  <div className="alert-meta">#EP-24098 · Samarqand</div>
                </div>
                <span className="chev"><Icon name="chev-rt" size={15}/></span>
              </div>
              <div className="alert-row">
                <div className="alert-icn" style={{ background:'var(--ep-blue)' }}><Icon name="globe" size={16}/></div>
                <div className="alert-body">
                  <div className="alert-ttl">Ob-havo toʻxtashi</div>
                  <div className="alert-meta">#EP-24091 · Andijon</div>
                </div>
                <span className="chev"><Icon name="chev-rt" size={15}/></span>
              </div>
            </div>
          </div>
        </div>

        {/* Recent orders */}
        <div className="card hover-lift">
          <div className="card-head">
            <div>
              <div className="card-ttl">Soʻnggi buyurtmalar</div>
              <div style={{ fontSize:12, color:'var(--fg2)', marginTop:3 }}>Bugun · 1,284 ta jami</div>
            </div>
            <div style={{ display:'flex', gap:8 }}>
              <button className="btn btn-secondary btn-sm"><Icon name="filter" size={13}/> Filter</button>
              <button className="btn btn-secondary btn-sm"><Icon name="doc" size={13}/> Eksport</button>
            </div>
          </div>
          <table className="tbl">
            <thead>
              <tr>
                <th>Buyurtma</th>
                <th>Mijoz</th>
                <th>Mahsulot</th>
                <th>Yoʻnalish</th>
                <th>Holat</th>
                <th style={{ textAlign:'right' }}>Summa</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {orderRows.map(o => (
                <tr key={o.id}>
                  <td style={{ fontFamily:'var(--font-mono)', fontSize:12, color:'var(--fg2)' }}>{o.id}</td>
                  <td><span className="av" style={{ background:o.avc }}>{o.av}</span><b>{o.who}</b></td>
                  <td>{o.what} <span style={{ color:'var(--fg2)' }}>· ×{o.qty}</span></td>
                  <td style={{ fontFamily:'var(--font-mono)', fontSize:12, color:'var(--fg2)' }}>{o.route}</td>
                  <td>{statusMap[o.status]}</td>
                  <td style={{ textAlign:'right', fontFamily:'var(--font-mono)', fontWeight:600 }}>{o.total}</td>
                  <td style={{ width:50, textAlign:'right' }}>
                    <button className="ibtn" style={{ width:32, height:32, borderRadius:9 }}><Icon name="more" size={15}/></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

window.DashboardPage = DashboardPage;
window.KpiCard = KpiCard;
window.BarChart = BarChart;
window.Donut = Donut;
