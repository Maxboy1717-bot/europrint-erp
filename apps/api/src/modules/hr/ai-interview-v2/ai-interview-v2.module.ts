/**
 * @module ai-interview-v2.module
 * @description NestJS @Module() definition. Providers, controllers, and imports for this feature slice.
 */

import { Module } from '@nestjs/common';
import { AiInterviewV2Service } from './ai-interview-v2.service';
import { AiInterviewV2Repository } from './ai-interview-v2.repository';
import { AiInterviewV2Controller } from './ai-interview-v2.controller';
import { AiInterviewGateway } from './ai-interview-v2.gateway';
import { AiInterviewAiService } from './ai-interview-v2-ai.service';

@Module({
  controllers: [AiInterviewV2Controller],
  providers: [AiInterviewV2Repository, AiInterviewV2Service, AiInterviewGateway, AiInterviewAiService],
  exports: [AiInterviewV2Service, AiInterviewGateway, AiInterviewAiService],
})
export class AiInterviewV2Module {}
