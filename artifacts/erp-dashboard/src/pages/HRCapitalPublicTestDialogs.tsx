/**
 * @module HRCapitalPublicTestDialogs
 * @description Results and question screen components for HRCapitalPublicTest page.
 */

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Trophy } from "lucide-react";
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, Tooltip } from "recharts";
import type { HrcSession, HrcQuestion, TestResults, TestTypeConfig } from "./HRCapitalPublicTestTypes";
import { INDICATORS, SYNDROME_DESCRIPTIONS } from "./HRCapitalPublicTestTypes";

interface ResultsScreenProps {
  testConfig: TestTypeConfig;
  results: TestResults | null;
}

export function ResultsScreen({ testConfig, results }: ResultsScreenProps) {
  return (
    <div className="min-h-screen p-4">
      <div className="max-w-2xl mx-auto space-y-6 py-8">
        <Card className="shadow-xl">
          <CardContent className="p-8 text-center">
            <Trophy className="w-12 h-12 text-[var(--ep-yellow)] mx-auto mb-3" />
            <h1 className="text-2xl font-bold">{testConfig.label} yakunlandi!</h1>
            <p className="text-muted-foreground mt-1">Natijalaringiz HR ga yuborildi</p>
            <div className="text-6xl font-bold text-primary mt-4">{results?.score}%</div>
            {results?.syndrome && (
              <div className="mt-4 p-4 bg-orange-50 rounded-xl text-left">
                <div className="font-semibold text-orange-800">Profil: {results.syndrome}</div>
                <div className="text-sm text-[var(--ep-primary)] mt-1">{SYNDROME_DESCRIPTIONS[results.syndrome]}</div>
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
                        <span className={`font-bold text-xs ${val >= 0 ? "text-[var(--ep-green)]" : "text-[var(--ep-red)]"}`}>
                          {val > 0 ? "+" : ""}{val}
                        </span>
                        <div className="w-24 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${val >= 0 ? "bg-green-500" : "bg-red-500"}`} style={{ width: `${Math.min(100, Math.abs(val))}%` }} />
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

interface QuestionScreenProps {
  session: HrcSession | null;
  questions: HrcQuestion[];
  currentIdx: number;
  answers: Record<number, number>;
  testConfig: TestTypeConfig;
  onAnswer: (answer: number) => void;
  onPrev: () => void;
  onNext: () => void;
  onFinish: () => void;
}

export function QuestionScreen({
  session, questions, currentIdx, answers, testConfig,
  onAnswer, onPrev, onNext, onFinish,
}: QuestionScreenProps) {
  const progress = Math.round((currentIdx / Math.max(questions.length, 1)) * 100);
  const currentQuestion = questions[currentIdx];
  const Icon = testConfig.icon;

  if (!currentQuestion) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Button onClick={onFinish}>Testni yakunlash</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4">
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
            {session?.test_type === "tool_test" && (
              <div className="space-y-3">
                <div className="flex justify-between text-[10px] text-muted-foreground px-1">
                  <span>Mutlaqo roziman</span><span>Mutlaqo roziman emas</span>
                </div>
                <div className="flex gap-2">
                  {([{ val: 2, short: "5" }, { val: 1, short: "4" }, { val: 0, short: "3" }, { val: -1, short: "2" }, { val: -2, short: "1" }]).map(option => (
                    <button
                      key={option.val}
                      onClick={() => onAnswer(option.val)}
                      className={`flex-1 py-4 rounded-xl border-2 text-lg font-bold transition-all hover:scale-105 ${answers[currentIdx] === option.val ? "border-primary bg-primary text-white shadow-lg scale-105" : "border-gray-200 bg-white hover:border-primary/50 hover:bg-primary/5"}`}
                      data-testid={`answer-option-${option.val}`}
                    >
                      {option.short}
                    </button>
                  ))}
                </div>
                <div className="flex justify-between text-[10px] text-muted-foreground px-1">
                  <span>Juda ko'p</span><span>Umuman yo'q</span>
                </div>
              </div>
            )}
            {(session?.test_type === "iq" || session?.test_type === "leadership") && (
              <div className="space-y-2">
                {(currentQuestion.options as string[]).map((option, optIdx) => (
                  <button
                    key={optIdx}
                    onClick={() => onAnswer(optIdx)}
                    className={`w-full text-left p-4 rounded-xl border-2 text-sm transition-all hover:scale-[1.01] ${answers[currentIdx] === optIdx ? "border-primary bg-primary/10 font-semibold" : "border-gray-200 bg-white hover:border-primary/40"}`}
                    data-testid={`mc-option-${optIdx}`}
                  >
                    <span className="inline-flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-bold shrink-0 border-current bg-white">
                        {String.fromCharCode(65 + optIdx)}
                      </span>
                      {option}
                    </span>
                  </button>
                ))}
              </div>
            )}
            <div className="flex justify-between items-center pt-2">
              {currentIdx > 0 ? <Button variant="ghost" size="sm" onClick={onPrev}>← Orqaga</Button> : <div />}
              {answers[currentIdx] !== undefined && (
                <Button size="sm" onClick={() => { if (currentIdx + 1 >= questions.length) onFinish(); else onNext(); }} data-testid="button-next">
                  {currentIdx + 1 >= questions.length ? "Yakunlash" : "Keyingi"} →
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
        {session?.test_type === "tool_test" && (
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-1">
            {(Array.isArray(questions) ? questions : []).map((_, idx) => (
              <div key={idx} className={`h-1.5 rounded-full transition-all ${idx < currentIdx ? "bg-primary" : idx === currentIdx ? "bg-primary/50" : "bg-gray-200"}`} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
