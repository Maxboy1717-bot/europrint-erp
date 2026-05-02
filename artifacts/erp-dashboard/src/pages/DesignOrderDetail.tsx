import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { ArrowLeft, Send, Paperclip, ExternalLink, Package } from "lucide-react";
import { Link, useRoute } from "wouter";
import { format } from "date-fns";
import { ErrorState } from "@/components/ui/error-state";

interface DesignOrder {
  order: {
    id: string;
    orderNumber: string;
    dealId: string | null;
    clientName: string;
    clientCompany: string | null;
    clientPhone: string | null;
    clientEmail: string | null;
    productType: string;
    productName: string;
    brandName: string | null;
    quantity: number;
    description: string | null;
    requirements: string | null;
    status: string;
    priority: string;
    deadline: string | null;
    createdAt: Date;
  };
  designer: {
    id: string;
    fullName: string;
  } | null;
}

interface DesignOrderMessage {
  id: number;
  orderId: string;
  senderId: string;
  senderName: string;
  senderRole: 'sales' | 'design' | 'system';
  message: string;
  attachments: string[] | null;
  createdAt: Date;
}

export default function DesignOrderDetail() {
  const [, params] = useRoute("/design-orders/:id");
  const orderId = params?.id;
  const { toast } = useToast();
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: orderData, isLoading: orderLoading, isError, refetch} = useQuery<DesignOrder>({
    queryKey: ["/api/design/orders", orderId],
    enabled: !!orderId,
  });

  const { data: messages = [], isLoading: messagesLoading } = useQuery<DesignOrderMessage[]>({
    queryKey: ["/api/design/orders", orderId, "messages"],
    refetchInterval: 5000,
    enabled: !!orderId,
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (message: string) => {
      return apiRequest('POST', `/api/design/orders/${orderId}/messages`, { message });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/design/orders", orderId, "messages"] });
      setNewMessage("");
    },
    onError: () => {
      toast({ 
        title: "Xatolik", 
        description: "Xabar yuborishda xatolik yuz berdi", 
        variant: "destructive" 
      });
    },
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;
    sendMessageMutation.mutate(newMessage);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!orderId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-gray-50 to-orange-100 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 p-6">
        <div className="max-w-7xl mx-auto">
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Package className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Buyurtma topilmadi</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (orderLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Yuklanmoqda...</p>
        </div>
      </div>
    );
  }


  if (isError) {
    return <ErrorState onRetry={refetch} />;
  }
  if (!orderData) {
    return null;
  }

  const getStatusBadge = (status: string) => {
    const styles = {
      'yangi': 'bg-blue-100 text-blue-700',
      'jarayonda': 'bg-orange-100 text-orange-700',
      'tasdiq-kutilmoqda': 'bg-purple-100 text-purple-700',
      'tasdiqlangan': 'bg-green-100 text-green-700',
      'ishlab-chiqarish': 'bg-teal-100 text-teal-700',
      'yakunlangan': 'bg-emerald-100 text-emerald-700',
    };
    return styles[status as keyof typeof styles] || 'bg-surface-container-low text-on-surface';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-gray-50 to-orange-100 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/design/orders">
            <Button variant="outline" size="icon" data-testid="button-back">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-orange-500 bg-clip-text text-transparent" data-testid="text-order-number">
              {orderData.order.orderNumber}
            </h1>
            <p className="text-muted-foreground mt-1">
              {orderData.order.clientName}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Buyurtma Tafsilotlari</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-muted-foreground">Holat</Label>
                  <div className="mt-1">
                    <Badge className={getStatusBadge(orderData.order.status)}>
                      {orderData.order.status}
                    </Badge>
                  </div>
                </div>

                <div>
                  <Label className="text-muted-foreground">Mahsulot</Label>
                  <p className="font-medium">{orderData.order.productName}</p>
                </div>

                <div>
                  <Label className="text-muted-foreground">Turi</Label>
                  <p className="capitalize">{orderData.order.productType}</p>
                </div>

                {orderData.order.brandName && (
                  <div>
                    <Label className="text-muted-foreground">Brend</Label>
                    <p>{orderData.order.brandName}</p>
                  </div>
                )}

                <div>
                  <Label className="text-muted-foreground">Miqdor</Label>
                  <p>{orderData.order.quantity.toLocaleString()}</p>
                </div>

                <div>
                  <Label className="text-muted-foreground">Ustuvorlik</Label>
                  <Badge variant="outline" className="capitalize">{orderData.order.priority}</Badge>
                </div>

                {orderData.order.deadline && (
                  <div>
                    <Label className="text-muted-foreground">Muddat</Label>
                    <p>{orderData.order.deadline}</p>
                  </div>
                )}

                {orderData.designer && (
                  <div>
                    <Label className="text-muted-foreground">Dizayner</Label>
                    <p>{orderData.designer.fullName}</p>
                  </div>
                )}

                {orderData.order.description && (
                  <div>
                    <Label className="text-muted-foreground">Tavsif</Label>
                    <p className="text-sm">{orderData.order.description}</p>
                  </div>
                )}

                {orderData.order.requirements && (
                  <div>
                    <Label className="text-muted-foreground">Maxsus Talablar</Label>
                    <p className="text-sm">{orderData.order.requirements}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Mijoz Ma'lumotlari</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label className="text-muted-foreground">Ism</Label>
                  <p>{orderData.order.clientName}</p>
                </div>

                {orderData.order.clientCompany && (
                  <div>
                    <Label className="text-muted-foreground">Kompaniya</Label>
                    <p>{orderData.order.clientCompany}</p>
                  </div>
                )}

                {orderData.order.clientPhone && (
                  <div>
                    <Label className="text-muted-foreground">Telefon</Label>
                    <p>{orderData.order.clientPhone}</p>
                  </div>
                )}

                {orderData.order.clientEmail && (
                  <div>
                    <Label className="text-muted-foreground">Email</Label>
                    <p>{orderData.order.clientEmail}</p>
                  </div>
                )}

                {orderData.order.dealId && (
                  <div className="pt-2 border-t">
                    <Label className="text-muted-foreground">CRM Deal</Label>
                    <Link href="/crm">
                      <Button variant="ghost" size="sm" className="p-0 h-auto mt-1" data-testid="link-crm-deal">
                        CRM'ga o'tish
                        <ExternalLink className="ml-1 h-3 w-3" />
                      </Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-2">
            <Card className="h-[calc(100vh-12rem)] flex flex-col">
              <CardHeader>
                <CardTitle>Chat (Savdo ⇄ Dizayn)</CardTitle>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col overflow-hidden p-0">
                <div className="flex-1 overflow-y-auto p-4 space-y-4" data-testid="chat-messages">
                  {messagesLoading ? (
                    <div className="text-center text-muted-foreground">
                      <p>Xabarlar yuklanmoqda...</p>
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="text-center text-muted-foreground py-8">
                      <p>Hozircha xabarlar yo'q</p>
                      <p className="text-sm">Birinchi xabarni yuboring!</p>
                    </div>
                  ) : (
                    (Array.isArray(messages) ? messages : []).map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex ${msg.senderRole === 'sales' ? 'justify-end' : 'justify-start'}`}
                        data-testid={`message-${msg.id}`}
                      >
                        <div
                          className={`max-w-[70%] rounded-lg p-3 ${
                            msg.senderRole === 'sales'
                              ? 'bg-orange-500 text-white'
                              : msg.senderRole === 'design'
                              ? 'bg-blue-500 text-white'
                              : 'bg-surface-container text-on-surface'
                          }`}
                        >
                          <div className="flex items-baseline gap-2 mb-1">
                            <span className="font-semibold text-sm">{msg.senderName}</span>
                            <span className="text-xs opacity-75">
                              {format(new Date(msg.createdAt), 'HH:mm')}
                            </span>
                          </div>
                          <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                        </div>
                      </div>
                    ))
                  )}
                  <div ref={messagesEndRef} />
                </div>

                <div className="border-t p-4">
                  <div className="flex gap-2">
                    <Textarea
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={handleKeyPress}
                      placeholder="Xabar yozing..."
                      className="resize-none"
                      rows={2}
                      data-testid="input-message"
                    />
                    <div className="flex flex-col gap-2">
                      <Button
                        size="icon"
                        variant="outline"
                        disabled
                        data-testid="button-attach"
                      >
                        <Paperclip className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        onClick={handleSendMessage}
                        disabled={!newMessage.trim() || sendMessageMutation.isPending}
                        data-testid="button-send"
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Enter - yuborish, Shift+Enter - yangi qator
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
