/**
 * AIAdvisor — Direktor uchun AI chat panel.
 * Tez savollar tugmalari + savol input + AI javob (POST /api/agents/director/ask).
 */
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Brain, Send } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

import { EPLoader } from "@/components/ep";
const QUICK_QUESTIONS = [
  'Bugungi eng katta muammo nima?',
  'Hafta prognozi qanday?',
  'Qaysi modullarga e\'tibor berishim kerak?',
  'Joriy moliyaviy holatga baho ber',
];

export function AIAdvisor() {
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<Array<{ q: string; a?: string; loading?: boolean }>>([]);

  const ask = useMutation<{ answer: string }, Error, string>({
    mutationFn: (question) => apiRequest<{ answer: string }>('POST', '/api/agents/director/ask', { question }),
    onMutate: (question) => {
      setHistory(h => [...h, { q: question, loading: true }]);
    },
    onSuccess: (data) => {
      setHistory(h => h.map((x, i) => i === h.length - 1 ? { ...x, a: data.answer, loading: false } : x));
    },
    onError: (err) => {
      setHistory(h => h.map((x, i) => i === h.length - 1 ? { ...x, a: `Xatolik: ${err.message}`, loading: false } : x));
    },
  });

  const submit = (q: string) => {
    if (!q.trim() || ask.isPending) return;
    ask.mutate(q.trim());
    setInput('');
  };

  return (
    <Card className="p-4 flex flex-col" style={{ height: 480 }}>
      <div className="flex items-center gap-2 mb-3">
        <Brain className="h-4 w-4 text-[var(--ep-blue)]" />
        <h3 className="font-bold text-sm">AI Maslahatchi</h3>
      </div>

      <div className="flex flex-wrap gap-1.5 mb-3">
        {QUICK_QUESTIONS.map(q => (
          <button key={q} onClick={() => submit(q)} disabled={ask.isPending}
                  className="text-[11px] px-2.5 py-1 rounded-full bg-blue-50 text-[var(--ep-blue)] border border-blue-200 hover:bg-blue-100 transition disabled:opacity-50">
            {q}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 mb-3">
        {history.length === 0 && (
          <div className="text-center py-8 text-xs text-muted-foreground">
            Tez savol tanlang yoki o'zingiz yozing
          </div>
        )}
        {history.map((m, i) => (
          <div key={i} className="space-y-1.5">
            <div className="flex justify-end">
              <div className="max-w-[85%] bg-[var(--ep-blue)] text-white rounded-lg rounded-tr-none px-3 py-2 text-sm">
                {m.q}
              </div>
            </div>
            <div className="flex">
              <div className="max-w-[85%] bg-slate-100 text-slate-900 rounded-lg rounded-tl-none px-3 py-2 text-sm whitespace-pre-wrap">
                {m.loading ? (
                  <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                    <EPLoader size={12} /> AI fikrlamoqda...
                  </span>
                ) : m.a}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          className="flex-1 px-3 py-2 rounded-md border text-sm"
          placeholder="Strategik savol yozing..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && submit(input)}
          disabled={ask.isPending}
        />
        <Button size="sm" onClick={() => submit(input)} disabled={!input.trim() || ask.isPending}>
          <Send className="h-3.5 w-3.5" />
        </Button>
      </div>
    </Card>
  );
}
