/**
 * @module not-found
 * @description React page component. Route-level UI.
 */

import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Home, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background">
      <Card className="w-full max-w-md mx-4">
        <CardContent className="pt-8 pb-8 flex flex-col items-center text-center gap-4">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
            <span className="text-2xl font-bold text-muted-foreground">404</span>
          </div>
          <div>
            <h1 className="text-xl font-semibold mb-1">Sahifa topilmadi</h1>
            <p className="text-sm text-muted-foreground">
              Siz qidirayotgan sahifa mavjud emas yoki o'chirilgan.
            </p>
          </div>
          <div className="flex gap-2 mt-2">
            <Button variant="outline" size="default" onClick={() => window.history.back()}>
              <ArrowLeft className="w-4 h-4 mr-1" />
              Orqaga
            </Button>
            <Link href="/">
              <Button size="default">
                <Home className="w-4 h-4 mr-1" />
                Bosh sahifa
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
