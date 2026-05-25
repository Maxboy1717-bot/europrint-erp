/* Public site icons & layout components.
   Icon set tuned to Lucide (1.7 stroke, 24 viewbox).
   Source: artifacts/europrint-site/src/{pages/Home,components/layout}.tsx
*/

function SiteIcon({ name, size = 16 }) {
  const paths = {
    'printer':   'M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2M6 14h12v8H6z',
    'file-text': 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M16 13H8M16 17H8M10 9H8',
    'layers':    'M12 2 2 7l10 5 10-5zM2 17l10 5 10-5M2 12l10 5 10-5',
    'package':   'M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16zM3.27 6.96 12 12.01l8.73-5.05M12 22.08V12',
    'megaphone': 'M3 11l18-5v12L3 14v-3zM11 6V19M16 9.5C17.5 9.5 19 11 19 12.5S17.5 15.5 16 15.5',
    'sparkles':  'M12 3 14 9 20 11 14 13 12 19 10 13 4 11 10 9zM5 3v4M3 5h4M19 17v4M17 19h4',
    'arrow-rt':  'M5 12h14M12 5l7 7-7 7',
    'chev-rt':   'M9 18l6-6-6-6',
    'check':     'M22 11.08V12a10 10 0 1 1-5.93-9.14M22 4 12 14.01l-3-3',
    'shield':    'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10zM9 12l2 2 4-4',
    'truck':     'M1 3h15v13H1zM16 8h4l3 3v5h-7zM5.5 21a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5zM18.5 21a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z',
    'clock':     'M12 22a10 10 0 1 1 0-20 10 10 0 0 1 0 20zM12 6v6l4 2',
    'headphone': 'M3 18v-6a9 9 0 0 1 18 0v6M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z',
    'award':     'M12 15a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM8.21 13.89 7 23l5-3 5 3-1.21-9.11',
    'trending':  'M23 6l-9.5 9.5-5-5L1 18M17 6h6v6',
    'users':     'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z',
    'star':      'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z',
    'zap':       'M13 2 3 14h9l-1 8 10-12h-9z',
    'phone':     'M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z',
    'mail':      'M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zM22 6l-10 7L2 6',
    'pin':       'M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0zM12 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
    'fb':        'M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z',
    'ig':        'M16.5 2h-9A5.5 5.5 0 0 0 2 7.5v9A5.5 5.5 0 0 0 7.5 22h9a5.5 5.5 0 0 0 5.5-5.5v-9A5.5 5.5 0 0 0 16.5 2zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zM17.5 7a1 1 0 1 0 0-2 1 1 0 0 0 0 2z',
    'send':      'M22 2 11 13M22 2l-7 20-4-9-9-4z',
  };
  const d = paths[name];
  if (!d) return null;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d={d}/>
    </svg>
  );
}

function UtilityBar() {
  return (
    <div className="utility-bar">
      <div className="container">
        <div className="util-left">
          <a href="tel:+998712000000"><SiteIcon name="phone"/> +998 71 200 00 00</a>
          <a href="mailto:info@europrint.uz"><SiteIcon name="mail"/> info@europrint.uz</a>
        </div>
        <span>Dushanba–Shanba: 09:00 – 18:00</span>
      </div>
    </div>
  );
}

function Navbar() {
  const links = ['Bosh sahifa','Kategoriyalar','Mahsulotlar','Blog','Hamkorlar','Vakansiyalar','Haqimizda','Aloqa'];
  return (
    <nav className="navbar">
      <div className="container">
        <a href="#" className="brand">
          <div className="brand-mark"><img src="../../assets/europrint-mark.png" alt="EuroPrint"/></div>
          <div className="brand-text">
            <div className="brand-name">EUROPRINT</div>
            <div className="brand-sub">Bosma yechimlari</div>
          </div>
        </a>
        <div className="nav-links">
          {links.map((l, i) => (
            <a key={l} href="#" className={i === 0 ? 'active' : ''}>{l}</a>
          ))}
        </div>
        <button className="cta">Narx soʻrash</button>
      </div>
    </nav>
  );
}

