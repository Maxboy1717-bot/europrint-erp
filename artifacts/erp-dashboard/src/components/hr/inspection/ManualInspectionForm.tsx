import { useState, useRef, type ChangeEvent } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { ClipboardCheck, Star, Upload, X } from 'lucide-react';

const FormSchema = z.object({
  cleanliness:      z.number().int().min(1, 'Kamida 1 yulduz').max(5),
  order_score:      z.number().int().min(1, 'Kamida 1 yulduz').max(5),
  equipment_ok:     z.boolean(),
  emergency_issues: z.boolean(),
  notes:            z.string().max(2000).optional(),
});
type FormValues = z.infer<typeof FormSchema>;

interface Props {
  open:     boolean;
  roomCode: string;
  roomName: string;
  onClose:  () => void;
  onSaved:  () => void;
}

const STAR_RANGE = [1, 2, 3, 4, 5] as const;

function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex gap-1">
      {(STAR_RANGE ?? []).map((star) => (
        <button key={star} type="button" onClick={() => onChange(star)} className="focus:outline-none">
          <Star
            className={`w-7 h-7 transition-colors ${
              star <= value ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'
            }`}
          />
        </button>
      ))}
      <span className="ml-2 text-sm text-gray-500 self-center">{value}/5</span>
    </div>
  );
}

export function ManualInspectionForm({ open, roomCode, roomName, onClose, onSaved }: Props) {
  const [pdfUrl,         setPdfUrl]         = useState<string | null>(null);
  const [submitError,    setSubmitError]    = useState<string | null>(null);
  const [evidenceBase64, setEvidenceBase64] = useState<string>('');
  const [evidencePreview, setEvidencePreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const {
    control, register, handleSubmit, reset, watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver:      zodResolver(FormSchema),
    defaultValues: { cleanliness: 3, order_score: 3, equipment_ok: true, emergency_issues: false, notes: '' },
  });

  const cleanliness     = watch('cleanliness');
  const orderScore      = watch('order_score');
  const equipmentOk     = watch('equipment_ok');
  const emergencyIssues = watch('emergency_issues');
  const isGood          = cleanliness >= 4 && orderScore >= 4 && equipmentOk && !emergencyIssues;

  const handleFile = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { setSubmitError('Faqat rasm fayllari qabul qilinadi'); return; }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result as string;
      setEvidencePreview(result);
      setEvidenceBase64(result);
    };
    reader.readAsDataURL(file);
  };

  const clearEvidence = () => { setEvidenceBase64(''); setEvidencePreview(null); };

  const onSubmit = async (values: FormValues) => {
    setSubmitError(null);
    setPdfUrl(null);
    try {
      const token = localStorage.getItem('access_token') ?? '';
      const payload: Record<string, unknown> = { room_code: roomCode, ...values };
      if (evidenceBase64) payload['evidence_photo_url'] = evidenceBase64;
      const res = await fetch('/api/hr/inspection/checklist', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body:    JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`Server xatosi: ${res.status}`);
      const data = await res.json() as { ok?: boolean; data?: { pdf_url?: string | null } };
      if (data.data?.pdf_url) setPdfUrl(data.data.pdf_url);
      onSaved();
    } catch (e: unknown) {
      setSubmitError((e as Error)?.message ?? 'Yuborishda xatolik');
    }
  };

  const handleClose = () => {
    reset();
    setPdfUrl(null);
    setSubmitError(null);
    setEvidenceBase64('');
    setEvidencePreview(null);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ClipboardCheck className="w-5 h-5 text-green-600" />
            Qo'lda inspeksiya — {roomName}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 py-2">
          {isGood && (
            <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-2 text-sm text-green-700 font-medium">
              ✅ Xona holati yaxshi
            </div>
          )}

          <div className="space-y-1">
            <Label>Tozalik darajasi</Label>
            <Controller
              name="cleanliness"
              control={control}
              render={({ field }) => <StarRating value={field.value} onChange={field.onChange} />}
            />
            {errors.cleanliness && <p className="text-xs text-red-500">{errors.cleanliness.message}</p>}
          </div>

          <div className="space-y-1">
            <Label>Tartib darajasi</Label>
            <Controller
              name="order_score"
              control={control}
              render={({ field }) => <StarRating value={field.value} onChange={field.onChange} />}
            />
            {errors.order_score && <p className="text-xs text-red-500">{errors.order_score.message}</p>}
          </div>

          <div className="flex items-center justify-between py-1 border-t">
            <Label className="font-medium">Jihozlar joyida</Label>
            <Controller
              name="equipment_ok"
              control={control}
              render={({ field }) => <Switch checked={field.value} onCheckedChange={field.onChange} />}
            />
          </div>

          <div className="flex items-center justify-between py-1 border-t">
            <div>
              <Label className="font-medium text-red-600">Favqulodda holat</Label>
              <p className="text-xs text-gray-400">Xavfli holat yoki shoshilinch muammo</p>
            </div>
            <Controller
              name="emergency_issues"
              control={control}
              render={({ field }) => (
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  className="data-[state=checked]:bg-red-500"
                />
              )}
            />
          </div>

          {/* Evidence photo upload */}
          <div className="space-y-2 border-t pt-3">
            <Label>Dalil fotosi (ixtiyoriy)</Label>
            {evidencePreview ? (
              <div className="relative rounded-lg overflow-hidden border bg-gray-50">
                <img src={evidencePreview} alt="Dalil" className="w-full h-36 object-cover" />
                <button
                  type="button"
                  onClick={clearEvidence}
                  className="absolute top-2 right-2 bg-white rounded-full p-1 shadow hover:bg-red-50"
                >
                  <X className="w-4 h-4 text-red-500" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="w-full h-20 border-2 border-dashed border-gray-200 rounded-lg flex items-center
                           justify-center gap-2 hover:border-blue-300 hover:bg-blue-50 transition-colors"
              >
                <Upload className="w-5 h-5 text-gray-400" />
                <span className="text-sm text-gray-400">Rasm biriktirish</span>
              </button>
            )}
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
          </div>

          <div className="space-y-1">
            <Label>Izohlar</Label>
            <Textarea
              {...register('notes')}
              placeholder="Qo'shimcha izohlar yoki muammolar haqida yozing..."
              rows={3}
              className="resize-none"
            />
            {errors.notes && <p className="text-xs text-red-500">{errors.notes.message}</p>}
          </div>

          {pdfUrl && (
            <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
              <Badge variant="secondary" className="text-xs">PDF tayyorlandi</Badge>
              <a href={pdfUrl} target="_blank" rel="noopener noreferrer"
                 className="text-xs text-blue-600 hover:underline">
                Yuklab olish →
              </a>
            </div>
          )}

          {submitError && (
            <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-md">{submitError}</p>
          )}

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={handleClose} disabled={isSubmitting}>
              Bekor qilish
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saqlanmoqda...' : 'Tasdiqlash & PDF'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
