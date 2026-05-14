/* PosKanbanProfile.jsx — v2 modern redesign
   1. POS Monitor — shift stats strip, featured-products tiles, animated cart, sparkline
   2. CRM Kanban — forecast banner with funnel + win-probability rings + heat indicator
   3. Employee Profile — cinematic hero + KPI rings + GitHub heatmap + radar + badges + AI
*/

/* ============================================================================
   1) POS MONITOR
   ============================================================================ */

const POS_CATS = [
  { id: 'all',    lbl: 'Hammasi',    n: 48 },
  { id: 'print',  lbl: 'Bosma',      n: 16 },
  { id: 'pack',   lbl: 'Qadoqlash',  n: 12 },
  { id: 'adv',    lbl: 'Reklama',    n: 9 },
  { id: 'sticker',lbl: 'Stikerlar',  n: 7 },
  { id: 'spec',   lbl: 'Maxsus',     n: 4 },
];

const POS_FEATURED = [
  { id:'f1', cls:'',       name:'Vizit kartochka', price:'120',     cur:"so'm" },
  { id:'f2', cls:'dark',   name:'Flayer A5',       price:'480',     cur:"so'm" },
  { id:'f3', cls:'coral',  name:'Stiker 50mm',     price:'380',     cur:"so'm" },
  { id:'f4', cls:'green',  name:'Karton quti S',   price:'4 500',  cur:"so'm" },
  { id:'f5', cls:'purple', name:'Roll-up 80×200',  price:'285 000',cur:"so'm" },
  { id:'f6', cls:'blue',   name:'Konvert brendlangan',price:'1 850',cur:"so'm" },
];

const POS_PRODUCTS = [
  { id:'p1',  cat:'print',   name:'Vizit kartochka 90×50', sku:'VK-001', price:120,    unit:"so'm/dona", stock:'> 5000', stockClass:'',  color:'#FF902F', tag:'TOP' },
  { id:'p2',  cat:'print',   name:'Flayer A5 — 4+4 ofset', sku:'FL-A5',  price:480,    unit:"so'm/dona", stock:'> 5000', stockClass:'',  color:'#3563AC' },
  { id:'p3',  cat:'print',   name:'Buklet A4 fold',        sku:'BK-A4',  price:1200,   unit:"so'm/dona", stock:'1240',   stockClass:'',  color:'#7A4FB1' },
  { id:'p4',  cat:'adv',     name:'Banner 5×3m frontlit',  sku:'BN-FR',  price:380000, unit:"so'm/dona", stock:'48',     stockClass:'low',color:'#E94560' },
  { id:'p5',  cat:'adv',     name:'Roll-up 80×200',        sku:'RU-80',  price:285000, unit:"so'm/dona", stock:'24',     stockClass:'low',color:'#2E8A5A' },
  { id:'p6',  cat:'pack',    name:'Karton quti — kichik',  sku:'KQ-S',   price:4500,   unit:"so'm/dona", stock:'820',    stockClass:'',  color:'#B5891C' },
  { id:'p7',  cat:'pack',    name:'Karton quti — katta',   sku:'KQ-L',   price:9800,   unit:"so'm/dona", stock:'410',    stockClass:'',  color:'#1A8FAF' },
  { id:'p8',  cat:'pack',    name:'Kraft paket 30×40',     sku:'KP-30',  price:2200,   unit:"so'm/dona", stock:'1200',   stockClass:'',  color:'#15171A' },
  { id:'p9',  cat:'sticker', name:'Stiker yumaloq 50mm',   sku:'ST-50',  price:380,    unit:"so'm/dona", stock:'> 5000', stockClass:'',  color:'#FF902F', tag:'TOP' },
  { id:'p10', cat:'sticker', name:'Stiker kvadrat 100mm',  sku:'ST-100', price:680,    unit:"so'm/dona", stock:'> 5000', stockClass:'',  color:'#C45C7A' },
  { id:'p11', cat:'spec',    name:'Korp. identifikatsiya', sku:'CI-PKG', price:850000, unit:'paket',     stock:'1',      stockClass:'low',color:'#7A4FB1' },
  { id:'p12', cat:'print',   name:'Brendlangan konvert',   sku:'KN-1',   price:1850,   unit:"so'm/dona", stock:'> 5000', stockClass:'',  color:'#3563AC' },
];

