/**
 * @module Calculator
 * @description React UI component.
 */

import { useState } from 'react';
import { ArrowRight, ArrowLeft, Package, Layers, Hash, CheckCircle } from 'lucide-react';
import { useLanguage } from '@/lib/public/i18n';
import { useTranslation } from '@/lib/i18n';

const materials = [
  { id: '3layer', name: '3 qatlamli', nameRu: '3-слойный', priceMultiplier: 1, icon: '📦' },
  { id: '5layer', name: '5 qatlamli', nameRu: '5-слойный', priceMultiplier: 1.8, icon: '📦' },
  { id: '7layer', name: '7 qatlamli', nameRu: '7-слойный', priceMultiplier: 2.5, icon: '📦' },
];

const quantities = [100, 200, 500, 1000, 2000, 5000];

export default function Calculator() {
  const { t } = useTranslation("common");
  const { t, language } = useLanguage();
  const [step, setStep] = useState(1);
  const [length, setLength] = useState(30);
  const [width, setWidth] = useState(20);
  const [height, setHeight] = useState(15);
  const [quantity, setQuantity] = useState(500);
  const [material, setMaterial] = useState('3layer');

  const calculatePrice = () => {
    const selectedMaterial = (Array.isArray(materials) ? materials : []).find(m => m.id === material);
    const area = 2 * (length * width + length * height + width * height);
    const basePrice = area * 0.5;
    const materialPrice = basePrice * (selectedMaterial?.priceMultiplier || 1);
    const totalPrice = materialPrice * quantity;
    
    let discount = 0;
    if (quantity >= 1000) discount = 0.15;
    else if (quantity >= 500) discount = 0.10;
    else if (quantity >= 200) discount = 0.05;
    
    return Math.round(totalPrice * (1 - discount));
  };

  const getDiscount = () => {
    if (quantity >= 1000) return 15;
    if (quantity >= 500) return 10;
    if (quantity >= 200) return 5;
    return 0;
  };

  const formatPrice = (value: number) => {
    return new Intl.NumberFormat('uz-UZ').format(value);
  };

  const nextStep = () => setStep(s => Math.min(s + 1, 3));
  const prevStep = () => setStep(s => Math.max(s - 1, 1));

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-center gap-4 mb-10">
        {([1, 2, 3]).map((s) => (
          <div key={s} className="flex items-center">
            <button
              onClick={() => setStep(s)}
              className="w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm transition-all duration-300"
              style={{
                backgroundColor: step >= s ? '#F97316' : '#E5E7EB',
                color: step >= s ? 'white' : '#6B7280',
                fontFamily: "'Montserrat', sans-serif"
              }}
              data-testid={`step-${s}`}
            >
              {step > s ? <CheckCircle className="w-5 h-5" /> : s}
            </button>
            {s < 3 && (
              <div 
                className="w-16 md:w-24 h-1 mx-2 rounded transition-colors duration-300"
                style={{ backgroundColor: step > s ? '#F97316' : '#E5E7EB' }}
              />
            )}
          </div>
        ))}
      </div>

      <div className="bg-card rounded-xl p-8 md:p-10" style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
        {step === 1 && (
          <div className="animate-fadeIn">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'rgba(249, 115, 22, 0.1)' }}>
                <Package className="w-6 h-6" style={{ color: '#F97316' }} />
              </div>
              <div>
                <h3 className="text-xl font-bold" style={{ color: '#2C3E50', fontFamily: "'Montserrat', sans-serif" }}>
                  {language === 'ru' ? 'Размеры коробки' : "Quti o'lchamlari"}
                </h3>
                <p className="text-sm" style={{ color: '#6B7280' }}>
                  {language === 'ru' ? 'Укажите размеры в сантиметрах' : "O'lchamlarni santimetrda kiriting"}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {([
                { label: t('calc.length'), value: length, setValue: setLength, id: 'length' },
                { label: t('calc.width'), value: width, setValue: setWidth, id: 'width' },
                { label: t('calc.height'), value: height, setValue: setHeight, id: 'height' },
              ]).map((field) => (
                <div key={field.id}>
                  <label className="block text-sm font-medium mb-3" style={{ color: '#333333' }}>
                    {field.label} <span style={{ color: '#9CA3AF' }}>(sm)</span>
                  </label>
                  <input
                    type="number"
                    value={field.value}
                    onChange={(e) => field.setValue(Number(e.target.value))}
                    className="w-full px-5 py-4 rounded-xl text-lg font-medium transition-all duration-200 focus:ring-2 focus:ring-primary focus:border-transparent"
                    style={{ 
                      border: '2px solid #E5E7EB', 
                      color: '#2C3E50',
                      outline: 'none'
                    }}
                    min="1"
                    data-testid={`input-${field.id}`}
                  />
                </div>
              ))}
            </div>

            <div className="flex justify-end mt-8">
              <button
                onClick={nextStep}
                className="flex items-center gap-2 px-8 py-4 rounded-xl font-semibold text-white transition-all duration-200 active:scale-[0.98]"
                style={{ backgroundColor: '#F97316', fontFamily: "'Montserrat', sans-serif" }}
                data-testid="button-next-1"
              >
                {language === 'ru' ? 'Далее' : 'Keyingisi'}
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="animate-fadeIn">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'rgba(249, 115, 22, 0.1)' }}>
                <Layers className="w-6 h-6" style={{ color: '#F97316' }} />
              </div>
              <div>
                <h3 className="text-xl font-bold" style={{ color: '#2C3E50', fontFamily: "'Montserrat', sans-serif" }}>
                  {language === 'ru' ? 'Выберите материал' : 'Materialni tanlang'}
                </h3>
                <p className="text-sm" style={{ color: '#6B7280' }}>
                  {language === 'ru' ? 'Количество слоев гофрокартона' : 'Gofrkarton qatlamlari soni'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {(Array.isArray(materials) ? materials : []).map((m) => (
                <button
                  key={m.id}
                  onClick={() => setMaterial(m.id)}
                  className="p-6 rounded-xl text-left transition-all duration-200"
                  style={{
                    border: material === m.id ? '2px solid #F97316' : '2px solid #E5E7EB',
                    backgroundColor: material === m.id ? 'rgba(249, 115, 22, 0.05)' : 'white',
                  }}
                  data-testid={`material-${m.id}`}
                >
                  <div className="text-3xl mb-3">{m.icon}</div>
                  <h4 className="font-semibold text-lg" style={{ color: '#2C3E50', fontFamily: "'Montserrat', sans-serif" }}>
                    {language === 'ru' ? m.nameRu : m.name}
                  </h4>
                  <p className="text-sm mt-1" style={{ color: '#6B7280' }}>
                    {m.priceMultiplier === 1 ? (language === 'ru' ? 'Базовая цена' : 'Asosiy narx') : 
                     `x${m.priceMultiplier} ${language === 'ru' ? 'от базовой' : 'asosiydan'}`}
                  </p>
                </button>
              ))}
            </div>

            <div className="flex justify-between mt-8">
              <button
                onClick={prevStep}
                className="flex items-center gap-2 px-6 py-4 rounded-xl font-semibold transition-all duration-200"
                style={{ color: '#6B7280', border: '2px solid #E5E7EB' }}
                data-testid="button-prev-2"
              >
                <ArrowLeft className="w-5 h-5" />
                {language === 'ru' ? 'Назад' : 'Orqaga'}
              </button>
              <button
                onClick={nextStep}
                className="flex items-center gap-2 px-8 py-4 rounded-xl font-semibold text-white transition-all duration-200 active:scale-[0.98]"
                style={{ backgroundColor: '#F97316', fontFamily: "'Montserrat', sans-serif" }}
                data-testid="button-next-2"
              >
                {language === 'ru' ? 'Далее' : 'Keyingisi'}
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="animate-fadeIn">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'rgba(249, 115, 22, 0.1)' }}>
                <Hash className="w-6 h-6" style={{ color: '#F97316' }} />
              </div>
              <div>
                <h3 className="text-xl font-bold" style={{ color: '#2C3E50', fontFamily: "'Montserrat', sans-serif" }}>
                  {language === 'ru' ? 'Количество' : 'Miqdor'}
                </h3>
                <p className="text-sm" style={{ color: '#6B7280' }}>
                  {language === 'ru' ? 'Выберите нужное количество' : 'Kerakli miqdorni tanlang'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 md:grid-cols-6 gap-3 mb-6">
              {(Array.isArray(quantities) ? quantities : []).map((q) => (
                <button
                  key={q}
                  onClick={() => setQuantity(q)}
                  className="py-4 px-3 rounded-xl font-semibold transition-all duration-200"
                  style={{
                    border: quantity === q ? '2px solid #F97316' : '2px solid #E5E7EB',
                    backgroundColor: quantity === q ? 'rgba(249, 115, 22, 0.05)' : 'white',
                    color: quantity === q ? '#F97316' : '#6B7280',
                  }}
                  data-testid={`quantity-${q}`}
                >
                  {q >= 1000 ? `${q/1000}K` : q}
                </button>
              ))}
            </div>

            <div className="mb-8">
              <label className="block text-sm font-medium mb-3" style={{ color: '#333333' }}>
                {language === 'ru' ? 'Или введите своё количество' : "Yoki o'z miqdoringizni kiriting"}
              </label>
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                className="w-full px-5 py-4 rounded-xl text-lg font-medium transition-all duration-200 focus:ring-2 focus:ring-primary focus:border-transparent"
                style={{ border: '2px solid #E5E7EB', color: '#2C3E50', outline: 'none' }}
                min="1"
                data-testid="input-custom-quantity"
              />
            </div>

            <div className="p-6 rounded-xl mb-8" style={{ backgroundColor: '#F5F7FA' }}>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <p className="text-sm" style={{ color: '#6B7280' }}>
                    {language === 'ru' ? 'Итоговая цена' : 'Yakuniy narx'}
                    {getDiscount() > 0 && (
                      <span className="ml-2 px-2 py-1 rounded text-xs font-semibold" style={{ backgroundColor: '#10B981', color: 'white' }}>
                        -{getDiscount()}%
                      </span>
                    )}
                  </p>
                  <p className="text-4xl font-bold mt-1" style={{ color: '#F97316', fontFamily: "'Montserrat', sans-serif" }}>
                    {formatPrice(calculatePrice())} <span className="text-lg font-medium" style={{ color: '#6B7280' }}>{t("som")}</span>
                  </p>
                </div>
                <div className="text-sm" style={{ color: '#6B7280' }}>
                  <p>{length}×{width}×{height} sm • {language === 'ru' ? (Array.isArray(materials) ? materials : []).find(m => m.id === material)?.nameRu : materials.find(m => m.id === material)?.name}</p>
                  <p>{formatPrice(quantity)} {language === 'ru' ? 'шт.' : 'dona'}</p>
                </div>
              </div>
            </div>

            <div className="flex flex-col md:flex-row justify-between gap-4">
              <button
                onClick={prevStep}
                className="flex items-center justify-center gap-2 px-6 py-4 rounded-xl font-semibold transition-all duration-200"
                style={{ color: '#6B7280', border: '2px solid #E5E7EB' }}
                data-testid="button-prev-3"
              >
                <ArrowLeft className="w-5 h-5" />
                {language === 'ru' ? 'Назад' : 'Orqaga'}
              </button>
              <a
                href={`/site/order?l=${length}&w=${width}&h=${height}&q=${quantity}&m=${material}&p=${calculatePrice()}`}
                className="flex items-center justify-center gap-2 px-10 py-4 rounded-xl font-semibold text-white transition-all duration-200 active:scale-[0.98]"
                style={{ backgroundColor: '#F97316', fontFamily: "'Montserrat', sans-serif" }}
                data-testid="link-order-from-calc"
              >
                {t('calc.order')}
                <ArrowRight className="w-5 h-5" />
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
