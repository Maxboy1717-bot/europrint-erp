import { Link } from 'wouter';
import { Package, ShoppingCart } from 'lucide-react';
import { useLanguage } from '@/lib/public/i18n';

interface Product {
  id: string;
  name: string;
  nameRu: string;
  price: number;
  image?: string;
  slug: string;
  feature?: string;
  featureRu?: string;
}

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const { language, t } = useLanguage();

  const formatPrice = (value: number) => {
    return new Intl.NumberFormat('uz-UZ').format(value);
  };

  return (
    <div className="group bg-surface-container-lowest rounded-xl overflow-hidden transition-all duration-300 hover:shadow-xl" style={{ border: '1px solid rgba(0,0,0,0.04)' }} data-testid={`product-card-${product.id}`}>
      <Link href={`/site/product/${product.slug}`} className="block">
        <div className="relative aspect-square overflow-hidden" style={{ backgroundColor: '#FAFBFC' }}>
          {product.image ? (
            <img
              src={product.image}
              alt={language === 'ru' ? product.nameRu : product.name}
              className="w-full h-full object-contain p-6 transition-transform duration-500 group-hover:scale-110"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Package className="w-20 h-20 transition-colors duration-300" style={{ color: '#E5E7EB' }} />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </div>
      </Link>
      
      <div className="p-5">
        <Link href={`/site/product/${product.slug}`}>
          <h3 
            className="font-semibold text-base leading-snug transition-colors duration-200 group-hover:text-orange-500 line-clamp-2"
            style={{ color: '#2C3E50', fontFamily: "'Montserrat', sans-serif" }}
          >
            {language === 'ru' ? product.nameRu : product.name}
          </h3>
        </Link>
        
        {(product.feature || product.featureRu) && (
          <p className="mt-2 text-sm leading-relaxed line-clamp-1" style={{ color: '#6B7280' }}>
            {language === 'ru' ? product.featureRu : product.feature}
          </p>
        )}
        
        <div className="mt-4 flex items-center justify-between gap-3">
          <p className="text-lg font-bold" style={{ color: '#F97316' }}>
            {formatPrice(product.price)} <span className="text-sm font-medium">so'm</span>
          </p>
          <button 
            className="flex items-center justify-center w-10 h-10 rounded-lg transition-all duration-200 active:scale-95"
            style={{ backgroundColor: 'rgba(249, 115, 22, 0.1)' }}
            data-testid={`button-add-cart-${product.id}`}
          >
            <ShoppingCart className="w-5 h-5" style={{ color: '#F97316' }} />
          </button>
        </div>
      </div>
    </div>
  );
}
