/**
 * @module HRCapitalPublicTest
 * @description React page component. Route-level UI.
 */

import { useState, useEffect } from "react";
import { useParams } from "wouter";
import type { HrcSession, HrcQuestion, TestResults, TestState } from "./HRCapitalPublicTestTypes";
import { getTestTypeConfig, API_BASE } from "./HRCapitalPublicTestTypes";
import { apiRequest, HttpError } from "@/lib/queryClient";
import {
  LoadingScreen, SubmittingScreen, ExpiredScreen, ErrorScreen,
  CompletedScreen, IntroScreen, ReplicationScreen,
} from "./HRCapitalPublicTestSections";
import { ResultsScreen, QuestionScreen } from "./HRCapitalPublicTestDialogs";

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
    apiRequest<{
      error?: string;
      completed?: boolean;
      session: HrcSession & { current_q_idx?: number; results?: TestResults; score?: number };
      questions?: HrcQuestion[];
    }>('GET', `${API_BASE}/${token}`)
      .then(data => {
        if (data.error) {
          if (data.error.includes("muddati")) { setTestState("expired"); return; }
          setError(data.error); setTestState("error"); return;
        }
        if (data.completed) {
          setSession(data.session);
          setResults(data.session.results || ({ score: data.session.score } as TestResults));
          setTestState("completed");
          return;
        }
        setSession(data.session);
        setQuestions(Array.isArray(data.questions) ? data.questions : []);
        setCurrentIdx(data.session.current_q_idx ?? 0);
        setTestState("intro");
      })
      .catch((err: unknown) => {
        if (err instanceof HttpError) {
          setError(err.message);
        } else {
          setError("Server bilan aloqa xatosi");
        }
        setTestState("error");
      });
  }, [token]);

  const saveAnswer = async (idx: number, answer: number): Promise<Record<number, number>> => {
    const newAnswers = { ...answers, [idx]: answer };
    setAnswers(newAnswers);
    try {
      await apiRequest('POST', `${API_BASE}/${token}/answer`, { question_idx: idx, answer });
    } catch {
      // best-effort save; ignore errors
    }
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
      const data = await apiRequest<TestResults & { error?: string }>('POST', `${API_BASE}/${token}/submit`, body);
      if (data.error) { setError(data.error); setTestState("error"); return; }
      setResults(data);
      setTestState("results");
    } catch (err) {
      const msg = err instanceof HttpError ? err.message : "Test yuborishda xatolik";
      setError(msg); setTestState("error");
    }
  };

  if (testState === "loading") return <LoadingScreen />;
  if (testState === "expired") return <ExpiredScreen />;
  if (testState === "error") return <ErrorScreen error={error} />;
  if (testState === "completed") return <CompletedScreen session={session} />;
  if (testState === "submitting") return <SubmittingScreen />;

  const testConfig = getTestTypeConfig(session?.test_type ?? "");

  if (testState === "intro") {
    return (
      <IntroScreen
        session={session}
        questions={questions}
        testConfig={testConfig}
        onStart={() => setTestState("testing")}
      />
    );
  }

  if (testState === "results") {
    return <ResultsScreen testConfig={testConfig} results={results} />;
  }

  // testing state
  if (session?.test_type === "replication") {
    return (
      <ReplicationScreen
        questions={questions}
        replicationText={replicationText}
        setReplicationText={setReplicationText}
        onSubmit={() => submitTest()}
      />
    );
  }

  return (
    <QuestionScreen
      session={session}
      questions={questions}
      currentIdx={currentIdx}
      answers={answers}
      testConfig={testConfig}
      onAnswer={handleAnswer}
      onPrev={() => setCurrentIdx(currentIdx - 1)}
      onNext={() => setCurrentIdx(currentIdx + 1)}
      onFinish={() => submitTest()}
    />
  );
}
