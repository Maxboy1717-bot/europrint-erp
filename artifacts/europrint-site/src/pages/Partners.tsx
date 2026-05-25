/**
 * @module Partners
 * @description Source module. See exports for details.
 */

import { Link } from "wouter";
import { ArrowRight, Star, Zap, UserCheck, CreditCard, ShoppingCart, Building2, Tv, Plane, Radio, Monitor, ShoppingBag, Droplets } from "lucide-react";
import { Button } from "@/components/ui/button";

const partners = [
  { name: "Uzum Market", category: "E-tijorat", desc: "O'zbekistonning yetakchi onlayn savdo platformasi", icon: ShoppingCart },
  { name: "Hamkorlar Bank", category: "Moliya", desc: "Yetakchi tijorat banki", icon: Building2 },
  { name: "Artel", category: "Elektronika", desc: "Uy maishiy texnika ishlab chiqaruvchisi", icon: Tv },
  { name: "Uzbekistan Airways", category: "Aviatsiya", desc: "Milliy aviakompaniya", icon: Plane },
  { name: "Beeline Uzbekistan", category: "Telekommunikatsiya", desc: "Yetakchi mobil operator", icon: Radio },
  { name: "Texnomart", category: "Chakana savdo", desc: "Elektronika va texnika do'konlar tarmog'i", icon: Monitor },
  { name: "Korzinka", category: "Supermarket", desc: "Yetakchi supermarket tarmog'i", icon: ShoppingBag },
  { name: "Uzsuvta'minot", category: "Kommunal", desc: "Davlat kommunal xizmatlari", icon: Droplets },
];

const benefits = [
  { icon: Star,      title: "Maxsus narxlar", desc: "Doimiy hamkorlar uchun chegirmalar va preferensial narxlar" },
  { icon: Zap,       title: "Ustuvor xizmat",  desc: "Buyurtmalar ustuvor navbatda bajariladi" },
  { icon: UserCheck, title: "Maxsus menejer",  desc: "Har bir hamkorga shaxsiy menejer biriktiriladi" },
  { icon: CreditCard,title: "Muddatli to'lov", desc: "Uzaytirilgan to'lov muddatlari va kredit imkoniyati" },
];

export default function Partners() {
  return (
    <div className="min-h-screen bg-background">

      {/* Page Header */}
      <div className="bg-[#1a1a2e] py-16 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <span className="inline-block bg-primary/15 text-primary text-xs font-semibold px-4 py-1.5 rounded-full mb-5 border border-primary/25">
            Ishonchli hamkorlik
          </span>
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-4">Hamkorlarimiz</h1>
          <p className="text-slate-400 max-w-xl mx-auto">
            O'zbekistondagi yetakchi kompaniyalar bilan ishonchli hamkorlik
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-16">

        {/* Partner grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {(partners ?? []).map(({ name, category, desc, icon: Icon }) => (
            <div
              key={name}
              className="bg-card border border-border rounded-xl p-5 text-center hover:shadow-md hover:border-primary/30 transition-all duration-200 group"
            >
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-3 group-hover:bg-primary/15 transition-colors">
                <Icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground text-sm">{name}</h3>
              <p className="text-xs text-muted-foreground mt-0.5 font-medium">{category}</p>
              <p className="text-xs text-muted-foreground mt-2 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>

        {/* Benefits */}
        <div className="bg-[#1a1a2e]/5 border border-border rounded-2xl p-10">
          <h2 className="text-2xl font-bold text-foreground mb-2 text-center">Hamkor bo'lish afzalliklari</h2>
          <p className="text-muted-foreground text-center mb-8">Korporativ hamkorlik dasturimizga qo'shiling</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {(benefits ?? []).map(({ icon: Icon, title, desc }) => (
              <div key={title} className="bg-card border border-border rounded-xl p-5 shadow-sm">
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">{title}</h3>
                <p className="text-sm text-muted-foreground">{desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="text-center bg-[#1a1a2e] rounded-2xl p-10 text-white">
          <h2 className="text-2xl font-bold mb-3">Hamkor bo'lishga tayyormisiz?</h2>
          <p className="text-slate-400 mb-6">Korporativ hamkorlik shartlarini muhokama qilaylik</p>
          <Link href="/contact">
            <Button className="bg-primary hover:bg-primary/90 text-white">
              Bog'lanish <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </Link>
        </div>

      </div>
    </div>
  );
}
