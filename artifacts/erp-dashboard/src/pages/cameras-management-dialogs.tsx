/**
 * @module cameras-management-dialogs
 * @description Dialog and form components for the Cameras Management page:
 *   - CameraFormFields — reusable form body (used by both Add and Edit dialogs)
 *   - AddCameraDialog  — "Add camera" dialog wrapping the form
 *   - EditCameraDialog — "Edit camera" dialog wrapping the form
 */

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { RefreshCw, Plus } from "lucide-react";
import type { UseFormReturn } from "react-hook-form";
import type { CameraFormData, WorkCenter, Translations } from "./cameras-management-types";

// ---------------------------------------------------------------------------
// Shared form fields
// ---------------------------------------------------------------------------

interface CameraFormFieldsProps {
  form: UseFormReturn<CameraFormData>;
  workCenters: WorkCenter[] | undefined;
  t: Translations;
  isEdit?: boolean;
}

export function CameraFormFields({ form, workCenters, t, isEdit = false }: CameraFormFieldsProps) {
  const pfx = isEdit ? "input-edit-" : "input-";

  return (
    <div className="space-y-4">
      {/* Code + Name row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="code"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t.code}</FormLabel>
              <FormControl>
                <Input
                  placeholder={isEdit ? undefined : "CAM-001"}
                  {...field}
                  data-testid={`${pfx}camera-code`}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t.name}</FormLabel>
              <FormControl>
                <Input
                  placeholder={isEdit ? undefined : "Kirish eshigi"}
                  {...field}
                  data-testid={`${pfx}camera-name`}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* Russian name */}
      <FormField
        control={form.control}
        name="nameRu"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t.nameRu}</FormLabel>
            <FormControl>
              <Input
                placeholder={isEdit ? undefined : "Входная дверь"}
                {...field}
                data-testid={`${pfx}camera-name-ru`}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Location */}
      <FormField
        control={form.control}
        name="location"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t.location}</FormLabel>
            <FormControl>
              <Input
                placeholder={isEdit ? undefined : "Asosiy bino, 1-qavat"}
                {...field}
                data-testid={`${pfx}camera-location`}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* IP + Work-center row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="ipAddress"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t.ipAddress}</FormLabel>
              <FormControl>
                <Input
                  placeholder={isEdit ? undefined : "192.168.1.100"}
                  {...field}
                  data-testid={`${pfx}camera-ip`}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="workCenterId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t.workCenter}</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger data-testid={isEdit ? "select-edit-work-center" : "select-work-center"} className="h-9">
                    <SelectValue placeholder={t.selectWorkCenter} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {workCenters?.map((wc) => (
                    <SelectItem key={wc.id} value={wc.id}>
                      {wc.code} - {wc.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* RTSP URL */}
      <FormField
        control={form.control}
        name="rtspUrl"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t.rtspUrl}</FormLabel>
            <FormControl>
              <Input
                placeholder={isEdit ? undefined : "rtsp://username:password@ip:port/stream"}
                {...field}
                data-testid={`${pfx}camera-rtsp`}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Active switch */}
      <FormField
        control={form.control}
        name="isActive"
        render={({ field }) => (
          <FormItem className="flex items-center gap-2">
            <FormControl>
              <Switch
                checked={field.value}
                onCheckedChange={field.onChange}
                data-testid={isEdit ? "switch-edit-camera-active" : "switch-camera-active"}
              />
            </FormControl>
            <FormLabel className="!mt-0">{t.active}</FormLabel>
          </FormItem>
        )}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// AddCameraDialog
// ---------------------------------------------------------------------------

interface AddCameraDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  form: UseFormReturn<CameraFormData>;
  workCenters: WorkCenter[] | undefined;
  t: Translations;
  isPending: boolean;
  onSubmit: (data: CameraFormData) => void;
}

export function AddCameraDialog({
  open,
  onOpenChange,
  form,
  workCenters,
  t,
  isPending,
  onSubmit,
}: AddCameraDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button
          className="bg-primary text-white rounded-lg px-5 py-2.5 text-sm font-semibold"
          data-testid="button-add-camera"
        >
          <Plus className="h-4 w-4 mr-1" />
          {t.addCamera}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg bg-card border-none rounded-xl p-6">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-foreground">{t.addCamera}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <CameraFormFields form={form} workCenters={workCenters} t={t} isEdit={false} />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                {t.cancel}
              </Button>
              <Button type="submit" disabled={isPending} data-testid="button-save-camera">
                {isPending ? <RefreshCw className="h-4 w-4 animate-spin" /> : t.save}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// EditCameraDialog
// ---------------------------------------------------------------------------

interface EditCameraDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  form: UseFormReturn<CameraFormData>;
  workCenters: WorkCenter[] | undefined;
  t: Translations;
  isPending: boolean;
  onSubmit: (data: CameraFormData) => void;
}

export function EditCameraDialog({
  open,
  onOpenChange,
  form,
  workCenters,
  t,
  isPending,
  onSubmit,
}: EditCameraDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg p-6">
        <DialogHeader>
          <DialogTitle className="text-[18px] font-semibold">{t.editCamera}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <CameraFormFields form={form} workCenters={workCenters} t={t} isEdit={true} />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                {t.cancel}
              </Button>
              <Button type="submit" disabled={isPending} data-testid="button-update-camera">
                {isPending ? <RefreshCw className="h-4 w-4 animate-spin" /> : t.save}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
