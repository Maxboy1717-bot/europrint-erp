/**
 * @module IoTTablet
 * @description React page component. Route-level UI.
 */

import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { useIoTTablet } from "./iot/useIoTTablet";
import { IoTLoginPanel } from "./iot/IoTLoginPanel";
import { IoTSchedulePanel } from "./iot/IoTSchedulePanel";
import { IoTChecklistModal } from "./iot/IoTChecklistModal";
import { IoTCompletionReport } from "./iot/IoTCompletionReport";
import { IoTProductionDashboard } from "./iot/IoTProductionDashboard";
import { EPErrorState } from "@/components/ep";

export default function IoTTablet() {
  const iot = useIoTTablet();

  if (!iot.isLoggedIn) {
    return (
      <IoTLoginPanel
        lang={iot.lang}
        setLang={iot.setLang}
        tabelNumber={iot.tabelNumber}
        setTabelNumber={iot.setTabelNumber}
        workerPassword={iot.workerPassword}
        setWorkerPassword={iot.setWorkerPassword}
        handleLogin={iot.handleLogin}
      />
    );
  }

  const displayOrders = iot.assignedOrders.length > 0 ? iot.assignedOrders : iot.orders;

  if (iot.showSchedule && !iot.activeSession) {
    return (
      <IoTSchedulePanel
        lang={iot.lang}
        setLang={iot.setLang}
        workerName={iot.workerName}
        currentDate={iot.currentDate}
        currentTime={iot.currentTime}
        assignedEquipment={iot.assignedEquipment}
        equipmentList={iot.equipmentList}
        selectedEquipment={iot.selectedEquipment}
        setSelectedEquipment={iot.setSelectedEquipment}
        ordersLoading={iot.ordersLoading}
        displayOrders={displayOrders}
        selectedOrder={iot.selectedOrder}
        setSelectedOrder={iot.setSelectedOrder}
        handleLogout={iot.handleLogout}
        createSession={iot.createSession}
      />
    );
  }

  if (iot.isError) {
    return <EPErrorState onRetry={iot.refetch} />;
  }

  return (
    <>
      <Button variant="ghost" size="sm" onClick={() => iot.refetch()} className="sr-only" aria-label="Yangilash">
        <RefreshCw className="h-4 w-4" />
      </Button>
      <IoTProductionDashboard
        lang={iot.lang}
        setLang={iot.setLang}
        workerName={iot.workerName}
        currentTime={iot.currentTime}
        activeSession={iot.activeSession}
        shiftInfo={iot.shiftInfo}
        shiftRemaining={iot.shiftRemaining}
        workerId={iot.workerId}
        elapsedTime={iot.elapsedTime}
        setupTime={iot.setupTime}
        qcReminderVisible={iot.qcReminderVisible}
        energySaving={iot.energySaving}
        setEnergySaving={iot.setEnergySaving}
        showSOSDialog={iot.showSOSDialog}
        setShowSOSDialog={iot.setShowSOSDialog}
        showHandoverDialog={iot.showHandoverDialog}
        setShowHandoverDialog={iot.setShowHandoverDialog}
        showQcFormDialog={iot.showQcFormDialog}
        setShowQcFormDialog={iot.setShowQcFormDialog}
        showDefectDialog={iot.showDefectDialog}
        setShowDefectDialog={iot.setShowDefectDialog}
        showDowntimeDialog={iot.showDowntimeDialog}
        setShowDowntimeDialog={iot.setShowDowntimeDialog}
        sosMessage={iot.sosMessage}
        setSosMessage={iot.setSosMessage}
        sosType={iot.sosType}
        setSosType={iot.setSosType}
        handleSOSSend={iot.handleSOSSend}
        handoverNotes={iot.handoverNotes}
        setHandoverNotes={iot.setHandoverNotes}
        handoverSignature={iot.handoverSignature}
        setHandoverSignature={iot.setHandoverSignature}
        qcSampleSize={iot.qcSampleSize}
        setQcSampleSize={iot.setQcSampleSize}
        qcDefectCount={iot.qcDefectCount}
        setQcDefectCount={iot.setQcDefectCount}
        qcNotes={iot.qcNotes}
        setQcNotes={iot.setQcNotes}
        defectQty={iot.defectQty}
        setDefectQty={iot.setDefectQty}
        defectReason={iot.defectReason}
        setDefectReason={iot.setDefectReason}
        defectStage={iot.defectStage}
        setDefectStage={iot.setDefectStage}
        selectedReasonCode={iot.selectedReasonCode}
        setSelectedReasonCode={iot.setSelectedReasonCode}
        downtimeMinutes={iot.downtimeMinutes}
        setDowntimeMinutes={iot.setDowntimeMinutes}
        downtimeNotes={iot.downtimeNotes}
        setDowntimeNotes={iot.setDowntimeNotes}
        defectReasons={iot.defectReasons}
        defectReasonsLoading={iot.defectReasonsLoading}
        reasonCodes={iot.reasonCodes}
        selectedOrder={iot.selectedOrder}
        selectedEquipment={iot.selectedEquipment}
        formatTime={iot.formatTime}
        formatEstimatedTime={iot.formatEstimatedTime}
        startSession={iot.startSession}
        stopSession={iot.stopSession}
        reportDefect={iot.reportDefect}
        submitHandover={iot.submitHandover}
        submitInlineQC={iot.submitInlineQC}
        reportDowntime={iot.reportDowntime}
      />
      <IoTChecklistModal
        lang={iot.lang}
        open={iot.showChecklistModal}
        onOpenChange={iot.setShowChecklistModal}
        checklistKitBarcode={iot.checklistKitBarcode}
        checklistMaterials={iot.checklistMaterials}
        crewAssignment={iot.crewAssignment}
        setCrewAssignment={iot.setCrewAssignment}
        employees={iot.employees}
        scanningItemId={iot.scanningItemId}
        scanMaterial={iot.scanMaterial}
        startProductionFromChecklist={iot.startProductionFromChecklist}
        activeSession={iot.activeSession}
      />
      <IoTCompletionReport
        lang={iot.lang}
        open={iot.showCompletionReport}
        onClose={() => { iot.setShowCompletionReport(false); iot.setShowSchedule(true); iot.setCompletionReport(null); }}
        completionReport={iot.completionReport}
        formatTime={iot.formatTime}
        tabletToken={iot.tabletToken}
      />
    </>
  );
}
