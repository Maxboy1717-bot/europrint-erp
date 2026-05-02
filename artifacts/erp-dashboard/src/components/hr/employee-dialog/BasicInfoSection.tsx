import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { FormSectionProps } from "./types";

export function BasicInfoSection({ form }: FormSectionProps) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <FormField
        control={form.control}
        name="fullName"
        render={({ field }) => (
          <FormItem>
            <FormLabel>F.I.SH</FormLabel>
            <FormControl>
              <Input placeholder="To'liq ism" {...field} data-testid="input-fullName" />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="employeeId"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Tabel raqami</FormLabel>
            <FormControl>
              <Input placeholder="ID" {...field} data-testid="input-employeeId" />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="phone"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Telefon</FormLabel>
            <FormControl>
              <Input placeholder="+998" {...field} data-testid="input-phone" />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="telegramChatId"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Telegram ID</FormLabel>
            <FormControl>
              <Input placeholder="Chat ID" {...field} data-testid="input-telegramChatId" />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
