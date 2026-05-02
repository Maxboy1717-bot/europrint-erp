import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Upload, X } from "lucide-react";
import { useRef } from "react";

interface ProfileImageSectionProps {
  previewUrl: string | null;
  setPreviewUrl: (url: string | null) => void;
  setSelectedFile: (file: File | null) => void;
  onToast: (title: string, description: string, variant?: "destructive") => void;
}

export function ProfileImageSection({
  previewUrl,
  setPreviewUrl,
  setSelectedFile,
  onToast
}: ProfileImageSectionProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        onToast("Fayl juda katta", "Maksimal hajm 5MB", "destructive");
        return;
      }
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setPreviewUrl(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
      <Avatar className="h-16 w-16">
        {previewUrl && <AvatarImage src={previewUrl} alt="Profile" />}
        <AvatarFallback className="text-2xl">?</AvatarFallback>
      </Avatar>
      <div className="flex-1">
        <p className="font-medium">Profil rasmi</p>
        <p className="text-sm text-muted-foreground">JPG, PNG (maks. 5MB)</p>
      </div>
      <div className="flex gap-2">
        <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
          <Upload className="w-4 h-4 mr-2" /> Yuklash
        </Button>
        {previewUrl && (
          <Button type="button" variant="outline" size="sm" onClick={() => { setSelectedFile(null); setPreviewUrl(null); }}>
            <X className="w-4 h-4 mr-2" /> O'chirish
          </Button>
        )}
      </div>
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileSelect} />
    </div>
  );
}
