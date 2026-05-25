/**
 * @module save-panel.command
 * @description Source module. See exports for details.
 */

import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, Logger } from '@nestjs/common';
import { Result, Err } from '@common/types/result.type';
import { ICoreRepo, CORE_REPO } from '../../domain/repositories/i-core.repo';
import { Panel, PanelLayout } from '../../domain/aggregates/panel.aggregate';
import { SavePanelDto } from '../../presentation/dto/core.dto';

export class SavePanelCommand {
  constructor(public readonly userId: string,
    public readonly data: SavePanelDto) {}
}

@CommandHandler(SavePanelCommand)
export class SavePanelHandler implements ICommandHandler<SavePanelCommand> {
  private readonly logger = new Logger(SavePanelHandler.name);

  constructor(@Inject(CORE_REPO) private repo: ICoreRepo) {}

  async execute(command: SavePanelCommand): Promise<Result<Panel>> {
    const { userId, data } = command;

    const existing = await this.repo.findPanelByUserId(userId);
    if (!existing.ok) {
      return Err('Panelni topishda xato');
    }

    if (existing.data) {
      return await this.repo.updatePanelLayout(userId, data.layout as import('../../domain/aggregates/panel.aggregate').PanelLayout[]);
    }

    const result = await this.repo.savePanelForUser(userId, data.layout as import('../../domain/aggregates/panel.aggregate').PanelLayout[], data.name);

    if (result.ok) {
      this.logger.log(`Panel saved for user: ${userId}`);
    }

    return result;
  }
}
