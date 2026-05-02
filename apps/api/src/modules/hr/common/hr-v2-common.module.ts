import { Module } from '@nestjs/common';
import { HrV2SeedService } from './hr-v2-seed.service';
import { HrV2SeedRepository } from './hr-v2-seed.repository';

@Module({
  providers: [HrV2SeedRepository, HrV2SeedService],
})
export class HrV2CommonModule {}
