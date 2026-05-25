/**
 * @module useInventoryCountTranslations
 * @description React UI component.
 */

import { useTranslation } from "@/lib/i18n";

export function useInventoryCountTranslations() {
  const { t } = useTranslation('warehouse');
  const { t: tCommon } = useTranslation('common');
  
  return {
    title: t('icTitle'),
    subtitle: t('icSubtitle'),
    error: tCommon('error'),
    noDataFound: tCommon('noData'),
    stats: {
      totalThisMonth: t('icStatsTotalThisMonth'),
      completed: t('icStatsCompleted'),
      withVariances: t('icStatsWithVariances'),
      totalVarianceValue: t('icStatsTotalVarianceValue'),
    },
    table: {
      countNumber: t('icTableCountNumber'),
      date: t('icTableDate'),
      warehouse: t('icTableWarehouse'),
      type: t('icTableType'),
      status: t('icTableStatus'),
      totalItems: t('icTableTotalItems'),
      countedItems: t('icTableCountedItems'),
      variances: t('icTableVariances'),
      actions: t('icTableActions'),
    },
    countTypes: {
      full: t('icCountTypeFull'),
      cycle: t('icCountTypeCycle'),
      spot: t('icCountTypeSpot'),
    },
    statuses: {
      planned: t('icStatusPlanned'),
      in_progress: t('icStatusInProgress'),
      completed: t('icStatusCompleted'),
      approved: t('icStatusApproved'),
    },
    filters: {
      allStatuses: t('icFilterAllStatuses'),
      allWarehouses: t('icFilterAllWarehouses'),
    },
    actions: {
      create: t('icActionCreate'),
      edit: t('icActionEdit'),
      view: t('icActionView'),
      start: t('icActionStart'),
      complete: t('icActionComplete'),
      approve: t('icActionApprove'),
      save: t('icActionSave'),
      cancel: t('icActionCancel'),
      export: t('icActionExport'),
      generateLines: t('icActionGenerateLines'),
      saveAll: t('icActionSaveAll'),
      back: t('icActionBack'),
    },
    form: {
      countDate: t('icFormCountDate'),
      warehouse: t('icFormWarehouse'),
      countType: t('icFormCountType'),
      assignedTo: t('icFormAssignedTo'),
      notes: t('icFormNotes'),
      selectWarehouse: t('icFormSelectWarehouse'),
      selectType: t('icFormSelectType'),
      selectUser: t('icFormSelectUser'),
    },
    detail: {
      title: t('icDetailTitle'),
      materialCode: t('icDetailMaterialCode'),
      materialName: t('icDetailMaterialName'),
      bookQuantity: t('icDetailBookQuantity'),
      countedQuantity: t('icDetailCountedQuantity'),
      variance: t('icDetailVariance'),
      variancePercent: t('icDetailVariancePercent'),
      reason: t('icDetailReason'),
      summary: {
        title: t('icDetailSummaryTitle'),
        positive: t('icDetailSummaryPositive'),
        negative: t('icDetailSummaryNegative'),
        total: t('icDetailSummaryTotal'),
      },
    },
    messages: {
      createSuccess: t('icMsgCreateSuccess'),
      updateSuccess: t('icMsgUpdateSuccess'),
      statusUpdated: t('icMsgStatusUpdated'),
      linesGenerated: t('icMsgLinesGenerated'),
      lineUpdated: t('icMsgLineUpdated'),
    },
  };
}