function PosMonitor({ onExit }) {
  const [cat, setCat]   = React.useState('all');
  const [cart, setCart] = React.useState([
    { ...POS_PRODUCTS[0], qty: 100 },
    { ...POS_PRODUCTS[1], qty: 50 },
    { ...POS_PRODUCTS[5], qty: 12 },
  ]);
  const [time, setTime] = React.useState(new Date());
  React.useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const addToCart = (p) => {
    setCart(c => {
      const ex = c.find(x => x.id === p.id);
      if (ex) return c.map(x => x.id === p.id ? { ...x, qty: x.qty + 1 } : x);
      return [...c, { ...p, qty: 1 }];
    });
  };
  const updateQty = (id, delta) => {
    setCart(c => c.map(x => x.id === id ? { ...x, qty: Math.max(0, x.qty + delta) } : x).filter(x => x.qty > 0));
  };
  const removeItem = (id) => setCart(c => c.filter(x => x.id !== id));

  const subtotal = cart.reduce((s, x) => s + x.qty * x.price, 0);
  const discount = Math.round(subtotal * 0.05);
  const nds      = Math.round((subtotal - discount) * 0.12);
  const total    = subtotal - discount + nds;
  const fmt = (n) => n.toLocaleString('ru-RU').replace(/,/g, ' ');

  const visible = cat === 'all' ? POS_PRODUCTS : POS_PRODUCTS.filter(p => p.cat === cat);
  const hh = String(time.getHours()).padStart(2,'0');
  const mm = String(time.getMinutes()).padStart(2,'0');
  const ss = String(time.getSeconds()).padStart(2,'0');

  // Build sales sparkline path
  const sparkData = [12, 18, 22, 16, 28, 35, 31, 42, 38, 48, 56, 52];
  const maxSpark = Math.max(...sparkData);
  const sparkPath = sparkData.map((v, i) => `${i === 0 ? 'M' : 'L'} ${i * 6} ${28 - (v / maxSpark) * 24}`).join(' ');

  return (
    <div className="pos-app" data-screen-label="POS · Monitor">
      <div className="pos-catalog">
        <div className="pos-cat-head">
          <div className="pos-brand">
            <img src="../../assets/europrint-mark.png" alt="EuroPrint"/>
            <span className="badge">POS · Showroom #1</span>
          </div>
          <div className="search-box pos-search" style={{ height: 44, maxWidth: 380 }}>
            <Icon name="search" size={16}/>
            <input placeholder="Mahsulot, SKU, barkod skanerlash…"/>
            <Icon name="scan" size={16}/>
          </div>
          <div className="clock">
            {hh}:{mm}<span style={{ color:'var(--fg2)' }}>:{ss}</span>
            <span className="sub">13 May, Dushanba</span>
          </div>
          <button className="btn btn-secondary" onClick={onExit}><Icon name="x" size={13}/> Yopish</button>
        </div>

        {/* Shift stats strip */}
        <div className="pos-shift">
          <div className="stat a">
            <div className="lbl">Bugungi chek</div>
            <div className="v">142</div>
            <div className="delta"><Icon name="arrow-up" size={10}/> 18 oxirgi soatda</div>
          </div>
          <div className="stat b">
            <div className="lbl">Sotuv summasi</div>
            <div className="v">4.2<span className="cur">M so'm</span></div>
            <div className="delta"><Icon name="arrow-up" size={10}/> +12.4%</div>
          </div>
          <div className="stat c">
            <div className="lbl">Oʻrtacha chek</div>
            <div className="v">29 580<span className="cur">so'm</span></div>
            <div className="delta" style={{ color:'var(--ep-green)' }}><Icon name="arrow-up" size={10}/> +6.2%</div>
          </div>
          <div className="stat d">
            <div className="lbl">Mijozlar</div>
            <div className="v">98</div>
            <div className="delta" style={{ color:'var(--fg2)' }}>· 14 yangi</div>
          </div>
          <div className="spark">
            <div>
              <div className="l">Trend</div>
              <div className="v">↑ 14%</div>
            </div>
            <svg viewBox="0 0 66 28">
              <path d={sparkPath} fill="none" stroke="#FF902F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d={sparkPath + ' L 66 28 L 0 28 Z'} fill="rgba(255,144,47,.2)" />
            </svg>
          </div>
        </div>

        {/* Featured (Quick-add hero strip) */}
        <div className="pos-featured">
          <div className="head">
            <span className="ttl">⭐ Eng koʻp sotilgan — bugun</span>
            <span style={{ fontSize: 11, color: 'var(--fg2)', fontWeight: 600 }}>Tezkor qoʻshish →</span>
          </div>
          <div className="row">
            {POS_FEATURED.map(f => (
              <div key={f.id} className={'pos-fav ' + f.cls}
                   onClick={() => addToCart(POS_PRODUCTS.find(p => p.name.startsWith(f.name.slice(0,8))) || POS_PRODUCTS[0])}>
                <div className="add-dot"><Icon name="plus" size={13}/></div>
                <div className="nm">{f.name}</div>
                <div className="pr">{f.price}<span className="cur">{f.cur}</span></div>
              </div>
            ))}
          </div>
        </div>

        <div className="pos-cats">
          {POS_CATS.map(c => (
            <div key={c.id} className={'pos-cat-pill' + (cat === c.id ? ' active' : '')} onClick={() => setCat(c.id)}>
              {c.lbl} <span className="n">{c.n}</span>
            </div>
          ))}
        </div>

        <div className="pos-grid">
          {visible.map(p => (
            <div key={p.id} className="pos-prod" onClick={() => addToCart(p)}>
              <div className="pic" style={{ background: p.color }}>
                {p.tag && <span className="corner-tag">{p.tag}</span>}
                {p.cat === 'print' ? 'B' : p.cat === 'pack' ? 'Q' : p.cat === 'adv' ? 'R' : p.cat === 'sticker' ? 'S' : 'M'}
              </div>
              <div className="name">{p.name}</div>
              <div className="row">
                <div className="price">{fmt(p.price)}<span className="cur">so'm</span></div>
                <div className={'stock ' + (p.stockClass || '')}>{p.stock}</div>
              </div>
              <button className="add" onClick={(e) => { e.stopPropagation(); addToCart(p); }}>
                <Icon name="plus" size={14}/> Savatga
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* RIGHT — receipt-style cart */}
      <aside className="pos-cart">
        <div className="pos-cart-head">
          <div className="ticket">
            <div className="ticket-id">#R-2024-1108<span className="sub">Smena #34</span></div>
            <div style={{ display:'flex', gap:6 }}>
              <button className="ibtn" style={{ width:36, height:36, borderRadius:10 }}><Icon name="users" size={15}/></button>
              <button className="ibtn" style={{ width:36, height:36, borderRadius:10 }}><Icon name="percent" size={15}/></button>
              <button className="ibtn" style={{ width:36, height:36, borderRadius:10 }}><Icon name="more" size={15}/></button>
            </div>
          </div>
          <div className="cashier">
            <div className="av">AK</div>
            <div>
              <div className="who">Alisher K.</div>
              <div className="who-sub">Smena · 09:00 — 18:00</div>
            </div>
            <div className="badge">Faol</div>
          </div>
        </div>

        <div className="pos-customer">
          <div className="plus"><Icon name="users" size={15}/></div>
          <div className="lead">
            <b>Mijoz tanlanmagan</b>
            Sadoqatli mijoz kartasini skanerlang yoki tanlang
          </div>
        </div>

        <div className="pos-items">
          <div className="lbl">
            <span>{cart.length} ta mahsulot</span>
            {cart.length > 0 && <span style={{ color: 'var(--accent-coral)', cursor: 'pointer' }} onClick={() => setCart([])}>Tozalash</span>}
          </div>
          {cart.length === 0 ? (
            <div className="pos-empty">
              <div className="ic"><Icon name="package" size={32}/></div>
              <div style={{ fontSize:14, fontWeight:600, color:'var(--fg1)' }}>Savat boʻsh</div>
              <div style={{ fontSize:12, marginTop:4 }}>Mahsulot qoʻshish uchun katalogdan tanlang</div>
            </div>
          ) : cart.map(item => (
            <div key={item.id} className="pos-item">
              <div className="thumb" style={{ background: item.color }}>
                {item.cat === 'print' ? 'B' : item.cat === 'pack' ? 'Q' : item.cat === 'adv' ? 'R' : item.cat === 'sticker' ? 'S' : 'M'}
              </div>
              <div className="info">
                <div className="nm">{item.name}</div>
                <div className="meta">{item.sku} · {fmt(item.price)} so'm × {item.qty}</div>
                <div className="controls">
                  <div className="pos-qty">
                    <button onClick={() => updateQty(item.id, -1)}><Icon name="minus" size={13}/></button>
                    <span className="n">{item.qty}</span>
                    <button onClick={() => updateQty(item.id, 1)}><Icon name="plus" size={13}/></button>
                  </div>
                </div>
              </div>
              <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:8 }}>
                <div className="sub-price">{fmt(item.qty * item.price)}</div>
                <span className="x" onClick={() => removeItem(item.id)}><Icon name="trash" size={14}/></span>
              </div>
            </div>
          ))}
        </div>

        <div className="pos-totals">
          <div className="row"><span>Subtotal</span><b>{fmt(subtotal)} so'm</b></div>
          <div className="row discount"><span>Chegirma · 5%</span><b>−{fmt(discount)} so'm</b></div>
          <div className="row"><span>NDS · 12%</span><b>{fmt(nds)} so'm</b></div>
          <div className="grand">
            <div className="lbl">JAMI<b>{cart.reduce((s,x) => s+x.qty, 0)} dona</b></div>
            <div className="v">{fmt(total)}<span className="cur">so'm</span></div>
          </div>
        </div>

        <div className="pos-quick">
          <button><Icon name="users" size={16}/> Mijoz</button>
          <button><Icon name="percent" size={16}/> Skidka</button>
          <button><Icon name="doc" size={16}/> Hold</button>
        </div>

        <div className="pos-pay">
          <button className="cash"><span className="ic"><Icon name="cash" size={17}/></span>Naqd</button>
          <button className="card"><span className="ic"><Icon name="credit-card" size={17}/></span>Karta</button>
          <button className="click"><span className="ic"><Icon name="phone" size={17}/></span>Click/Payme</button>
          <button className="other"><span className="ic"><Icon name="gift" size={17}/></span>Boshqa</button>
          <button className="primary" disabled={cart.length === 0}>
            <Icon name="check" size={18}/> Toʻlovni amalga oshirish
          </button>
        </div>
      </aside>
    </div>
  );
}

