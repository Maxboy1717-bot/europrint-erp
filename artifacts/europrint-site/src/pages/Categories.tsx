/**
 * @module Categories
 * @description Source module. See exports for details.
 */

import { Link } from "wouter";
import { ArrowRight, Printer, BookOpen, Layers, Package, Megaphone, Gift, Shirt, Sparkles } from "lucide-react";

const categories = [
  {
    id: 1,
    title: "Katta Format Bosma",
    desc: "Banner, backlit, flex, mesh, akrilik va boshqa katta format bosma mahsulotlar",
    icon: Printer,
    count: 45,
    iconBg: "bg-orange-50",
    iconColor: "text-orange-500",
    accent: "group-hover:border-orange-300",
  },
  {
    id: 2,
    title: "Ofset Bosma",
    desc: "Kitoblar, jurnalylar, kataloglar, broshyuralar — yuqori sifatli ofset texnologiya",
    icon: BookOpen,
    count: 38,
    iconBg: "bg-blue-50",
    iconColor: "text-blue-500",
    accent: "group-hover:border-blue-300",
  },
  {
    id: 3,
    title: "Raqamli Bosma",
    desc: "Vizitka, buklet, flayer, plakat — tez va sifatli raqamli bosma",
    icon: Layers,
    count: 62,
    iconBg: "bg-green-50",
    iconColor: "text-green-500",
    accent: "group-hover:border-green-300",
  },
  {
    id: 4,
    title: "Qadoqlash",
    desc: "Mahsulot qutilari, kraft paketlar, blister qadoqlash va maxsus yechimlar",
    icon: Package,
    count: 29,
    iconBg: "bg-purple-50",
    iconColor: "text-purple-500",
    accent: "group-hover:border-purple-300",
  },
  {
    id: 5,
    title: "Reklama Materiallari",
    desc: "Roll-up, X-banner, bayroqcha, stiker, POS materiallari va outdoor reklama",
    icon: Megaphone,
    count: 54,
    iconBg: "bg-red-50",
    iconColor: "text-red-500",
    accent: "group-hover:border-red-300",
  },
  {
    id: 6,
    title: "Suvenir Mahsulotlar",
    desc: "Korporativ sovg'alar, logotipli mahsulotlar va brendlangan suvenir",
    icon: Gift,
    count: 33,
    iconBg: "bg-pink-50",
    iconColor: "text-pink-500",
    accent: "group-hover:border-pink-300",
  },
  {
    id: 7,
    title: "Tekstil Bosma",
    desc: "Futbolka, bosh kiyim, sumka va kiyim-kechaklarga bosma",
    icon: Shirt,
    count: 21,
    iconBg: "bg-teal-50",
    iconColor: "text-teal-500",
    accent: "group-hover:border-teal-300",
  },
  {
    id: 8,
    title: "Maxsus Loyihalar",
    desc: "Individual dizayn, korporativ identifikatsiya va noyob bosma yechimlar",
    icon: Sparkles,
    count: 15,
    iconBg: "bg-amber-50",
    iconColor: "text-amber-500",
    accent: "group-hover:border-amber-300",
  },
];

export default function Categories() {
  return (
    <div className="min-h-screen bg-background">

      {/* Page header */}
      <div className="bg-[#1a1a2e] py-16 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <span className="inline-block bg-primary/15 text-primary text-xs font-semibold px-4 py-1.5 rounded-full mb-5 border border-primary/25">
            500+ mahsulot
          </span>
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-4">Mahsulot Kategoriyalari</h1>
          <p className="text-slate-400 max-w-xl mx-auto">
            Barcha bosma ehtiyojlaringiz uchun keng assortiment. Professional yondashuv va kafolatlangan sifat.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {(categories ?? []).map((cat) => {
            const Icon = cat.icon;
            return (
              <Link key={cat.id} href="/products">
                <div className={`group bg-card border border-border rounded-2xl p-6 cursor-pointer hover:-translate-y-1 hover:shadow-lg transition-all duration-200 ${cat.accent}`}>
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-5 ${cat.iconBg}`}>
                    <Icon className={`w-6 h-6 ${cat.iconColor}`} />
                  </div>
                  <h3 className="font-semibold text-foreground text-base mb-2 group-hover:text-primary transition-colors">
                    {cat.title}
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed mb-4">{cat.desc}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground bg-muted px-2.5 py-1 rounded-full">
                      {cat.count} mahsulot
                    </span>
                    <ArrowRight className="w-4 h-4 text-primary group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
