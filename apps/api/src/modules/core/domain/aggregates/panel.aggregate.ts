export class Panel {
  constructor(public readonly id: string,
    public readonly userId: string,
    public readonly name: string,
    public readonly layout: PanelLayout[],
    public readonly isDefault: boolean,
    public readonly createdAt: Date,
    public updatedAt: Date) {}
}

export interface PanelLayout {
  widgetId: string;
  widgetType: 'chart' | 'table' | 'kpi' | 'calendar' | 'map';
  position: { x: number; y: number; w: number; h: number };
  config: Record<string, unknown>;
}
