/**
 * @module LeaveTab
 * @description React page component. Route-level UI.
 */

import type { LeaveTabProps } from "./LeaveTabTypes";
import {
  BusinessTripDialog,
  LeaveRequestDialog,
  SickLeaveDialog,
} from "./LeaveTabDialogs";
import {
  BusinessTripsSection,
  LeaveRequestsSection,
  LeaveStatCards,
  SickLeavesSection,
} from "./LeaveTabSections";

export function LeaveTab({
  t,
  tCommon,
  leaveRequests,
  loadingLeaveRequests,
  leaveRequestDialogOpen,
  setLeaveRequestDialogOpen,
  leaveRequestForm,
  setLeaveRequestForm,
  saveLeaveRequestMutation,
  sickLeaves,
  loadingSickLeaves,
  sickLeaveDialogOpen,
  setSickLeaveDialogOpen,
  sickLeaveForm,
  setSickLeaveForm,
  saveSickLeaveMutation,
  businessTrips,
  loadingBusinessTrips,
  businessTripDialogOpen,
  setBusinessTripDialogOpen,
  businessTripForm,
  setBusinessTripForm,
  saveBusinessTripMutation,
}: LeaveTabProps) {
  return (
    <div className="space-y-6">
      <LeaveStatCards
        leaveCount={leaveRequests?.length || 0}
        sickCount={sickLeaves?.length || 0}
        tripCount={businessTrips?.length || 0}
      />

      <LeaveRequestsSection
        leaveRequests={leaveRequests}
        loading={loadingLeaveRequests}
        t={t}
        dialogTrigger={
          <LeaveRequestDialog
            open={leaveRequestDialogOpen}
            onOpenChange={setLeaveRequestDialogOpen}
            form={leaveRequestForm}
            setForm={setLeaveRequestForm}
            mutation={saveLeaveRequestMutation}
            tCommon={tCommon}
          />
        }
      />

      <SickLeavesSection
        sickLeaves={sickLeaves}
        loading={loadingSickLeaves}
        dialogTrigger={
          <SickLeaveDialog
            open={sickLeaveDialogOpen}
            onOpenChange={setSickLeaveDialogOpen}
            form={sickLeaveForm}
            setForm={setSickLeaveForm}
            mutation={saveSickLeaveMutation}
            tCommon={tCommon}
          />
        }
      />

      <BusinessTripsSection
        businessTrips={businessTrips}
        loading={loadingBusinessTrips}
        t={t}
        dialogTrigger={
          <BusinessTripDialog
            open={businessTripDialogOpen}
            onOpenChange={setBusinessTripDialogOpen}
            form={businessTripForm}
            setForm={setBusinessTripForm}
            mutation={saveBusinessTripMutation}
            tCommon={tCommon}
          />
        }
      />
    </div>
  );
}