/* ============================================================================
   2) CRM KANBAN v2
   ============================================================================ */

const KB_COLS = [
  { id:'lead',  cls:'lead',  ttl:'Lead',                heat: [4,6,5,7,8,6,9] },
  { id:'qual',  cls:'qual',  ttl:'Tasdiqlangan',        heat: [3,4,4,5,5,4,6] },
  { id:'prop',  cls:'prop',  ttl:'Taklif yuborildi',    heat: [5,6,4,7,6,8,7] },
  { id:'negot', cls:'negot', ttl:'Muzokaralar',         heat: [2,3,2,3,4,3,3] },
  { id:'won',   cls:'won',   ttl:'Yutilgan',            heat: [1,2,2,3,2,4,3] },
  { id:'lost',  cls:'lost',  ttl:'Yoʻqotilgan',         heat: [1,1,2,1,1,2,1] },
];

const KB_DEALS = [
  { stage:'lead', pri:'med',  win:35, co:'Korzinka Online',  init:'K', color:'#3563AC', ttl:'Q2 kataloglar — 50,000 nusxa', value:18.4, owner:'AK', avs:['AK','DY'], tags:['hot','E-commerce'], days:2, msgs:5 },
  { stage:'lead', pri:'low',  win:18, co:'Hayot Group',      init:'H', color:'#1A8FAF', ttl:'Logo + brending paketi', value:6.8, owner:'BR', avs:['BR'], tags:['cold','Yangi'], days:1, msgs:1 },
  { stage:'lead', pri:'med',  win:28, co:'Makro',            init:'M', color:'#B5891C', ttl:'Etiket A4 + paketlar', value:8.2, owner:'DY', avs:['DY','SH'], tags:['Riteyl'], days:3, msgs:2 },
  { stage:'qual', pri:'high', win:62, co:'Artel Electronics',init:'A', color:'#FF902F', ttl:'Karton qutilar — 12,000 dona', value:42.6, owner:'BR', avs:['BR','AK'], tags:['hot','VIP'], days:5, msgs:11 },
  { stage:'qual', pri:'med',  win:45, co:'Davr Mobile',      init:'D', color:'#C45C7A', ttl:'Vizit kartochka · 200 xodim', value:3.4, owner:'SH', avs:['SH'], tags:['Telekom'], days:2, msgs:3 },
  { stage:'prop', pri:'high', win:74, co:'Uzum Market',      init:'U', color:'#7A4FB1', ttl:'Marketplace flayer kampaniya', value:24.0, owner:'AK', avs:['AK','BR','DY'], tags:['warm','Marketplace'], days:7, msgs:18 },
  { stage:'prop', pri:'med',  win:56, co:'Beeline',          init:'B', color:'#E94560', ttl:'Roll-up 24 ta — magazinlar', value:7.8, owner:'DY', avs:['DY'], tags:['Telekom'], days:4, msgs:6 },
  { stage:'negot',pri:'high', win:82, co:'Toshkent Plaza',   init:'T', color:'#15171A', ttl:'Anniv. kampaniya · brendlash', value:65.0, owner:'BR', avs:['BR','AK','SH','DY'], tags:['hot','VIP'], days:14, msgs:32, stuck:true },
  { stage:'won',  pri:'high', win:100,co:'Korzinka Online',  init:'K', color:'#3563AC', ttl:'Bayram qadoqlash', value:32.5, owner:'AK', avs:['AK','DY'], tags:['Yopildi'], days:0, msgs:48 },
  { stage:'won',  pri:'med',  win:100,co:'Artel',            init:'A', color:'#FF902F', ttl:'Q1 marketing', value:14.2, owner:'BR', avs:['BR'], tags:['Yopildi'], days:0, msgs:12 },
  { stage:'lost', pri:'low',  win:0,  co:'Star Group',       init:'S', color:'#9A9CA0', ttl:'Premium tashrif kartochka', value:9.5, owner:'DY', avs:['DY'], tags:['Narx yuqori'], days:0, msgs:8 },
];

