/**
 * @module panel.aggregate
 * @description Source module. See exports for details.
 */

import { TashkentTimeService } from '@common/time';
import { Ok, Err, AppErr, Result } from '@common/result';
import { AggregateRoot } from '@shared/domain/aggregate-root.base';
import { PanelCreatedEvent, PanelRenamedEvent } from '../events';

const _time = new TashkentTimeService();

export class Panel extends AggregateRoot {
  public name: string;
  public updatedAt: Date;

  constructor(
    public readonly id: string,
    public readonly userId: string,
    name: string,
    public readonly layout: PanelLayout[],
    public readonly isDefault: boolean,
    public readonly createdAt: Date,
    updatedAt: Date,
  ) {
    super();
    this.name = name;
    this.updatedAt = updatedAt;
  }

  static create(
    id: string,
    userId: string,
    name: string,
    layout: PanelLayout[] = [],
    isDefault: boolean = false,
  ): Panel {
    const now = _time.now();
    const panel = new Panel(id, userId, name, layout, isDefault, now, now);
    panel.addDomainEvent(new PanelCreatedEvent(id, userId, name, now));
    return panel;
  }

  rename(newName: string): Result<void> {
    if (typeof newName !== 'string' || newName.trim().length === 0) {
      return Err(AppErr('VALIDATION', 'Panel name must be a non-empty string'));
    }
    if (newName === this.name) {
      return Err(AppErr('BUSINESS_RULE_VIOLATION', 'New name is identical to current name'));
    }
    const oldName = this.name;
    this.name = newName;
    this.updatedAt = _time.now();
    this.addDomainEvent(new PanelRenamedEvent(this.id, oldName, newName));
    return Ok<void>();
  }
}

export interface PanelLayout {
  widgetId: string;
  widgetType: 'chart' | 'table' | 'kpi' | 'calendar' | 'map';
  position: { x: number; y: number; w: number; h: number };
  config: Record<string, unknown>;
}
