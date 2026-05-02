import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { InspectionController } from './inspection.controller';
import { InspectionService } from './inspection.service';
import { InspectionRepository } from './inspection.repository';
import { RoomAnalysisCron } from './room-analysis.cron';
import { TelegramBotsModule } from '../telegram-bots/telegram-bots.module';

@Module({
  imports: [HttpModule, TelegramBotsModule],
  controllers: [InspectionController],
  providers: [InspectionService, InspectionRepository, RoomAnalysisCron],
  exports: [InspectionService],
})
export class InspectionModule {}
