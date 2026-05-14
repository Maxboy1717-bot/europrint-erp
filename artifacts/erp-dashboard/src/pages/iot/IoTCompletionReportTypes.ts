/**
 * @module IoTCompletionReportTypes
 * @description Types for IoTCompletionReport component.
 */

import { CompletionReportData, IotLang } from "./iot-types";

export interface IoTCompletionReportProps {
  lang: IotLang;
  open: boolean;
  onClose: () => void;
  completionReport: CompletionReportData | null;
  formatTime: (s: number) => string;
  tabletToken: string;
}

export type CompletionStep = "results" | "evaluation" | "material" | "done";

export interface StarRatingProps {
  value: number;
  onChange: (v: number) => void;
  label: string;
  lang: IotLang;
}
