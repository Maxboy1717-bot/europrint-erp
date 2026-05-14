/**
 * @module About
 * @description Source module. See exports for details.
 */

import { Link } from "wouter";
import { CheckCircle2, Users, Award, Clock, Building2, Printer, ShieldCheck, ArrowRight, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";

const timeline = [
  { year: "2009", event: "EuroPrint kompaniyasi Toshkentda tashkil topdi" },
  { year: "2012", event: "Birinchi katta format bosma mashinalari sotib olindi" },
  { year: "2015", event: "ISO 9001 sertifikatini oldi" },
  { year: "2018", event: "Yangi ishlab chiqarish majmuasi ochildi (15,000 m²)" },
  { year: "2021", event: "400-chi xodim qabul qilindi" },
  { year: "2024", event: "O'zbekistonning №1 bosma kompaniyasi unvoniga sazovor bo'ldi" },
];

const team = [
  { name: "Alisher Karimov",    role: "Bosh direktor",      initials: "AK" },
  { name: "Nilufar Rashidova",  role: "Marketing direktori", initials: "NR" },
  { name: "Bobur Yusupov",      role: "Texnik direktor",     initials: "BY" },
  { name: "Zulfiya Toshmatova", role: "Moliya direktori",    initials: "ZT" },
];

const highlights = [
  { icon: Users,       label: "400+ xodim" },
  { icon: Award,       label: "ISO 9001 sertifikati" },
  { icon: Clock,       label: "15+ yil tajriba" },
  { icon: Building2,   label: "15,000 m² zavod" },
  { icon: Printer,     label: "50+ bosma mashina" },
  { icon: TrendingUp,  label: "2500+ mijoz" },
];

export default function About() {
  return (
    <div className="min-h-screen bg-background">

      {/* Page header */}
      <div className="bg-[#1a1a2e] py-16 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <span className="inline-block bg-primary/15 text-primary text-xs font-semibold px-4 py-1.5 rounded-full mb-5 border border-primary/25">
            2009 yildan beri
          </span>
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-4">EuroPrint haqida</h1>
          <p className="text-slate-400 max-w-xl mx-auto">
            O'zbekistonda bosma sanoatining rivojlanishiga hissa qo'shib kelmoqdamiz
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-20">

        {/* Mission + Highlights */}
        <div className="grid lg:grid-cols-2 gap-14 items-center">
          <div>
            <span className="inline-block bg-primary/8 text-primary text-xs font-semibold px-4 py-1.5 rounded-full mb-5 border border-primary/15">
              Bizning Missiyamiz
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-5">
              Mijozlarimiz uchun<br />
              <span className="text-primary">eng yaxshi yechim</span>
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              EuroPrint — O'zbekistondagi yetakchi bosma kompaniyasi. Biz mijozlarimizga faqat yuqori sifatli bosma mahsulotlar emas, balki ularning biznesini o'stirishga yordam beruvchi yechimlar taqdim etamiz.
            </p>
            <p className="text-muted-foreground leading-relaxed mb-8">
              Zamonaviy bosma uskunalar parki, ISO 9001 sertifikati va 400+ tajribali xodimlar bilan biz har qanday murakkab loyihani muvaffaqiyatli amalga oshirishga tayyormiz.
            </p>
            <div className="grid sm:grid-cols-2 gap-3">
              {(highlights ?? []).map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-3 bg-[#f8f9fc] border border-border rounded-xl px-4 py-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-4 h-4 text-primary" />
                  </div>
                  <span className="text-sm font-medium text-foreground">{label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white border border-border rounded-3xl p-10 shadow-sm text-center">
            <div className="w-20 h-20 mx-auto mb-5 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Printer className="w-10 h-10 text-primary" />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-2">Zamonaviy Ishlab Chiqarish</h3>
            <p className="text-muted-foreground text-sm mb-8">15,000 m² ishlab chiqarish maydoni, 50+ bosma mashina</p>
            <div className="flex items-center justify-center gap-2 text-sm text-green-600 font-semibold">
              <CheckCircle2 className="w-4 h-4" />
              ISO 9001:2015 sertifikatlangan
            </div>
          </div>
        </div>

        {/* Timeline */}
        <div>
          <div className="text-center mb-12">
            <span className="inline-block bg-primary/8 text-primary text-xs font-semibold px-4 py-1.5 rounded-full mb-4 border border-primary/15">
              Tarixiy Rivojlanish
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground">Bizning Yo'limiz</h2>
          </div>

          <div className="relative">
            <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-px bg-border -translate-x-1/2" />
            <div className="space-y-8">
              {(timeline ?? []).map((item, i) => (
                <div
                  key={item.year}
                  className={`relative flex flex-col md:flex-row gap-6 items-center ${i % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"}`}
                >
                  <div className="hidden md:block absolute left-1/2 w-4 h-4 bg-primary rounded-full -translate-x-1/2 border-4 border-background shadow-sm z-10" />
                  <div className="flex-1 flex md:justify-end">
                    {i % 2 === 0 && (
                      <div className="bg-card border border-border rounded-2xl p-5 shadow-sm w-full md:max-w-xs hover:border-primary/30 transition-colors">
                        <span className="text-primary font-bold text-sm">{item.year}</span>
                        <p className="text-foreground text-sm mt-1 leading-relaxed">{item.event}</p>
                      </div>
                    )}
                  </div>
                  <div className="md:w-8" />
                  <div className="flex-1">
                    {i % 2 !== 0 && (
                      <div className="bg-card border border-border rounded-2xl p-5 shadow-sm w-full md:max-w-xs hover:border-primary/30 transition-colors">
                        <span className="text-primary font-bold text-sm">{item.year}</span>
                        <p className="text-foreground text-sm mt-1 leading-relaxed">{item.event}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Team */}
        <div>
          <div className="text-center mb-12">
            <span className="inline-block bg-primary/8 text-primary text-xs font-semibold px-4 py-1.5 rounded-full mb-4 border border-primary/15">
              Rahbariyat
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground">Bizning Jamoa</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {(team ?? []).map((member) => (
              <div key={member.name} className="bg-card border border-border rounded-2xl p-6 text-center hover:border-primary/30 hover:shadow-md transition-all">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-primary to-orange-400 flex items-center justify-center text-white font-bold text-lg shadow-sm">
                  {member.initials}
                </div>
                <h3 className="font-semibold text-foreground text-sm">{member.name}</h3>
                <p className="text-xs text-muted-foreground mt-1">{member.role}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="bg-gradient-to-br from-[#1a1a2e] to-[#0f3460] rounded-3xl p-10 text-center">
          <div className="w-14 h-14 mx-auto mb-5 rounded-2xl bg-primary/20 flex items-center justify-center">
            <ShieldCheck className="w-7 h-7 text-primary" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-3">Hamkorlik qilishga tayyormisiz?</h2>
          <p className="text-slate-400 mb-7 max-w-md mx-auto">
            Biznes ehtiyojlaringiz uchun individual yechim topamiz. 1 soat ichida javob beramiz.
          </p>
          <Link href="/quote">
            <Button className="bg-primary hover:bg-primary/90 text-white font-semibold px-8 h-12 shadow-lg shadow-primary/30">
              Narx so'rash <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </Link>
        </div>

      </div>
    </div>
  );
}
