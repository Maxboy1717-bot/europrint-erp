/**
 * @module PublicFooter
 * @description React UI component.
 */

import { Link } from 'wouter';
import { Phone, Mail, MapPin, Send } from 'lucide-react';
import { useLanguage } from '@/lib/public/i18n';
import logoImage from '@assets/Logo_Euro_Print_1769616882846.png';

import { useTranslation } from '@/lib/i18n';
export default function PublicFooter() {
  const { t } = useTranslation('common');
  const currentYear = new Date().getFullYear();

  const links = [
    { href: '/site/catalog', labelKey: 'nav.products' },
    { href: '/site/about', labelKey: 'nav.about' },
    { href: '/site/portfolio', labelKey: 'nav.portfolio' },
    { href: '/site/contact', labelKey: 'nav.contact' },
  ];

  return (
    <footer className="hidden md:block" style={{ backgroundColor: '#4A7C59' }}>
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="md:col-span-1">
            <div className="mb-6">
              <img 
                src={logoImage} 
                alt={t("europrintLogo")} 
                className="h-12 w-auto brightness-0 invert"
              />
            </div>
            <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.7)' }}>
              {t('footer.description')}
            </p>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-white mb-6 uppercase tracking-wider">
              {t('nav.navigation')}
            </h4>
            <ul className="space-y-4">
              {(Array.isArray(links) ? links : []).map((link) => (
                <li key={link.href}>
                  <Link 
                    href={link.href} 
                    className="text-sm transition-colors duration-200 hover:text-white"
                    style={{ color: 'rgba(255,255,255,0.7)' }}
                    data-testid={`footer-link-${link.href.replace('/site/', '')}`}
                  >
                    {t(link.labelKey)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-white mb-6 uppercase tracking-wider">
              {t('nav.connect')}
            </h4>
            <ul className="space-y-4">
              <li>
                <a 
                  href="tel:+998712345678" 
                  className="flex items-center gap-3 text-sm transition-colors duration-200 hover:text-white"
                  style={{ color: 'rgba(255,255,255,0.7)' }}
                  data-testid="footer-link-phone"
                >
                  <Phone className="w-4 h-4" />
                  +998 71 234 56 78
                </a>
              </li>
              <li>
                <a 
                  href="mailto:info@europrint.uz" 
                  className="flex items-center gap-3 text-sm transition-colors duration-200 hover:text-white"
                  style={{ color: 'rgba(255,255,255,0.7)' }}
                  data-testid="footer-link-email"
                >
                  <Mail className="w-4 h-4" />
                  info@europrint.uz
                </a>
              </li>
              <li className="flex items-start gap-3 text-sm" style={{ color: 'rgba(255,255,255,0.7)' }}>
                <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{t('contact.addressValue')}</span>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-white mb-6 uppercase tracking-wider">
              {t('nav.subscribe')}
            </h4>
            <p className="text-sm mb-4" style={{ color: 'rgba(255,255,255,0.7)' }}>
              {t('nav.subscribeDesc')}
            </p>
            <form className="flex gap-2">
              <input
                type="email"
                placeholder={t('email1')}
                className="flex-1 px-4 py-3 rounded-lg text-sm bg-card/10 text-white placeholder-white/50 border border-white/20 focus:outline-none focus:border-white/40"
                data-testid="input-footer-email"
              />
              <button 
                type="submit"
                className="px-4 py-3 rounded-lg transition-all duration-200 active:scale-95"
                style={{ backgroundColor: '#F97316' }}
                data-testid="button-footer-subscribe"
              >
                <Send className="w-4 h-4 text-white" />
              </button>
            </form>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-white/20 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
            © {currentYear} Europrint. {t('footer.rights')}
          </p>
          <div className="flex gap-6">
            <a href="#" className="text-sm transition-colors duration-200 hover:text-white" style={{ color: 'rgba(255,255,255,0.5)' }} data-testid="footer-link-telegram">
              {t("telegram")}
            </a>
            <a href="#" className="text-sm transition-colors duration-200 hover:text-white" style={{ color: 'rgba(255,255,255,0.5)' }} data-testid="footer-link-instagram">
              {t("instagram")}
            </a>
            <a href="#" className="text-sm transition-colors duration-200 hover:text-white" style={{ color: 'rgba(255,255,255,0.5)' }} data-testid="footer-link-facebook">
              {t("facebook")}
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
