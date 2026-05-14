/**
 * @module Footer
 * @description Source module. See exports for details.
 */

import { Link } from "wouter";
import { Phone, Mail, MapPin, Facebook, Instagram, Send } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-[#1a1a2e] text-gray-300 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-primary rounded flex items-center justify-center text-white font-bold text-sm">EP</div>
              <span className="text-white font-bold text-lg">EuroPrint</span>
            </div>
            <p className="text-sm leading-relaxed">
              O'zbekistondagi yetakchi bosma mahsulotlar ishlab chiqaruvchisi. Katta format bosma, reklama materiallari va qadoqlash yechimlari.
            </p>
            <div className="flex gap-3 mt-4">
              <a href="#" className="text-gray-400 hover:text-primary transition-colors"><Facebook className="w-5 h-5" /></a>
              <a href="#" className="text-gray-400 hover:text-primary transition-colors"><Instagram className="w-5 h-5" /></a>
              <a href="#" className="text-gray-400 hover:text-primary transition-colors"><Send className="w-5 h-5" /></a>
            </div>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">Mahsulotlar</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/categories" className="hover:text-white transition-colors">Katta format bosma</Link></li>
              <li><Link href="/categories" className="hover:text-white transition-colors">Reklama materiallari</Link></li>
              <li><Link href="/categories" className="hover:text-white transition-colors">Qadoqlash</Link></li>
              <li><Link href="/categories" className="hover:text-white transition-colors">Ofset bosma</Link></li>
              <li><Link href="/categories" className="hover:text-white transition-colors">Raqamli bosma</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">Kompaniya</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/about" className="hover:text-white transition-colors">Haqimizda</Link></li>
              <li><Link href="/partners" className="hover:text-white transition-colors">Hamkorlar</Link></li>
              <li><Link href="/careers" className="hover:text-white transition-colors">Vakansiyalar</Link></li>
              <li><Link href="/blog" className="hover:text-white transition-colors">Blog</Link></li>
              <li><Link href="/faq" className="hover:text-white transition-colors">FAQ</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">Aloqa</h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-2">
                <MapPin className="w-4 h-4 mt-0.5 text-primary shrink-0" />
                <span>Toshkent sh., Yunusobod tumani, Amir Temur ko'chasi 108</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-primary shrink-0" />
                <a href="tel:+998712000000" className="hover:text-white transition-colors">+998 71 200 00 00</a>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-primary shrink-0" />
                <a href="mailto:info@europrint.uz" className="hover:text-white transition-colors">info@europrint.uz</a>
              </li>
            </ul>
          </div>
        </div>
      </div>
      <div className="border-t border-white/10 py-4 text-center text-xs text-gray-500">
        © {new Date().getFullYear()} EuroPrint. Barcha huquqlar himoyalangan.
      </div>
    </footer>
  );
}
