/**
 * @module storage.module
 * @description NestJS @Module() definition. Providers, controllers, and imports for this feature slice.
 *
 * TODO PA3-17: This module is flagged as a tiny-module merge candidate, but
 *   merging into `wms/` is the wrong target — `/storage/*` is a cross-cutting
 *   file-serving endpoint consumed by chat (`/storage/chat/...`), wms
 *   (`/storage/wms/...`), and any future module that needs persisted uploads.
 *   The right consolidation home would be a `common/storage/` infrastructure
 *   module that any feature can import, alongside other cross-cutting
 *   utilities. Until that lands, the module stays in place because:
 *     - The `/storage/*` URL contract is depended on by clients and other
 *       modules via URL, not via TS imports (zero code-level consumers).
 *     - Moving the controller under `wms/` would imply WMS ownership and
 *       confuse future maintainers.
 *   Revisit when `common/storage/` is created OR when an object-store
 *   (S3-compatible) backend replaces the local fs implementation, since
 *   that is the natural moment to introduce a proper storage abstraction.
 */

import { Module } from '@nestjs/common';
import { StorageController } from './storage.controller';

@Module({
  controllers: [StorageController],
})
export class StorageModule {}
