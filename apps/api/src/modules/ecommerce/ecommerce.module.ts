/**
 * @module ecommerce.module
 * @description NestJS @Module() definition. Providers, controllers, and imports for this feature slice.
 */

import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { EcommerceService } from './ecommerce.service';
import { EcommerceRepository } from './ecommerce.repository';
import { EcommerceCatalogController } from './ecommerce-catalog.controller';
import { EcommerceOrdersController } from './ecommerce-orders.controller';
import { EcommercePublicController } from './ecommerce-public.controller';
import { EcommerceCustomersController } from './ecommerce-customers.controller';
// PA3-17 Wave 6: merged from former modules/website/ (route prefix '/website/*' preserved)
import { WebsiteService } from './website/website.service';
import { WebsiteRepository } from './website/website.repository';
import { WebsiteController } from './website/website.controller';
import { WebsiteMediaController } from './website/website-media.controller';

@Module({
  imports: [CqrsModule, EventEmitterModule.forRoot()],
  providers: [
    EcommerceRepository,
    EcommerceService,
    // PA3-17 Wave 6: merged from modules/website/
    WebsiteService,
    WebsiteRepository,
  ],
  controllers: [
    EcommerceCatalogController,
    EcommerceOrdersController,
    EcommercePublicController,
    EcommerceCustomersController,
    // PA3-17 Wave 6: merged from modules/website/
    WebsiteController,
    WebsiteMediaController,
  ],
})
export class EcommerceModule {}
