import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { FormSectionProps } from "./types";

export function ContractSection({ form }: FormSectionProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="shift"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Smena</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger data-testid="select-shift">
                    <SelectValue placeholder="Smenani tanlang" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="A">A smena</SelectItem>
                  <SelectItem value="B">B smena</SelectItem>
                  <SelectItem value="C">C smena</SelectItem>
                  <SelectItem value="D">D smena</SelectItem>
                  <SelectItem value="kunlik">Kunlik</SelectItem>
                  <SelectItem value="ofis">Ofis</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="salaryType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Ish haqi turi</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger data-testid="select-salary-type">
                    <SelectValue placeholder="Turini tanlang" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="fiks">Fiks (Oylik)</SelectItem>
                  <SelectItem value="baytulmal">Ishbay</SelectItem>
                  <SelectItem value="smenbay">Smenbay</SelectItem>
                  <SelectItem value="soatbay">Soatbay</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="workshopZone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Sex/Hudud</FormLabel>
              <FormControl>
                <Input placeholder="Masalan: 1-sex" {...field} data-testid="input-workshopZone" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Holati</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger data-testid="select-status">
                    <SelectValue placeholder="Holatni tanlang" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="active">Faol</SelectItem>
                  <SelectItem value="inactive">Faol emas</SelectItem>
                  <SelectItem value="on_leave">Ta'tilda</SelectItem>
                  <SelectItem value="probation">Sinov muddati</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="hireDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Ishga kirgan sana</FormLabel>
              <FormControl>
                <Input type="date" {...field} data-testid="input-hireDate" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="attestationDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Attestatsiya sanasi</FormLabel>
              <FormControl>
                <Input type="date" {...field} data-testid="input-attestationDate" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}
