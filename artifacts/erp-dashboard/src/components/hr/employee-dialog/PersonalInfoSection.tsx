/**
 * @module PersonalInfoSection
 * @description React UI component.
 */

import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { FormSectionProps } from "./types";

export function PersonalInfoSection({ form }: FormSectionProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="birthDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tug'ilgan sana</FormLabel>
              <FormControl>
                <Input type="date" {...field} data-testid="input-birthDate" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="gender"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Jinsi</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger data-testid="select-gender" className="h-9">
                    <SelectValue placeholder="Jinsini tanlang" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="erkak">Erkak</SelectItem>
                  <SelectItem value="ayol">Ayol</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
      <FormField
        control={form.control}
        name="address"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Yashash manzili</FormLabel>
            <FormControl>
              <Input placeholder="To'liq manzil" {...field} data-testid="input-address" />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="maritalStatus"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Oilaviy holati</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger data-testid="select-marital-status" className="h-9">
                    <SelectValue placeholder="Oilaviy holatini tanlang" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="turmush qurmagan">Turmush qurmagan</SelectItem>
                  <SelectItem value="turmush qurgan">Turmush qurgan</SelectItem>
                  <SelectItem value="ajrashgan">Ajrashgan</SelectItem>
                  <SelectItem value="beva/beva ayol">Beva/Beva ayol</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="childrenCount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Farzandlar soni</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  type="number"
                  placeholder="Masalan: 2"
                  data-testid="input-children-count"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
      <FormField
        control={form.control}
        name="childrenEducation"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Farzandlarning ta'lim holati</FormLabel>
            <Select onValueChange={field.onChange} value={field.value}>
              <FormControl>
                <SelectTrigger data-testid="select-children-education" className="h-9">
                  <SelectValue placeholder="Farzandlar ta'limini tanlang" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="yo'q">Farzand yo'q</SelectItem>
                <SelectItem value="maktabgacha">Maktabgacha</SelectItem>
                <SelectItem value="maktabda">Maktabda</SelectItem>
                <SelectItem value="oliy ta'lim">Oliy ta'limda</SelectItem>
                <SelectItem value="bitirgan">Ta'limni bitirgan</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