function WinRing({ pct, size = 38 }) {
  const r = (size - 6) / 2;
  const c = 2 * Math.PI * r;
  const color = pct >= 70 ? 'var(--ep-green)' : pct >= 40 ? 'var(--ep-primary)' : pct >= 20 ? 'var(--ep-yellow)' : 'var(--accent-coral)';
  return (
    <div className="win-ring" style={{ width: size, height: size }}>
      <svg viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#F3E6E1" strokeWidth="3"/>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth="3"
                strokeDasharray={`${c * pct / 100} ${c}`} strokeLinecap="round"/>
      </svg>
      <span className="pct" style={{ color: pct === 0 ? 'var(--fg3)' : color }}>{pct}%</span>
    </div>
  );
}

function KanbanCard({ d }) {
  return (
    <div className="kb-card">
      <div className={'priority ' + (d.pri || 'low')}/>
      <span className="grip"><Icon name="grip" size={14}/></span>
      <div className="head">
        <div className="co-mark" style={{ background: d.color }}>{d.init}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="co-name">{d.co}</div>
          <div className="co-sub">#{d.stage.toUpperCase()}-{1000 + Math.floor(Math.random()*9000)}</div>
        </div>
      </div>
      <div className="ttl">{d.ttl}</div>
      <div className="value-row">
        <div className="value">
          <span className="num">₿ {d.value}</span><span className="cur">mln so'm</span>
        </div>
        <WinRing pct={d.win}/>
      </div>
      <div className="tags">
        {d.tags.map(t => (
          <span key={t} className={'tag' + (t === 'hot' ? ' hot' : t === 'warm' ? ' warm' : t === 'cold' ? ' cold' : '')}>
            {t === 'hot' ? '🔥 Hot' : t === 'warm' ? '⚡ Warm' : t === 'cold' ? '❄ Cold' : t}
          </span>
        ))}
      </div>
      <div className="foot">
        <div className="av-group">
          {d.avs.map((a, i) => <span key={i} className="av" style={{ background: ['#FF902F','#3563AC','#7A4FB1','#2E8A5A'][i % 4] }}>{a}</span>)}
        </div>
        <div className="meta">
          <span className={d.stuck ? 'stuck' : ''}><Icon name="clock"/> {d.days}k</span>
          <span><Icon name="message"/> {d.msgs}</span>
        </div>
      </div>
    </div>
  );
}

