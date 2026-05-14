/**
 * @module camera.module
 * @description NestJS @Module() definition. Providers, controllers, and imports for this feature slice.
 */

import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { CameraController } from './camera.controller';
import { AiCameraController } from './ai-camera.controller';
import { CameraService } from './camera.service';
import { CameraRepository } from './camera.repo';

@Module({
  imports: [AuthModule],
  controllers: [CameraController, AiCameraController],
  providers: [CameraService, CameraRepository],
  exports: [CameraService],
})
export class CameraModule {}
