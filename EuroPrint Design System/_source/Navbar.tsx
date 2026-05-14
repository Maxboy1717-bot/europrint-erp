/**
 * @module Navbar
 * @description Source module. See exports for details.
 */

import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Menu, X, Phone, Mail, ChevronDown, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

const navLinks = [
  { href: "/",           label: "Bosh sahifa" },
  { href: "/categories", label: "Kategoriyalar" },
  { href: "/products",   label: "Mahsulotlar" },
  { href: "/blog",       label: "Blog" },
  { href: "/partners",   label: "Hamkorlar" },
  { href: "/careers",    label: "Vakansiyalar" },
  { href: "/about",      label: "Haqimizda" },
  { href: "/contact",    label: "Aloqa" },
];

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [location] = useLocation();

  return (
    <header className="sticky top-0 z-50 bg-white shadow-[0_1px_0_0_#e8e8ee]">
      {/* Top bar */}
      <div className="bg-[#1a1a2e] text-slate-300 text-xs py-2 px-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-5">
            <a href="tel:+998712000000" className="flex items-center gap-1.5 hover:text-white transition-colors">
              <Phone className="w-3 h-3" />
              +998 71 200 00 00
            </a>
            <a href="mailto:info@europrint.uz" className="hidden sm:flex items-center gap-1.5 hover:text-white transition-colors">
              <Mail className="w-3 h-3" />
              info@europrint.uz
            </a>
          </div>
          <span className="hidden md:block">Dushanba–Shanba: 09:00 – 18:00</span>
        </div>
      </div>

      {/* Main nav */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 flex-shrink-0">
            <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center shadow-sm shadow-primary/30">
              <Printer className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="text-base font-bold text-[#1a1a2e] leading-none">EuroPrint</div>
              <div className="text-[10px] text-muted-foreground leading-none mt-0.5">Bosma yechimlari</div>
            </div>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-1">
            {(navLinks ?? []).map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`
                  text-sm font-medium px-3 py-2 rounded-lg transition-all
                  ${location === link.href
                    ? "text-primary bg-primary/8"
                    : "text-[#444] hover:text-primary hover:bg-primary/5"
                  }
                `}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* CTA */}
          <div className="hidden lg:flex items-center gap-3">
            <Link href="/quote">
              <Button className="bg-primary hover:bg-primary/90 text-white font-semibold px-5 shadow-sm shadow-primary/25 h-9 text-sm">
                Narx so'rash
              </Button>
            </Link>
          </div>

          {/* Mobile toggle */}
          <button
            className="lg:hidden p-2 rounded-lg text-[#444] hover:text-foreground hover:bg-[#f8f9fc] transition-colors"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="lg:hidden bg-white border-t border-border py-4 px-4 shadow-lg">
          <nav className="flex flex-col gap-1 mb-4">
            {(navLinks ?? []).map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`
                  px-4 py-2.5 rounded-xl text-sm font-medium transition-colors
                  ${location === link.href
                    ? "text-primary bg-primary/8"
                    : "text-foreground hover:text-primary hover:bg-[#f8f9fc]"
                  }
                `}
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <Link href="/quote" onClick={() => setMobileOpen(false)}>
            <Button className="w-full bg-primary hover:bg-primary/90 text-white font-semibold">
              Narx so'rash
            </Button>
          </Link>
        </div>
      )}
    </header>
  );
}
