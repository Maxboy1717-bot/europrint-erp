/**
 * @module ai-fit.module
 * @description P36 AI-fit per-card scorer slice. Isolated module so the
 *   AI-fit feature registers independently of ai.module.ts (which carries
 *   other in-flight work). Imports AiModule for AiRouterService (exported)
 *   + AuthModule for the guards.
 */

import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { DrizzleService } from '../common/services/drizzle.service';
import { AiModule } from './ai.module';
import { DrizzleAiFitRepo } from './infrastructure/repositories/drizzle-ai-fit.repo';
import { AI_FIT_REPO } from './domain/repositories/i-ai-fit.repo';
import { AiFitService } from './application/services/ai-fit.service';
import { AiFitController } from './presentation/ai-fit.controller';

@Module({
  imports: [AiModule, AuthModule],
  controllers: [AiFitController],
  providers: [
    DrizzleService,
    DrizzleAiFitRepo,
    { provide: AI_FIT_REPO, useClass: DrizzleAiFitRepo },
    AiFitService,
  ],
  exports: [AiFitService],
})
export class AiFitModule {}
