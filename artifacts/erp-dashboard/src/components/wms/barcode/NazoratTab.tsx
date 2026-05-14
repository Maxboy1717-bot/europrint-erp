/**
 * @module NazoratTab
 * @description React UI component.
 */

import { ChiqishNazoratibolimi } from "./ChiqishNazoratibolimi";
import { OperatorQarzlariBolimi } from "./OperatorQarzlariBolimi";
import { SiklHisobBolimi } from "./SiklHisobBolimi";
import { ChopNavbatiBolimi } from "./ChopNavbatiBolimi";

export function NazoratTab() {
  return (
    <div className="space-y-3 p-3">
      <ChiqishNazoratibolimi />
      <OperatorQarzlariBolimi />
      <SiklHisobBolimi />
      <ChopNavbatiBolimi />
    </div>
  );
}
