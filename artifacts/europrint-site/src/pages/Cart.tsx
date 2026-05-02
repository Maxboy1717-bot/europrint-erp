import { useState } from "react";
import { Link } from "wouter";
import { ShoppingCart, Trash2, Plus, Minus, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const initialItems = [
  { id: 1, name: "Banner (Mesh) — 3x2m", price: 72000, qty: 2, unit: "dona" },
  { id: 2, name: "Vizitka (laminatsiya) — 100 dona", price: 45000, qty: 1, unit: "to'plam" },
];

export default function Cart() {
  const [items, setItems] = useState(initialItems);

  const updateQty = (id: number, delta: number) => {
    setItems((prev) =>
      (prev ?? []).map((item) =>
        item.id === id ? { ...item, qty: Math.max(1, item.qty + delta) } : item
      )
    );
  };

  const remove = (id: number) => setItems((prev) => (prev ?? []).filter((item) => item.id !== id));

  const total = (items ?? []).reduce((sum, item) => sum + item.price * item.qty, 0);

  if (items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-24 text-center">
        <ShoppingCart className="w-16 h-16 mx-auto text-gray-300 mb-6" />
        <h2 className="text-2xl font-bold text-gray-900 mb-3">Savatcha bo'sh</h2>
        <p className="text-gray-500 mb-6">Mahsulot tanlashni boshlang</p>
        <Link href="/products">
          <Button className="bg-blue-700 hover:bg-blue-800">Katalogga o'tish</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
      <h1 className="text-2xl font-bold text-gray-900 mb-8 flex items-center gap-2">
        <ShoppingCart className="w-6 h-6" /> Savatcha ({items.length} mahsulot)
      </h1>

      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-4">
          {(items ?? []).map((item) => (
            <div key={item.id} className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-4">
              <div className="bg-blue-50 rounded-lg w-16 h-16 flex items-center justify-center text-2xl shrink-0">
                🖨️
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-gray-900 text-sm">{item.name}</h3>
                <p className="text-blue-700 font-semibold mt-1">
                  {(item.price * item.qty).toLocaleString()} so'm
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => updateQty(item.id, -1)}
                  className="w-7 h-7 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-50"
                >
                  <Minus className="w-3 h-3" />
                </button>
                <span className="w-6 text-center text-sm font-medium">{item.qty}</span>
                <button
                  onClick={() => updateQty(item.id, 1)}
                  className="w-7 h-7 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-50"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>
              <button
                onClick={() => remove(item.id)}
                className="text-gray-300 hover:text-red-500 transition-colors ml-2"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-6 h-fit shadow-sm">
          <h2 className="font-semibold text-gray-900 mb-4">Jami</h2>
          <div className="space-y-2 text-sm mb-4">
            {(items ?? []).map((item) => (
              <div key={item.id} className="flex justify-between text-gray-500">
                <span>{item.name} × {item.qty}</span>
                <span>{(item.price * item.qty).toLocaleString()}</span>
              </div>
            ))}
          </div>
          <div className="border-t border-gray-100 pt-4 mb-6">
            <div className="flex justify-between font-bold text-gray-900">
              <span>Jami summa:</span>
              <span>{total.toLocaleString()} so'm</span>
            </div>
          </div>
          <Link href="/quote">
            <Button className="w-full bg-blue-700 hover:bg-blue-800">
              Buyurtma berish <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </Link>
          <Link href="/products">
            <Button variant="outline" className="w-full mt-2">Xaridni davom ettirish</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
