/**
 * @module drizzle-sd-customers/customer-360.builder
 * @description Constructs the 7-layer Customer 360 response payload from raw
 *   query results. Pure presentation logic — no DB access.
 */

import {
  computeBehavioral, computeRfmAbc, computePredictive,
  computeSentiment, computeRecommendations,
} from './customer-360.helpers';

type Row = Record<string, unknown>;

export interface Customer360Inputs {
  customerRows: Row[];
  ordersRows: Row[];
  contactsRows: Row[];
  documentsRows: Row[];
  interactionsRows: Row[];
  competitorsRows: Row[];
  paymentsRows: Row[];
  npsRows: Row[];
  /** SB0611 — per-product order history (sales_order_items joined to this customer's orders). Optional for callers that don't need it yet. */
  productsRows?: Row[];
}

export function buildCustomer360View(inp: Customer360Inputs): Record<string, unknown> {
  const { customerRows, ordersRows, contactsRows, documentsRows, interactionsRows, competitorsRows, paymentsRows, npsRows, productsRows = [] } = inp;
  const cust = customerRows[0] as Row | undefined;
  const orders = ordersRows;
  const payments = paymentsRows;

  const b = computeBehavioral(orders);
  const r = computeRfmAbc({ daysSinceLastOrder: b.daysSinceLastOrder, totalOrders: b.totalOrders, totalRevenue: b.totalRevenue });
  const p = computePredictive({
    totalOrders: b.totalOrders, daysSinceLastOrder: b.daysSinceLastOrder, totalRevenue: b.totalRevenue,
    daysSinceFirstOrder: b.daysSinceFirstOrder, rfmFrequency: r.rfmFrequency, rfmMonetary: r.rfmMonetary, rfmRecency: r.rfmRecency,
  });
  const s = computeSentiment(interactionsRows, npsRows);

  const journeyStage = b.totalOrders === 0 ? 'prospect'
    : b.daysSinceLastOrder > 180 ? 'lost'
    : b.daysSinceLastOrder > 60 ? 'at_risk'
    : b.daysSinceFirstOrder < 90 ? 'growing' : 'stable';
  const journeyStageLabels: Record<string, string> = {
    prospect: 'Potensial', new: 'Yangi', growing: 'O\'sish',
    stable: 'Barqaror', at_risk: 'Xavf ostida', lost: 'Yo\'qolgan',
  };

  const recommendations = computeRecommendations({
    totalOrders: b.totalOrders, churnRisk: p.churnRisk,
    rfmRecency: r.rfmRecency, rfmFrequency: r.rfmFrequency, abcScore: r.abcScore,
    sentimentScore: s.sentimentScore, upsellProbability: p.upsellProbability, npsScore: s.npsScore,
  });

  const decisionMakers = contactsRows.filter(c => c.is_decision_maker);
  const relationshipQuality = String(cust?.relationship_quality ?? 'normal');
  const lastInteraction = interactionsRows[0];
  const nextActions = interactionsRows
    .filter(i => i.next_action && i.next_action_date)
    .map(i => ({ action: i.next_action, date: i.next_action_date, by: i.employee_name }))
    .slice(0, 5);

  return {
    customer: cust,
    basic: {
      id: cust?.id, title: cust?.name, name: cust?.name,
      customerCode: cust?.customer_code ?? null,
      customerType: cust?.customer_type ?? 'legal',
      customerCategory: cust?.segment ?? r.computedSegment,
      status: cust?.status ?? 'active',
      stir: cust?.stir ?? cust?.inn,
      industry: cust?.industry ?? null,
      address: cust?.address ?? cust?.actual_address,
      actualAddress: cust?.actual_address,
      phones: cust?.phone ? [{ value: cust.phone, type: 'asosiy' }] : [],
      emails: cust?.email ? [{ value: cust.email, type: 'asosiy' }] : [],
      websites: cust?.website ? [{ value: cust.website }] : [],
      source: cust?.source ?? null,
      creditLimit: Number(cust?.credit_limit ?? 0),
      paymentTermsDays: Number(cust?.payment_terms_days ?? 30),
      discountRate: Number(cust?.discount_rate ?? 0),
      dateCreate: cust?.created_at,
      comments: cust?.notes,
      companyStructure: cust?.company_structure ?? 'independent',
      shareOfWallet: Number(cust?.share_of_wallet ?? 0),
      relationshipQuality,
    },
    contacts: contactsRows.map(c => ({
      id: c.id, fullName: c.full_name, position: c.position, phone: c.phone, email: c.email,
      telegram: c.telegram, isPrimary: c.is_primary,
      influenceLevel: Number(c.influence_level ?? 3),
      isDecisionMaker: Boolean(c.is_decision_maker),
      department: c.department, linkedinUrl: c.linkedin_url, roleNote: c.role_note,
    })),
    decisionMakers: decisionMakers.map(c => ({
      id: c.id, fullName: c.full_name, position: c.position,
      influenceLevel: Number(c.influence_level ?? 3),
      department: c.department, phone: c.phone, email: c.email,
    })),
    orders: {
      totalCount: b.totalOrders, totalAmount: b.totalRevenue, averageOrderAmount: b.avgOrderValue,
      firstOrderDate: b.firstOrderDate, lastOrderDate: b.lastOrderDate,
      monthlyTrend: b.yearlyTrend,
      recentOrders: orders.slice(0, 15).map(o => ({
        id: o.id, orderNumber: o.order_number, status: o.status,
        totalAmount: Number(o.total_amount ?? 0), currency: o.currency ?? 'UZS',
        createdAt: o.created_at, deliveryDate: o.delivery_date,
      })),
    },
    communications: {
      recent: interactionsRows.map(i => ({
        id: i.id, type: i.type, direction: i.direction, subject: i.subject,
        notes: i.notes, description: i.notes, outcome: i.outcome, employeeName: i.employee_name,
        createdAt: i.created_at, interactionDate: i.interaction_date ?? i.created_at,
        interaction_date: i.interaction_date ?? i.created_at,
        next_action: i.next_action, next_action_date: i.next_action_date,
        satisfactionRating: i.satisfaction_rating,
      })),
      upcomingTasks: interactionsRows
        .filter(i => i.next_action && i.next_action_date)
        .map(i => ({ id: i.id, next_action: i.next_action, next_action_date: i.next_action_date }))
        .slice(0, 10),
      totalCount: interactionsRows.length,
    },
    complaints: interactionsRows
      .filter(i => i.type === 'complaint')
      .map(i => ({ id: i.id, notes: i.notes, subject: i.subject, status: 'open', createdAt: i.created_at })),
    nps: {
      score: s.npsScore, responses: npsRows.length, promoters: s.npsPromoters, detractors: s.npsDetractors,
      avgScore: s.avgNps ? Math.round(s.avgNps * 10) / 10 : null,
      category: s.npsScore === null ? 'unknown' : s.npsScore >= 50 ? 'excellent' : s.npsScore >= 0 ? 'good' : 'poor',
      recentResponses: npsRows.slice(0, 5).map(n => ({
        id: n.id, score: Number(n.score), comment: n.comment, category: n.category, createdAt: n.created_at,
      })),
    },
    avgSatisfaction: s.avgSatisfaction,
    journey: {
      stage: journeyStage, stageLabel: journeyStageLabels[journeyStage] ?? journeyStage,
      firstOrderDate: b.firstOrderDate, lastOrderDate: b.lastOrderDate,
      daysSinceFirstOrder: b.daysSinceFirstOrder, daysSinceLastOrder: b.daysSinceLastOrder,
      peakMonth: b.yearlyTrend.length > 0 ? b.yearlyTrend.reduce((a, c) => a.total > c.total ? a : c) : null,
    },
    growth: {
      lastYearTotal: b.lastYearTotal, thisYearTotal: b.thisYearTotal,
      projectedThisYear: b.projectedThisYear, growthRate: b.growthRate,
      trend: b.totalOrders > 3 ? 'growing' : b.totalOrders > 0 ? 'stable' : 'new',
      riskSignals: p.churnRisk > 60 ? ['Churn xavfi yuqori'] : b.daysSinceLastOrder > 45 ? ['So\'nggi faoliyat past'] : [],
      yearlyTrend: b.yearlyTrend, totalOrders: b.totalOrders, totalRevenue: b.totalRevenue, avgOrderValue: b.avgOrderValue,
    },
    predictive: {
      churnRisk: p.churnRisk,
      churnLabel: p.churnRisk >= 70 ? 'high' : p.churnRisk >= 40 ? 'medium' : 'low',
      ltvForecast: p.ltvForecast, avgMonthlyRevenue: Math.round(p.avgMonthlyRevenue),
      upsellProbability: p.upsellProbability, nextBestAction: recommendations[0] ?? null,
      allActions: recommendations,
    },
    sentiment: {
      score: s.sentimentScore, label: s.sentimentLabel,
      analyzedInteractions: s.sentCount, totalInteractions: interactionsRows.length,
      avgSatisfaction: s.avgSatisfaction, npsScore: s.npsScore,
    },
    segmentation: {
      segment: r.computedSegment, abcScore: r.abcScore, abcCategory: r.computedSegment,
      categoryLabel: r.computedSegment === 'A' ? 'VIP mijoz' : r.computedSegment === 'B' ? 'Doimiy mijoz' : r.computedSegment === 'C' ? 'Oddiy mijoz' : 'Xavfli mijoz',
      scoreBreakdown: { revenueScore: r.revScore, frequencyScore: r.freqScore, recencyScore: r.recScore, paymentScore: r.payScore, loyaltyScore: r.loyScore },
      rfm: { recency: r.rfmRecency, frequency: r.rfmFrequency, monetary: r.rfmMonetary },
      recommendations, totalRevenue: b.totalRevenue, totalOrders: b.totalOrders, avgOrderValue: b.avgOrderValue,
      firstOrderDate: b.firstOrderDate, lastOrderDate: b.lastOrderDate,
      shareOfWallet: Number(cust?.share_of_wallet ?? 0), upsellProbability: p.upsellProbability,
    },
    internalIntelligence: {
      relationshipQuality,
      relationshipLabel: relationshipQuality === 'excellent' ? 'Ajoyib' : relationshipQuality === 'good' ? 'Yaxshi' : relationshipQuality === 'normal' ? 'Oddiy' : relationshipQuality === 'difficult' ? 'Murakkab' : 'Noma\'lum',
      totalNotes: interactionsRows.filter(i => i.type === 'note').length,
      nextActions,
      lastInteraction: lastInteraction ? {
        type: lastInteraction.type,
        date: lastInteraction.interaction_date ?? lastInteraction.created_at,
        by: lastInteraction.employee_name,
      } : null,
      keyInsights: [
        r.rfmFrequency >= 4 ? 'Tez-tez buyurtma beruvchi' : null,
        r.rfmMonetary >= 4 ? 'Yuqori daromadli mijoz' : null,
        s.sentimentScore > 0.2 ? 'Ijobiy munosabatda' : s.sentimentScore < -0.2 ? 'Salbiy munosabatda' : null,
        Number(cust?.payment_terms_days ?? 30) <= 7 ? 'Tez to\'lovchi' : null,
      ].filter(Boolean),
    },
    finance: {
      totalRevenue: b.totalRevenue, totalOrders: b.totalOrders, avgOrderValue: b.avgOrderValue,
      totalPaid: payments.reduce((sum, x) => sum + Number(x.amount ?? 0), 0),
      openDebt: b.totalRevenue - payments.reduce((sum, x) => sum + Number(x.amount ?? 0), 0),
      payments: payments.map(x => ({
        // sd_payments has no payment_date column — paid_date is the real "when paid" field
        // (matches the ORDER BY fix in drizzle-sd-customers.repo.ts's get360View query).
        id: x.id, amount: Number(x.amount ?? 0),
        paymentDate: x.paid_date, method: x.payment_method ?? x.method, status: x.status,
      })),
    },
    ltv: {
      lifetimeValue: b.totalRevenue, ltvForecast: p.ltvForecast,
      avgMonthlyRevenue: Math.round(p.avgMonthlyRevenue),
      totalOrders: b.totalOrders, avgOrderValue: b.avgOrderValue,
      firstOrderDate: b.firstOrderDate, lastOrderDate: b.lastOrderDate,
      daysSinceFirstOrder: b.daysSinceFirstOrder,
      lifetimeMonths: Math.round(b.daysSinceFirstOrder / 30),
      upsellProbability: p.upsellProbability,
    },
    competitors: {
      list: competitorsRows.map(c => ({
        id: c.id, competitorName: c.competitor_name ?? c.name,
        product: c.product_type, productType: c.product_type,
        estimatedSharePct: Number(c.estimated_share_pct ?? 0),
        winBackPotential: c.win_back_potential, notes: c.notes,
        competitor_name: c.competitor_name ?? c.name,
        win_back_potential: c.win_back_potential,
        estimated_share_percent: Number(c.estimated_share_pct ?? 0),
      })),
      totalCompetitorShare: competitorsRows.reduce((sum, c) => sum + Number(c.estimated_share_pct ?? 0), 0),
      ourShare: Math.max(0, 100 - competitorsRows.reduce((sum, c) => sum + Number(c.estimated_share_pct ?? 0), 0)),
    },
    contracts: {
      totalCount: documentsRows.length,
      contracts: documentsRows.filter(d => d.type === 'contract').map(d => ({
        id: d.id, name: d.name ?? d.title, type: d.type,
        fileUrl: d.file_url ?? d.url, expiresAt: d.expires_at ?? d.end_date,
        status: d.status ?? 'active', notes: d.notes, startDate: d.start_date, endDate: d.end_date,
        totalAmount: Number(d.total_amount ?? 0),
      })),
      expiringSoon: documentsRows.filter(d => {
        if (!d.expires_at && !d.end_date) return false;
        const exp = new Date(String(d.expires_at ?? d.end_date));
        const days = Math.ceil((exp.getTime() - Date.now()) / 86400000);
        return days >= 0 && days <= 30;
      }).map(d => ({ id: d.id, name: d.name ?? d.title, expiresAt: d.expires_at ?? d.end_date })),
      allDocuments: documentsRows.map(d => ({
        id: d.id, name: d.name ?? d.title, type: d.type,
        fileUrl: d.file_url ?? d.url, url: d.file_url ?? d.url,
        expiresAt: d.expires_at ?? d.end_date, endDate: d.expires_at ?? d.end_date,
        notes: d.notes, startDate: d.start_date, totalAmount: Number(d.total_amount ?? 0),
      })),
    },
    recent_orders: orders.slice(0, 10),
    documents: documentsRows,
    // SB0611 — "Mahsulotlar arxivi" tab: every product line this customer has ordered,
    // most recent order first (decisions/06-sd.md:470 — sana/tiraj/narx/dizayn link).
    productsArchive: productsRows.map(p => ({
      id: p.id, salesOrderId: p.sales_order_id, orderNumber: p.order_number,
      productName: p.product_name, materialNumber: p.material_number,
      quantity: Number(p.order_quantity ?? 0), unit: p.unit,
      unitPrice: Number(p.net_price ?? 0), totalPrice: Number(p.total_price ?? 0),
      orderDate: p.order_date, deliveryDate: p.delivery_date, orderStatus: p.order_status,
    })),
  };
}
