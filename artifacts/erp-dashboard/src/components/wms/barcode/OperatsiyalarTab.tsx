/**
 * @module OperatsiyalarTab
 * @description React UI component.
 */

import { QabulBolimi } from "./QabulBolimi";
import { QCBolimi } from "./QCBolimi";
import { PickingBolimi } from "./PickingBolimi";
import { IshChiqarishBolimi } from "./IshChiqarishBolimi";

export function OperatsiyalarTab() {
  return (
    <div className="space-y-3 p-3">
      <QabulBolimi />
      <QCBolimi />
      <PickingBolimi />
      <IshChiqarishBolimi />
    </div>
  );
}
