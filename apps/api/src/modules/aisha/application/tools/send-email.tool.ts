/**
 * @module send-email.tool
 */

import { Injectable, Inject, Optional } from '@nestjs/common';
import { Result, Err, AppErr, safeCall } from '@common/result';
import type { IAishaTool, ToolResult } from '../../domain/tool.interface';
import { provSource, provResult } from './_helpers';

export interface EmailSendResult {
  messageId: string;
  to:        string[];
}

export interface IEmailSender {
  send(opts: { to: string[]; subject: string; body: string; attachments?: string[] })
    : Promise<{ messageId: string }>;
}

export const EMAIL_SENDER = Symbol('AISHA_EMAIL_SENDER');

@Injectable()
export class SendEmailTool implements IAishaTool {
  readonly definition = {
    name: 'send_email',
    description: 'HIGH: Email yuborish (ovozli tasdiqlash kerak).',
    input_schema: {
      type: 'object' as const,
      properties: {
        to:           { type: 'string', description: 'CSV emails' },
        subject:      { type: 'string' },
        body:         { type: 'string' },
        attachments:  { type: 'string', description: 'CSV URL\'lar (ixtiyoriy)' },
      },
      required: ['to', 'subject', 'body'],
    },
  };

  readonly stakeLevel = 'high' as const;

  constructor(
    @Optional() @Inject(EMAIL_SENDER)
    private readonly sender: IEmailSender | null = null,
  ) {}

  async execute(input: Record<string, unknown>): Promise<Result<ToolResult<EmailSendResult>>> {
    const to = String(input['to'] ?? '').split(',').map(s => s.trim()).filter(Boolean);
    const subject = String(input['subject'] ?? '');
    const body = String(input['body'] ?? '');
    if (to.length === 0) return Err(AppErr('VALIDATION', 'to bo\'sh bo\'lmasligi kerak'));
    if (!subject || !body) return Err(AppErr('VALIDATION', 'subject va body majburiy'));
    const sender = this.sender;
    if (!sender) return Err(AppErr('EXTERNAL_SERVICE', 'EmailSender provayderi yo\'q'));

    return safeCall<ToolResult<EmailSendResult>>(async () => {
      const start = Date.now();
      const r = await sender.send({
        to, subject, body,
        attachments: String(input['attachments'] ?? '').split(',').map(s => s.trim()).filter(Boolean),
      });
      return provResult<EmailSendResult>({
        data: { messageId: r.messageId, to },
        sources: [provSource({ type: 'api', identifier: 'smtp.mailer', startMs: start, rowCount: to.length })],
      });
    });
  }
}
