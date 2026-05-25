/**
 * @module Article
 * @description Source module. See exports for details.
 */

import { useRoute, Link } from "wouter";
import { Calendar, Clock, ArrowLeft, Share2, TrendingUp, Leaf, BookOpen, Palette, Award, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";

const categoryIcons: Record<string, React.ElementType> = {
  "Sanoat yangiliklari": TrendingUp,
  "Ekologiya": Leaf,
  "Qo'llanma": BookOpen,
  "Dizayn": Palette,
  "Sifat": Award,
  "Tahlil": BarChart3,
};

const categoryStyles: Record<string, string> = {
  "Sanoat yangiliklari": "bg-primary/10 text-primary border-primary/20",
  "Ekologiya": "bg-green-100 text-green-700 border-green-200",
  "Qo'llanma": "bg-purple-100 text-purple-700 border-purple-200",
  "Dizayn": "bg-pink-100 text-pink-700 border-pink-200",
  "Sifat": "bg-amber-100 text-amber-700 border-amber-200",
};

const articles: Record<string, {
  title: string;
  date: string;
  readTime: string;
  category: string;
  content: string;
}> = {
  "1": {
    title: "2024 yil bosma sanoatidagi eng yangi tendentsiyalar",
    date: "15 mart 2024",
    readTime: "5 daqiqa",
    category: "Sanoat yangiliklari",
    content: `
Raqamli transformatsiya bosma sanoatini keskin o'zgartirmoqda. 2024 yilda biz bir nechta muhim tendentsiyalarni kuzatmoqdamiz.

**1. Shaxsiylashtirish (Personalization)**

Mijozlar endi bir xil, ommaviy bosma materiallardan ko'ra shaxsiylashtirilgan mahsulotlarni afzal ko'rishmoqda. Variable Data Printing (VDP) texnologiyasi har bir nusxani noyob qilish imkoniyatini beradi.

**2. Ekologik materiallar**

CO2 emisyasini kamaytirish talablari kuchayib borayapti. Kompaniyalar qayta ishlangan qog'oz, soya bo'yoqlari va suv bazali laklar bilan ishlashga o'tmoqda.

**3. Raqamli va fizik integratsiya**

QR kodlar, AR (Augmented Reality) elementlari bosma materiallarni interaktiv qilmoqda. Bosma katalog skanerlansa — 3D mahsulot ko'rinishi chiqadi.

**4. Tezkor yetkazib berish**

Mijozlar sabr qila olmaydi. 24 soat ichida yetkazib berish standartga aylanyapti.

**Xulosa:** EuroPrint bu tendentsiyalarga mos ravishda zamonaviy uskunalar va texnologiyalarga sarmoya kiritmoqda.
    `,
  },
};

export default function Article() {
  const [, params] = useRoute("/blog/:id");
  const article = params?.id ? articles[params.id] : null;
  const CategoryIcon = article ? (categoryIcons[article.category] || TrendingUp) : TrendingUp;

  if (!article) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-foreground mb-3">Maqola topilmadi</h2>
          <Link href="/blog">
            <Button variant="outline">Blogga qaytish</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">

      {/* Page Header */}
      <div className="bg-[#1a1a2e] py-16 px-4">
        <div className="max-w-3xl mx-auto">
          <Link href="/blog">
            <button className="flex items-center gap-2 text-sm text-slate-400 hover:text-white mb-6 transition-colors">
              <ArrowLeft className="w-4 h-4" /> Blogga qaytish
            </button>
          </Link>
          <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full mb-4 border ${categoryStyles[article.category] || "bg-primary/10 text-primary border-primary/20"}`}>
            <CategoryIcon className="w-3 h-3" />
            {article.category}
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-4 leading-tight">{article.title}</h1>
          <div className="flex items-center gap-4 text-sm text-slate-400">
            <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4" /> {article.date}</span>
            <span className="flex items-center gap-1.5"><Clock className="w-4 h-4" /> {article.readTime}</span>
            <button className="flex items-center gap-1.5 hover:text-white transition-colors ml-auto">
              <Share2 className="w-4 h-4" /> Ulashish
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">

        {/* Hero banner */}
        <div className="bg-[#1a1a2e]/5 border border-border rounded-2xl h-48 flex items-center justify-center mb-10">
          <div className="text-center">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
              <CategoryIcon className="w-8 h-8 text-primary" />
            </div>
            <span className="text-sm text-muted-foreground font-medium">{article.category}</span>
          </div>
        </div>

        {/* Content */}
        <div className="prose prose-gray max-w-none">
          {article.content.split('\n').map((line, i) => {
            if (line.startsWith('**') && line.endsWith('**')) {
              return (
                <h2 key={`k-${i}`} className="text-xl font-bold text-foreground mt-8 mb-3 flex items-center gap-2">
                  <span className="w-1 h-6 bg-primary rounded-full inline-block" />
                  {line.replace(/\*\*/g, '')}
                </h2>
              );
            }
            if (line.trim()) {
              return <p key={`k-${i}`} className="text-muted-foreground leading-relaxed mb-4">{line}</p>;
            }
            return null;
          })}
        </div>

        {/* Footer */}
        <div className="mt-12 border-t border-border pt-8 flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-foreground mb-1">Ko'proq o'qing</h3>
            <p className="text-sm text-muted-foreground">Barcha maqolalarimizni ko'ring</p>
          </div>
          <Link href="/blog">
            <Button className="bg-primary hover:bg-primary/90 text-white">Barcha maqolalar</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
