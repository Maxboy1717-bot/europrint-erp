import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ChevronsUpDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { FormData, Translation, CrmCompany, Product } from "./types";
import { PRODUCT_TYPES, VID_ZAKAZA, KRASOK_OPTIONS } from "./order-constants";

interface CustomerStepProps {
  formData: FormData;
  setFormData: (data: FormData) => void;
  t: Translation;
  companies: CrmCompany[];
  products: Product[];
  customerOpen: boolean;
  setCustomerOpen: (open: boolean) => void;
  productOpen: boolean;
  setProductOpen: (open: boolean) => void;
  handleProductSelect: (product: Product) => void;
}

export function CustomerStep({
  formData,
  setFormData,
  t,
  companies,
  products,
  customerOpen,
  setCustomerOpen,
  productOpen,
  setProductOpen,
  handleProductSelect,
}: CustomerStepProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in slide-in-from-right-4 duration-500">
      <div className="space-y-6">
        <div className="space-y-2">
          <Label className="text-on-surface-variant font-semibold">{t.papkaNo}</Label>
          <div className="flex gap-2">
            <Input
              value={formData.papkaNo}
              onChange={(e) => setFormData({ ...formData, papkaNo: e.target.value })}
              placeholder={t.papkaNoPlaceholder}
              className="bg-surface-container-low border-outline-variant rounded-lg"
              data-testid="input-papka-no"
            />
            <Button variant="outline" size="sm" className="shrink-0 border-primary text-primary hover:bg-primary/10">
              {t.autoGenerate}
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-on-surface-variant font-semibold">{t.customer} <span className="text-red-500">*</span></Label>
          <Popover open={customerOpen} onOpenChange={setCustomerOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={customerOpen}
                className="w-full justify-between bg-surface-container-low border-outline-variant text-on-surface hover:bg-surface-container-high transition-colors text-left font-normal"
                data-testid="button-customer-select"
              >
                {formData.mijozNomi || t.customerPlaceholder}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[400px] p-0" align="start">
              <Command className="bg-surface">
                <CommandInput placeholder={t.searchCustomer} className="border-none focus:ring-0" />
                <CommandList>
                  <CommandEmpty>{t.noCustomers}</CommandEmpty>
                  <CommandGroup>
                    {(Array.isArray(companies) ? companies : []).map((company) => (
                      <CommandItem
                        key={company.id}
                        onSelect={() => {
                          setFormData({ ...formData, mijozNomi: company.name });
                          setCustomerOpen(false);
                        }}
                        className="hover:bg-primary/10 cursor-pointer py-3"
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4 text-primary",
                            formData.mijozNomi === company.name ? "opacity-100" : "opacity-0"
                          )}
                        />
                        {company.name}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-2">
          <Label className="text-on-surface-variant font-semibold">{t.product} <span className="text-red-500">*</span></Label>
          <Popover open={productOpen} onOpenChange={setProductOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={productOpen}
                className="w-full justify-between bg-surface-container-low border-outline-variant text-on-surface hover:bg-surface-container-high transition-colors text-left font-normal"
                data-testid="button-product-select"
              >
                {formData.mahsulotNomi || t.productPlaceholder}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[400px] p-0" align="start">
              <Command className="bg-surface">
                <CommandInput placeholder={t.searchProduct} className="border-none focus:ring-0" />
                <CommandList>
                  <CommandEmpty>{t.noProducts}</CommandEmpty>
                  <CommandGroup>
                    {(Array.isArray(products) ? products : []).map((product) => (
                      <CommandItem
                        key={product.id}
                        onSelect={() => handleProductSelect(product)}
                        className="hover:bg-primary/10 cursor-pointer py-3"
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4 text-primary",
                            formData.productId === product.id ? "opacity-100" : "opacity-0"
                          )}
                        />
                        <div className="flex flex-col">
                          <span>{product.name}</span>
                          <span className="text-xs text-on-surface-variant font-mono">{product.code}</span>
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-on-surface-variant font-semibold">{t.productType}</Label>
            <Select
              value={formData.mahsulotTuri}
              onValueChange={(val) => setFormData({ ...formData, mahsulotTuri: val })}
            >
              <SelectTrigger className="bg-surface-container-low border-outline-variant">
                <SelectValue placeholder={t.productType} />
              </SelectTrigger>
              <SelectContent>
                {(Array.isArray(PRODUCT_TYPES) ? PRODUCT_TYPES : []).map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {t.lang === "ru" ? type.labelRu : type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-on-surface-variant font-semibold">{t.vidZakaza}</Label>
            <Select
              value={formData.vidZakaza}
              onValueChange={(val) => setFormData({ ...formData, vidZakaza: val })}
            >
              <SelectTrigger className="bg-surface-container-low border-outline-variant">
                <SelectValue placeholder={t.vidZakaza} />
              </SelectTrigger>
              <SelectContent>
                {(Array.isArray(VID_ZAKAZA) ? VID_ZAKAZA : []).map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {t.lang === "ru" ? type.labelRu : type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-on-surface-variant font-semibold">{t.quantity} <span className="text-red-500">*</span></Label>
            <Input
              type="number"
              value={formData.tiraj}
              onChange={(e) => setFormData({ ...formData, tiraj: Number(e.target.value) })}
              className="bg-surface-container-low border-outline-variant font-bold text-primary"
              data-testid="input-tiraj"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-on-surface-variant font-semibold">{t.krasok}</Label>
            <Select
              value={formData.krasok}
              onValueChange={(val) => setFormData({ ...formData, krasok: val })}
            >
              <SelectTrigger className="bg-surface-container-low border-outline-variant">
                <SelectValue placeholder={t.krasok} />
              </SelectTrigger>
              <SelectContent>
                {(Array.isArray(KRASOK_OPTIONS) ? KRASOK_OPTIONS : []).map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label className="text-on-surface-variant font-semibold">{t.formatA}</Label>
            <Input
              type="number"
              value={formData.formatA}
              onChange={(e) => setFormData({ ...formData, formatA: Number(e.target.value) })}
              className="bg-surface-container-low border-outline-variant"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-on-surface-variant font-semibold">{t.formatB}</Label>
            <Input
              type="number"
              value={formData.formatB}
              onChange={(e) => setFormData({ ...formData, formatB: Number(e.target.value) })}
              className="bg-surface-container-low border-outline-variant"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-on-surface-variant font-semibold">{t.formatC}</Label>
            <Input
              type="number"
              value={formData.formatC}
              onChange={(e) => setFormData({ ...formData, formatC: Number(e.target.value) })}
              className="bg-surface-container-low border-outline-variant"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-on-surface-variant font-semibold">{t.primZakaza}</Label>
          <Textarea
            value={formData.primZakaza}
            onChange={(e) => setFormData({ ...formData, primZakaza: e.target.value })}
            placeholder={t.primZakazaPlaceholder}
            className="bg-surface-container-low border-outline-variant min-h-[100px]"
          />
        </div>
      </div>
    </div>
  );
}
