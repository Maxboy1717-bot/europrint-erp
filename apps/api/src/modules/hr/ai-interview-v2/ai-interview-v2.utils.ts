/**
 * @module ai-interview-v2.utils
 * @description Source module. See exports for details.
 */

interface ScoredAnswer {
  question: string;
  answer: string;
  score: number;
}

export function getGreeting(name: string, language: string): string {
  const greetings: Record<string, string> = {
    uz: `Xush kelibsiz, ${name}! Men EuroPrint HR AI yordamchisiman. Intervyuimizni boshlaylik.`,
    ru: `Добро пожаловать, ${name}! Я AI-помощник HR EuroPrint. Начнём интервью.`,
    en: `Welcome, ${name}! I'm EuroPrint's HR AI assistant. Let's start the interview.`,
  };
  return greetings[language] || greetings['uz'];
}

export function getCancelMessage(language: string): string {
  const messages: Record<string, string> = {
    uz: "Kamera 3 marta rad etildi. Intervyu bekor qilindi. HR bilan bog'laning.",
    ru: 'Камера отклонена 3 раза. Интервью отменено. Свяжитесь с HR.',
    en: 'Camera rejected 3 times. Interview cancelled. Please contact HR.',
  };
  return messages[language] || messages['uz'];
}

export function getCompletionMessage(language: string): string {
  const messages: Record<string, string> = {
    uz: "Intervyu muvaffaqiyatli yakunlandi!\nHR jamoasi siz bilan tez orada bog'lanadi.",
    ru: 'Интервью успешно завершено! Команда HR свяжется с вами в ближайшее время.',
    en: 'Interview completed successfully!\nThe HR team will contact you soon.',
  };
  return messages[language] || messages['uz'];
}

export function calculateResults(
  answers: ScoredAnswer[],
  evaluation?: { strengths: string[]; weaknesses: string[]; summary: string; recommendation: string },
) {
  const scores = (Array.isArray(answers) ? answers : []).map(a => a.score ?? 5);
  const avg = scores.length > 0 ? (Array.isArray(scores) ? scores : []).reduce((a, b) => a + b, 0) / scores.length : 5;
  const pct = Math.round(avg * 10);

  return {
    communicationScore: pct,
    confidenceScore: pct,
    problemSolvingScore: pct,
    overallScore: pct,
    recommendation: evaluation?.recommendation || (avg >= 7 ? 'HIRE' : avg >= 5 ? 'CONSIDER' : 'REJECT'),
    aiSummary: evaluation?.summary || `Nomzod ${answers.length} ta savolga javob berdi. O'rtacha ball: ${avg.toFixed(1)}/10`,
    transcript: (Array.isArray(answers) ? answers : []).map((a, i) => `S${i + 1}: ${a.question}\nJ: ${a.answer}`).join('\n\n'),
    strengths: evaluation?.strengths || [],
    weaknesses: evaluation?.weaknesses || [],
  };
}

export function fallbackAnalysis(answer: string): { score: number; feedback: string; keywords: string[] } {
  const wordCount = answer.trim().split(/\s+/).length;
  const score = Math.min(10, Math.max(4, Math.floor(wordCount / 5)));
  return {
    score,
    feedback: score >= 7 ? 'Kuchli va aniq javob' : score >= 5 ? "Yaxshi, lekin batafsilroq bo'lishi mumkin" : "Ko'proq ma'lumot kerak",
    keywords: [],
  };
}

export function fallbackEvaluation(answers: ScoredAnswer[]): { strengths: string[]; weaknesses: string[]; summary: string; recommendation: string } {
  const avg = answers.length > 0
    ? (Array.isArray(answers) ? answers : []).reduce((sum, a) => sum + (a.score || 5), 0) / answers.length
    : 5;
  return {
    strengths: ['Intervyu yakunlandi'],
    weaknesses: [],
    summary: `Nomzod ${answers.length} ta savolga javob berdi. O'rtacha ball: ${avg.toFixed(1)}/10`,
    recommendation: avg >= 7 ? 'HIRE' : avg >= 5 ? 'CONSIDER' : 'REJECT',
  };
}
