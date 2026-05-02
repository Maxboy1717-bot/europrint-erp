import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Inject, Logger } from '@nestjs/common';
import { Result, Err } from '@common/types/result.type';
import { ICoreRepo, CORE_REPO } from '../../domain/repositories/i-core.repo';
import { Panel } from '../../domain/aggregates/panel.aggregate';

export class GetMyPanelQuery {
  constructor(public readonly userId: string) {}
}

@QueryHandler(GetMyPanelQuery)
export class GetMyPanelHandler implements IQueryHandler<GetMyPanelQuery> {
  private readonly logger = new Logger(GetMyPanelHandler.name);

  constructor(@Inject(CORE_REPO) private repo: ICoreRepo) {}

  async execute(query: GetMyPanelQuery): Promise<Result<Panel>> {
    const userPanel = await this.repo.findPanelByUserId(query.userId);
    if (!userPanel.ok) {
      return Err('Panelni topishda xato');
    }

    if (userPanel.data) {
      return { ok: true, data: userPanel.data };
    }

    const defaultPanel = await this.repo.getDefaultPanel();
    if (!defaultPanel.ok) {
      return Err('Panelni topishda xato');
    }

    if (defaultPanel.data) {
      return { ok: true, data: defaultPanel.data };
    }

    const emptyPanel = new Panel(
      '',
      query.userId,
      'My Dashboard',
      [],
      false,
      _time.now(),
      _time.now(),
    );

    return { ok: true, data: emptyPanel };
  }
}
