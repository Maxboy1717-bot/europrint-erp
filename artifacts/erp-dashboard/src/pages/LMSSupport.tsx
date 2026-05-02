import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  BookOpen,
  FileText,
  HelpCircle,
  LifeBuoy,
  Mail,
  MessageSquare,
  Phone,
} from "lucide-react";

const FAQ_ITEMS = [
  {
    question: "Yangi kursga qanday yozilaman?",
    answer:
      "LMS bosh sahifasiga o'ting, kerakli kursni toping va 'Yozilish' tugmasini bosing. Kurs menejer tomonidan tasdiqlangach, siz avtomatik ravishda xabar olasiz.",
  },
  {
    question: "Sertifikat qachon beriladi?",
    answer:
      "Kursning barcha modullarini va yakuniy testni muvaffaqiyatli topshirgandan so'ng sertifikat avtomatik tarzda hisobingizga qo'shiladi.",
  },
  {
    question: "Test natijasini qayta topshirish mumkinmi?",
    answer:
      "Ha, har bir test 3 marta topshirilishi mumkin. Barcha urinishlar tugagandan so'ng kuratorga murojaat qiling.",
  },
  {
    question: "Kurs materyallarini yuklab olish mumkinmi?",
    answer:
      "Ba'zi kurslar PDF va video fayllarni yuklab olish imkonini beradi. Buning uchun kurs sahifasidagi yuklab olish tugmasidan foydalaning.",
  },
  {
    question: "Parolni unutsam nima qilaman?",
    answer:
      "Kirish sahifasidagi 'Parolni unutdim' havolasini bosing yoki IT bo'limiga murojaat qiling.",
  },
];

const CONTACT_CHANNELS = [
  {
    icon: Phone,
    label: "Telefon",
    value: "+998 71 123-45-67",
    badge: "Ish kunlari 09:00–18:00",
    color: "text-green-600 dark:text-green-400",
  },
  {
    icon: Mail,
    label: "E-mail",
    value: "support@europrint.uz",
    badge: "24 soat ichida javob",
    color: "text-blue-600 dark:text-blue-400",
  },
  {
    icon: MessageSquare,
    label: "Telegram",
    value: "@europrint_support",
    badge: "Tezkor yordam",
    color: "text-sky-600 dark:text-sky-400",
  },
];

export default function LMSSupport() {
  return (
    <div className="flex flex-col h-full bg-surface overflow-y-auto">
      <div className="max-w-4xl w-full mx-auto px-6 py-8 space-y-8">
        <div className="flex items-center gap-3">
          <Link href="/lms-dashboard">
            <Button variant="ghost" size="icon" data-testid="button-back-to-lms">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-semibold text-on-surface">
              Yordam markazi
            </h1>
            <p className="text-sm text-on-surface-variant mt-0.5">
              LMS platformasi bo'yicha savol va muammolaringizga yordam
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {(Array.isArray(CONTACT_CHANNELS) ? CONTACT_CHANNELS : []).map((ch) => {
            const Icon = ch.icon;
            return (
              <Card key={ch.label} data-testid={`card-contact-${ch.label.toLowerCase()}`}>
                <CardContent className="flex flex-col items-center text-center gap-3 p-6">
                  <div className={`${ch.color} bg-surface-container-lowest rounded-full p-3`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="font-medium text-on-surface">{ch.label}</p>
                    <p className="text-sm text-on-surface-variant mt-0.5">{ch.value}</p>
                  </div>
                  <Badge variant="secondary">{ch.badge}</Badge>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <HelpCircle className="h-4 w-4 text-primary" />
              Ko'p so'raladigan savollar (FAQ)
            </CardTitle>
          </CardHeader>
          <CardContent className="divide-y divide-border">
            {(Array.isArray(FAQ_ITEMS) ? FAQ_ITEMS : []).map((item, idx) => (
              <div
                key={idx}
                className="py-4 first:pt-0 last:pb-0"
                data-testid={`faq-item-${idx}`}
              >
                <p className="font-medium text-sm text-on-surface mb-1">
                  {item.question}
                </p>
                <p className="text-sm text-on-surface-variant leading-relaxed">
                  {item.answer}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm font-medium">
                <BookOpen className="h-4 w-4 text-primary" />
                Foydalanuvchi qo'llanmasi
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm text-on-surface-variant">
                LMS platformasidan foydalanish bo'yicha to'liq qo'llanma
                IT bo'limi tomonidan tayyorlangan.
              </p>
              <Link href="/lms/knowledge-base">
                <Button variant="outline" size="sm" className="mt-2" data-testid="button-knowledge-base">
                  Bilimlar bazasiga o'tish
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm font-medium">
                <FileText className="h-4 w-4 text-primary" />
                Muammoni bildirib qo'ying
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm text-on-surface-variant">
                Texnik muammo yoki takliflaringizni quyidagi e-mail orqali
                yuboring — 24 soat ichida javob beramiz.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-2"
                data-testid="button-send-email"
                onClick={() =>
                  window.open("mailto:support@europrint.uz?subject=LMS+Muammo", "_blank")
                }
              >
                <LifeBuoy className="h-3.5 w-3.5 mr-1.5" />
                Murojaat yuborish
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="text-center">
          <Link href="/lms-dashboard">
            <Button variant="default" data-testid="button-back-to-dashboard">
              <ArrowLeft className="h-4 w-4 mr-2" />
              LMS bosh sahifasiga qaytish
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
