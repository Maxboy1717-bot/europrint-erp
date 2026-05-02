import { CommandHandler, ICommandHandler, EventBus } from '@nestjs/cqrs';
import { Injectable, Logger } from '@nestjs/common';
import { Result, Ok } from '@common/result';
import { CreateCampaignCommand } from './create-campaign.command';
import { CampaignCreatedEvent } from '../../domain/events';
import { Campaign } from '../../domain/aggregates/campaign.aggregate';

@Injectable()
@CommandHandler(CreateCampaignCommand)
export class CreateCampaignHandler implements ICommandHandler<CreateCampaignCommand> {
  private readonly logger = new Logger(CreateCampaignHandler.name);

  constructor(
    private readonly eventBus: EventBus,
      ) {}

  async execute(command: CreateCampaignCommand): Promise<Result<string>> {
      const campaign = Campaign.create(
        command.name,
        command.type as never,
        command.description,
        command.targetAudience,
        command.budget,
        command.startDate,
        command.endDate,
        command.createdBy,
      );

      this.eventBus.publish(new CampaignCreatedEvent(campaign.id, campaign.name));
      this.logger.log('Campaign created');
      return Ok(campaign.id);
  }
}
