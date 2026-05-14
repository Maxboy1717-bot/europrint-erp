/**
 * @module ecommerce.module
 * @description NestJS @Module() definition. Providers, controllers, and imports for this feature slice.
 */

import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { EcommerceService } from './ecommerce.service';
import { EcommerceRepository } from './ecommerce.repository';
import { EcommerceCatalogController } from './ecommerce-catalog.controller';
import { EcommerceOrdersController } from './ecommerce-orders.controller';
import { EcommercePublicController } from './ecommerce-public.controller';
import { EcommerceCustomersController } from './ecommerce-customers.controller';

@Module({
  imports: [EventEmitterModule.forRoot()],
  providers: [EcommerceRepository, EcommerceService],
  controllers: [
    EcommerceCatalogController,
    EcommerceOrdersController,
    EcommercePublicController,
    EcommerceCustomersController,
  ],
})
export class EcommerceModule {}
