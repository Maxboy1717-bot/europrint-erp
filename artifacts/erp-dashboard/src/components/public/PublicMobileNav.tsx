import { Link, useLocation } from 'wouter';
import { Home, Package, Briefcase, User, ShoppingCart } from 'lucide-react';
import { useLanguage } from '@/lib/public/i18n';

export default function PublicMobileNav() {
  const [location] = useLocation();
  const { t } = useLanguage();

  const navItems = [
    { href: '/site', icon: Home, labelKey: 'nav.home' },
    { href: '/site/catalog', icon: Package, labelKey: 'nav.products' },
    { href: '/site/order', icon: ShoppingCart, labelKey: 'nav.order', isMain: true },
    { href: '/site/about', icon: Briefcase, labelKey: 'nav.about' },
    { href: '/site/contact', icon: User, labelKey: 'nav.contact' },
  ];

  const isActive = (href: string) => {
    if (href === '/site') return location === '/site';
    return location.startsWith(href);
  };

  return (
    <nav 
      className="md:hidden fixed bottom-0 left-0 right-0 z-50"
      style={{ backgroundColor: '#F5F2E8', boxShadow: '0 -4px 20px rgba(0,0,0,0.08)' }}
    >
      <div className="flex items-center justify-around h-20 px-2 safe-area-inset-bottom">
        {(Array.isArray(navItems) ? navItems : []).map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          
          if (item.isMain) {
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-col items-center justify-center -mt-6"
                data-testid="mobile-nav-order"
              >
                <div 
                  className="w-14 h-14 rounded-full flex items-center justify-center shadow-lg"
                  style={{ backgroundColor: '#F97316' }}
                >
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <span 
                  className="text-xs mt-1 font-semibold"
                  style={{ color: '#F97316' }}
                >
                  {t(item.labelKey)}
                </span>
              </Link>
            );
          }
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center justify-center flex-1 h-full pt-2 transition-colors"
              data-testid={`mobile-nav-${item.href.replace('/site/', '') || 'home'}`}
            >
              <Icon 
                className="w-5 h-5" 
                style={{ color: active ? '#4A7C59' : '#9CA3AF' }} 
              />
              <span 
                className="text-xs mt-1.5 font-medium"
                style={{ color: active ? '#4A7C59' : '#6B7280' }}
              >
                {t(item.labelKey)}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
