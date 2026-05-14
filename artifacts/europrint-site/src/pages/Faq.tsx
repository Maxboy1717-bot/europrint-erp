/**
 * @module Faq
 * @description Source module. See exports for details.
 */

import { useState } from "react";
import { ChevronDown, ChevronUp, MessageCircle, Package, Truck, Palette, CreditCard, RotateCcw, Image, Clock } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

const faqs = [
  {
    icon: Package,
    category: "Buyurtma",
    question: "Minimal buyurtma miqdori qancha?",
    answer: "Mahsulot turiga qarab farqlanadi. Raqamli bosma uchun minimal buyurtma — 1 dona. Ofset bosma uchun — 500 dona. Katta format bosma uchun — 1 m². Muayyan mahsulot bo'yicha aniq ma'lumot uchun menejerimiz bilan bog'laning.",
  },
  {
    icon: Clock,
    category: "Yetkazib berish",
    question: "Buyurtmani qancha vaqtda yetkazib berasiz?",
    answer: "Standart muddatlar: Raqamli bosma — 1-2 ish kuni, Ofset bosma — 3-7 ish kuni, Katta format bosma — 1-3 ish kuni. Shoshilinch buyurtmalar uchun express xizmat mavjud (qo'shimcha to'lov bilan).",
  },
  {
    icon: Palette,
    category: "Dizayn",
    question: "Dizayn xizmatini taqdim etasizmi?",
    answer: "Ha, bizda tajribali dizaynerlar jamoasi bor. Biz brendingizdagi ranglar, shriftlar va uslubga mos materiallar yaratib beramiz. Dizayn narxi alohida kelishiladi. Siz ham tayyor dizayn fayllaringizni yuborishingiz mumkin.",
  },
  {
    icon: Image,
    category: "Texnik",
    question: "Qanday fayl formatlarini qabul qilasiz?",
    answer: "Biz quyidagi formatlarni qabul qilamiz: PDF (CMYK, 300 DPI), AI (Adobe Illustrator), CDR (CorelDRAW). Fayllar CMYK ranglar rejimida va kamida 300 DPI rezolutsiyada bo'lishi kerak.",
  },
  {
    icon: CreditCard,
    category: "To'lov",
    question: "To'lov qanday amalga oshiriladi?",
    answer: "Naqd pul, bank o'tkazmasi (faktura), Payme va Click orqali to'lov qabul qilinadi. Korporativ mijozlar uchun muddatli to'lov imkoniyati mavjud (shartnoma asosida).",
  },
  {
    icon: Truck,
    category: "Yetkazib berish",
    question: "Yetkazib berish xizmati bormi?",
    answer: "Ha, Toshkent shahri bo'ylab yetkazib berish xizmati mavjud. Minimum buyurtma summasidan kelib chiqib, yetkazib berish bepul yoki pulli bo'lishi mumkin. Boshqa shaharlar uchun pochta xizmatlari orqali yuboriladi.",
  },
  {
    icon: Package,
    category: "Sifat",
    question: "Namuna bosib berasizmi?",
    answer: "Ha, katta hajmli buyurtmalardan oldin namunaviy bosib ko'rsatishimiz mumkin. Namuna qiymati odatda tayyor buyurtma narxidan chegirilib tashlanadi.",
  },
  {
    icon: RotateCcw,
    category: "Kafolatlar",
    question: "Qaytarish va almashtirish siyosatiz qanday?",
    answer: "Agar mahsulot sifatsiz yoki buyurtmangizga mos kelmasa, 5 ish kuni ichida murojaat qilishingiz mumkin. Bizning xatoimiz bo'lsa — qayta bosib beramiz. Mijoz xatosi bo'lsa (noto'g'ri fayl) — qisman qaytariladi.",
  },
];

const categories = ["Barchasi", "Buyurtma", "Yetkazib berish", "Dizayn", "Texnik", "To'lov", "Sifat", "Kafolatlar"];

export default function Faq() {
  const [expanded, setExpanded] = useState<number | null>(null);
  const [activeCategory, setActiveCategory] = useState("Barchasi");

  const filtered = activeCategory === "Barchasi" ? (Array.isArray(faqs) ? faqs : []) : (Array.isArray(faqs) ? faqs : []).filter((f) => f.category === activeCategory);

  return (
    <div className="min-h-screen bg-background">

      {/* Page Header */}
      <div className="bg-[#1a1a2e] py-16 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <span className="inline-block bg-primary/15 text-primary text-xs font-semibold px-4 py-1.5 rounded-full mb-5 border border-primary/25">
            Tez-tez so'raladigan savollar
          </span>
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-4">Ko'p so'raladigan savollar</h1>
          <p className="text-slate-400 max-w-xl mx-auto">
            Eng ko'p beriladigan savollarga javoblar
          </p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16">

        {/* Category filters */}
        <div className="flex flex-wrap gap-2 mb-8">
          {(categories ?? []).map((cat) => (
            <button
              key={cat}
              onClick={() => { setActiveCategory(cat); setExpanded(null); }}
              className={`px-3.5 py-1.5 rounded-full text-sm font-medium transition-all border ${
                activeCategory === cat
                  ? "bg-primary text-white border-primary"
                  : "bg-card text-muted-foreground border-border hover:border-primary/40 hover:text-foreground"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Accordion */}
        <div className="space-y-3">
          {(filtered ?? []).map((faq, i) => {
            const globalIndex = faqs.indexOf(faq);
            const isOpen = expanded === globalIndex;
            return (
              <div
                key={`k-${i}`}
                className={`bg-card border rounded-xl overflow-hidden shadow-sm transition-all ${isOpen ? "border-primary/40" : "border-border"}`}
              >
                <button
                  className="w-full flex items-center justify-between p-5 text-left hover:bg-muted/30 transition-colors gap-3"
                  onClick={() => setExpanded(isOpen ? null : globalIndex)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <faq.icon className="w-4 h-4 text-primary" />
                    </div>
                    <span className="font-medium text-foreground">{faq.question}</span>
                  </div>
                  {isOpen
                    ? <ChevronUp className="w-5 h-5 text-primary shrink-0" />
                    : <ChevronDown className="w-5 h-5 text-muted-foreground shrink-0" />
                  }
                </button>
                {isOpen && (
                  <div className="px-5 pb-5 border-t border-border">
                    <p className="text-sm text-muted-foreground leading-relaxed pt-4">{faq.answer}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* CTA */}
        <div className="mt-10 bg-[#1a1a2e] rounded-2xl p-8 text-white text-center">
          <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center mx-auto mb-4">
            <MessageCircle className="w-6 h-6 text-primary" />
          </div>
          <h2 className="text-xl font-bold mb-2">Savolingiz javob topilmadimi?</h2>
          <p className="text-slate-400 text-sm mb-4">Biz bilan to'g'ridan-to'g'ri bog'laning</p>
          <Link href="/contact">
            <Button className="bg-primary hover:bg-primary/90 text-white">
              Aloqa
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
