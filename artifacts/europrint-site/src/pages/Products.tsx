import { useState } from "react";
import { Link } from "wouter";
import { Search, Filter, ShoppingCart, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

const categories = ["Barchasi", "Katta format", "Ofset bosma", "Raqamli bosma", "Qadoqlash", "Reklama"];

const CATEGORY_COLORS: Record<string, string> = {
  "Katta format":   "bg-orange-50 text-orange-600",
  "Ofset bosma":    "bg-blue-50 text-blue-600",
  "Raqamli bosma":  "bg-green-50 text-green-600",
  "Qadoqlash":      "bg-purple-50 text-purple-600",
  "Reklama":        "bg-red-50 text-red-600",
};

const products = [
  { id: 1,  name: "Banner (Mesh)",           category: "Katta format",  price: "12,000",    unit: "m²",       icon: "🖼️",  desc: "Tashqi reklama uchun mesh banner, 440gsm" },
  { id: 2,  name: "Lightbox backlit",         category: "Katta format",  price: "25,000",    unit: "m²",       icon: "💡",  desc: "Ichdan yoritiluvchi reklama materiallari" },
  { id: 3,  name: "Vizitka (laminatsiya)",    category: "Raqamli bosma", price: "45,000",    unit: "100 dona", icon: "💳",  desc: "9x5 sm, 350gsm, laminatsiya bilan" },
  { id: 4,  name: "Buklet (A4, 4 bet)",       category: "Ofset bosma",   price: "280,000",   unit: "1000 dona",icon: "📄",  desc: "A4, 4 sahifali buklet, ofset bosma" },
  { id: 5,  name: "Katalog (A4, 24 bet)",     category: "Ofset bosma",   price: "1,200,000", unit: "500 dona", icon: "📚",  desc: "A4 format katalog, 24 sahifa, qattiq muqova" },
  { id: 6,  name: "Roll-up stand",            category: "Reklama",       price: "180,000",   unit: "dona",     icon: "🎪",  desc: "85x200 sm, aluminiy konstruksiya" },
  { id: 7,  name: "Stiker kesish",            category: "Raqamli bosma", price: "8,000",     unit: "m²",       icon: "🏷️",  desc: "Vinyl stiker, konturli kesish" },
  { id: 8,  name: "Mahsulot qutisi",          category: "Qadoqlash",     price: "500",       unit: "dona",     icon: "📦",  desc: "Karton quti, individual dizayn" },
  { id: 9,  name: "Flayer (A5)",              category: "Raqamli bosma", price: "120,000",   unit: "1000 dona",icon: "📋",  desc: "A5 flayer, ikki tomonli bosma" },
  { id: 10, name: "Plakat (A1)",              category: "Katta format",  price: "35,000",    unit: "dona",     icon: "📰",  desc: "A1 format plakat, UV bosma" },
  { id: 11, name: "Paqet kraft",              category: "Qadoqlash",     price: "2,500",     unit: "dona",     icon: "🛍️",  desc: "Kraft qog'oz paket, logotip bilan" },
  { id: 12, name: "Bayroqcha",                category: "Reklama",       price: "15,000",    unit: "dona",     icon: "🚩",  desc: "Matoli bayroq, 50x100 sm" },
];

export default function Products() {
  const [search, setSearch]               = useState("");
  const [activeCategory, setActiveCategory] = useState("Barchasi");

  const filtered = (products ?? []).filter((p) => {
    const matchesCat    = activeCategory === "Barchasi" || p.category === activeCategory;
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-background">

      {/* Page header */}
      <div className="bg-[#1a1a2e] py-16 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <span className="inline-block bg-primary/15 text-primary text-xs font-semibold px-4 py-1.5 rounded-full mb-5 border border-primary/25">
            500+ mahsulot
          </span>
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-4">Mahsulotlar Katalogi</h1>
          <p className="text-slate-400 max-w-xl mx-auto">
            Barcha bosma ehtiyojlaringiz uchun keng assortiment. Professional yondashuv va kafolatlangan sifat.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

        {/* Search + filter */}
        <div className="flex flex-col sm:flex-row gap-3 mb-7">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Mahsulot qidirish..."
              className="pl-10 h-11 rounded-xl"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Button variant="outline" className="h-11 px-5 rounded-xl flex items-center gap-2">
            <Filter className="w-4 h-4" /> Filtr
          </Button>
        </div>

        {/* Category tabs */}
        <div className="flex gap-2 flex-wrap mb-8">
          {(categories ?? []).map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                activeCategory === cat
                  ? "bg-primary text-white shadow-sm shadow-primary/30"
                  : "bg-card border border-border text-muted-foreground hover:text-foreground hover:border-primary/30"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Product grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {(filtered ?? []).map((product) => (
            <Card key={product.id} className="group overflow-hidden border-border hover:border-primary/30 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200">
              <CardContent className="p-0">
                {/* Image area */}
                <div className="bg-[#f8f9fc] flex items-center justify-center text-5xl h-32 border-b border-border">
                  {product.icon}
                </div>
                <div className="p-4">
                  <span className={`inline-block text-xs font-medium px-2.5 py-0.5 rounded-lg mb-2 ${CATEGORY_COLORS[product.category] ?? "bg-muted text-muted-foreground"}`}>
                    {product.category}
                  </span>
                  <h3 className="font-semibold text-foreground mb-1 group-hover:text-primary transition-colors">
                    {product.name}
                  </h3>
                  <p className="text-xs text-muted-foreground mb-4 line-clamp-2 leading-relaxed">
                    {product.desc}
                  </p>
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-primary font-bold text-sm">{product.price} so'm</span>
                      <span className="text-muted-foreground text-xs ml-1">/ {product.unit}</span>
                    </div>
                    <Link href="/quote">
                      <Button size="sm" className="bg-primary hover:bg-primary/90 text-white text-xs h-8 px-3 rounded-lg">
                        <ShoppingCart className="w-3 h-3 mr-1" /> Buyurtma
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-20 text-muted-foreground">
            <Search className="w-12 h-12 mx-auto mb-4 opacity-25" />
            <p className="text-base">Mahsulot topilmadi</p>
            <p className="text-sm mt-1">Qidiruv so'zini o'zgartiring yoki filterni tozalang</p>
          </div>
        )}
      </div>
    </div>
  );
}
