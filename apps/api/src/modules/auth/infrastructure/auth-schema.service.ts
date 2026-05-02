import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { AuthSchemaRepository } from './auth-schema.repository';

@Injectable()
export class AuthSchemaService implements OnModuleInit {
  private readonly logger = new Logger(AuthSchemaService.name);

  constructor(private readonly repo: AuthSchemaRepository) {}

  onModuleInit(): void {
    this.repo.ensureOtpTables().catch((e: unknown) => this.logger.warn(`auth schema init: ${e}`));
  }
}