/* Count-up hook (mirrors the ERP kit's). */
function useCountUp(target, { duration = 1400, decimals = 0 } = {}) {
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
  return decimals === 0 ? Math.round(v) : v.toFixed(decimals);
}

/* Renders a numeric stat with count-up + suffix preserved (e.g. "2,500+" → counts to 2500 with + suffix). */
function AnimatedNumber({ value, prefix = '', suffix = '', decimals = 0, formatFn }) {
  const n = useCountUp(value, { decimals, duration: 1400 });
  const formatted = formatFn ? formatFn(n) : (typeof n === 'number' ? n.toLocaleString('en-US') : n);
  return <React.Fragment>{prefix}{formatted}{suffix}</React.Fragment>;
}

function Hero() {
  const stats = [
    { ic: 'award',    raw: 15,   suffix: '+',     l: 'Yil tajriba' },
    { ic: 'users',    raw: 2500, suffix: '+',     l: 'Mamnun mijozlar' },
    { ic: 'layers',   raw: 500,  suffix: '+',     l: 'Mahsulot turi' },
    { ic: 'star',     raw: 4.9,  suffix: '',      l: 'Sifat reytingi', decimals: 1 },
  ];

  // Sheen position follows the mouse on hover.
  const onMove = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty('--mx', ((e.clientX - r.left) / r.width * 100) + '%');
    e.currentTarget.style.setProperty('--my', ((e.clientY - r.top)  / r.height * 100) + '%');
  };

  return (
    <section className="hero" data-screen-label="01 Hero">
      <div className="grid-bg"></div>
      <div className="orb1"></div>
      <div className="orb2"></div>
      <div className="orb3"></div>
      <div className="container">
        <div className="hero-left">
          <span className="eyebrow">Oʻzbekistonning №1 bosma kompaniyasi</span>
          <h1>Professional<br/><span className="orange">Bosma Yechimlar</span><br/>sizning biznesingiz uchun</h1>
          <p className="lead">15 yillik tajriba, 400+ xodim, 50+ zamonaviy bosma mashina bilan har qanday murakkab buyurtmani oʻz vaqtida yetkazamiz.</p>
          <div className="hero-cta">
            <button className="cta" style={{ padding: '14px 28px', fontSize: 15 }}>Bepul narx olish <SiteIcon name="arrow-rt" size={17}/></button>
            <button className="cta-ghost-white">Katalogni koʻrish <SiteIcon name="chev-rt"/></button>
          </div>
        </div>
        <div className="hero-stats">
          {stats.map(s => (
            <div key={s.l} className="hero-stat" onMouseMove={onMove}>
              <div className="ic"><SiteIcon name={s.ic} size={21}/></div>
              <div className="val">
                <AnimatedNumber value={s.raw} decimals={s.decimals || 0} suffix={s.suffix}/>
              </div>
              <div className="lbl">{s.l}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Services() {
  const services = [
    { ic: 'printer',   bg:'#FFF1E1', fg:'#FF902F', ttl: 'Katta Format Bosma',   dsc: 'Banner, backlit, flex, mesh — 15,000 m² zamonaviy ishlab chiqarishdan' },
    { ic: 'file-text', bg:'#E7EFFC', fg:'#3563AC', ttl: 'Ofset Bosma',          dsc: 'Kitoblar, kataloglar, jurnalylar — yuqori aniqlikda ofset texnologiya' },
    { ic: 'layers',    bg:'#E4F3EA', fg:'#2E8A5A', ttl: 'Raqamli Bosma',        dsc: 'Vizitka, buklet, flayer — 24 soat ichida tayyor' },
    { ic: 'package',   bg:'#F1EAFA', fg:'#7A4FB1', ttl: 'Qadoqlash',            dsc: 'Mahsulot qutilari, kraft paketlar, blister — individual dizayn' },
    { ic: 'megaphone', bg:'#FCE6E1', fg:'#C0432F', ttl: 'Reklama Materiallari', dsc: 'Roll-up, X-banner, bayroqcha, stiker, POS materiallari' },
    { ic: 'sparkles',  bg:'#FAF1DD', fg:'#B5891C', ttl: 'Maxsus Loyihalar',     dsc: 'Korporativ identifikatsiya, noyob bosma, individual yechimlar' },
  ];
  return (
    <section className="section" data-screen-label="02 Xizmatlar">
      <div className="container">
        <div className="section-head">
          <span className="section-eyebrow">Bizning Xizmatlar</span>
          <h2>Har qanday bosma ehtiyojingiz</h2>
          <p className="lead">Kichik tirazdan yirik sanoat buyurtmalarigacha — barchasini bir joyda</p>
        </div>
        <div className="svc-grid">
          {services.map(s => (
            <div key={s.ttl} className="svc-card">
              <div className="svc-icn" style={{ background: s.bg, color: s.fg }}>
                <SiteIcon name={s.ic} size={24}/>
              </div>
              <h3 className="svc-ttl">{s.ttl}</h3>
              <p className="svc-dsc">{s.dsc}</p>
            </div>
          ))}
        </div>
        <div style={{ textAlign: 'center', marginTop: 40 }}>
          <button className="cta-outline" style={{ padding: '12px 26px', fontSize: 14 }}>Barcha xizmatlar <SiteIcon name="arrow-rt"/></button>
        </div>
      </div>
    </section>
  );
}

function WhyUs() {
  const features = [
    { ic: 'shield',    txt: 'ISO 9001:2015 sertifikatlangan' },
    { ic: 'zap',       txt: 'Zamonaviy bosma uskunalar parki' },
    { ic: 'headphone', txt: "24/7 mijozlar qoʻllab-quvvatlash" },
    { ic: 'truck',     txt: 'Tez yetkazib berish, kechiktirmasdan' },
    { ic: 'trending',  txt: 'Raqobatbardosh narxlar' },
    { ic: 'award',     txt: 'Bepul dizayn maslahati' },
  ];
  return (
    <section className="section cool" data-screen-label="03 Nima uchun biz">
      <div className="container why-grid">
        <div>
          <span className="section-eyebrow">Nima uchun EuroPrint?</span>
          <h2>Biznes hamkoringiz,<br/><span className="orange">nafaqat printeringiz</span></h2>
          <p className="lead" style={{ marginTop: 14, maxWidth: 480 }}>Faqat bosma xizmati emas — korporativ identifikatsiyadan marketing materiallarigacha toʻliq kompleks yechim taqdim etamiz.</p>
          <div className="why-features">
            {features.map(f => (
              <div key={f.txt} className="why-feat">
                <div className="ic"><SiteIcon name={f.ic} size={16}/></div>
                <span className="txt">{f.txt}</span>
              </div>
            ))}
          </div>
          <button className="cta-dark" style={{ marginTop: 28, padding: '11px 24px' }}>Koʻproq bilish <SiteIcon name="arrow-rt"/></button>
        </div>
        <div className="factory-card">
          <div className="big-ic"><SiteIcon name="printer" size={38}/></div>
          <h3>Zamonaviy Ishlab Chiqarish</h3>
          <p>15,000 m² ishlab chiqarish maydonida 400+ xodim</p>
          <div className="factory-mini">
            <div className="item"><div className="v">50+</div><div className="l">Bosma mashina</div></div>
            <div className="item"><div className="v">400+</div><div className="l">Xodim</div></div>
            <div className="item"><div className="v">24/7</div><div className="l">Ishlab chiqarish</div></div>
          </div>
          <div className="factory-iso"><SiteIcon name="check" size={16}/> ISO 9001:2015 sertifikatlangan</div>
        </div>
      </div>
    </section>
  );
}

function TrustBar() {
  const stats = [
    { ic:'clock',    raw: 15,   suffix: '+',    l: 'Yil bozorda' },
    { ic:'users',    raw: 2500, suffix: '+',    l: 'Mijozlar' },
    { ic:'truck',    raw: 98,   suffix: '%',    l: 'Vaqtida yetkazish' },
    { ic:'star',     raw: 4.9,  suffix: ' ★',   l: 'Oʻrtacha baho', decimals: 1 },
  ];
  return (
    <section className="trust-bar" data-screen-label="04 Ishonch">
      <div className="container">
        <div className="trust-grid">
          {stats.map(s => (
            <div key={s.l}>
              <SiteIcon name={s.ic} size={22}/>
              <div className="v"><AnimatedNumber value={s.raw} decimals={s.decimals || 0} suffix={s.suffix}/></div>
              <div className="l">{s.l}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CtaSection() {
  return (
    <section className="cta-section" data-screen-label="05 CTA">
      <div className="container">
        <div className="cta-block">
          <div className="orb-a"></div>
          <div className="orb-b"></div>
          <div className="inner">
            <span className="badge">Hoziroq boshlang</span>
            <h2>Loyihangizni boshlashga tayyormisiz?</h2>
            <p>Bepul maslahat va aniq narx hisoblash uchun hoziroq murojaat qiling. 1 soat ichida javob beramiz.</p>
            <div className="cta-row">
              <button className="cta-white">Bepul narx olish <SiteIcon name="arrow-rt" size={17}/></button>
              <button className="cta-ghost-white">Bogʻlanish</button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="footer" data-screen-label="06 Footer">
      <div className="container">
        <div className="foot-grid">
          <div>
            <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:16 }}>
              <img src="../../assets/europrint-mark.png" alt="" style={{ width:38, height:38 }}/>
              <span className="brand-name">EUROPRINT</span>
            </div>
            <p>Oʻzbekistondagi yetakchi bosma mahsulotlar ishlab chiqaruvchisi. Katta format bosma, reklama materiallari va qadoqlash yechimlari.</p>
            <div className="foot-social">
              <a href="#"><SiteIcon name="fb"/></a>
              <a href="#"><SiteIcon name="ig"/></a>
              <a href="#"><SiteIcon name="send"/></a>
            </div>
          </div>
          <div>
            <h4>Mahsulotlar</h4>
            <ul>
              <li><a href="#">Katta format bosma</a></li>
              <li><a href="#">Reklama materiallari</a></li>
              <li><a href="#">Qadoqlash</a></li>
              <li><a href="#">Ofset bosma</a></li>
              <li><a href="#">Raqamli bosma</a></li>
            </ul>
          </div>
          <div>
            <h4>Kompaniya</h4>
            <ul>
              <li><a href="#">Haqimizda</a></li>
              <li><a href="#">Hamkorlar</a></li>
              <li><a href="#">Vakansiyalar</a></li>
              <li><a href="#">Blog</a></li>
              <li><a href="#">FAQ</a></li>
            </ul>
          </div>
          <div>
            <h4>Aloqa</h4>
            <ul style={{ gap: 14 }}>
              <li className="foot-contact"><SiteIcon name="pin"/><span>Toshkent sh., Yunusobod tumani, Amir Temur koʻchasi 108</span></li>
              <li className="foot-contact"><SiteIcon name="phone"/><a href="tel:+998712000000">+998 71 200 00 00</a></li>
              <li className="foot-contact"><SiteIcon name="mail"/><a href="mailto:info@europrint.uz">info@europrint.uz</a></li>
            </ul>
          </div>
        </div>
      </div>
      <div className="foot-bot">© 2026 EuroPrint. Barcha huquqlar himoyalangan.</div>
    </footer>
  );
}

window.UtilityBar = UtilityBar;
window.Navbar = Navbar;
window.Hero = Hero;
window.Services = Services;
window.WhyUs = WhyUs;
window.TrustBar = TrustBar;
window.CtaSection = CtaSection;
window.Footer = Footer;
