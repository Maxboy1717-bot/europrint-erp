/**
 * @module feedback-360.module
 * @description NestJS @Module() definition. Providers, controllers, and imports for this feature slice.
 */

import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { Feedback360Controller } from './feedback-360.controller';
import { Feedback360Service } from './feedback-360.service';
import { Feedback360Repository } from './feedback-360.repo';

@Module({
  imports: [AuthModule],
  controllers: [Feedback360Controller],
  providers: [Feedback360Service, Feedback360Repository],
  exports: [Feedback360Service],
})
export class Feedback360Module {}
