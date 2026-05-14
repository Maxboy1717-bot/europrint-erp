/**
 * @module drizzle-sd-customers.repo
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

import { Injectable } from '@nestjs/common';
import { db , runQuery } from '@shared/db';
import { sql } from 'drizzle-orm';
import {
  execSdCustomerSoftDelete, execSdContactDelete,
  execSdDocumentDelete, execSdCompetitorDelete,
} from '@common/database/queries-sd';
import { ABC_SCORE_WEIGHT } from '@common/constants/business.constants';

type Row = Record<string, unknown>;

@Injectable()
export class DrizzleSdCustomersRepository {
  private mapSegment(status: string | null | undefined): string {
    const s = String(status ?? 'new').toLowerCase();
    if (s === 'vip') return 'vip';
    if (s === 'active') return 'regular';
    if (s === 'new') return 'new';
    if (s === 'at_risk' || s === 'potential') return 'potential';
    return 'new';
  }

  async list(pat: string | null, status: string | undefined, lim: number, off: number): Promise<Row[]> {
    // Map frontend 'segment' filter back to DB 'status' (frontend sends segment=vip|regular|new|potential)
    const dbStatus = status === 'regular' ? 'active' : status === 'vip' ? 'vip' : status === 'potential' ? 'at_risk' : status === 'new' ? 'new' : status;
    const rows = await runQuery<Row>(sql`
      SELECT c.id, c.name, c.stir, c.status, c.actual_address, c.notes,
             c.credit_limit, c.payment_terms_days, c.industry, c.website,
             COUNT(DISTINCT o.id)::int AS "totalOrders",
             COALESCE(SUM(o.total_amount), 0)::numeric(15,2) AS "totalRevenue"
      FROM sd_customers c LEFT JOIN sales_orders o ON o.customer_id = c.id
      WHERE c.status != 'deleted'
        AND (${pat}::text IS NULL OR c.name ILIKE ${pat} OR c.stir ILIKE ${pat})
        AND (${dbStatus ?? null}::text IS NULL OR c.status = ${dbStatus ?? null})
      GROUP BY c.id, c.name, c.stir, c.status, c.actual_address, c.notes,
               c.credit_limit, c.payment_terms_days, c.industry, c.website
      ORDER BY c.name LIMIT ${lim} OFFSET ${off}
    `);
    return (rows.rows as Row[]).map(r => ({
      ...r,
      totalOrders: Number(r.totalOrders ?? 0),
      totalRevenue: Number(r.totalRevenue ?? 0),
      creditLimit: Number(r.credit_limit ?? 0),
      actualAddress: r.actual_address ?? null,
      segment: this.mapSegment(String(r.status ?? '')),
    }));
  }

  async getById(cid: number): Promise<Row[]> {
    const rows = await runQuery<Row>(sql`
      SELECT c.*, c.actual_address,
             COUNT(DISTINCT o.id)::int AS "totalOrders",
             COALESCE(SUM(o.total_amount), 0)::numeric(15,2) AS "totalRevenue"
      FROM sd_customers c
      LEFT JOIN sales_orders o ON o.customer_id = c.id
      WHERE c.id = ${cid} AND c.status != 'deleted'
      GROUP BY c.id
    `);
    return (rows.rows as Row[]).map(r => ({
      ...r,
      totalOrders:   Number(r.totalOrders ?? 0),
      totalRevenue:  Number(r.totalRevenue ?? 0),
      creditLimit:   Number(r.credit_limit ?? 0),
      actualAddress: r.actual_address ?? null,
      segment:       this.mapSegment(String(r.status ?? '')),
    }));
  }

  async get360View(cid: number): Promise<Record<string, unknown>> {
    const safe = async (q: ReturnType<typeof runQuery<Row>>) =>
      q.then(r => r.rows as Row[]).catch(() => [] as Row[]);

    // 8 parallel queries — all 7 layers of Customer 360
    const [customerRows, ordersRows, contactsRows, documentsRows, interactionsRows, competitorsRows, paymentsRows, npsRows] = await Promise.all([
      safe(runQuery<Row>(sql`SELECT * FROM sd_customers WHERE id = ${cid} AND deleted_at IS NULL`)),
      safe(runQuery<Row>(sql`
        SELECT id, order_number, status, total_amount, currency, created_at, delivery_date,
               EXTRACT(YEAR FROM created_at)::int AS order_year,
               EXTRACT(MONTH FROM created_at)::int AS order_month
        FROM sales_orders WHERE customer_id = ${cid} AND deleted_at IS NULL ORDER BY created_at DESC LIMIT 100
      `)),
      safe(runQuery<Row>(sql`
        SELECT id, customer_id, full_name, position, phone, email, telegram,
               is_primary, department, influence_level, is_decision_maker,
               linkedin_url, role_note, created_at
        FROM sd_customer_contacts WHERE customer_id = ${cid}
        ORDER BY is_decision_maker DESC, influence_level DESC, is_primary DESC, full_name
      `)),
      safe(runQuery<Row>(sql`SELECT * FROM sd_customer_documents WHERE customer_id = ${cid} ORDER BY created_at DESC LIMIT 30`)),
      safe(runQuery<Row>(sql`
        SELECT i.id, i.type, i.notes, i.direction, i.subject, i.outcome,
               i.next_action, i.next_action_date, i.interaction_date, i.created_at,
               i.satisfaction_rating, i.sentiment_score,
               COALESCE(e.first_name,'') || ' ' || COALESCE(e.last_name,'') AS employee_name
        FROM sd_customer_interactions i
        LEFT JOIN employees e ON e.id::text = i.employee_id::text
        WHERE i.customer_id = ${cid} ORDER BY i.created_at DESC LIMIT 50
      `)),
      safe(runQuery<Row>(sql`SELECT * FROM sd_customer_competitors WHERE customer_id = ${cid} ORDER BY competitor_name`)),
      safe(runQuery<Row>(sql`SELECT * FROM sd_payments WHERE customer_id = ${cid} ORDER BY payment_date DESC LIMIT 50`)),
      safe(runQuery<Row>(sql`
        SELECT id, score, comment, created_at,
               CASE WHEN score >= 9 THEN 'promoter' WHEN score >= 7 THEN 'passive' ELSE 'detractor' END AS category
        FROM nps_responses WHERE customer_id = ${cid} ORDER BY created_at DESC LIMIT 20
      `)),
    ]);

    const cust = customerRows[0] as Row | undefined;
    const orders = ordersRows;
    const payments = paymentsRows;

    // ── Layer 2: Behavioral metrics ──────────────────────────────────────────
    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((s, o) => s + Number(o.total_amount ?? 0), 0);
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    const firstOrderDate = orders.length > 0 ? orders[orders.length - 1]?.created_at : null;
    const lastOrderDate  = orders.length > 0 ? orders[0]?.created_at : null;

    const daysSinceFirstOrder = firstOrderDate
      ? Math.floor((Date.now() - new Date(String(firstOrderDate)).getTime()) / 86400000) : 0;
    const daysSinceLastOrder  = lastOrderDate
      ? Math.floor((Date.now() - new Date(String(lastOrderDate)).getTime()) / 86400000)  : 9999;

    // Yearly trend (last 24 months)
    const yearlyMap: Record<string, { year: number; month: number; total: number; count: number }> = {};
    for (const o of orders) {
      const k = `${o.order_year}-${String(o.order_month).padStart(2,'0')}`;
      if (!yearlyMap[k]) yearlyMap[k] = { year: Number(o.order_year), month: Number(o.order_month), total: 0, count: 0 };
      yearlyMap[k].total += Number(o.total_amount ?? 0);
      yearlyMap[k].count += 1;
    }
    const yearlyTrend = Object.values(yearlyMap).sort((a, b) => a.year !== b.year ? a.year - b.year : a.month - b.month);

    // Year comparison
    const thisYear = new Date().getFullYear();
    const lastYearTotal = yearlyTrend.filter(r => r.year === thisYear - 1).reduce((s, r) => s + r.total, 0);
    const thisYearTotal = yearlyTrend.filter(r => r.year === thisYear).reduce((s, r) => s + r.total, 0);
    const growthRate = lastYearTotal > 0 ? Math.round(((thisYearTotal - lastYearTotal) / lastYearTotal) * 100) : 0;
    const projectedThisYear = thisYearTotal > 0
      ? Math.round(thisYearTotal / (new Date().getMonth() + 1) * 12) : 0;

    // ── Layer 6: RFM + ABC scoring ────────────────────────────────────────────
    const rfmRecency   = daysSinceLastOrder <= 7 ? 5 : daysSinceLastOrder <= 30 ? 4 : daysSinceLastOrder <= 90 ? 3 : daysSinceLastOrder <= 180 ? 2 : 1;
    const rfmFrequency = totalOrders >= 20 ? 5 : totalOrders >= 10 ? 4 : totalOrders >= 5 ? 3 : totalOrders >= 2 ? 2 : 1;
    const rfmMonetary  = totalRevenue >= 100_000_000 ? 5 : totalRevenue >= 50_000_000 ? 4 : totalRevenue >= 10_000_000 ? 3 : totalRevenue >= 1_000_000 ? 2 : 1;

    const revScore  = rfmMonetary * 20;
    const freqScore = rfmFrequency * 20;
    const recScore  = rfmRecency * 20;
    const payScore  = 80;
    const loyScore  = Math.min(totalOrders > 1 ? totalOrders * 8 : 20, 100);
    const abcScore  = Math.round(revScore * ABC_SCORE_WEIGHT.revenue + freqScore * ABC_SCORE_WEIGHT.frequency + recScore * ABC_SCORE_WEIGHT.recency + payScore * ABC_SCORE_WEIGHT.margin + loyScore * ABC_SCORE_WEIGHT.longevity);
    const computedSegment = abcScore >= 75 ? 'A' : abcScore >= 50 ? 'B' : abcScore >= 25 ? 'C' : 'D';

    // ── Layer 5: Predictive ───────────────────────────────────────────────────
    const churnRisk = totalOrders === 0 ? 0
      : daysSinceLastOrder > 180 ? 85 : daysSinceLastOrder > 90 ? 65
      : daysSinceLastOrder > 45  ? 40 : daysSinceLastOrder > 14 ? 20 : 5;

    const avgMonthlyRevenue = totalRevenue / Math.max(1, daysSinceFirstOrder / 30);
    const ltvForecast = Math.round(avgMonthlyRevenue * 24);

    // Upsell probability (product diversity × frequency signal)
    const upsellProbability = Math.min(100, Math.round(
      (rfmFrequency * 10) + (rfmMonetary * 8) + (rfmRecency * 5) + (totalOrders > 5 ? 15 : 0)
    ));

    // ── Layer 4: Journey stage ────────────────────────────────────────────────
    const journeyStage = totalOrders === 0 ? 'prospect'
      : daysSinceLastOrder > 180 ? 'lost'
      : daysSinceLastOrder > 60  ? 'at_risk'
      : daysSinceFirstOrder < 90 ? 'growing' : 'stable';
    const journeyStageLabels: Record<string, string> = {
      prospect: 'Potensial', new: 'Yangi', growing: 'O\'sish',
      stable: 'Barqaror', at_risk: 'Xavf ostida', lost: 'Yo\'qolgan',
    };

    // ── Layer 3: Sentiment analysis ───────────────────────────────────────────
    const posWords = ['yaxshi','rahmat','ajoyib','rozi','mamnun','excellent','good','great','хорошо','отлично','satisfied','happy','sifatli','tez','professional'];
    const negWords = ['yomon','shikoyat','muammo','kechikish','bad','problem','issue','complaint','плохо','проблема','dissatisfied','angry','sekin','sifatsiz','qaytarish'];
    let sentTotal = 0, sentCount = 0;
    for (const iRow of interactionsRows) {
      const text = String((iRow.notes ?? '') + ' ' + (iRow.subject ?? '') + ' ' + (iRow.outcome ?? '')).toLowerCase();
      // Also use stored sentiment_score if available
      if (iRow.sentiment_score !== null && iRow.sentiment_score !== undefined) {
        sentTotal += Number(iRow.sentiment_score); sentCount++;
      } else {
        let s = 0;
        for (const w of posWords) if (text.includes(w)) s++;
        for (const w of negWords) if (text.includes(w)) s--;
        if (s !== 0) { sentTotal += Math.max(-1, Math.min(1, s)); sentCount++; }
      }
    }
    // NPS-based sentiment boost
    const avgNps = npsRows.length > 0 ? npsRows.reduce((s, n) => s + Number(n.score ?? 0), 0) / npsRows.length : null;
    if (avgNps !== null) {
      const npsNorm = (avgNps - 5) / 5; // -1 to +1
      sentTotal += npsNorm; sentCount++;
    }
    const sentimentScore = sentCount > 0 ? Math.max(-1, Math.min(1, sentTotal / sentCount)) : 0;
    const sentimentLabel = sentimentScore > 0.2 ? 'positive' : sentimentScore < -0.2 ? 'negative' : 'neutral';

    // Satisfaction trend from ratings
    const ratedInteractions = interactionsRows.filter(i => i.satisfaction_rating);
    const avgSatisfaction = ratedInteractions.length > 0
      ? ratedInteractions.reduce((s, i) => s + Number(i.satisfaction_rating), 0) / ratedInteractions.length : null;

    // NPS score
    const npsPromoters  = npsRows.filter(n => Number(n.score) >= 9).length;
    const npsDetractors = npsRows.filter(n => Number(n.score) <= 6).length;
    const npsScore = npsRows.length > 0
      ? Math.round(((npsPromoters - npsDetractors) / npsRows.length) * 100) : null;

    // ── Smart recommendations ─────────────────────────────────────────────────
    const recommendations: string[] = [];
    if (totalOrders === 0)         recommendations.push("📋 Hali buyurtma berilmagan — taklif yuboring");
    if (churnRisk > 60)            recommendations.push("⚠️ Churn xavfi yuqori — zudlik bilan muloqot o'rnatish kerak");
    if (rfmRecency <= 2 && totalOrders > 0) recommendations.push("📞 60+ kun faoliyatsiz — qayta faollashtiring");
    if (rfmFrequency >= 4)         recommendations.push("🌟 Tez-tez buyurtma beruvchi — maxsus chegirma taklif eting");
    if (abcScore >= 75)            recommendations.push("💎 A-kategoriya mijoz — VIP xizmat ta'minlang");
    if (sentimentScore < -0.2)     recommendations.push("😟 Salbiy munosabat aniqlandi — shikoyatlarni ko'rib chiqing");
    if (upsellProbability >= 60)   recommendations.push("🚀 Upsell imkoniyati yuqori — yangi mahsulot taklif qiling");
    if (npsScore !== null && npsScore < 0) recommendations.push("📊 NPS manfiy — mijoz qoniqmasligi aniqlandi");
    if (recommendations.length === 0) recommendations.push("✅ Mijoz ko'rsatkichlari yaxshi — hozirgi aloqani davom ettiring");

    // ── Layer 1: Decision makers ──────────────────────────────────────────────
    const decisionMakers = contactsRows.filter(c => c.is_decision_maker);

    // ── Layer 7: Internal intelligence ────────────────────────────────────────
    const relationshipQuality = String(cust?.relationship_quality ?? 'normal');
    const lastInteraction = interactionsRows[0];
    const nextActions = interactionsRows
      .filter(i => i.next_action && i.next_action_date)
      .map(i => ({ action: i.next_action, date: i.next_action_date, by: i.employee_name }))
      .slice(0, 5);

    // ── RETURN: Full 7-layer Customer 360 ─────────────────────────────────────
    return {
      customer: cust,

      // ── Layer 1: Identity ──────────────────────────────────────────────────
      basic: {
        id: cust?.id,
        title: cust?.name,
        name: cust?.name,
        customerCode:     cust?.customer_code ?? null,
        customerType:     cust?.customer_type ?? 'legal',
        customerCategory: cust?.segment ?? computedSegment,
        status:           cust?.status ?? 'active',
        stir:             cust?.stir ?? cust?.inn,
        industry:         cust?.industry ?? null,
        address:          cust?.address ?? cust?.actual_address,
        actualAddress:    cust?.actual_address,
        phones:           cust?.phone ? [{ value: cust.phone, type: 'asosiy' }] : [],
        emails:           cust?.email ? [{ value: cust.email, type: 'asosiy' }] : [],
        websites:         cust?.website ? [{ value: cust.website }] : [],
        source:           cust?.source ?? null,
        creditLimit:      Number(cust?.credit_limit ?? 0),
        paymentTermsDays: Number(cust?.payment_terms_days ?? 30),
        discountRate:     Number(cust?.discount_rate ?? 0),
        dateCreate:       cust?.created_at,
        comments:         cust?.notes,
        companyStructure: cust?.company_structure ?? 'independent',
        shareOfWallet:    Number(cust?.share_of_wallet ?? 0),
        relationshipQuality,
      },

      // Contacts with influence levels (Layer 1)
      contacts: contactsRows.map(c => ({
        id:               c.id,
        fullName:         c.full_name,
        position:         c.position,
        phone:            c.phone,
        email:            c.email,
        telegram:         c.telegram,
        isPrimary:        c.is_primary,
        influenceLevel:   Number(c.influence_level ?? 3),
        isDecisionMaker:  Boolean(c.is_decision_maker),
        department:       c.department,
        linkedinUrl:      c.linkedin_url,
        roleNote:         c.role_note,
      })),
      decisionMakers: decisionMakers.map(c => ({
        id:             c.id,
        fullName:       c.full_name,
        position:       c.position,
        influenceLevel: Number(c.influence_level ?? 3),
        department:     c.department,
        phone:          c.phone,
        email:          c.email,
      })),

      // ── Layer 2: Behavioral ────────────────────────────────────────────────
      orders: {
        totalCount:    totalOrders,
        totalAmount:   totalRevenue,
        averageOrderAmount: avgOrderValue,
        firstOrderDate,
        lastOrderDate,
        monthlyTrend:  yearlyTrend,
        recentOrders:  orders.slice(0, 15).map(o => ({
          id:           o.id,
          orderNumber:  o.order_number,
          status:       o.status,
          totalAmount:  Number(o.total_amount ?? 0),
          currency:     o.currency ?? 'UZS',
          createdAt:    o.created_at,
          deliveryDate: o.delivery_date,
        })),
      },

      // ── Layer 3: Sentiment & Feedback ─────────────────────────────────────
      communications: {
        recent: interactionsRows.map(i => ({
          id:                 i.id,
          type:               i.type,
          direction:          i.direction,
          subject:            i.subject,
          notes:              i.notes,
          description:        i.notes,
          outcome:            i.outcome,
          employeeName:       i.employee_name,
          createdAt:          i.created_at,
          interactionDate:    i.interaction_date ?? i.created_at,
          interaction_date:   i.interaction_date ?? i.created_at,
          next_action:        i.next_action,
          next_action_date:   i.next_action_date,
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
        .map(i => ({
          id: i.id, notes: i.notes, subject: i.subject,
          status: 'open', createdAt: i.created_at,
        })),
      nps: {
        score:      npsScore,
        responses:  npsRows.length,
        promoters:  npsPromoters,
        detractors: npsDetractors,
        avgScore:   avgNps ? Math.round(avgNps * 10) / 10 : null,
        category:   npsScore === null ? 'unknown' : npsScore >= 50 ? 'excellent' : npsScore >= 0 ? 'good' : 'poor',
        recentResponses: npsRows.slice(0, 5).map(n => ({
          id: n.id, score: Number(n.score), comment: n.comment,
          category: n.category, createdAt: n.created_at,
        })),
      },
      avgSatisfaction,

      // ── Layer 4: Journey ──────────────────────────────────────────────────
      journey: {
        stage:              journeyStage,
        stageLabel:         journeyStageLabels[journeyStage] ?? journeyStage,
        firstOrderDate,
        lastOrderDate,
        daysSinceFirstOrder,
        daysSinceLastOrder,
        peakMonth:          yearlyTrend.length > 0 ? yearlyTrend.reduce((a, b) => a.total > b.total ? a : b) : null,
      },
      growth: {
        lastYearTotal,
        thisYearTotal,
        projectedThisYear,
        growthRate,
        trend:       totalOrders > 3 ? 'growing' : totalOrders > 0 ? 'stable' : 'new',
        riskSignals: churnRisk > 60 ? ['Churn xavfi yuqori'] : daysSinceLastOrder > 45 ? ['So\'nggi faoliyat past'] : [],
        yearlyTrend,
        totalOrders,
        totalRevenue,
        avgOrderValue,
      },

      // ── Layer 5: Predictive ───────────────────────────────────────────────
      predictive: {
        churnRisk,
        churnLabel:         churnRisk >= 70 ? 'high' : churnRisk >= 40 ? 'medium' : 'low',
        ltvForecast,
        avgMonthlyRevenue:  Math.round(avgMonthlyRevenue),
        upsellProbability,
        nextBestAction:     recommendations[0] ?? null,
        allActions:         recommendations,
      },

      // ── Layer 3: Sentiment (separate section) ─────────────────────────────
      sentiment: {
        score:                 sentimentScore,
        label:                 sentimentLabel,
        analyzedInteractions:  sentCount,
        totalInteractions:     interactionsRows.length,
        avgSatisfaction,
        npsScore,
      },

      // ── Layer 6: Value metrics ────────────────────────────────────────────
      segmentation: {
        segment:         computedSegment,
        abcScore,
        abcCategory:     computedSegment,
        categoryLabel:   computedSegment === 'A' ? 'VIP mijoz' : computedSegment === 'B' ? 'Doimiy mijoz' : computedSegment === 'C' ? 'Oddiy mijoz' : 'Xavfli mijoz',
        scoreBreakdown: {
          revenueScore:   revScore,
          frequencyScore: freqScore,
          recencyScore:   recScore,
          paymentScore:   payScore,
          loyaltyScore:   loyScore,
        },
        rfm: { recency: rfmRecency, frequency: rfmFrequency, monetary: rfmMonetary },
        recommendations,
        totalRevenue,
        totalOrders,
        avgOrderValue,
        firstOrderDate,
        lastOrderDate,
        shareOfWallet:    Number(cust?.share_of_wallet ?? 0),
        upsellProbability,
      },

      // ── Layer 7: Internal intelligence ───────────────────────────────────
      internalIntelligence: {
        relationshipQuality,
        relationshipLabel: relationshipQuality === 'excellent' ? 'Ajoyib' : relationshipQuality === 'good' ? 'Yaxshi' : relationshipQuality === 'normal' ? 'Oddiy' : relationshipQuality === 'difficult' ? 'Murakkab' : 'Noma\'lum',
        totalNotes:        interactionsRows.filter(i => i.type === 'note').length,
        nextActions,
        lastInteraction:   lastInteraction ? {
          type: lastInteraction.type,
          date: lastInteraction.interaction_date ?? lastInteraction.created_at,
          by:   lastInteraction.employee_name,
        } : null,
        keyInsights: [
          rfmFrequency >= 4  ? 'Tez-tez buyurtma beruvchi' : null,
          rfmMonetary >= 4   ? 'Yuqori daromadli mijoz' : null,
          sentimentScore > 0.2 ? 'Ijobiy munosabatda' : sentimentScore < -0.2 ? 'Salbiy munosabatda' : null,
          Number(cust?.payment_terms_days ?? 30) <= 7 ? 'Tez to\'lovchi' : null,
        ].filter(Boolean),
      },

      // ── Finance ───────────────────────────────────────────────────────────
      finance: {
        totalRevenue,
        totalOrders,
        avgOrderValue,
        totalPaid:     payments.reduce((s, p) => s + Number(p.amount ?? 0), 0),
        openDebt:      totalRevenue - payments.reduce((s, p) => s + Number(p.amount ?? 0), 0),
        payments:      payments.map(p => ({
          id: p.id, amount: Number(p.amount ?? 0),
          paymentDate: p.payment_date, method: p.payment_method ?? p.method, status: p.status,
        })),
      },

      // ── LTV ───────────────────────────────────────────────────────────────
      ltv: {
        lifetimeValue:      totalRevenue,
        ltvForecast,
        avgMonthlyRevenue:  Math.round(avgMonthlyRevenue),
        totalOrders,
        avgOrderValue,
        firstOrderDate,
        lastOrderDate,
        daysSinceFirstOrder,
        lifetimeMonths:     Math.round(daysSinceFirstOrder / 30),
        upsellProbability,
      },

      // ── Competitors ───────────────────────────────────────────────────────
      competitors: {
        list: competitorsRows.map(c => ({
          id: c.id,
          competitorName:    c.competitor_name ?? c.name,
          product:           c.product_type,
          productType:       c.product_type,
          estimatedSharePct: Number(c.estimated_share_pct ?? 0),
          winBackPotential:  c.win_back_potential,
          notes:             c.notes,
          competitor_name:   c.competitor_name ?? c.name,
          win_back_potential:c.win_back_potential,
          estimated_share_percent: Number(c.estimated_share_pct ?? 0),
        })),
        totalCompetitorShare: competitorsRows.reduce((s, c) => s + Number(c.estimated_share_pct ?? 0), 0),
        ourShare: Math.max(0, 100 - competitorsRows.reduce((s, c) => s + Number(c.estimated_share_pct ?? 0), 0)),
      },

      // ── Contracts / Documents ─────────────────────────────────────────────
      contracts: {
        totalCount:    documentsRows.length,
        contracts:     documentsRows.filter(d => d.type === 'contract').map(d => ({
          id: d.id, name: d.name ?? d.title, type: d.type,
          fileUrl: d.file_url ?? d.url, expiresAt: d.expires_at ?? d.end_date,
          status: d.status ?? 'active', notes: d.notes, startDate: d.start_date, endDate: d.end_date,
          totalAmount: Number(d.total_amount ?? 0),
        })),
        expiringSoon:  documentsRows.filter(d => {
          if (!d.expires_at && !d.end_date) return false;
          const exp = new Date(String(d.expires_at ?? d.end_date));
          const days = Math.ceil((exp.getTime() - Date.now()) / 86400000);
          return days >= 0 && days <= 30;
        }).map(d => ({ id: d.id, name: d.name ?? d.title, expiresAt: d.expires_at ?? d.end_date })),
        allDocuments:  documentsRows.map(d => ({
          id: d.id, name: d.name ?? d.title, type: d.type,
          fileUrl: d.file_url ?? d.url, url: d.file_url ?? d.url,
          expiresAt: d.expires_at ?? d.end_date, endDate: d.expires_at ?? d.end_date,
          notes: d.notes, startDate: d.start_date, totalAmount: Number(d.total_amount ?? 0),
        })),
      },

      // Legacy compat
      recent_orders: orders.slice(0, 10),
      documents:     documentsRows,
    };
  }

  async update(cid: number, body: Row): Promise<Row[]> {
    const { name, title, stir, inn, phone, email, address, status, notes } = body;
    const finalName = name ?? title ?? null;
    const finalStir = stir ?? inn ?? null;
    const rows = await runQuery<Row>(sql`
      UPDATE sd_customers
      SET name = COALESCE(${finalName}, name),
          stir = COALESCE(${finalStir}, stir),
          inn = COALESCE(${finalStir}, inn),
          phone = COALESCE(${phone ?? null}, phone),
          email = COALESCE(${email ?? null}, email),
          address = COALESCE(${address ?? null}, address),
          status = COALESCE(${status ?? null}, status),
          notes = COALESCE(${notes ?? null}, notes),
          updated_at = NOW()
      WHERE id = ${cid} RETURNING *
    `);
    return rows.rows as Row[];
  }

  async create(body: Row): Promise<Row> {
    const { name, title, stir, inn, phone, email, address, notes } = body;
    const finalName = name ?? title ?? 'Nomsiz';
    const finalStir = stir ?? inn ?? null;
    // Map frontend segment → DB status
    const seg = String(body.segment ?? 'new');
    const dbStatus = seg === 'vip' ? 'vip' : seg === 'regular' ? 'active' : seg === 'potential' ? 'at_risk' : 'new';
    const actualAddress = body.actualAddress ?? body.actual_address ?? address ?? null;
    const rows = await runQuery<Row>(sql`
      INSERT INTO sd_customers (name, stir, inn, phone, email, address, actual_address, notes, status, created_at, updated_at)
      VALUES (${finalName}, ${finalStir}, ${finalStir}, ${phone ?? null}, ${email ?? null},
              ${actualAddress}, ${actualAddress},
              ${notes ?? null}, ${dbStatus}, NOW(), NOW())
      RETURNING *
    `);
    const row = rows.rows[0] as Row;
    return { ...row, segment: this.mapSegment(String(row.status ?? '')), creditLimit: Number(row.credit_limit ?? 0), actualAddress: row.actual_address ?? null };
  }

  async softDelete(cid: number): Promise<void> {
    await execSdCustomerSoftDelete(cid);
  }

  async getRecentOrders(cid: number): Promise<Row[]> {
    const rows = await runQuery<Row>(sql`
      SELECT id, order_number, status, total_amount, created_at, delivery_date
      FROM sales_orders WHERE customer_id = ${cid} AND deleted_at IS NULL
      ORDER BY created_at DESC LIMIT 10
    `);
    return rows.rows as Row[];
  }

  async getContacts(cid: number): Promise<Row[]> {
    const rows = await runQuery<Row>(sql`SELECT * FROM sd_customer_contacts WHERE customer_id = ${cid} ORDER BY is_primary DESC, full_name`);
    return rows.rows as Row[];
  }

  async addContact(cid: number, full_name: unknown, phone: unknown, email: unknown, position: unknown, is_primary: unknown, extras?: Record<string, unknown>): Promise<Row> {
    const influence  = extras?.influence_level ?? 3;
    const isDm       = extras?.is_decision_maker ?? false;
    const dept       = extras?.department ?? null;
    const linkedin   = extras?.linkedin_url ?? null;
    const roleNote   = extras?.role_note ?? null;
    const telegram   = extras?.telegram ?? null;
    const rows = await runQuery<Row>(sql`
      INSERT INTO sd_customer_contacts
        (customer_id, full_name, phone, email, position, is_primary, influence_level, is_decision_maker, department, linkedin_url, role_note, telegram)
      VALUES
        (${cid}, ${full_name}, ${phone ?? null}, ${email ?? null}, ${position ?? null}, ${is_primary ?? false},
         ${influence}, ${isDm}, ${dept}, ${linkedin}, ${roleNote}, ${telegram})
      RETURNING *
    `);
    return rows.rows[0] as Row;
  }

  async updateContact(kid: number, cid: number, full_name: unknown, phone: unknown, email: unknown, position: unknown, extras?: Record<string, unknown>): Promise<Row[]> {
    const influence = extras?.influence_level ?? null;
    const isDm      = extras?.is_decision_maker ?? null;
    const dept      = extras?.department ?? null;
    const linkedin  = extras?.linkedin_url ?? null;
    const roleNote  = extras?.role_note ?? null;
    const telegram  = extras?.telegram ?? null;
    const rows = await runQuery<Row>(sql`
      UPDATE sd_customer_contacts SET
        full_name         = COALESCE(${full_name ?? null}, full_name),
        phone             = COALESCE(${phone ?? null}, phone),
        email             = COALESCE(${email ?? null}, email),
        position          = COALESCE(${position ?? null}, position),
        telegram          = COALESCE(${telegram}, telegram),
        influence_level   = COALESCE(${influence}, influence_level),
        is_decision_maker = COALESCE(${isDm}, is_decision_maker),
        department        = COALESCE(${dept}, department),
        linkedin_url      = COALESCE(${linkedin}, linkedin_url),
        role_note         = COALESCE(${roleNote}, role_note),
        updated_at        = NOW()
      WHERE id = ${kid} AND customer_id = ${cid} RETURNING *
    `);
    return rows.rows as Row[];
  }

  async getNps(cid: number): Promise<Row[]> {
    const rows = await runQuery<Row>(sql`
      SELECT *, CASE WHEN score >= 9 THEN 'promoter' WHEN score >= 7 THEN 'passive' ELSE 'detractor' END AS category
      FROM nps_responses WHERE customer_id = ${cid} ORDER BY created_at DESC LIMIT 30
    `);
    return rows.rows as Row[];
  }

  async addNps(cid: number, score: number, comment: unknown): Promise<Row> {
    const id = `nps-${cid}-${Date.now()}`;
    const rows = await runQuery<Row>(sql`
      INSERT INTO nps_responses (id, customer_id, score, comment, created_at)
      VALUES (${id}, ${cid}, ${score}, ${comment ?? null}, NOW())
      RETURNING *, CASE WHEN score >= 9 THEN 'promoter' WHEN score >= 7 THEN 'passive' ELSE 'detractor' END AS category
    `);
    return rows.rows[0] as Row;
  }

  async updateInternalNotes(cid: number, body: Record<string, unknown>): Promise<Row[]> {
    const rq = body.relationship_quality ?? null;
    const notes = body.internal_notes ?? null;
    const shareOfWallet = body.share_of_wallet ?? null;
    const rows = await runQuery<Row>(sql`
      UPDATE sd_customers SET
        relationship_quality = COALESCE(${rq}, relationship_quality),
        notes               = COALESCE(${notes}, notes),
        share_of_wallet     = COALESCE(${shareOfWallet}, share_of_wallet),
        updated_at          = NOW()
      WHERE id = ${cid} RETURNING *
    `);
    return rows.rows as Row[];
  }

  async deleteContact(kid: number, cid: number): Promise<void> {
    await execSdContactDelete(kid, cid);
  }

  async getInteractions(cid: number): Promise<Row[]> {
    const rows = await runQuery<Row>(sql`
      SELECT i.*, COALESCE(e.first_name,'') || ' ' || COALESCE(e.last_name,'') AS employee_name
      FROM sd_customer_interactions i LEFT JOIN employees e ON e.id::text = i.employee_id::text
      WHERE i.customer_id = ${cid} ORDER BY i.created_at DESC LIMIT 20
    `);
    return rows.rows as Row[];
  }

  async addInteraction(cid: number, type: unknown, notes: unknown, employee_id: unknown): Promise<Row> {
    const rows = await runQuery<Row>(sql`
      INSERT INTO sd_customer_interactions (customer_id, type, notes, employee_id)
      VALUES (${cid}, ${type}, ${notes ?? null}, ${employee_id ?? null}) RETURNING *
    `);
    return rows.rows[0] as Row;
  }

  async getDocuments(cid: number): Promise<Row[]> {
    const rows = await runQuery<Row>(sql`SELECT * FROM sd_customer_documents WHERE customer_id = ${cid} ORDER BY created_at DESC`);
    return rows.rows as Row[];
  }

  async addDocument(cid: number, type: unknown, name: unknown, url: unknown, notes: unknown): Promise<Row> {
    const rows = await runQuery<Row>(sql`
      INSERT INTO sd_customer_documents (customer_id, type, name, url, notes)
      VALUES (${cid}, ${type}, ${name}, ${url ?? null}, ${notes ?? null}) RETURNING *
    `);
    return rows.rows[0] as Row;
  }

  async deleteDocument(cid: number, did: number): Promise<void> {
    await execSdDocumentDelete(did, cid);
  }

  async getCompetitors(cid: number): Promise<Row[]> {
    const rows = await runQuery<Row>(sql`SELECT * FROM sd_customer_competitors WHERE customer_id = ${cid} ORDER BY competitor_name`);
    return rows.rows as Row[];
  }

  async addCompetitor(cid: number, competitorName: unknown, notes: unknown, productType?: unknown, estimatedSharePct?: unknown, winBackPotential?: unknown): Promise<Row> {
    const rows = await runQuery<Row>(sql`
      INSERT INTO sd_customer_competitors (customer_id, competitor_name, notes, product_type, estimated_share_pct, win_back_potential)
      VALUES (${cid}, ${competitorName ?? null}, ${notes ?? null}, ${productType ?? null}, ${estimatedSharePct ?? null}, ${winBackPotential ?? null})
      RETURNING *
    `);
    return rows.rows[0] as Row;
  }

  async deleteCompetitor(customerId: number, competitorId: number): Promise<void> {
    await execSdCompetitorDelete(competitorId, customerId);
  }

  async getComplaints(cid: number): Promise<Row[]> {
    const rows = await runQuery<Row>(sql`
      SELECT cp.*, COALESCE(e.first_name,'') || ' ' || COALESCE(e.last_name,'') AS resolved_by_name
      FROM sd_customer_complaints cp LEFT JOIN employees e ON e.id = cp.resolved_by
      WHERE cp.customer_id = ${cid} ORDER BY cp.created_at DESC
    `);
    return rows.rows as Row[];
  }

  async resolveComplaint(customerId: number, complaintId: number, resolution: string, resolvedBy: number | null): Promise<Row | null> {
    const rows = await runQuery<Row>(sql`
      UPDATE sd_customer_complaints SET status = 'resolved', resolution = ${resolution}, resolved_by = ${resolvedBy}, resolved_at = NOW()
      WHERE id = ${complaintId} AND customer_id = ${customerId} RETURNING *
    `);
    return (rows.rows[0] ?? null) as Row | null;
  }
}
