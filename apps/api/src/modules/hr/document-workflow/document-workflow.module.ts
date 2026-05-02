import { Module } from '@nestjs/common';
import { DocumentWorkflowService } from './document-workflow.service';
import { DocumentWorkflowController } from './document-workflow.controller';
import { DocumentWorkflowProcessor } from './document-workflow.processor';
import { DocumentWorkflowRepository } from './document-workflow.repository';

@Module({
  controllers: [DocumentWorkflowController],
  providers: [DocumentWorkflowService, DocumentWorkflowProcessor, DocumentWorkflowRepository],
  exports: [DocumentWorkflowService],
})
export class DocumentWorkflowModule {}
