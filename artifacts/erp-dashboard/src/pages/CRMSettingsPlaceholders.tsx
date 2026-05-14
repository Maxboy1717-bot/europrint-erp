/** @module CRMSettingsPlaceholders @description Placeholder panel components for CRM Settings sidebar sections that are not yet implemented. */

import { Card, CardContent } from "@/components/ui/card";
import { FileText, Key, Package, Layers } from "lucide-react";

export function RequisitesTab() {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Mening rekvizitlarim</h2>
      <Card>
        <CardContent className="py-12 text-center">
          <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Rekvizitlar sozlamalari</p>
        </CardContent>
      </Card>
    </div>
  );
}

export function AccessTab() {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Kirish huquqlari</h2>
      <Card>
        <CardContent className="py-12 text-center">
          <Key className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Kirish huquqlari sozlamalari</p>
        </CardContent>
      </Card>
    </div>
  );
}

export function ProductsTab() {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Tovarlar va omborlar</h2>
      <Card>
        <CardContent className="py-12 text-center">
          <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Tovarlar va omborlar sozlamalari</p>
        </CardContent>
      </Card>
    </div>
  );
}

export function IntegrationsTab() {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Integratsiyalar</h2>
      <Card>
        <CardContent className="py-12 text-center">
          <Layers className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Tashqi tizimlar bilan integratsiya</p>
        </CardContent>
      </Card>
    </div>
  );
}
