import { TrendingUp, BarChart3, Building2, Users, FileText, ShoppingCart, CreditCard, Target } from "lucide-react";
import { SectionHeader } from "@/components/sd/europrint/SectionHeader";
import { OverviewDashboard } from "@/components/sd/europrint/OverviewDashboard";
import { CustomersTab } from "@/components/sd/europrint/CustomersTab";
import { LeadsTab } from "@/components/sd/europrint/LeadsTab";
import { QuotationsTab } from "@/components/sd/europrint/QuotationsTab";
import { OrdersTab } from "@/components/sd/europrint/OrdersTab";
import { PaymentsTab } from "@/components/sd/europrint/PaymentsTab";
import { KPITab } from "@/components/sd/europrint/KPITab";

const SECTIONS = [
  { id: "s-dashboard", icon: BarChart3, label: "Dashboard", title: "Dashboard", description: "Umumiy ko'rsatkichlar va lead funnel", Component: OverviewDashboard },
  { id: "s-customers", icon: Building2, label: "Mijozlar", title: "Mijozlar", description: "Mijozlar bazasi, kontaktlar va buyurtma tarixi", Component: CustomersTab },
  { id: "s-leads", icon: Users, label: "Leedlar", title: "Leedlar — Funnel", description: "Yangi → Ishlanmoqda → Taklif → Muzokaralar → Yutildi/Yutqizildi", Component: LeadsTab },
  { id: "s-quotations", icon: FileText, label: "Taklifnomalar", title: "Taklifnomalar", description: "Narx hisoblash, taklifnoma yaratish va tasdiqlash", Component: QuotationsTab },
  { id: "s-orders", icon: ShoppingCart, label: "Buyurtmalar", title: "Buyurtmalar", description: "13 bosqichli buyurtma zanjiri boshqaruvi", Component: OrdersTab },
  { id: "s-payments", icon: CreditCard, label: "To'lovlar", title: "To'lovlar", description: "Avans, qoldiq, debitorlik va aging hisobot", Component: PaymentsTab },
  { id: "s-kpi", icon: Target, label: "KPI", title: "KPI va Tahlil", description: "Menejer reytingi, kvotalar va funnel tahlili", Component: KPITab },
];

export default function SDEuroprint() {
  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="flex flex-col h-full">
      {/* Sticky quick-nav */}
      <div className="sticky top-0 z-50 bg-background border-b px-4 py-2 flex items-center gap-1 flex-wrap">
        <TrendingUp className="w-4 h-4 text-primary shrink-0 mr-1" />
        <span className="text-sm font-semibold mr-3">CRM + Savdo</span>
        {(Array.isArray(SECTIONS) ? SECTIONS : []).map(s => (
          <button
            key={s.id}
            data-testid={`nav-${s.id}`}
            onClick={() => scrollTo(s.id)}
            className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-md hover-elevate text-muted-foreground hover:text-foreground border border-transparent hover:border-border transition-colors"
          >
            <s.icon className="w-3.5 h-3.5" />
            {s.label}
          </button>
        ))}
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 space-y-10 max-w-screen-xl mx-auto pb-16">
          {(Array.isArray(SECTIONS) ? SECTIONS : []).map(({ id, icon, title, description, Component }) => (
            <section key={id} className="space-y-4">
              <SectionHeader id={id} icon={icon} title={title} description={description} />
              <Component />
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
