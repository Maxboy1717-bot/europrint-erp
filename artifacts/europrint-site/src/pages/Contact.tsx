/**
 * @module Contact
 * @description Source module. See exports for details.
 */

import { useState } from "react";
import { Phone, Mail, MapPin, Clock, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

const contactInfo = [
  { icon: MapPin, title: "Manzil", value: "Toshkent sh., Yunusobod tumani, Amir Temur ko'chasi 108" },
  { icon: Phone, title: "Telefon", value: "+998 71 200 00 00" },
  { icon: Mail, title: "Email", value: "info@europrint.uz" },
  { icon: Clock, title: "Ish vaqti", value: "Dush–Juma: 9:00–18:00, Shan: 9:00–15:00" },
];

export default function Contact() {
  const { toast } = useToast();
  const [form, setForm] = useState({ name: "", email: "", phone: "", message: "" });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/public/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error || "Xatolik yuz berdi");
      }
      toast({ title: "Xabar yuborildi!", description: "Tez orada siz bilan bog'lanamiz." });
      setForm({ name: "", email: "", phone: "", message: "" });
    } catch (err: unknown) {
      toast({
        title: "Xatolik",
        description: err instanceof Error ? err.message : "Xabar yuborishda muammo yuz berdi.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">

      {/* Page Header */}
      <div className="bg-[#1a1a2e] py-16 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <span className="inline-block bg-primary/15 text-primary text-xs font-semibold px-4 py-1.5 rounded-full mb-5 border border-primary/25">
            7/24 qo'llab-quvvatlash
          </span>
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-4">Biz bilan bog'laning</h1>
          <p className="text-slate-400 max-w-xl mx-auto">
            Savollaringiz bormi? Sizga yordam berishdan mamnunmiz.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid md:grid-cols-2 gap-12">

          {/* Left: Contact info + map */}
          <div>
            <div className="space-y-5 mb-8">
              {(contactInfo ?? []).map(({ icon: Icon, title, value }) => (
                <div key={title} className="flex items-start gap-4">
                  <div className="bg-primary/10 rounded-xl p-3 shrink-0">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{title}</p>
                    <p className="font-medium text-foreground">{value}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-[#1a1a2e]/5 border border-border rounded-2xl h-56 flex items-center justify-center">
              <div className="text-center text-muted-foreground">
                <MapPin className="w-8 h-8 mx-auto mb-2 text-primary/50" />
                <p className="text-sm">Toshkent, Amir Temur ko'chasi 108</p>
              </div>
            </div>
          </div>

          {/* Right: Form */}
          <div className="bg-card border border-border rounded-2xl p-8 shadow-sm">
            <h2 className="text-xl font-semibold text-foreground mb-6">Xabar yuborish</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Ismingiz</Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="To'liq ismingiz"
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
                  required
                />
              </div>
              <div>
                <Label htmlFor="phone">Telefon</Label>
                <Input
                  id="phone"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="+998 90 123 45 67"
                />
              </div>
              <div>
                <Label htmlFor="message">Xabaringiz</Label>
                <Textarea
                  id="message"
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  placeholder="Savolingiz yoki so'rovingizni yozing..."
                  rows={4}
                  required
                />
              </div>
              <Button
                type="submit"
                className="w-full bg-primary hover:bg-primary/90 text-white"
                disabled={loading}
              >
                {loading ? "Yuborilmoqda..." : (
                  <><Send className="w-4 h-4 mr-2" />Xabar yuborish</>
                )}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