function CrmKanban() {
  const fmt = (n) => n.toFixed(1);
  const summary = (stage) => {
    const items = KB_DEALS.filter(d => d.stage === stage);
    return { n: items.length, total: items.reduce((s, x) => s + x.value, 0) };
  };
  const totalPipeline = KB_DEALS.filter(d => !['won','lost'].includes(d.stage)).reduce((s,x) => s+x.value, 0);
  const stages = ['lead','qual','prop','negot','won','lost'];
  const stageSums = stages.map(s => summary(s).total);
  const maxStage = Math.max(...stageSums);

  return (
    <div data-screen-label="CRM · Pipeline">
      <Topbar
        title="Sotuv pipeline"
        breadcrumb={<><b>Dashboard</b> &nbsp;/&nbsp; CRM &nbsp;/&nbsp; Pipeline</>}
        actions={
          <>
            <div className="seg">
              <button className="active">Kanban</button>
              <button>Roʻyxat</button>
              <button>Hisobot</button>
            </div>
            <button className="btn btn-primary"><Icon name="plus" size={14}/> Yangi bitim</button>
          </>
        }
      />

      <div className="page">
        {/* Forecast banner */}
        <div className="kb-forecast">
          <div className="left">
            <div className="lbl">Bu chorakda yopilish prognozi</div>
            <div className="v">₿ {fmt(totalPipeline * 0.42)}<span className="cur">M soʻm</span></div>
            <div className="sub">Hozirgi konversiya: <b style={{ color:'#FF902F' }}>32.4%</b> · Sikl: <b style={{ color:'#FF902F' }}>14 kun</b></div>
          </div>
          <div className="funnel">
            {stages.map((s, i) => {
              const h = (stageSums[i] / maxStage * 100) || 5;
              const colors = ['#3563AC','#7A4FB1','#FF902F','#B5891C','#2E8A5A','#E94560'];
              return (
                <div key={s} style={{ display:'flex', flexDirection:'column', alignItems:'center' }}>
                  <div className="col" style={{ width:'100%', height:'70px', display:'flex', alignItems:'flex-end' }}>
                    <i style={{ width:'100%', height: h + '%', background: colors[i] }}/>
                  </div>
                  <div className="nm">{KB_COLS[i].ttl.slice(0,8)}</div>
                </div>
              );
            })}
          </div>
          <div className="right">
            <div className="seg">
              <button className="active">Q2</button>
              <button>H2</button>
              <button>Yil</button>
            </div>
          </div>
        </div>

        {/* Pipeline KPIs */}
        <div className="kpi-grid" style={{ marginBottom: 16 }}>
          <KpiCard label="Pipeline jami"  value={'₿ ' + fmt(totalPipeline) + 'M'}  delta="14.2%" deltaTrend="up" icon="briefcase" iconBg="var(--ep-primary)"/>
          <KpiCard label="Faol bitimlar"   value="11"       delta="3"     deltaTrend="up" icon="check"     iconBg="#15171A"/>
          <KpiCard label="Konversiya"      value="32.4"  suffix="%" delta="2.1%" deltaTrend="up" icon="chart" iconBg="var(--accent-coral)"/>
          <KpiCard label="Oʻrtacha sikl"   value="14"   suffix=" kun" delta="−3 kun" deltaTrend="up" icon="clock" iconBg="#7A4FB1"/>
        </div>

        {/* Filter bar */}
        <div className="card hover-lift" style={{ padding: '14px 18px', marginBottom: 14, display:'flex', alignItems:'center', justifyContent:'space-between', gap: 14, flexWrap:'wrap' }}>
          <div style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap' }}>
            <div className="seg">
              <button className="active">Hammasi</button>
              <button>Mening bitimlarim</button>
              <button>Jamoa</button>
              <button>VIP</button>
            </div>
            <button className="btn btn-secondary btn-sm"><Icon name="filter" size={13}/> 2 filter qoʻllangan</button>
          </div>
          <div className="search-box" style={{ height: 38, width: 280 }}>
            <Icon name="search" size={14}/>
            <input placeholder="Mijoz, bitim, ID…"/>
          </div>
        </div>

        {/* Kanban board */}
        <div className="kb-board">
          {KB_COLS.map(c => {
            const s = summary(c.id);
            const maxHeat = Math.max(...c.heat);
            return (
              <div key={c.id} className={'kb-col ' + c.cls}>
                <div className="kb-col-head">
                  <span className="dot"/>
                  <span className="ttl">{c.ttl}</span>
                  <span className="n">{s.n}</span>
                  <button className="add"><Icon name="plus" size={12}/></button>
                </div>
                <div className="kb-col-sum">
                  <span>Jami summa</span>
                  <span className="spark">
                    {c.heat.map((h, i) => <i key={i} style={{ height: (h / maxHeat * 14) + 'px' }}/>)}
                  </span>
                  <b>₿ {fmt(s.total)}M</b>
                </div>
                <div className="kb-cards">
                  {KB_DEALS.filter(d => d.stage === c.id).map((d, i) => <KanbanCard key={c.id + i} d={d}/>)}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ============================================================================
   3) EMPLOYEE PROFILE v2
   ============================================================================ */

function KpiRing({ pct, color, size = 64 }) {
  const r = (size - 8) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div className="ring-vis" style={{ width: size, height: size }}>
      <svg viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#F3E6E1" strokeWidth="6"/>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth="6"
                strokeDasharray={`${c * pct / 100} ${c}`} strokeLinecap="round"/>
      </svg>
      <span className="pct" style={{ color }}>{pct}%</span>
    </div>
  );
}

function SkillsRadar({ skills }) {
  // skills: [{ nm, pct }]
  const cx = 140, cy = 140, R = 110;
  const n = skills.length;
  const angle = (i) => (i / n) * Math.PI * 2 - Math.PI / 2;
  const point = (i, r) => `${cx + Math.cos(angle(i)) * r},${cy + Math.sin(angle(i)) * r}`;
  const grid = [0.25, 0.5, 0.75, 1].map(f =>
    skills.map((_, i) => point(i, R * f)).join(' ')
  );
  const dataPath = skills.map((s, i) => point(i, R * s.pct / 100)).join(' ');
  return (
    <svg viewBox="0 0 280 280">
      {grid.map((g, i) => (
        <polygon key={i} points={g} fill="none" stroke="var(--line-warm)" strokeWidth="1" strokeDasharray={i === 3 ? 'none' : '2 3'}/>
      ))}
      {skills.map((_, i) => (
        <line key={i} x1={cx} y1={cy} x2={cx + Math.cos(angle(i)) * R} y2={cy + Math.sin(angle(i)) * R}
              stroke="var(--line-warm)" strokeWidth="1"/>
      ))}
      <polygon points={dataPath} fill="rgba(255,144,47,.22)" stroke="#FF902F" strokeWidth="2.5"/>
      {skills.map((s, i) => (
        <circle key={i} cx={cx + Math.cos(angle(i)) * (R * s.pct / 100)} cy={cy + Math.sin(angle(i)) * (R * s.pct / 100)} r="4" fill="#FF902F" stroke="#fff" strokeWidth="2"/>
      ))}
      {skills.map((s, i) => {
        const lx = cx + Math.cos(angle(i)) * (R + 18);
        const ly = cy + Math.sin(angle(i)) * (R + 18);
        return (
          <text key={i} x={lx} y={ly} fontSize="11" fontWeight="600" fill="var(--fg1)" textAnchor="middle" dominantBaseline="middle" fontFamily="Inter">
            {s.nm}
          </text>
        );
      })}
    </svg>
  );
}

function EmployeeProfile() {
  const [tab, setTab] = React.useState(0);

  // Heatmap: 26 weeks × 7 days = 182 cells
  const heatCells = React.useMemo(() => {
    const cells = [];
    for (let i = 0; i < 182; i++) {
      const v = Math.random();
      // weekends slightly lighter
      const day = i % 7;
      const isWeekend = day === 5 || day === 6;
      cells.push({ v, isWeekend });
    }
    return cells;
  }, []);

  const heatColor = (v, isWeekend) => {
    if (isWeekend && v < 0.4) return 'var(--bg-blush)';
    if (v < 0.2) return 'var(--bg-blush)';
    if (v < 0.4) return 'rgba(255,144,47,.20)';
    if (v < 0.6) return 'rgba(255,144,47,.45)';
    if (v < 0.85) return 'var(--accent-coral)';
    return '#15171A';
  };

  const skills = [
    { nm: 'Bosma operatsiyalari', pct: 95 },
    { nm: 'Mashina texnologiyasi', pct: 88 },
    { nm: 'Sifat nazorati',       pct: 82 },
    { nm: 'Jamoa boshqaruvi',     pct: 72 },
    { nm: 'CAD / Adobe',          pct: 65 },
    { nm: 'Inglizcha',            pct: 38 },
  ];

  const badges = [
    { ic: 'award',  bg: 'linear-gradient(135deg, #FFD56B, #E89B00)', nm: 'Yil eng yaxshisi', yr: '2023' },
    { ic: 'star',   bg: 'linear-gradient(135deg, #FF902F, #EE6A1B)', nm: '5-yillik tajriba', yr: '2024' },
    { ic: 'sparkle',bg: 'linear-gradient(135deg, #7A4FB1, #4D2E80)', nm: 'Sertifikatlangan', yr: '2023' },
    { ic: 'check',  bg: 'linear-gradient(135deg, #2E8A5A, #1F6E45)', nm: '100% Sifat', yr: '2024' },
    { ic: 'users',  bg: 'linear-gradient(135deg, #3563AC, #244781)', nm: 'Smena boshligʻi', yr: '2024' },
    { ic: 'plus',   bg: 'linear-gradient(135deg, #E94560, #C73450)', nm: '128 loyiha', yr: '2024' },
    { ic: 'gift',   bg: 'linear-gradient(135deg, #1A8FAF, #126780)', nm: 'Tezkor yetkazish', yr: '2024' },
    { ic: 'shield', bg: 'linear-gradient(135deg, #15171A, #2A2D33)', nm: 'Xavfsizlik master', yr: '2024' },
  ];

  const timeline = [
    { ic: 'briefcase', bg:'var(--ep-primary)', ttl:'Smena boshligʻiga koʻtarildi',    meta:'15 Yanvar, 2024', desc:'40 ta xodimni boshqaradi, oylik tirajni 38% oshirdi.' },
    { ic: 'award',     bg:'#2E8A5A',          ttl:'"Yil eng yaxshi operatori"',       meta:'12 Dekabr, 2023', desc:'400+ xodim orasidan tanlandi.' },
    { ic: 'star',      bg:'#7A4FB1',          ttl:'Ofset texnologiyasi sertifikati',  meta:'8 Avgust, 2023',  desc:'Yaponiyada 3 hafta — Komori uskunalari boʻyicha.' },
    { ic: 'plus',      bg:'#3563AC',          ttl:'EuroPrint jamoasiga qoʻshildi',    meta:'1 Mart, 2019',    desc:'Junior bosma operatori sifatida.' },
  ];

  return (
    <div data-screen-label="HR · Xodim profili">
      <Topbar
        breadcrumb={<><b>Dashboard</b> &nbsp;/&nbsp; HR &nbsp;/&nbsp; <a>Xodimlar</a> &nbsp;/&nbsp; Alisher Karimov</>}
        title={null}
        actions={
          <>
            <button className="btn btn-secondary"><Icon name="message" size={13}/> Xabar</button>
            <button className="btn btn-secondary"><Icon name="download" size={13}/> CV yuklash</button>
            <button className="btn btn-primary"><Icon name="edit" size={13}/> Tahrirlash</button>
          </>
        }
      />

      <div className="page">
        {/* HERO */}
        <div className="ep-hero">
          <div className="ep-hero-cover">
            <div className="live-tag">Hozir ishda · Mashina P-04</div>
          </div>
          <div className="ep-hero-body">
            <div className="ep-hero-photo">
              AK
              <div className="badge-online"></div>
            </div>
            <div className="ep-hero-info">
              <h1 className="nm">Alisher Karimov</h1>
              <div className="role">
                <span>Bosma operatori · Smena boshligʻi</span>
                <span className="dot"></span>
                <span>Ishlab chiqarish boʻlimi</span>
                <span className="dot"></span>
                <span style={{ fontFamily:'var(--font-mono)' }}>EP-1284</span>
              </div>
              <div className="pills">
                <span className="pill success">Faol</span>
                <span className="pill primary">Tajriba: 5 yil 2 oy</span>
                <span className="pill purple">Sertifikatlangan</span>
                <span className="pill coral">Smena boshligʻi</span>
                <span className="pill neutral">Toshkent shahri</span>
              </div>
            </div>
            <div className="ep-hero-actions">
              <button className="ibtn" style={{ borderRadius: 12 }}><Icon name="phone" size={16}/></button>
              <button className="ibtn" style={{ borderRadius: 12 }}><Icon name="mail" size={16}/></button>
              <button className="ibtn" style={{ borderRadius: 12 }}><Icon name="more" size={16}/></button>
            </div>
          </div>

          {/* KPI RINGS */}
          <div className="ep-kpi-rings">
            <div className="ep-ring">
              <div>
                <div className="label">Davomat (oy)</div>
                <div className="value">96.4<span className="small">%</span></div>
                <div className="delta up"><Icon name="arrow-up" size={10}/> 2.3%</div>
              </div>
              <KpiRing pct={96} color="#2E8A5A"/>
            </div>
            <div className="ep-ring">
              <div>
                <div className="label">KPI baholash</div>
                <div className="value">4.8<span className="small"> / 5.0</span></div>
                <div className="delta up"><Icon name="arrow-up" size={10}/> 0.2</div>
              </div>
              <KpiRing pct={96} color="#FF902F"/>
            </div>
            <div className="ep-ring">
              <div>
                <div className="label">Maqsad bajarilishi</div>
                <div className="value">128<span className="small"> / 140</span></div>
                <div className="delta up"><Icon name="arrow-up" size={10}/> 91%</div>
              </div>
              <KpiRing pct={91} color="#E94560"/>
            </div>
            <div className="ep-ring">
              <div>
                <div className="label">Jamoa baholashi</div>
                <div className="value">4.6<span className="small"> / 5.0</span></div>
                <div className="delta up"><Icon name="arrow-up" size={10}/> 0.4</div>
              </div>
              <KpiRing pct={92} color="#7A4FB1"/>
            </div>
          </div>
        </div>

        <div className="grid-2-1">
          {/* MAIN COLUMN */}
          <div className="row-gap">
            {/* Tabs + personal info */}
            <div className="card hover-lift">
              <div className="tabs" style={{ padding: '12px 22px 0', border: 'none' }}>
                {['Umumiy', 'Hujjatlar', 'Davomat & Maosh', 'KPI & Bajarilgan ishlar', 'Tarix'].map((t, i) => (
                  <button key={t} className={'tab' + (i === tab ? ' active' : '')} onClick={() => setTab(i)}>{t}</button>
                ))}
              </div>

              <div style={{ borderTop: '1px solid var(--line-warm)', padding: '20px 22px' }}>
                <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14 }}>Shaxsiy va ish maʼlumotlari</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: '12px 32px' }}>
                  {[
                    ['Toʻliq F.I.SH',  'Karimov Alisher Bekzodovich'],
                    ['Lavozim',         'Bosma operatori · Smena boshligʻi'],
                    ['Tugʻilgan sana',  '14 Iyun, 1992 (32 yosh)'],
                    ['Boʻlim',          'Ishlab chiqarish'],
                    ['Pasport',         'AA 1283746, MIA 1714'],
                    ['Bevosita rahbar', 'Sardor Hojiyev'],
                    ['JSHSHIR',         '32706142840012'],
                    ['Ishga kirgan',    '01 Mart, 2019 · 5y 2o'],
                    ['Manzil',          'Toshkent, Yunusobod, A.Temur 108'],
                    ['Smena',           'Kunduzgi · 09:00 — 18:00'],
                    ['Oilaviy ahvoli',  'Uylangan · 2 farzand'],
                    ['Maxsus huquqlar', 'Bosma uskunalar · Forklift'],
                  ].map(([k, v]) => (
                    <div key={k} style={{ display: 'grid', gridTemplateColumns: '160px 1fr', gap: 12, fontSize: 13 }}>
                      <span style={{ color: 'var(--fg2)' }}>{k}</span>
                      <span style={{ fontWeight: 500 }}>{v}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Attendance heatmap */}
            <div className="card hover-lift">
              <div className="card-head">
                <div>
                  <div className="card-ttl">Davomat tarixi · 6 oy</div>
                  <div style={{ fontSize: 12, color: 'var(--fg2)', marginTop: 3 }}>
                    <b style={{ color: 'var(--fg1)' }}>168 ish kun</b> · 12 taʼtil · 4 kasallik · 2 kechikish
                  </div>
                </div>
                <div className="seg">
                  <button>3 oy</button>
                  <button className="active">6 oy</button>
                  <button>1 yil</button>
                </div>
              </div>
              <div className="card-body">
                <div className="ep-heatmap">
                  {heatCells.map((c, i) => <div key={i} style={{ background: heatColor(c.v, c.isWeekend) }}/>)}
                </div>
                <div className="ep-heat-legend">
                  <span>Yan</span>
                  <span style={{ flex: 1 }}/>
                  <span>Fev</span>
                  <span style={{ flex: 1 }}/>
                  <span>Mar</span>
                  <span style={{ flex: 1 }}/>
                  <span>Apr</span>
                  <span style={{ flex: 1 }}/>
                  <span>May</span>
                  <span style={{ flex: 1 }}/>
                  <span>Iyn</span>
                </div>
                <div className="ep-heat-legend" style={{ justifyContent: 'flex-end', marginTop: 12 }}>
                  <span>Yo'q</span>
                  <i style={{ background: 'var(--bg-blush)' }}/>
                  <i style={{ background: 'rgba(255,144,47,.20)' }}/>
                  <i style={{ background: 'rgba(255,144,47,.45)' }}/>
                  <i style={{ background: 'var(--accent-coral)' }}/>
                  <i style={{ background: '#15171A' }}/>
                  <span>To'liq smena</span>
                </div>
              </div>
            </div>

            {/* Skills radar */}
            <div className="card hover-lift">
              <div className="card-head">
                <div>
                  <div className="card-ttl">Koʻnikma profili</div>
                  <div style={{ fontSize: 12, color: 'var(--fg2)', marginTop: 3 }}>Oxirgi baholash: 12 Mart, 2024</div>
                </div>
                <button className="card-act">Batafsil <Icon name="chev-rt" size={11}/></button>
              </div>
              <div className="card-body" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, alignItems: 'center' }}>
                <div className="ep-radar"><SkillsRadar skills={skills}/></div>
                <div>
                  {skills.map(s => (
                    <div key={s.nm} className="ep-skill-row">
                      <span className="nm">{s.nm}</span>
                      <span className="meter"><i style={{ width: s.pct + '%' }}/></span>
                      <span style={{ fontSize: 12, fontWeight: 700, width: 32, textAlign:'right', fontFamily:'var(--font-mono)' }}>{s.pct}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Achievements badges grid */}
            <div className="card hover-lift">
              <div className="card-head">
                <div>
                  <div className="card-ttl">Yutuqlar va mukofotlar</div>
                  <div style={{ fontSize: 12, color: 'var(--fg2)', marginTop: 3 }}>8 ta nishon · 5 yillik tajriba</div>
                </div>
                <button className="card-act">Hammasi</button>
              </div>
              <div className="ep-badges">
                {badges.map((b, i) => (
                  <div key={i} className="ep-badge">
                    <div className="medal" style={{ background: b.bg }}><Icon name={b.ic} size={22}/></div>
                    <div className="nm">{b.nm}</div>
                    <div className="yr">{b.yr}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Timeline */}
            <div className="card hover-lift">
              <div className="card-head">
                <div className="card-ttl">Karyera tarixi</div>
                <button className="card-act">Hammasi</button>
              </div>
              <div style={{ padding: '0 22px 18px' }}>
                {timeline.map((t, i) => (
                  <div key={i} className="ep-tl-row">
                    <div className="dot" style={{ background: t.bg }}><Icon name={t.ic} size={15}/></div>
                    <div className="body">
                      <div className="ttl">{t.ttl}</div>
                      <div className="meta">{t.meta}</div>
                      <div className="desc">{t.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* SIDE PANEL */}
          <div className="row-gap">
            {/* AI Insights */}
            <div className="ep-insight">
              <div className="head">
                <div className="ic"><Icon name="sparkle" size={16}/></div>
                <div>
                  <div className="lbl">AI Insight</div>
                  <div className="ttl">Karyera tavsiyalari</div>
                </div>
              </div>
              <div className="point">
                <div className="bullet" style={{ background: 'rgba(46,138,90,.2)', color: '#3FE07A' }}><Icon name="arrow-up" size={12}/></div>
                <div className="body"><b>Promotsiya tayyor:</b> Sex boshqaruvchisi lavozimiga tavsiya — KPI va davomat ko'rsatkichlari yuqori.</div>
              </div>
              <div className="point">
                <div className="bullet" style={{ background: 'rgba(255,144,47,.25)', color: '#FF902F' }}><Icon name="star" size={12}/></div>
                <div className="body"><b>Trening tavsiyasi:</b> Inglizcha — B1 darajaga olib chiqish karyera o'sishini tezlashtiradi.</div>
              </div>
              <div className="point">
                <div className="bullet" style={{ background: 'rgba(233,69,96,.2)', color: '#E94560' }}><Icon name="bell" size={12}/></div>
                <div className="body"><b>Diqqat:</b> Smena boshligʻi sifatida 6 oylik baholash 28 May'ga rejalashtirilgan.</div>
              </div>
            </div>

            {/* Contact */}
            <div className="card hover-lift">
              <div className="card-head"><div className="card-ttl">Aloqa</div></div>
              <div className="card-body" style={{ paddingTop: 0 }}>
                {[
                  { ic:'phone',   lbl:'Telefon',  v:'+998 90 123 45 67' },
                  { ic:'mail',    lbl:'Email',    v:'a.karimov@europrint.uz' },
                  { ic:'pin',     lbl:'Manzil',   v:'Toshkent, Yunusobod, A.Temur 108' },
                  { ic:'message', lbl:'Telegram', v:'@alisher_k' },
                ].map(c => (
                  <div key={c.lbl} className="ep-contact-row">
                    <div className="ic"><Icon name={c.ic} size={14}/></div>
                    <div className="body">
                      <div className="lbl">{c.lbl}</div>
                      <div className="val">{c.v}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Documents */}
            <div className="card hover-lift">
              <div className="card-head">
                <div className="card-ttl">Hujjatlar · 8 ta</div>
                <button className="card-act"><Icon name="plus" size={12}/></button>
              </div>
              <div className="card-body" style={{ paddingTop: 0 }}>
                {[
                  { nm:'Mehnat shartnomasi',  size:'2.4 MB', date:'01 Mart, 2019',   col:'#3563AC' },
                  { nm:'Pasport nusxasi',      size:'1.8 MB', date:'01 Mart, 2019',   col:'#FF902F' },
                  { nm:'Diplom — TDPU',         size:'4.2 MB', date:'15 Iyun, 2014',    col:'#7A4FB1' },
                  { nm:'Ofset sertifikati',     size:'3.1 MB', date:'08 Avgust, 2023', col:'#2E8A5A' },
                ].map(d => (
                  <div key={d.nm} style={{ display:'flex', alignItems:'center', gap:11, padding:'10px 0', borderBottom:'1px solid var(--line-warm-dim)' }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: d.col, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Icon name="pdf" size={15}/>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{d.nm}</div>
                      <div style={{ fontSize: 11, color: 'var(--fg2)', marginTop: 2, fontFamily: 'var(--font-mono)' }}>{d.date} · {d.size}</div>
                    </div>
                    <button className="ibtn" style={{ width: 32, height: 32, borderRadius: 9 }}><Icon name="download" size={14}/></button>
                  </div>
                ))}
              </div>
            </div>

            {/* Team */}
            <div className="card hover-lift">
              <div className="card-head">
                <div className="card-ttl">Smena jamoasi</div>
                <span style={{ fontSize: 11, color: 'var(--fg2)' }}>40 xodim</span>
              </div>
              <div className="card-body" style={{ paddingTop: 0 }}>
                {[
                  { av:'S', avc:'#15171A', nm:'Sardor Hojiyev',    rl:'Direktor', online:true },
                  { av:'D', avc:'#3563AC', nm:'Dilnoza Yusupova',  rl:'Yordamchi', online:true },
                  { av:'B', avc:'#7A4FB1', nm:'Bekzod Rahimov',    rl:'Bosma operator', online:false },
                  { av:'M', avc:'#C45C7A', nm:'Madina Tursunova',  rl:'Sifat nazoratchisi', online:true },
                ].map(p => (
                  <div key={p.nm} style={{ display:'flex', alignItems:'center', gap:11, padding:'10px 0', borderBottom:'1px solid var(--line-warm-dim)' }}>
                    <div style={{ position:'relative' }}>
                      <div className="av" style={{ background: p.avc, width: 34, height: 34, fontSize: 12, marginRight: 0 }}>{p.av}</div>
                      {p.online && <span style={{ position:'absolute', bottom:-1, right:-1, width: 10, height: 10, borderRadius:'50%', background:'#2E8A5A', border:'2px solid #fff' }}/>}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{p.nm}</div>
                      <div style={{ fontSize: 11.5, color: 'var(--fg2)' }}>{p.rl}</div>
                    </div>
                    <button className="ibtn" style={{ width: 30, height: 30, borderRadius: 8 }}><Icon name="message" size={13}/></button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

window.PosMonitor = PosMonitor;
window.CrmKanban = CrmKanban;
window.EmployeeProfile = EmployeeProfile;
