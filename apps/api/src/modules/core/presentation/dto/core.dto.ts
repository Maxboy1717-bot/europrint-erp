/**
 * @module core.dto
 * @description DTO + Zod schema definition. Zod schema validates request bodies; DTO type is inferred via z.infer.
 */

import { z } from 'zod';

export const PanelLayoutSchema = z.object({
  widgetId: z.string().min(1),
  widgetType: z.enum(['chart', 'table', 'kpi', 'calendar', 'map']),
  position: z.object({
    x: z.number(),
    y: z.number(),
    w: z.number(),
    h: z.number(),
  }),
  config: z.record(z.unknown()),
});

export type PanelLayoutDto = z.infer<typeof PanelLayoutSchema>;

export const SavePanelDtoSchema = z.object({
  name: z.string().optional(),
  layout: z.array(PanelLayoutSchema),
});

export type SavePanelDto = z.infer<typeof SavePanelDtoSchema>;
