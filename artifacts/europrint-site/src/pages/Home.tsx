/**
 * @module Home
 * @description Source module. See exports for details.
 */

import { Link } from "wouter";
import {
  ArrowRight, CheckCircle2, Printer, Package, Megaphone,
  FileText, Layers, Sparkles, ShieldCheck, Truck,
  Clock, Headphones, Award, TrendingUp, Users, Star,
  ChevronRight, Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const services = [
  {
    icon: Printer,
    title: "Katta Format Bosma",
    desc: "Banner, backlit, flex, mesh — 15,000 m² zamonaviy ishlab chiqarishdan",
    color: "bg-orange-50 text-orange-500",
  },
  {
    icon: FileText,
    title: "Ofset Bosma",
    desc: "Kitoblar, kataloglar, jurnalylar — yuqori aniqlikda ofset texnologiya",
    color: "bg-blue-50 text-blue-500",
  },
  {
    icon: Layers,
    title: "Raqamli Bosma",
    desc: "Vizitka, buklet, flayer — 24 soat ichida tayyor",
    color: "bg-green-50 text-green-500",
  },
  {
    icon: Package,
    title: "Qadoqlash",
    desc: "Mahsulot qutilari, kraft paketlar, blister — individual dizayn",
    color: "bg-purple-50 text-purple-500",
  },
  {
    icon: Megaphone,
    title: "Reklama Materiallari",
    desc: "Roll-up, X-banner, bayroqcha, stiker, POS materiallari",
    color: "bg-red-50 text-red-500",
  },
  {
    icon: Sparkles,
    title: "Maxsus Loyihalar",
    desc: "Korporativ identifikatsiya, noyob bosma, individual yechimlar",
    color: "bg-amber-50 text-amber-500",
  },
];

const features = [
  { icon: ShieldCheck,  text: "ISO 9001:2015 sertifikatlangan" },
  { icon: Zap,          text: "Zamonaviy bosma uskunalar parki" },
  { icon: Headphones,   text: "24/7 mijozlar qo'llab-quvvatlash" },
  { icon: Truck,        text: "Tez yetkazib berish, kechiktirmasdan" },
  { icon: TrendingUp,   text: "Raqobatbardosh narxlar" },
  { icon: Award,        text: "Bepul dizayn maslahati" },
];

const stats = [
  { value: "15+",    label: "Yil tajriba",     icon: Award },
  { value: "2,500+", label: "Mamnun mijozlar",  icon: Users },
  { value: "500+",   label: "Mahsulot turi",    icon: Layers },
  { value: "4.9",    label: "Sifat reytingi",   icon: Star },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-background">

      {/* ══ HERO ══════════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden bg-[#1a1a2e] py-24 px-4">
        {/* Decorative circles */}
        <div className="pointer-events-none absolute -top-32 -right-32 w-96 h-96 rounded-full bg-primary/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-24 w-72 h-72 rounded-full bg-blue-500/10 blur-3xl" />

        <div className="relative max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
          {/* Left */}
          <div>
            <span className="inline-flex items-center gap-1.5 bg-primary/15 text-primary border border-primary/25 text-xs font-semibold px-3 py-1 rounded-full mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              O'zbekistonning №1 bosma kompaniyasi
            </span>

            <h1 className="text-4xl sm:text-5xl font-bold text-white leading-tight mb-6">
              Professional<br />
              <span className="text-primary">Bosma Yechimlar</span><br />
              sizning biznesingiz uchun
            </h1>

            <p className="text-slate-300 text-lg leading-relaxed mb-10 max-w-lg">
              15 yillik tajriba, 400+ xodim, 50+ zamonaviy bosma mashina bilan
              har qanday murakkab buyurtmani o'z vaqtida yetkazamiz.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/quote">
                <Button size="lg" className="bg-primary hover:bg-primary/90 text-white font-semibold h-13 px-8 text-base shadow-lg shadow-primary/30">
                  Bepul narx olish <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <Link href="/products">
                <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10 h-13 px-8 text-base">
                  Katalogni ko'rish <ChevronRight className="ml-1 w-4 h-4" />
                </Button>
              </Link>
            </div>
          </div>

          {/* Right — Stats grid */}
          <div className="grid grid-cols-2 gap-4">
            {(stats ?? []).map(({ value, label, icon: Icon }) => (
              <div
                key={label}
                className="bg-white/5 border border-white/10 backdrop-blur-sm rounded-2xl p-6 text-center hover:bg-white/10 transition-colors"
              >
                <div className="w-11 h-11 mx-auto mb-3 rounded-xl bg-primary/20 flex items-center justify-center">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <div className="text-3xl font-bold text-white mb-1">{value}</div>
                <div className="text-slate-400 text-sm">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ SERVICES ═════════════════════════════════════════════════════ */}
      <section className="py-24 px-4 bg-background">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <span className="inline-block bg-primary/8 text-primary text-xs font-semibold px-4 py-1.5 rounded-full mb-4 border border-primary/15">
              Bizning Xizmatlar
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              Har qanday bosma ehtiyojingiz
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Kichik tirazdan yirik sanoat buyurtmalarigacha — barchasini bir joyda
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {(services ?? []).map(({ icon: Icon, title, desc, color }) => (
              <div
                key={title}
                className="group bg-card border border-border rounded-2xl p-7 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-1 transition-all duration-200 cursor-pointer"
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-5 ${color}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="font-semibold text-foreground text-lg mb-2 group-hover:text-primary transition-colors">
                  {title}
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>

          <div className="text-center mt-10">
            <Link href="/categories">
              <Button variant="outline" size="lg" className="border-primary/40 text-primary hover:bg-primary hover:text-white transition-colors">
                Barcha xizmatlar <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ══ WHY US ═══════════════════════════════════════════════════════ */}
      <section className="py-24 px-4 bg-[#f8f9fc]">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
          {/* Left */}
          <div>
            <span className="inline-block bg-primary/8 text-primary text-xs font-semibold px-4 py-1.5 rounded-full mb-4 border border-primary/15">
              Nima uchun EuroPrint?
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-5">
              Biznes hamkoringiz,<br />
              <span className="text-primary">nafaqat printeringiz</span>
            </h2>
            <p className="text-muted-foreground text-base leading-relaxed mb-8 max-w-lg">
              Faqat bosma xizmati emas — korporativ identifikatsiyadan marketing materiallarigacha
              to'liq kompleks yechim taqdim etamiz.
            </p>
            <div className="grid sm:grid-cols-2 gap-3">
              {(features ?? []).map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-3 bg-white rounded-xl border border-border px-4 py-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-4 h-4 text-primary" />
                  </div>
                  <span className="text-sm font-medium text-foreground">{text}</span>
                </div>
              ))}
            </div>
            <Link href="/about">
              <Button className="mt-8 bg-[#1a1a2e] hover:bg-[#16213e] text-white px-8">
                Ko'proq bilish <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
          </div>

          {/* Right — Factory card */}
          <div className="bg-white border border-border rounded-3xl p-10 shadow-sm">
            <div className="text-center">
              <div className="w-20 h-20 mx-auto mb-5 rounded-2xl bg-primary/10 flex items-center justify-center">
                <Printer className="w-10 h-10 text-primary" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">Zamonaviy Ishlab Chiqarish</h3>
              <p className="text-muted-foreground text-sm mb-8">15,000 m² ishlab chiqarish maydonida 400+ xodim</p>

              <div className="grid grid-cols-3 gap-4">
                {([
                  { value: "50+",   label: "Bosma mashina" },
                  { value: "400+",  label: "Xodim" },
                  { value: "24/7",  label: "Ishlab chiqarish" },
                ]).map(({ value, label }) => (
                  <div key={label} className="bg-[#f8f9fc] rounded-xl p-4">
                    <div className="text-2xl font-bold text-primary mb-0.5">{value}</div>
                    <div className="text-xs text-muted-foreground">{label}</div>
                  </div>
                ))}
              </div>

              <div className="mt-6 flex items-center justify-center gap-2 text-sm text-green-600 font-medium">
                <CheckCircle2 className="w-4 h-4" />
                ISO 9001:2015 sertifikatlangan
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══ TRUST BAR ════════════════════════════════════════════════════ */}
      <section className="bg-[#1a1a2e] py-16 px-4">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {([
            { value: "15+",    label: "Yil bozorda",      icon: Clock },
            { value: "2,500+", label: "Mijozlar",          icon: Users },
            { value: "98%",    label: "Vaqtida yetkazish", icon: Truck },
            { value: "4.9 ★",  label: "O'rtacha baho",     icon: Star },
          ]).map(({ value, label, icon: Icon }) => (
            <div key={label}>
              <Icon className="w-6 h-6 text-primary mx-auto mb-3" />
              <div className="text-3xl font-bold text-white mb-1">{value}</div>
              <div className="text-slate-400 text-sm">{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ══ CTA ══════════════════════════════════════════════════════════ */}
      <section className="py-24 px-4 bg-background">
        <div className="max-w-4xl mx-auto">
          <div className="bg-gradient-to-br from-primary via-orange-500 to-amber-400 rounded-3xl p-12 text-center relative overflow-hidden">
            <div className="pointer-events-none absolute -top-16 -right-16 w-64 h-64 rounded-full bg-white/10 blur-2xl" />
            <div className="pointer-events-none absolute -bottom-12 -left-12 w-48 h-48 rounded-full bg-white/10 blur-2xl" />
            <div className="relative">
              <span className="inline-block bg-white/20 text-white text-xs font-semibold px-4 py-1.5 rounded-full mb-5">
                Hoziroq boshlang
              </span>
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                Loyihangizni boshlashga tayyormisiz?
              </h2>
              <p className="text-white/85 text-lg mb-8 max-w-xl mx-auto">
                Bepul maslahat va aniq narx hisoblash uchun hoziroq murojaat qiling. 1 soat ichida javob beramiz.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/quote">
                  <Button size="lg" className="bg-white text-primary hover:bg-white/90 font-bold h-13 px-10 text-base shadow-xl">
                    Bepul narx olish <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </Link>
                <Link href="/contact">
                  <Button size="lg" variant="outline" className="border-white/50 text-white hover:bg-white/15 h-13 px-8 text-base">
                    Bog'lanish
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
