import { useState, useEffect } from "react";
import { useParams } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Loader2, CheckCircle2, AlertCircle, Brain, FlaskConical,
  Target, ClipboardList, ChevronRight, Trophy
} from "lucide-react";
import type React from "react";
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, Tooltip } from "recharts";

const API_BASE = "/api/hr/hrc-tests/public";

// ─── Types ────────────────────────────────────────────────────────────────────

type TestType = "tool_test" | "iq" | "leadership" | "replication";
type TestStatus = "pending" | "in_progress" | "completed" | "expired";

interface HrcSession {
  id: string;
  session_token: string;
  test_type: TestType;
  status: TestStatus;
  expires_at: string;
  current_q_idx: number;
  score: number | null;
  syndrome: string | null;
  iq_level: string | null;
  leadership_score: number | null;
  replication_accuracy: number | null;
  results: TestResults | null;
  vacancy_title?: string;
}

interface HrcQuestion {
  id: number;
  text_uz: string;
  options?: string[];
  indicator?: string;
  weight?: number;
  category?: string;
  content_uz?: string;
  title_uz?: string;
}

interface TestResults {
  score: number;
  indicators?: Record<string, number>;
  syndrome?: string | null;
  iqLevel?: string | null;
  leadershipScore?: number | null;
  replicationAccuracy?: number | null;
}

const INDICATORS = [
  { key: "A", label: "Moslashuvchanlik", color: "#6366f1" },
  { key: "B", label: "Hamkorlik", color: "#22c55e" },
  { key: "C", label: "Tartiblilik", color: "#f59e0b" },
  { key: "D", label: "Liderlik", color: "#ef4444" },
  { key: "E", label: "Strategik fikr", color: "#8b5cf6" },
  { key: "F", label: "Em. barqarorlik", color: "#06b6d4" },
  { key: "G", label: "Kommunikatsiya", color: "#f97316" },
  { key: "H", label: "O'sishga tayyorlik", color: "#14b8a6" },
  { key: "I", label: "Optimizm", color: "#84cc16" },
  { key: "J", label: "Maqsadlilik", color: "#ec4899" },
];

const SYNDROME_DESCRIPTIONS: Record<string, string> = {
  "Pedant": "Qattiq tartib tarafdori, o'zgarishlarga qarshilik ko'rsatadi",
  "Rozovye Ochki": "Ortiqcha optimist, xatarlarni ko'rmaydi",
  "Manipulyator": "Boshqalarni boshqarish uchun ta'sir vositalaridan foydalanadi",
  "Neeffektivny": "Past samaradorlik, mas'uliyatdan qochadi",
  "Konservator": "Yangilikka qarshi, eski usullarga yopishib olgan",
  "Prokrastinator": "Ishlarni kechiktiradi, qaror qabul qilishdan qo'rqadi",
  "Emotsional Beqaror": "Stressga nisbatan kuchli ta'sirlanuvchan",
  "Avtoritar": "Boshqalarning fikrini hisobga olmaydi",
  "O'sishdan Qochuvchi": "Tanqid va o'sish imkoniyatlaridan qo'rqadi",
  "Jamoa Qo'g'irchoq'i": "Mustaqil qaror qabul qila olmaydi",
  "Introviert Jamoa": "Jamoa bilan ishlashni afzal ko'radi lekin kommunikatsiyasi zaif",
  "Xaotik Novator": "G'oyalarga to'la lekin tartibsiz, yakunlamaydigan",
};

type TestState = "loading" | "intro" | "testing" | "submitting" | "results" | "error" | "expired" | "completed";

type LucideIcon = React.ComponentType<{ className?: string }>;
interface TestTypeConfig { label: string; icon: LucideIcon; desc: string; color: string }

function getTestTypeConfig(type: string): TestTypeConfig {
  const configs: Record<string, TestTypeConfig> = {
    tool_test: { label: "TOOL TEST", icon: Brain, desc: "Shaxsiyat profili baholash", color: "text-violet-600 bg-violet-50" },
    iq: { label: "IQ Test", icon: FlaskConical, desc: "Intellektual qobiliyat baholash", color: "text-blue-600 bg-blue-50" },
    leadership: { label: "Liderlik testi", icon: Target, desc: "Muammo manbai topish qobiliyati", color: "text-orange-600 bg-orange-50" },
    replication: { label: "Takrorlash testi", icon: ClipboardList, desc: "Ko'rsatmani aniq bajarish", color: "text-green-600 bg-green-50" },
  };
  return configs[type] ?? configs["tool_test"];
}

