/**
 * @module Blog
 * @description Source module. See exports for details.
 */

import { Link } from "wouter";
import { Calendar, Clock, ArrowRight, TrendingUp, Leaf, BookOpen, Palette, Award, BarChart3 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const posts = [
  {
    id: 1,
    title: "2024 yil bosma sanoatidagi eng yangi tendentsiyalar",
    excerpt: "Raqamli transformatsiya bosma sanoatini qanday o'zgartirmoqda? Eng yangi texnologiyalar va mijozlar talablari haqida.",
    category: "Sanoat yangiliklari",
    date: "15 mart 2024",
    readTime: "5 daqiqa",
    icon: TrendingUp,
  },
  {
    id: 2,
    title: "Ekologik bosma: Atrof-muhitga do'st materiallar",
    excerpt: "EuroPrint qanday qilib bosma jarayonida karbon izini kamaytirmoqda va qaysi materiallar eng ekologik hisoblanadi.",
    category: "Ekologiya",
    date: "8 mart 2024",
    readTime: "4 daqiqa",
    icon: Leaf,
  },
  {
    id: 3,
    title: "Katta format bosma: Qanday qilib samarali reklama yaratish",
    excerpt: "Outdoor reklama uchun katta format bosma qoidalari: o'lcham, rezolutsiya, materiallar tanlash bo'yicha amaliy qo'llanma.",
    category: "Qo'llanma",
    date: "1 mart 2024",
    readTime: "7 daqiqa",
    icon: BookOpen,
  },
  {
    id: 4,
    title: "Qadoqlash dizayni: Mahsulot savdosini oshirishning sirri",
    excerpt: "Tadqiqotlar shuni ko'rsatadiki, yaxshi qadoqlash dizayni mahsulot savdosini 35% ga oshirishi mumkin. Nimani hisobga olish kerak?",
    category: "Dizayn",
    date: "22 fevral 2024",
    readTime: "6 daqiqa",
    icon: Palette,
  },
  {
    id: 5,
    title: "ISO 9001: Bosma sanoatida sifat nazoratining ahamiyati",
    excerpt: "EuroPrint ISO 9001 sertifikatini qanday oldi va bu sertifikat mijozlar uchun nima kafolat beradi?",
    category: "Sifat",
    date: "14 fevral 2024",
    readTime: "5 daqiqa",
    icon: Award,
  },
  {
    id: 6,
    title: "Raqamli va ofset bosma: Qaysi birini tanlash kerak?",
    excerpt: "Ikkala texnologiyaning afzalliklari va kamchiliklari, qachon qaysi birini ishlatish maqsadga muvofiq ekanligini tushuntiradi.",
    category: "Qo'llanma",
    date: "5 fevral 2024",
    readTime: "8 daqiqa",
    icon: BarChart3,
  },
];

const tagStyles: Record<string, string> = {
  "Sanoat yangiliklari": "bg-primary/10 text-primary border-primary/20",
  "Ekologiya": "bg-green-100 text-green-700 border-green-200",
  "Qo'llanma": "bg-purple-100 text-purple-700 border-purple-200",
  "Dizayn": "bg-pink-100 text-pink-700 border-pink-200",
  "Sifat": "bg-amber-100 text-amber-700 border-amber-200",
};

export default function Blog() {
  return (
    <div className="min-h-screen bg-background">

      {/* Page Header */}
      <div className="bg-[#1a1a2e] py-16 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <span className="inline-block bg-primary/15 text-primary text-xs font-semibold px-4 py-1.5 rounded-full mb-5 border border-primary/25">
            Foydali maqolalar
          </span>
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-4">Blog va Yangiliklar</h1>
          <p className="text-slate-400 max-w-xl mx-auto">
            Bosma sanoati, dizayn va marketing bo'yicha foydali maqolalar
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {(posts ?? []).map((post) => (
            <Link key={post.id} href={`/blog/${post.id}`}>
              <Card className="hover:shadow-lg transition-all duration-200 cursor-pointer h-full group border border-border">
                <CardContent className="p-6 flex flex-col h-full">
                  <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                    <post.icon className="w-5 h-5 text-primary" />
                  </div>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full inline-flex items-center mb-3 border ${tagStyles[post.category] || "bg-muted text-muted-foreground border-border"}`}>
                    {post.category}
                  </span>
                  <h2 className="font-semibold text-foreground mb-2 group-hover:text-primary transition-colors line-clamp-2 leading-snug">
                    {post.title}
                  </h2>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-4 flex-1 line-clamp-3">{post.excerpt}</p>
                  <div className="flex items-center justify-between text-xs text-muted-foreground pt-4 border-t border-border">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-3 h-3" /> {post.date}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3 h-3" /> {post.readTime}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {/* Load more CTA */}
        <div className="text-center mt-12">
          <p className="text-muted-foreground text-sm mb-4">Ko'proq maqolalar tez orada qo'shiladi</p>
          <Link href="/contact">
            <span className="inline-flex items-center gap-1.5 text-primary text-sm font-medium hover:underline cursor-pointer">
              Yangiliklar uchun obuna bo'ling <ArrowRight className="w-4 h-4" />
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
}
