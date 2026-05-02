import { useRoute, Link } from "wouter";
import { ArrowLeft, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const productData: Record<string, {
  name: string;
  category: string;
  price: string;
  unit: string;
  emoji: string;
  desc: string;
  specs: Record<string, string>;
  features: string[];
}> = {
  "1": {
    name: "Banner (Mesh)",
    category: "Katta format",
    price: "12,000",
    unit: "m²",
    emoji: "🖼️",
    desc: "Tashqi reklama uchun eng ko'p ishlatiladigan material. Shamol o'tkazuvchan tuzilishi tufayli shamol yuk ostida ham chidamli.",
    specs: {
      "Og'irlik": "440 gsm",
      "Material": "PVC mesh",
      "Rezolutsiya": "720-1440 dpi",
      "Ranglar": "CMYK",
      "O'lcham": "Individual, max 5m keng",
    },
    features: [
      "UV nurlariga chidamli",
      "Namlikka bardoshli",
      "Shamol o'tkazuvchan",
      "Engil va ko'chma",
      "Kafolat: 2 yil",
    ],
  },
};

export default function ProductDetail() {
  const [match, params] = useRoute("/products/:id");
  const product = params?.id ? productData[params.id] : null;

  const defaultProduct = {
    name: "Mahsulot",
    category: "Bosma",
    price: "12,000",
    unit: "m²",
    emoji: "🖨️",
    desc: "Yuqori sifatli bosma mahsulot. Batafsil ma'lumot uchun menejerimiz bilan bog'laning.",
    specs: { "Material": "Premium", "Kafolat": "2 yil" },
    features: ["Yuqori sifat", "Tez yetkazib berish", "Individual o'lcham"],
  };

  const p = product || defaultProduct;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <Link href="/products">
        <button className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 mb-6">
          <ArrowLeft className="w-4 h-4" /> Katalogga qaytish
        </button>
      </Link>

      <div className="grid md:grid-cols-2 gap-12">
        <div>
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-3xl flex items-center justify-center h-80 text-8xl mb-4">
            {p.emoji}
          </div>
        </div>

        <div>
          <Badge className="mb-3 bg-blue-100 text-blue-700 border-0">{p.category}</Badge>
          <h1 className="text-3xl font-bold text-gray-900 mb-3">{p.name}</h1>
          <p className="text-gray-500 leading-relaxed mb-6">{p.desc}</p>

          <div className="bg-blue-50 rounded-xl p-4 mb-6">
            <div className="text-3xl font-bold text-blue-700">{p.price} so'm</div>
            <div className="text-gray-500 text-sm">/ {p.unit} (QQS qo'shilgan)</div>
          </div>

          <div className="mb-6">
            <h3 className="font-semibold text-gray-900 mb-3">Xususiyatlar:</h3>
            <div className="space-y-2">
              {p.features?.map((f) => (
                <div key={f} className="flex items-center gap-2 text-sm text-gray-600">
                  <CheckCircle className="w-4 h-4 text-green-500" /> {f}
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <Link href="/quote" className="flex-1">
              <Button className="w-full bg-blue-700 hover:bg-blue-800">Narx so'rash</Button>
            </Link>
            <Link href="/contact">
              <Button variant="outline">Konsultatsiya</Button>
            </Link>
          </div>
        </div>
      </div>

      {Object.keys(p.specs).length > 0 && (
        <div className="mt-12">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Texnik xususiyatlar</h2>
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            {Object.entries(p.specs).map(([key, val], i) => (
              <div key={key} className={`flex justify-between px-5 py-3 text-sm ${i % 2 === 0 ? "bg-gray-50" : "bg-white"}`}>
                <span className="text-gray-500">{key}</span>
                <span className="font-medium text-gray-900">{val}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
