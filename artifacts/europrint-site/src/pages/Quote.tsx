/**
 * @module Quote
 * @description Source module. See exports for details.
 */

import { useState } from "react";
import { CheckCircle, FileText, Clock, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

const productTypes = [
  "Katta format bosma", "Ofset bosma", "Raqamli bosma", "Qadoqlash",
  "Reklama materiallari", "Tekstil bosma", "Suvenir mahsulotlar", "Boshqa",
];

const highlights = [
  { icon: Clock, label: "24h", sub: "Tez javob" },
  { icon: FileText, label: "0 so'm", sub: "Bepul maslahat" },
  { icon: ShieldCheck, label: "100%", sub: "Maxfiylik" },
];

export default function Quote() {
  const { toast } = useToast();
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    company: "", name: "", phone: "", email: "",
    productType: "", quantity: "", details: "", deadline: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/public/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error || "Xatolik yuz berdi");
      }
      setSubmitted(true);
    } catch (err: unknown) {
      toast({
        title: "Xatolik",
        description: err instanceof Error ? err.message : "So'rov yuborishda muammo yuz berdi.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="bg-green-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-3">So'rovingiz qabul qilindi!</h2>
          <p className="text-muted-foreground mb-6">
            Menegerimiz 1-2 soat ichida siz bilan bog'lanib, narx taklifi yuboradi.
          </p>
          <Button
            onClick={() => {
              setSubmitted(false);
              setForm({ company: "", name: "", phone: "", email: "", productType: "", quantity: "", details: "", deadline: "" });
            }}
            variant="outline"
          >
            Yangi so'rov
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">

      {/* Page Header */}
      <div className="bg-[#1a1a2e] py-16 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <span className="inline-block bg-primary/15 text-primary text-xs font-semibold px-4 py-1.5 rounded-full mb-5 border border-primary/25">
            1-2 soat ichida javob
          </span>
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-4">Narx So'rash</h1>
          <p className="text-slate-400 max-w-xl mx-auto">
            Formani to'ldiring va individual narx taklifini oling
          </p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16">

        {/* Highlights */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {(highlights ?? []).map(({ icon: Icon, label, sub }) => (
            <div key={sub} className="text-center bg-card border border-border rounded-xl p-4">
              <Icon className="w-5 h-5 text-primary mx-auto mb-2" />
              <div className="text-primary font-bold text-lg leading-none">{label}</div>
              <div className="text-sm text-muted-foreground mt-1">{sub}</div>
            </div>
          ))}
        </div>

        {/* Form Card */}
        <div className="bg-card border border-border rounded-2xl p-8 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="company">Kompaniya nomi</Label>
                <Input
                  id="company"
                  value={form.company}
                  onChange={(e) => setForm({ ...form, company: e.target.value })}
                  placeholder="ERP Solutions LLC"
                  required
                />
              </div>
              <div>
                <Label htmlFor="name">Ism-familiya</Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Alisher Karimov"
                  required
                />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="phone">Telefon</Label>
                <Input
                  id="phone"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="+998 90 123 45 67"
                  required
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="email@company.com"
                />
              </div>
            </div>

            <div>
              <Label>Mahsulot turi</Label>
              <Select onValueChange={(v) => setForm({ ...form, productType: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Mahsulot turini tanlang" />
                </SelectTrigger>
                <SelectContent>
                  {(productTypes ?? []).map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="quantity">Miqdor</Label>
                <Input
                  id="quantity"
                  value={form.quantity}
                  onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                  placeholder="1000 dona yoki 50 m²"
                />
              </div>
              <div>
                <Label htmlFor="deadline">Yetkazib berish muddati</Label>
                <Input
                  id="deadline"
                  type="date"
                  value={form.deadline}
                  onChange={(e) => setForm({ ...form, deadline: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="details">Batafsil tavsif</Label>
              <Textarea
                id="details"
                value={form.details}
                onChange={(e) => setForm({ ...form, details: e.target.value })}
                placeholder="O'lcham, rang, material, maxsus talablar..."
                rows={4}
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-primary hover:bg-primary/90 text-white py-3"
              disabled={loading}
            >
              {loading ? "Yuborilmoqda..." : "So'rov yuborish"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
