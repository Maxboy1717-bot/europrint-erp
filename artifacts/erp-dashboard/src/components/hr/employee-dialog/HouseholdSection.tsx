/**
 * @module HouseholdSection
 * @description React UI component.
 */

import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { FormSectionProps } from "./types";

export function HouseholdSection({ form }: FormSectionProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="housingType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Uy turi</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger data-testid="select-housing-type" className="h-9">
                    <SelectValue placeholder="Uy turini tanlang" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="shaxsiy uy">Shaxsiy uy</SelectItem>
                  <SelectItem value="kvartira">Kvartira</SelectItem>
                  <SelectItem value="ijara">Ijaraga olingan</SelectItem>
                  <SelectItem value="yotoqxona">Yotoqxona</SelectItem>
                  <SelectItem value="qarindoshlar bilan">Qarindoshlar bilan</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="householdSize"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Oilada necha kishi yashaydi</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  type="number"
                  placeholder="Masalan: 5"
                  data-testid="input-household-size"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
      <FormField
        control={form.control}
        name="householdMembers"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Kimlar bilan yashaydi</FormLabel>
            <FormControl>
              <Input
                {...field}
                placeholder="Masalan: turmush o'rtog'i, 2 ta farzand, qaynona, qaynota"
                data-testid="input-household-members"
              />
            </FormControl>
            <p className="text-xs text-muted-foreground">
              Oila a'zolarini vergul bilan ajratib yozing
            </p>
            <FormMessage />
          </FormItem>
        )}
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="latitude"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Kenglik (Latitude)</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder="Masalan: 40.5286"
                  data-testid="input-latitude"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="longitude"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Uzunlik (Longitude)</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder="Masalan: 70.9425"
                  data-testid="input-longitude"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}
