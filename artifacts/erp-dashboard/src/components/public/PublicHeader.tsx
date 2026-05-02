import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { Menu, X } from 'lucide-react';
import { useLanguage } from '@/lib/public/i18n';
import logoImage from '@assets/Logo_Euro_Print_1769616882846.png';

export default function PublicHeader() {
  const [isOpen, setIsOpen] = useState(false);
  const [location] = useLocation();
  const { language, setLanguage, t } = useLanguage();

  const navItems = [
    { href: '/site/catalog', labelKey: 'nav.products' },
    { href: '/site', labelKey: 'nav.home' },
    { href: '/site/about', labelKey: 'nav.about' },
    { href: '/site/portfolio', labelKey: 'nav.portfolio' },
    { href: '/site/contact', labelKey: 'nav.contact' },
  ];

  const isActive = (href: string) => {
    if (href === '/site') return location === '/site';
    return location.startsWith(href);
  };

  return (
    <header className="sticky top-0 z-50" style={{ backgroundColor: '#F5F2E8' }}>
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex items-center justify-between h-24 lg:h-28">
          <Link href="/site" className="flex items-center" data-testid="link-logo">
            <img 
              src={logoImage} 
              alt="EuroPrint Logo" 
              className="h-14 lg:h-16 w-auto"
            />
          </Link>

          <nav className="hidden lg:flex items-center gap-2">
            {(Array.isArray(navItems) ? navItems : []).map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-2.5 px-6 py-3 rounded-full text-base font-medium transition-all duration-200"
                style={{
                  color: '#4A7C59',
                  backgroundColor: isActive(item.href) ? 'rgba(74, 124, 89, 0.1)' : 'transparent',
                }}
                data-testid={`nav-${item.href.replace('/site/', '') || 'home'}`}
              >
                <span 
                  className="w-2 h-2 rounded-full" 
                  style={{ backgroundColor: '#F97316' }} 
                />
                {t(item.labelKey)}
              </Link>
            ))}
          </nav>

          <div className="hidden lg:flex items-center gap-4">
            <button
              onClick={() => setLanguage(language === 'uz' ? 'ru' : 'uz')}
              className="w-12 h-12 rounded-full text-base font-bold flex items-center justify-center transition-all duration-200"
              style={{ backgroundColor: '#4A7C59', color: 'white' }}
              data-testid="button-language-toggle"
            >
              {language === 'uz' ? 'Uz' : 'Ru'}
            </button>
            <Link
              href="/site/contact"
              className="px-8 py-3.5 rounded-full text-base font-semibold transition-all duration-200 active:scale-[0.98]"
              style={{ backgroundColor: '#F97316', color: 'white' }}
              data-testid="link-header-contact"
            >
              {t('nav.connect')}
            </Link>
          </div>

          <button
            onClick={() => setIsOpen(!isOpen)}
            className="lg:hidden p-3 rounded-lg"
            data-testid="button-mobile-menu"
          >
            {isOpen ? (
              <X className="w-7 h-7" style={{ color: '#4A7C59' }} />
            ) : (
              <Menu className="w-7 h-7" style={{ color: '#4A7C59' }} />
            )}
          </button>
        </div>

        {isOpen && (
          <nav className="lg:hidden py-6 border-t" style={{ borderColor: 'rgba(74, 124, 89, 0.2)' }}>
            <div className="space-y-2">
              {(Array.isArray(navItems) ? navItems : []).map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-3 px-4 py-4 text-lg font-medium rounded-lg transition-all duration-200"
                  style={{
                    color: '#4A7C59',
                    backgroundColor: isActive(item.href) ? 'rgba(74, 124, 89, 0.1)' : 'transparent',
                  }}
                  data-testid={`mobile-menu-${item.href.replace('/site/', '') || 'home'}`}
                >
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#F97316' }} />
                  {t(item.labelKey)}
                </Link>
              ))}
            </div>
            <div className="flex items-center gap-4 mt-6 pt-6 border-t" style={{ borderColor: 'rgba(74, 124, 89, 0.2)' }}>
              <button
                onClick={() => setLanguage(language === 'uz' ? 'ru' : 'uz')}
                className="px-5 py-3 rounded-full text-base font-bold"
                style={{ backgroundColor: '#4A7C59', color: 'white' }}
                data-testid="button-mobile-language-toggle"
              >
                {language === 'uz' ? "O'zbekcha" : 'Русский'}
              </button>
              <Link
                href="/site/contact"
                onClick={() => setIsOpen(false)}
                className="flex-1 text-center px-6 py-3 rounded-full text-base font-semibold"
                style={{ backgroundColor: '#F97316', color: 'white' }}
                data-testid="mobile-menu-contact-cta"
              >
                {t('nav.connect')}
              </Link>
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}
