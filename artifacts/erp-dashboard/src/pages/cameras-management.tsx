import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { safeArray } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { DeleteConfirmDialog } from "@/components/delete-confirm-dialog";
import { 
  Camera, 
  Plus, 
  Edit, 
  Trash2, 
  MapPin, 
  Settings, 
  Video, 
  CheckCircle, 
  XCircle,
  RefreshCw,
  Eye,
  Power,
  Wifi,
  WifiOff
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { ErrorState } from "@/components/ui/error-state";

interface CameraData {
  id: string;
  code: string;
  name: string;
  nameRu: string | null;
  rtspUrl: string | null;
  ipAddress: string | null;
  port: number | null;
  username: string | null;
  password: string | null;
  workCenterId: string | null;
  location: string | null;
  isActive: boolean;
  createdAt: string;
}

interface WorkCenter {
  id: string;
  code: string;
  name: string;
}

const cameraFormSchema = z.object({
  code: z.string().min(1, "Kamera kodi kerak"),
  name: z.string().min(2, "Nom kamida 2 ta belgidan iborat bo'lishi kerak"),
  nameRu: z.string().optional(),
  rtspUrl: z.string().optional(),
  ipAddress: z.string().optional(),
  port: z.number().optional(),
  username: z.string().optional(),
  password: z.string().optional(),
  workCenterId: z.string().optional(),
  location: z.string().optional(),
  isActive: z.boolean().default(true)
});

type CameraFormData = z.infer<typeof cameraFormSchema>;

export default function CamerasManagement() {
  const { toast } = useToast();
  const [language, setLanguage] = useState<"uz" | "ru">("uz");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingCamera, setEditingCamera] = useState<CameraData | null>(null);

  const { data: cameras, isLoading, isError, refetch} = useQuery<CameraData[]>({
    queryKey: ["/api/cameras"]
  });

  const { data: workCenters } = useQuery<WorkCenter[]>({
    queryKey: ["/api/pp/work-centers"]
  });

  const form = useForm<CameraFormData>({
    resolver: zodResolver(cameraFormSchema),
    defaultValues: {
      code: "",
      name: "",
      nameRu: "",
      rtspUrl: "",
      ipAddress: "",
      location: "",
      isActive: true
    }
  });

  const addMutation = useMutation({
    mutationFn: async (data: CameraFormData) => {
      return apiRequest("POST", "/api/cameras", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cameras"] });
      setIsAddDialogOpen(false);
      form.reset();
      toast({
        title: language === "uz" ? "Muvaffaqiyat" : "Успех",
        description: language === "uz" ? "Kamera qo'shildi" : "Камера добавлена"
      });
    },
    onError: () => {
      toast({
        title: language === "uz" ? "Xato" : "Ошибка",
        description: language === "uz" ? "Kamera qo'shishda xato" : "Ошибка при добавлении камеры",
        variant: "destructive"
      });
    }
  });

  const updateMutation = useMutation({
    mutationFn: async (data: CameraFormData & { id: string }) => {
      const { id, ...rest } = data;
      return apiRequest("PATCH", `/api/cameras/${id}`, rest);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cameras"] });
      setEditingCamera(null);
      form.reset();
      toast({
        title: language === "uz" ? "Muvaffaqiyat" : "Успех",
        description: language === "uz" ? "Kamera yangilandi" : "Камера обновлена"
      });
    },
    onError: () => {
      toast({
        title: language === "uz" ? "Xato" : "Ошибка",
        description: language === "uz" ? "Kamerani yangilashda xato" : "Ошибка при обновлении камеры",
        variant: "destructive"
      });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/cameras/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cameras"] });
      toast({
        title: language === "uz" ? "Muvaffaqiyat" : "Успех",
        description: language === "uz" ? "Kamera o'chirildi" : "Камера удалена"
      });
    },
    onError: () => {
      toast({
        title: language === "uz" ? "Xato" : "Ошибка",
        description: language === "uz" ? "Kamerani o'chirishda xato" : "Ошибка при удалении камеры",
        variant: "destructive"
      });
    }
  });

  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      return apiRequest("PATCH", `/api/cameras/${id}`, { isActive });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cameras"] });
    }
  });

  const onSubmit = (data: CameraFormData) => {
    if (editingCamera) {
      updateMutation.mutate({ ...data, id: editingCamera.id });
    } else {
      addMutation.mutate(data);
    }
  };

  const handleEdit = (camera: CameraData) => {
    setEditingCamera(camera);
    form.reset({
      code: camera.code,
      name: camera.name,
      nameRu: camera.nameRu || "",
      rtspUrl: camera.rtspUrl || "",
      ipAddress: camera.ipAddress || "",
      port: camera.port || undefined,
      username: camera.username || "",
      password: camera.password || "",
      workCenterId: camera.workCenterId || undefined,
      location: camera.location || "",
      isActive: camera.isActive
    });
  };

  const t = {
    title: language === "uz" ? "Kameralar Boshqaruvi" : "Управление камерами",
    subtitle: language === "uz" ? "Kameralarni qo'shish, tahrirlash va boshqarish" : "Добавление, редактирование и управление камерами",
    addCamera: language === "uz" ? "Kamera qo'shish" : "Добавить камеру",
    editCamera: language === "uz" ? "Kamerani tahrirlash" : "Редактировать камеру",
    code: language === "uz" ? "Kod" : "Код",
    name: language === "uz" ? "Nomi" : "Название",
    nameRu: language === "uz" ? "Nomi (rus)" : "Название (рус)",
    location: language === "uz" ? "Joylashuv" : "Местоположение",
    ipAddress: language === "uz" ? "IP manzil" : "IP адрес",
    rtspUrl: language === "uz" ? "RTSP URL" : "RTSP URL",
    workCenter: language === "uz" ? "Ish markazi" : "Рабочий центр",
    status: language === "uz" ? "Holat" : "Статус",
    active: language === "uz" ? "Faol" : "Активная",
    inactive: language === "uz" ? "Nofaol" : "Неактивная",
    actions: language === "uz" ? "Amallar" : "Действия",
    save: language === "uz" ? "Saqlash" : "Сохранить",
    cancel: language === "uz" ? "Bekor qilish" : "Отмена",
    delete: language === "uz" ? "O'chirish" : "Удалить",
    totalCameras: language === "uz" ? "Jami kameralar" : "Всего камер",
    activeCameras: language === "uz" ? "Faol kameralar" : "Активные камеры",
    selectWorkCenter: language === "uz" ? "Ish markazini tanlang" : "Выберите рабочий центр",
    noCameras: language === "uz" ? "Kameralar topilmadi" : "Камеры не найдены"
  };

  if (isError) {
    return <ErrorState onRetry={refetch} />;
  }

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-4">
          {([...Array(5)]).map((_, i) => (
            <Skeleton key={`k-${i}`} className="h-16" />
          ))}
        </div>
      </div>
    );
  }

  const safeCameras = safeArray<CameraData>(cameras);
  const activeCameras = (Array.isArray(safeCameras) ? safeCameras : []).filter(c => c.isActive).length;

  return (
    <div className="p-6 space-y-6 bg-surface min-h-screen">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-light tracking-tight text-on-surface">
            {language === "uz" ? "Kameralar" : "Камеры"} <span className="font-bold text-primary">{language === "uz" ? "Boshqaruvi" : "Управление"}</span>
          </h1>
          <p className="text-on-surface-variant">{t.subtitle}</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex rounded-lg border border-outline-variant overflow-hidden">
            <Button 
              variant={language === "uz" ? "default" : "ghost"} 
              size="sm"
              className="rounded-none px-4"
              onClick={() => setLanguage("uz")}
              data-testid="button-lang-uz"
            >
              UZ
            </Button>
            <Button 
              variant={language === "ru" ? "default" : "ghost"} 
              size="sm"
              className="rounded-none px-4"
              onClick={() => setLanguage("ru")}
              data-testid="button-lang-ru"
            >
              RU
            </Button>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-br from-primary to-primary-dim text-white rounded-lg px-5 py-2.5 text-sm font-semibold" data-testid="button-add-camera">
                <Plus className="h-4 w-4 mr-1" />
                {t.addCamera}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg bg-surface-container-lowest border-none rounded-xl">
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold text-on-surface">{t.addCamera}</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="code"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t.code}</FormLabel>
                          <FormControl>
                            <Input placeholder="CAM-001" {...field} data-testid="input-camera-code" />
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
                            <Input placeholder="Kirish eshigi" {...field} data-testid="input-camera-name" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={form.control}
                    name="nameRu"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t.nameRu}</FormLabel>
                        <FormControl>
                          <Input placeholder="Входная дверь" {...field} data-testid="input-camera-name-ru" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="location"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t.location}</FormLabel>
                        <FormControl>
                          <Input placeholder="Asosiy bino, 1-qavat" {...field} data-testid="input-camera-location" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="ipAddress"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t.ipAddress}</FormLabel>
                          <FormControl>
                            <Input placeholder="192.168.1.100" {...field} data-testid="input-camera-ip" />
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
                              <SelectTrigger data-testid="select-work-center">
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
                  <FormField
                    control={form.control}
                    name="rtspUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t.rtspUrl}</FormLabel>
                        <FormControl>
                          <Input placeholder="rtsp://username:password@ip:port/stream" {...field} data-testid="input-camera-rtsp" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="isActive"
                    render={({ field }) => (
                      <FormItem className="flex items-center gap-2">
                        <FormControl>
                          <Switch 
                            checked={field.value} 
                            onCheckedChange={field.onChange} 
                            data-testid="switch-camera-active"
                          />
                        </FormControl>
                        <FormLabel className="!mt-0">{t.active}</FormLabel>
                      </FormItem>
                    )}
                  />
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                      {t.cancel}
                    </Button>
                    <Button type="submit" disabled={addMutation.isPending} data-testid="button-save-camera">
                      {addMutation.isPending ? <RefreshCw className="h-4 w-4 animate-spin" /> : t.save}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="bg-surface-container-lowest border-none rounded-lg p-5">
          <div className="flex flex-row items-center justify-between gap-2 mb-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">{t.totalCameras}</span>
            <Camera className="h-5 w-5 text-primary" />
          </div>
          <div className="text-4xl font-bold tracking-tight text-on-surface">{safeCameras.length}</div>
        </Card>
        <Card className="bg-surface-container-lowest border-none rounded-lg p-5">
          <div className="flex flex-row items-center justify-between gap-2 mb-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">{t.activeCameras}</span>
            <CheckCircle className="h-5 w-5 text-green-500" />
          </div>
          <div className="text-4xl font-bold tracking-tight text-green-600">{activeCameras}</div>
        </Card>
      </div>

      <Card className="bg-surface-container-lowest border-none rounded-lg overflow-hidden shadow-none">
        <CardContent className="p-0">
          <ScrollArea className="h-[500px]">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="bg-surface-container text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-6">{t.code}</TableHead>
                  <TableHead className="bg-surface-container text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-6">{t.name}</TableHead>
                  <TableHead className="bg-surface-container text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-6">{t.location}</TableHead>
                  <TableHead className="bg-surface-container text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-6">{t.ipAddress}</TableHead>
                  <TableHead className="bg-surface-container text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-6">{t.status}</TableHead>
                  <TableHead className="bg-surface-container text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-6 text-right">{t.actions}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {safeCameras.length > 0 ? (
                  (Array.isArray(safeCameras) ? safeCameras : []).map((camera) => (
                    <TableRow key={camera.id} className="hover:bg-surface-container-low transition-colors border-none" data-testid={`row-camera-${camera.id}`}>
                      <TableCell className="font-bold text-on-surface py-4 px-6">{camera.code}</TableCell>
                      <TableCell className="py-4 px-6">
                        <div>
                          <p className="font-bold text-on-surface">{language === "uz" ? camera.name : (camera.nameRu || camera.name)}</p>
                          {camera.workCenterId && (
                            <p className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant flex items-center gap-1 mt-1">
                              <Settings className="h-3 w-3" />
                              {workCenters?.find(wc => wc.id === camera.workCenterId)?.name || "—"}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="py-4 px-6">
                        <div className="flex items-center gap-1 text-sm font-medium text-on-surface-variant">
                          <MapPin className="h-3.5 w-3.5" />
                          {camera.location || "—"}
                        </div>
                      </TableCell>
                      <TableCell className="py-4 px-6">
                        {camera.ipAddress ? (
                          <div className="flex items-center gap-1 text-sm font-medium text-on-surface-variant">
                            <Wifi className="h-3.5 w-3.5 text-green-500" />
                            {camera.ipAddress}
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 text-sm font-medium text-on-surface-variant/50">
                            <WifiOff className="h-3.5 w-3.5" />
                            —
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <Switch
                            checked={camera.isActive}
                            onCheckedChange={(checked) => toggleStatusMutation.mutate({ id: camera.id, isActive: checked })}
                            data-testid={`switch-status-${camera.id}`}
                            className="data-[state=checked]:bg-primary"
                          />
                          <Badge variant={camera.isActive ? "default" : "secondary"} className={`${
                            camera.isActive ? "bg-green-100 text-green-800" : "bg-surface-container text-on-surface-variant"
                          } border-none rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider`}>
                            {camera.isActive ? (
                              <><CheckCircle className="h-3 w-3 mr-1" />{t.active}</>
                            ) : (
                              <><XCircle className="h-3 w-3 mr-1" />{t.inactive}</>
                            )}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="text-right py-4 px-6">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleEdit(camera)}
                            className="rounded-lg hover:bg-surface-container-high text-on-surface-variant"
                            data-testid={`button-edit-${camera.id}`}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <DeleteConfirmDialog
                            title="Kamerani o'chirishni tasdiqlaysizmi?"
                            description="Kamera va unga bog'liq barcha ma'lumotlar o'chiriladi."
                            onConfirm={() => deleteMutation.mutate(camera.id)}
                            isPending={deleteMutation.isPending}
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-20 text-on-surface-variant">
                      <Camera className="h-16 w-16 mx-auto mb-4 opacity-10" />
                      <p className="font-bold uppercase tracking-widest text-sm">{t.noCameras}</p>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>

      <Dialog open={!!editingCamera} onOpenChange={(open) => !open && setEditingCamera(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{t.editCamera}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t.code}</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-edit-camera-code" />
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
                        <Input {...field} data-testid="input-edit-camera-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="nameRu"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t.nameRu}</FormLabel>
                    <FormControl>
                      <Input {...field} data-testid="input-edit-camera-name-ru" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t.location}</FormLabel>
                    <FormControl>
                      <Input {...field} data-testid="input-edit-camera-location" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="ipAddress"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t.ipAddress}</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-edit-camera-ip" />
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
                          <SelectTrigger data-testid="select-edit-work-center">
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
              <FormField
                control={form.control}
                name="rtspUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t.rtspUrl}</FormLabel>
                    <FormControl>
                      <Input {...field} data-testid="input-edit-camera-rtsp" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-2">
                    <FormControl>
                      <Switch 
                        checked={field.value} 
                        onCheckedChange={field.onChange} 
                        data-testid="switch-edit-camera-active"
                      />
                    </FormControl>
                    <FormLabel className="!mt-0">{t.active}</FormLabel>
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setEditingCamera(null)}>
                  {t.cancel}
                </Button>
                <Button type="submit" disabled={updateMutation.isPending} data-testid="button-update-camera">
                  {updateMutation.isPending ? <RefreshCw className="h-4 w-4 animate-spin" /> : t.save}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
