/**
 * @module ai-interview-v2.gateway
 * @description NestJS WebSocket gateway. Socket.IO handlers.
 */

import { Logger, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { castTo } from '@common/db-rows';
import { MS_PER_SECOND } from '@common/constants/app.constants';
import { errMsg } from "../hr-v2-error";
import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import type { Server, Socket } from 'socket.io';
import { AiInterviewV2Service } from './ai-interview-v2.service';
import { AiInterviewAiService } from './ai-interview-v2-ai.service';
import { getGreeting, getCancelMessage, getCompletionMessage, calculateResults } from './ai-interview-v2.utils';
import type { InterviewQuestion, SessionData } from './ai-interview-v2.types';
import { aiInterviewCorsOrigin, setAiInterviewOrigins } from './ai-interview-v2-cors';

@WebSocketGateway({
  namespace: '/ai-interview',
  cors: {
    origin: aiInterviewCorsOrigin,
    methods: ['GET', 'POST'],
  },
})
export class AiInterviewGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(AiInterviewGateway.name);

  @WebSocketServer()
  server: Server;

  private sessions = new Map<string, SessionData>();

  constructor(
    private readonly svc: AiInterviewV2Service,
    private readonly aiSvc: AiInterviewAiService,
    cfg: ConfigService,
  ) {
    const rawOrigins = cfg.get<string>('ALLOWED_ORIGINS');
    const nodeEnv = cfg.get<string>('NODE_ENV') ?? 'development';
    setAiInterviewOrigins(
      rawOrigins
        ? rawOrigins.split(',').map((o) => o.trim()).filter(Boolean)
        : nodeEnv === 'production' ? ['https://europrint.uz'] : '*',
    );
  }

  async handleConnection(client: Socket) {
    const token = client.handshake.query.token as string;
    if (!token) {
      client.emit('error', { message: 'Token required' });
      client.disconnect();
      return;
    }

    const _rValidation = await this.svc.validateToken(token);
    if (!_rValidation.ok) throw new InternalServerErrorException(String(_rValidation.error));
    const validation = _rValidation.data;
    if (!validation.valid) {
      client.emit('error', { message: validation.error });
      client.disconnect();
      return;
    }

    const jobTitle = validation.job_title;
    const _rQs0 = await this.svc.getQuestionsForJob(jobTitle, validation.candidate_language || 'uz');
    const questions = castTo<InterviewQuestion[]>((_rQs0.ok ? _rQs0.data : []));

    this.sessions.set(client.id, {
      sessionId: validation.session_id ?? 0,
      candidateName: validation.candidate_name ?? '',
      candidateLanguage: validation.candidate_language || 'uz',
      jobTitle,
      status: 'connected',
      questionCount: questions.length,
      answeredCount: 0,
      answers: [],
      cameraRejections: validation.camera_rejections || 0,
    });

    client.join(`session:${validation.session_id}`);
    client.emit('connected', {
      sessionId: validation.session_id,
      candidateName: validation.candidate_name,
      language: validation.candidate_language,
      questions: (Array.isArray(questions) ? questions : []).map(q => ({
        id: q.id,
        question: q.question,
        maxScore: q.max_score || 10,
      })),
    });

    this.logger.log(`AI Interview client connected: ${client.id} | Session: ${validation.session_id}`);
  }

  handleDisconnect(client: Socket) {
    const session = this.sessions.get(client.id);
    if (session) {
      this.logger.log(`AI Interview client disconnected: ${client.id} | Session: ${session.sessionId}`);
      this.sessions.delete(client.id);
    }
  }

  @SubscribeMessage('session.join')
  async handleSessionJoin(@ConnectedSocket() client: Socket, @MessageBody() data: { language?: string }) {
    const session = this.sessions.get(client.id);
    if (!session) { client.emit('error', { message: 'Session not found' }); return; }

    if (data.language && ['uz', 'ru', 'en'].includes(data.language)) {
      session.candidateLanguage = data.language;
      this.sessions.set(client.id, session);
    }

    const _rQs1 = await this.svc.getQuestionsForJob(session.jobTitle, session.candidateLanguage);
    const questions = castTo<InterviewQuestion[]>((_rQs1.ok ? _rQs1.data : []));
    client.emit('session.joined', {
      sessionId: session.sessionId,
      candidateName: session.candidateName,
      questions: (Array.isArray(questions) ? questions : []).map(q => ({ id: q.id, question: q.question, maxScore: q.max_score || 10 })),
    });
  }

  @SubscribeMessage('camera.rejected')
  async handleCameraRejected(@ConnectedSocket() client: Socket) {
    const session = this.sessions.get(client.id);
    if (!session) return;

        const _rResult = await this.svc.reportCameraRejection(
      await this.getTokenForSession(session.sessionId),
    );
    if (!_rResult.ok) throw new InternalServerErrorException(String(_rResult.error));
    const result = _rResult.data as Record<string, unknown>;

    session.cameraRejections = result.rejections as number;
    this.sessions.set(client.id, session);

    if (result.cancelled) {
      client.emit('interview.cancelled', {
        reason: 'camera_rejected',
        message: getCancelMessage(session.candidateLanguage),
      });
      client.disconnect();
    } else {
      client.emit('camera.rejection.counted', {
        count: result.rejections as number,
        remaining: 3 - (result.rejections as number),
      });
    }
  }

  @SubscribeMessage('start.interview')
  async handleStartInterview(@ConnectedSocket() client: Socket) {
    const session = this.sessions.get(client.id);
    if (!session) { client.emit('error', { message: 'Session not found' }); return; }

    try {
      await this.svc.startSession(session.sessionId);
      session.status = 'active';
      this.sessions.set(client.id, session);

      const _rQs2 = await this.svc.getQuestionsForJob(session.jobTitle, session.candidateLanguage);
      const questions = castTo<InterviewQuestion[]>((_rQs2.ok ? _rQs2.data : []));
      const greeting = getGreeting(session.candidateName, session.candidateLanguage);

      client.emit('interview.started', {
        sessionId: session.sessionId,
        firstQuestion: questions[0]?.question,
        totalQuestions: questions.length,
        greeting,
      });

      setTimeout(() => {
        if (questions[0]) {
          client.emit('ai.question', {
            question: questions[0].question,
            index: 0,
            totalQuestions: questions.length,
          });
        }
      }, MS_PER_SECOND);

      this.logger.log(`Interview started for session ${session.sessionId}`);
    } catch (err) {
      client.emit('error', { message: errMsg(err as Error) });
    }
  }

  @SubscribeMessage('audio.chunk')
  async handleAudioChunk(@ConnectedSocket() client: Socket, @MessageBody() data: { transcript?: string; questionIndex: number }) {
    const session = this.sessions.get(client.id);
    if (!session || !data.transcript?.trim()) return;

    client.emit('ai.processing', { questionIndex: data.questionIndex });
    const _rQs3 = await this.svc.getQuestionsForJob(session.jobTitle, session.candidateLanguage);
    const questions = castTo<InterviewQuestion[]>((_rQs3.ok ? _rQs3.data : []));
    const currentQuestion = questions[data.questionIndex];
    if (!currentQuestion) return;

    const _rAnalysis = await this.aiSvc.analyzeAnswer(data.transcript, currentQuestion.question, session.candidateLanguage);
    if (!_rAnalysis.ok) throw new InternalServerErrorException(String(_rAnalysis.error));
    const analysis = _rAnalysis.data as Record<string, unknown>;

    session.answers[data.questionIndex] = { question: currentQuestion.question, answer: data.transcript, score: analysis.score as number };
    session.answeredCount = Math.max(session.answeredCount, data.questionIndex + 1);
    this.sessions.set(client.id, session);

    const nextIndex = data.questionIndex + 1;
    const nextQuestion = nextIndex < questions.length ? questions[nextIndex] : null;
    client.emit('ai.text', { questionIndex: data.questionIndex, analysis, feedback: analysis.feedback, nextQuestion: nextQuestion?.question || null, nextIndex, isLast: !nextQuestion });
  }

  @SubscribeMessage('user.answer')
  async handleUserAnswer(@ConnectedSocket() client: Socket, @MessageBody() data: { text: string; questionIndex?: number }) {
    const session = this.sessions.get(client.id);
    if (!session) return;

    const _rQs4 = await this.svc.getQuestionsForJob(session.jobTitle, session.candidateLanguage);
    const questions = castTo<InterviewQuestion[]>((_rQs4.ok ? _rQs4.data : []));
    const qIdx = data.questionIndex ?? session.answeredCount;
    const currentQuestion = questions[qIdx];
    if (!currentQuestion) return;

    const _rAnalysis = await this.aiSvc.analyzeAnswer(data.text, currentQuestion.question, session.candidateLanguage);
    if (!_rAnalysis.ok) throw new InternalServerErrorException(String(_rAnalysis.error));
    const analysis = _rAnalysis.data as Record<string, unknown>;

    session.answers.push({ question: currentQuestion.question, answer: data.text, score: analysis.score as number });
    session.answeredCount = qIdx + 1;
    this.sessions.set(client.id, session);

    const nextIndex = qIdx + 1;
    const nextQuestion = nextIndex < questions.length ? questions[nextIndex] : null;
    client.emit('ai.text', { questionIndex: qIdx, analysis, feedback: analysis.feedback, nextQuestion: nextQuestion?.question || null, nextIndex, isLast: !nextQuestion });

    if (nextQuestion) {
      setTimeout(() => {
        client.emit('ai.question', { question: nextQuestion.question, index: nextIndex, totalQuestions: questions.length });
      }, 800);
    }
  }

  @SubscribeMessage('submit.text.answer')
  async handleTextAnswer(@ConnectedSocket() client: Socket, @MessageBody() data: { answer: string; questionIndex: number }) {
    const session = this.sessions.get(client.id);
    if (!session) return;

    const _rQs5 = await this.svc.getQuestionsForJob(session.jobTitle, session.candidateLanguage);
    const questions = castTo<InterviewQuestion[]>((_rQs5.ok ? _rQs5.data : []));
    const response = await this.aiSvc.analyzeAnswer(data.answer, questions[data.questionIndex]?.question || '', session.candidateLanguage);

    client.emit('ai.text', {
      questionIndex: data.questionIndex,
      analysis: response,
      nextQuestion: data.questionIndex + 1 < questions.length ? questions[data.questionIndex + 1]?.question : null,
      isLast: data.questionIndex + 1 >= questions.length,
    });
  }

  @SubscribeMessage('complete.interview')
  async handleComplete(@ConnectedSocket() client: Socket) {
    const session = this.sessions.get(client.id);
    if (!session) return;

    const _rEval = await this.aiSvc.generateFinalEvaluation(session.answers, session.candidateLanguage);
    const evaluation = (_rEval.ok ? _rEval.data : undefined) as { strengths: string[]; weaknesses: string[]; summary: string; recommendation: string } | undefined;
    const results = calculateResults(session.answers, evaluation);
    await this.svc.completeSession(session.sessionId, results);

    client.emit('interview.completed', {
      sessionId: session.sessionId,
      results,
      message: getCompletionMessage(session.candidateLanguage),
    });
  }

  private async getTokenForSession(sessionId: number): Promise<string> {
    const _rSess = await this.svc.getSession(sessionId);
    return ((_rSess.ok ? _rSess.data : {}) as Record<string, unknown>)['token'] as string;
  }

  broadcastToSession(sessionId: number, event: string, data: Record<string, unknown>) {
    this.server.to(`session:${sessionId}`).emit(event, data);
  }
}
