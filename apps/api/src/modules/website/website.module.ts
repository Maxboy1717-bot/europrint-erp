import { Module } from '@nestjs/common';
import { WebsiteService } from './website.service';
import { WebsiteController } from './website.controller';
import { WebsiteMediaController } from './website-media.controller';
import { WebsiteRepository } from './website.repository';

@Module({
  providers: [WebsiteService, WebsiteRepository],
  controllers: [WebsiteController, WebsiteMediaController],
})
export class WebsiteModule {}
