import { useState, useRef, type ChangeEvent } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Camera, Upload, X } from 'lucide-react';

const FormSchema = z.object({
  description: z.string().max(1000).optional(),
});
type FormValues = z.infer<typeof FormSchema>;

interface Props {
  open:     boolean;
  roomCode: string;
  roomName: string;
  onClose:  () => void;
  onSaved:  () => void;
}

export function RoomReferenceUpload({ open, roomCode, roomName, onClose, onSaved }: Props) {
  const [preview,     setPreview]     = useState<string | null>(null);
  const [base64,      setBase64]      = useState<string>('');
  const [submitError, setSubmitError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const {
    register, handleSubmit, reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver:      zodResolver(FormSchema),
    defaultValues: { description: '' },
  });

  const handleFile = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setSubmitError('Faqat rasm fayllari qabul qilinadi');
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result as string;
      setPreview(result);
      setBase64(result);
    };
    reader.readAsDataURL(file);
  };

  const onSubmit = async (values: FormValues) => {
    if (!base64) { setSubmitError('Rasm tanlanmagan'); return; }
    setSubmitError(null);
    try {
      const token = localStorage.getItem('access_token') ?? '';
      const res = await fetch(`/api/hr/inspection/rooms/${roomCode}/reference-photo`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body:    JSON.stringify({
          image_base64: base64,
          room_name:    roomName,
          description:  values.description || undefined,
        }),
      });
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({})) as { message?: string };
        throw new Error(errBody.message ?? `Server xatosi: ${res.status}`);
      }
      onSaved();
      handleClose();
    } catch (e: unknown) {
      setSubmitError((e as Error)?.message ?? 'Yuklashda xatolik');
    }
  };

  const handleClose = () => {
    setPreview(null);
    setBase64('');
    setSubmitError(null);
    reset();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-blue-600" />
            Referans rasm yuklash — {roomName}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
          {preview ? (
            <div className="relative rounded-lg overflow-hidden border bg-gray-50">
              <img src={preview} alt="Preview" className="w-full h-52 object-cover" />
              <button
                type="button"
                onClick={() => { setPreview(null); setBase64(''); }}
                className="absolute top-2 right-2 bg-white rounded-full p-1 shadow hover:bg-red-50"
              >
                <X className="w-4 h-4 text-red-500" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="w-full h-40 border-2 border-dashed border-blue-200 rounded-lg flex flex-col items-center
                         justify-center gap-2 hover:border-blue-400 hover:bg-blue-50 transition-colors"
            >
              <Upload className="w-8 h-8 text-blue-400" />
              <span className="text-sm text-gray-500">Rasm tanlash uchun bosing</span>
              <span className="text-xs text-gray-400">JPEG, PNG, WebP</span>
            </button>
          )}

          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />

          <div className="space-y-1">
            <Label htmlFor="ref-desc">Izoh (ixtiyoriy)</Label>
            <Textarea
              id="ref-desc"
              {...register('description')}
              rows={3}
              placeholder="Xonaning ideal holati haqida qisqacha izoh..."
              className="resize-none"
            />
            {errors.description && (
              <p className="text-xs text-red-500">{errors.description.message}</p>
            )}
          </div>

          {!base64 && (
            <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded px-2 py-1">
              Davom etish uchun rasm tanlang
            </p>
          )}

          {submitError && (
            <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-md">{submitError}</p>
          )}

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={handleClose} disabled={isSubmitting}>
              Bekor qilish
            </Button>
            <Button type="submit" disabled={isSubmitting || !base64}>
              {isSubmitting ? 'Yuklanmoqda...' : 'Saqlash'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
