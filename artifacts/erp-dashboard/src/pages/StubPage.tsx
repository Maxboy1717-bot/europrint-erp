import { Construction } from "lucide-react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";

export default function StubPage() {
  const [location, navigate] = useLocation();
  const module = location.replace(/^\//, "");
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-muted-foreground">
      <Construction className="w-12 h-12 opacity-40" />
      <div className="text-center">
        <p className="text-lg font-semibold text-foreground">Tez orada</p>
        <p className="text-sm mt-1 opacity-70">
          <code className="px-1.5 py-0.5 bg-muted rounded text-xs">{module}</code>{" "}
          moduli hali ishlab chiqilmoqda
        </p>
      </div>
      <Button variant="outline" size="sm" onClick={() => navigate("/")}>
        Bosh sahifaga qaytish
      </Button>
    </div>
  );
}