export default function HRCapitalPublicTest() {
  const { token } = useParams<{ token: string }>();
  const [testState, setTestState] = useState<TestState>("loading");
  const [session, setSession] = useState<HrcSession | null>(null);
  const [questions, setQuestions] = useState<HrcQuestion[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [replicationText, setReplicationText] = useState("");
  const [results, setResults] = useState<TestResults | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) { setTestState("error"); setError("Token topilmadi"); return; }
    fetch(`${API_BASE}/${token}`)
      .then(r => r.json())
      .then(data => {
        if (data.error) {
          if (data.error.includes("muddati")) { setTestState("expired"); return; }
          setError(data.error); setTestState("error"); return;
        }
        if (data.completed) {
          setSession(data.session);
          setResults(data.session.results || { score: data.session.score });
          setTestState("completed");
          return;
        }
        setSession(data.session);
        setQuestions(Array.isArray(data.questions) ? data.questions : []);
        setCurrentIdx(data.session.current_q_idx ?? 0);
        setTestState("intro");
      })
      .catch(() => { setError("Server bilan aloqa xatosi"); setTestState("error"); });
  }, [token]);

  const saveAnswer = async (idx: number, answer: number): Promise<Record<number, number>> => {
    const newAnswers = { ...answers, [idx]: answer };
    setAnswers(newAnswers);
    await fetch(`${API_BASE}/${token}/answer`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question_idx: idx, answer }),
    });
    return newAnswers;
  };

  const handleAnswer = async (answer: number) => {
    const newAnswers = await saveAnswer(currentIdx, answer);
    if (currentIdx + 1 >= questions.length) {
      await submitTest(newAnswers);
    } else {
      setCurrentIdx(currentIdx + 1);
    }
  };

  const submitTest = async (_finalAnswers?: Record<number, number>) => {
    setTestState("submitting");
    try {
      const body: { replication_text?: string } = {};
      if (session?.test_type === "replication") body.replication_text = replicationText;
      const res = await fetch(`${API_BASE}/${token}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.error) { setError(data.error); setTestState("error"); return; }
      setResults(data);
      setTestState("results");
    } catch {
      setError("Test yuborishda xatolik"); setTestState("error");
    }
  };

  if (testState === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto mb-3" />
          <p className="text-muted-foreground">Test yuklanmoqda...</p>
        </div>
      </div>
    );
  }

  if (testState === "expired") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="max-w-md w-full text-center">
          <CardContent className="p-8">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Test muddati o'tgan</h2>
            <p className="text-muted-foreground">Ushbu test linki 24 soatlik muddatda amal qiladi. HR bilan bog'laning.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (testState === "error") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="max-w-md w-full text-center">
          <CardContent className="p-8">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Xatolik</h2>
            <p className="text-muted-foreground">{error || "Test topilmadi"}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (testState === "completed") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="max-w-md w-full text-center">
          <CardContent className="p-8">
            <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Test allaqachon yakunlangan</h2>
            <p className="text-muted-foreground">Siz bu testni avval topshirdingiz. Natijalar HR ga yuborildi.</p>
            {session?.score != null && (
              <div className="mt-4 text-4xl font-bold text-primary">{session?.score}%</div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (testState === "submitting") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto mb-3" />
          <p className="text-muted-foreground">Natijalar hisoblanmoqda...</p>
        </div>
      </div>
    );
  }

  const testConfig = getTestTypeConfig(session?.test_type ?? "");
  const Icon = testConfig.icon;

  if (testState === "intro") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
        <Card className="max-w-lg w-full shadow-xl">
          <CardContent className="p-8 text-center space-y-6">
            <div className={`w-16 h-16 rounded-2xl ${testConfig.color} flex items-center justify-center mx-auto`}>
              <Icon className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">{testConfig.label}</h1>
              <p className="text-muted-foreground mt-1">{testConfig.desc}</p>
              {session?.vacancy_title && (
                <Badge className="mt-2 bg-primary/10 text-primary border-0">{session.vacancy_title}</Badge>
              )}
            </div>

            {session?.test_type === "tool_test" && (
              <div className="text-sm text-muted-foreground bg-muted/50 rounded-lg p-4 text-left">
                <p className="font-medium mb-2">Bu test haqida:</p>
                <ul className="space-y-1 list-disc list-inside">
                  <li>{questions.length} ta savol</li>
                  <li>Har bir savolga 5 xil javob bor (1 dan 5 gacha)</li>
                  <li>Halol javob bering — to'g'ri yoki noto'g'ri javob yo'q</li>
                  <li>Natijalar faqat HR ko'radi</li>
                </ul>
              </div>
            )}
            {session?.test_type === "iq" && (
              <div className="text-sm text-muted-foreground bg-muted/50 rounded-lg p-4 text-left">
                <p className="font-medium mb-2">Bu test haqida:</p>
                <ul className="space-y-1 list-disc list-inside">
                  <li>{questions.length} ta savol</li>
                  <li>Har bir savolga bir to'g'ri javob bor</li>
                  <li>Vaqt cheklanmagan</li>
                </ul>
              </div>
            )}
            {session?.test_type === "leadership" && (
              <div className="text-sm text-muted-foreground bg-muted/50 rounded-lg p-4 text-left">
                <p className="font-medium mb-2">Bu test haqida:</p>
                <ul className="space-y-1 list-disc list-inside">
                  <li>{questions.length} ta vaziyat tahlili</li>
                  <li>Muammo kelib chiqish manbaini toping</li>
                </ul>
              </div>
            )}
            {session?.test_type === "replication" && (
              <div className="text-sm text-muted-foreground bg-muted/50 rounded-lg p-4 text-left">
                <p className="font-medium mb-2">Bu test haqida:</p>
                <ul className="space-y-1 list-disc list-inside">
                  <li>Sizga ko'rsatma beriladi</li>
                  <li>Ko'rsatmani o'z so'zlaringiz bilan qayta yozing</li>
                  <li>Aniqlik va to'liqlik o'lchanadi (maqsad: 90%+)</li>
                </ul>
              </div>
            )}

            <Button
              className="w-full"
              size="lg"
              onClick={() => setTestState("testing")}
              data-testid="button-start-test"
            >
              Testni boshlash <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (testState === "results") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4">
        <div className="max-w-2xl mx-auto space-y-6 py-8">
          <Card className="shadow-xl">
            <CardContent className="p-8 text-center">
              <Trophy className="w-12 h-12 text-yellow-500 mx-auto mb-3" />
              <h1 className="text-2xl font-bold">{testConfig.label} yakunlandi!</h1>
              <p className="text-muted-foreground mt-1">Natijalaringiz HR ga yuborildi</p>
              <div className="text-6xl font-bold text-primary mt-4">{results?.score}%</div>

              {results?.syndrome && (
                <div className="mt-4 p-4 bg-orange-50 rounded-xl text-left">
                  <div className="font-semibold text-orange-800">Profil: {results.syndrome}</div>
                  <div className="text-sm text-orange-700 mt-1">{SYNDROME_DESCRIPTIONS[results.syndrome]}</div>
                </div>
              )}

              {results?.iqLevel && (
                <div className="mt-4 p-4 bg-blue-50 rounded-xl">
                  <div className="font-semibold text-blue-800">{results.iqLevel}</div>
                </div>
              )}

              {results?.indicators && Object.keys(results.indicators).length > 0 && (
                <div className="mt-6">
                  <div className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart data={(Array.isArray(INDICATORS) ? INDICATORS : []).map(ind => ({
                        label: ind.label,
                        value: results.indicators?.[ind.key] ?? 0,
                      }))}>
                        <PolarGrid />
                        <PolarAngleAxis dataKey="label" tick={{ fontSize: 10 }} />
                        <PolarRadiusAxis angle={90} domain={[-100, 100]} tick={{ fontSize: 9 }} />
                        <Radar dataKey="value" stroke="#6366f1" fill="#6366f1" fillOpacity={0.3} />
                        <Tooltip formatter={(v: number) => [`${v}`, "Ball"]} />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="space-y-1.5 mt-3 text-left">
                    {(Array.isArray(INDICATORS) ? INDICATORS : []).map(ind => {
                      const val = results.indicators?.[ind.key] ?? 0;
                      return (
                        <div key={ind.key} className="flex items-center gap-2 text-sm">
                          <span className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0" style={{ backgroundColor: ind.color }}>
                            {ind.key}
                          </span>
                          <span className="flex-1">{ind.label}</span>
                          <span className={`font-bold text-xs ${val >= 0 ? "text-green-600" : "text-red-500"}`}>
                            {val > 0 ? "+" : ""}{val}
                          </span>
                          <div className="w-24 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${val >= 0 ? "bg-green-500" : "bg-red-500"}`}
                              style={{ width: `${Math.min(100, Math.abs(val))}%`, marginLeft: val < 0 ? "0" : "0" }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
          <p className="text-center text-sm text-muted-foreground">
            Testni topshirganingiz uchun rahmat! HR mutaxassisi siz bilan bog'lanadi.
          </p>
        </div>
      </div>
    );
  }

  // ─── Testing state ──────────────────────────────────────────────────────────
  const progress = Math.round((currentIdx / Math.max(questions.length, 1)) * 100);

  if (session?.test_type === "replication") {
    const instruction = questions[0];
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-green-50 p-4">
        <div className="max-w-2xl mx-auto py-8 space-y-6">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-green-600" /> Ko'rsatmani o'qing
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="p-4 bg-green-50 rounded-xl text-sm leading-relaxed font-medium">
                {instruction?.content_uz ?? "Ko'rsatma yuklanmoqda..."}
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-base">Ko'rsatmani o'z so'zlaringiz bilan yozing</CardTitle>
              <p className="text-xs text-muted-foreground">Diqqatli o'qing, so'ng quyida qayta yozing</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="Ko'rsatmani bu yerga yozing..."
                value={replicationText}
                onChange={e => setReplicationText(e.target.value)}
                rows={6}
                className="resize-none"
                data-testid="textarea-replication"
              />
              <Button
                className="w-full"
                disabled={replicationText.trim().length < 10}
                onClick={() => submitTest()}
              >
                Testni yakunlash <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentIdx];
  if (!currentQuestion) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Button onClick={() => submitTest()}>Testni yakunlash</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4">
      <div className="max-w-xl mx-auto py-8 space-y-4">
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Savol {currentIdx + 1} / {questions.length}</span>
            <span>{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        <Card className="shadow-lg" data-testid="question-card">
          <CardContent className="p-6 space-y-6">
            <div className="flex items-start gap-3">
              <div className={`p-2 rounded-lg ${testConfig.color} shrink-0`}>
                <Icon className="w-4 h-4" />
              </div>
              <p className="text-base font-medium leading-relaxed pt-0.5" data-testid="question-text">
                {currentQuestion.text_uz}
              </p>
            </div>

            {/* TOOL TEST: Likert scale 1-5 */}
            {session?.test_type === "tool_test" && (
              <div className="space-y-3">
                <div className="flex justify-between text-[10px] text-muted-foreground px-1">
                  <span>Mutlaqo roziman</span>
                  <span>Mutlaqo roziman emas</span>
                </div>
                <div className="flex gap-2">
                  {([
                    { val: 2, label: "5 — Mutlaqo roziman", short: "5" },
                    { val: 1, label: "4 — Ko'proq roziman", short: "4" },
                    { val: 0, label: "3 — Betaraf", short: "3" },
                    { val: -1, label: "2 — Ko'proq rozi emasman", short: "2" },
                    { val: -2, label: "1 — Mutlaqo rozi emasman", short: "1" },
                  ]).map(option => (
                    <button
                      key={option.val}
                      onClick={() => handleAnswer(option.val)}
                      className={`flex-1 py-4 rounded-xl border-2 text-lg font-bold transition-all hover:scale-105
                        ${answers[currentIdx] === option.val
                          ? "border-primary bg-primary text-white shadow-lg scale-105"
                          : "border-gray-200 bg-white hover:border-primary/50 hover:bg-primary/5"
                        }`}
                      data-testid={`answer-option-${option.val}`}
                    >
                      {option.short}
                    </button>
                  ))}
                </div>
                <div className="flex justify-between text-[10px] text-muted-foreground px-1">
                  <span>Juda ko'p</span>
                  <span>Umuman yo'q</span>
                </div>
              </div>
            )}

            {/* IQ Test & Leadership: Multiple choice — both submit option index */}
            {(session?.test_type === "iq" || session?.test_type === "leadership") && (
              <div className="space-y-2">
                {(currentQuestion.options as string[]).map((option, optIdx) => (
                  <button
                    key={optIdx}
                    onClick={() => handleAnswer(optIdx)}
                    className={`w-full text-left p-4 rounded-xl border-2 text-sm transition-all hover:scale-[1.01]
                      ${answers[currentIdx] === optIdx
                        ? "border-primary bg-primary/10 font-semibold"
                        : "border-gray-200 bg-white hover:border-primary/40"
                      }`}
                    data-testid={`mc-option-${optIdx}`}
                  >
                    <span className="inline-flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-bold shrink-0
                        border-current bg-white">
                        {String.fromCharCode(65 + optIdx)}
                      </span>
                      {option}
                    </span>
                  </button>
                ))}
              </div>
            )}

            <div className="flex justify-between items-center pt-2">
              {currentIdx > 0 ? (
                <Button variant="ghost" size="sm" onClick={() => setCurrentIdx(currentIdx - 1)}>
                  ← Orqaga
                </Button>
              ) : <div />}
              {answers[currentIdx] !== undefined && (
                <Button
                  size="sm"
                  onClick={() => {
                    if (currentIdx + 1 >= questions.length) submitTest();
                    else setCurrentIdx(currentIdx + 1);
                  }}
                  data-testid="button-next"
                >
                  {currentIdx + 1 >= questions.length ? "Yakunlash" : "Keyingi"} →
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {session?.test_type === "tool_test" && (
          <div className="grid grid-cols-5 gap-1">
            {(Array.isArray(questions) ? questions : []).map((_, idx) => (
              <div
                key={idx}
                className={`h-1.5 rounded-full transition-all ${
                  idx < currentIdx ? "bg-primary" :
                  idx === currentIdx ? "bg-primary/50" :
                  "bg-gray-200"
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
