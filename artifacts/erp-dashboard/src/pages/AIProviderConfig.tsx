/**
 * @page AIProviderConfig
 * @description AI Provayder konfiguratsiyasi — admin sahifasi.
 * BE endpoint: GET /api/ai/provider-configs · PATCH /api/ai/provider-configs/:provider
 * EP Dizayn: EPPageHeader + EPCard + Switch + Badge
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from '@/lib/i18n';
import { apiRequest } from '@/lib/api-request';
import { EPPageHeader, EPCard } from '@/components/ep';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';

interface ProviderConfig {
  id: number;
  provider: 'openai' | 'gemini' | 'claude';
  apiKeyHint: string | null;
  defaultModel: string | null;
  dailyBudgetUsd: string;
  isActive: boolean;
  notes: string | null;
}

const PROVIDER_LABELS: Record<string, string> = {
  openai: 'OpenAI (GPT-4o-mini)',
  gemini: 'Google Gemini (1.5 Flash)',
  claude: 'Anthropic Claude',
};

const PROVIDER_COLORS: Record<string, string> = {
  openai: 'bg-green-100 text-green-800',
  gemini: 'bg-blue-100 text-blue-800',
  claude: 'bg-purple-100 text-purple-800',
};

export default function AIProviderConfig() {
  const { t } = useTranslation('ai');
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<string | null>(null);
  const [budgetVal, setBudgetVal] = useState('');

  const { data, isLoading, isError } = useQuery<{ data: ProviderConfig[] }>({
    queryKey: ['/api/ai/provider-configs'],
    queryFn: () => apiRequest('GET', '/api/ai/provider-configs'),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ provider, isActive }: { provider: string; isActive: boolean }) =>
      apiRequest('PATCH', `/api/ai/provider-configs/${provider}`, { isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/ai/provider-configs'] });
      toast({ title: t('providerConfig.updated') });
    },
    onError: () => toast({ title: t('providerConfig.updateFailed'), variant: 'destructive' }),
  });

  const budgetMutation = useMutation({
    mutationFn: ({ provider, dailyBudgetUsd }: { provider: string; dailyBudgetUsd: number }) =>
      apiRequest('PATCH', `/api/ai/provider-configs/${provider}`, { dailyBudgetUsd }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/ai/provider-configs'] });
      toast({ title: t('providerConfig.budgetSaved') });
      setEditing(null);
    },
    onError: () => toast({ title: t('providerConfig.updateFailed'), variant: 'destructive' }),
  });

  if (isLoading) return <Skeleton className="h-64 m-6" />;
  if (isError) return (
    <div className="p-6 text-red-600">{t('providerConfig.loadError')}</div>
  );

  const configs = Array.isArray(data?.data) ? data.data : [];

  return (
    <div className="space-y-6 p-6">
      <EPPageHeader
        title={t('providerConfig.title')}
        subtitle={t('providerConfig.subtitle')}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {configs.map((cfg) => (
          <EPCard key={cfg.provider} className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${PROVIDER_COLORS[cfg.provider] ?? ''}`}>
                  {cfg.provider.toUpperCase()}
                </span>
                <p className="mt-1 text-sm font-medium text-foreground">
                  {PROVIDER_LABELS[cfg.provider] ?? cfg.provider}
                </p>
              </div>
              <Switch
                checked={cfg.isActive}
                onCheckedChange={(checked) =>
                  toggleMutation.mutate({ provider: cfg.provider, isActive: checked })
                }
                disabled={toggleMutation.isPending}
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">{t('providerConfig.dailyBudget')}</Label>
              {editing === cfg.provider ? (
                <div className="flex gap-2">
                  <Input
                    type="number"
                    value={budgetVal}
                    onChange={(e) => setBudgetVal(e.target.value)}
                    className="h-8 text-sm"
                    placeholder="50"
                  />
                  <Button
                    size="sm"
                    onClick={() => {
                      const val = parseFloat(budgetVal);
                      if (!isNaN(val) && val > 0) {
                        budgetMutation.mutate({ provider: cfg.provider, dailyBudgetUsd: val });
                      }
                    }}
                    disabled={budgetMutation.isPending}
                  >
                    {t('providerConfig.save')}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setEditing(null)}>
                    {t('providerConfig.cancel')}
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold">${cfg.dailyBudgetUsd}</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 px-2 text-xs"
                    onClick={() => {
                      setBudgetVal(cfg.dailyBudgetUsd);
                      setEditing(cfg.provider);
                    }}
                  >
                    {t('providerConfig.edit')}
                  </Button>
                </div>
              )}
            </div>

            {cfg.apiKeyHint && (
              <div>
                <Label className="text-xs text-muted-foreground">{t('providerConfig.apiKey')}</Label>
                <p className="text-sm font-mono text-muted-foreground">****{cfg.apiKeyHint}</p>
              </div>
            )}

            {cfg.defaultModel && (
              <div>
                <Label className="text-xs text-muted-foreground">{t('providerConfig.model')}</Label>
                <p className="text-sm">{cfg.defaultModel}</p>
              </div>
            )}

            <Badge variant={cfg.isActive ? 'default' : 'secondary'}>
              {cfg.isActive ? t('providerConfig.active') : t('providerConfig.inactive')}
            </Badge>
          </EPCard>
        ))}
      </div>
    </div>
  );
}
