import { Injectable } from '@nestjs/common';
import { db , runQuery } from '@shared/db';
import { sql } from 'drizzle-orm';
import {
  execSdCustomerSoftDelete, execSdContactDelete,
  execSdDocumentDelete, execSdCompetitorDelete,
} from '@common/database/queries-sd';

type Row = Record<string, unknown>;

@Injectable()
export class DrizzleSdCustomersRepository {
  async list(pat: string | null, status: string | undefined, lim: number, off: number): Promise<Row[]> {
    const rows = await runQuery<Row>(sql`
      SELECT c.*, COUNT(DISTINCT o.id)::int AS order_count,
             COALESCE(SUM(o.total_amount), 0)::numeric(15,2) AS lifetime_value
      FROM sd_customers c LEFT JOIN sales_orders o ON o.customer_id = c.id
      WHERE (${pat}::text IS NULL OR c.name ILIKE ${pat} OR c.stir ILIKE ${pat})
        AND (${status ?? null}::text IS NULL OR c.status = ${status ?? null})
      GROUP BY c.id ORDER BY c.name LIMIT ${lim} OFFSET ${off}
    `);
    return rows.rows as Row[];
  }

  async getById(cid: number): Promise<Row[]> {
    const rows = await runQuery<Row>(sql`SELECT * FROM sd_customers WHERE id = ${cid}`);
    return rows.rows as Row[];
  }

  async get360View(cid: number): Promise<Record<string, unknown>> {
    // Parallel fetch — har bir query xato bersa ham boshqalari ishlaydi
    const safe = async (q: ReturnType<typeof runQuery<Row>>) =>
      q.then(r => r.rows as Row[]).catch(() => [] as Row[]);

    const [customerRows, ordersRows, contactsRows, documentsRows, interactionsRows, competitorsRows, paymentsRows] = await Promise.all([
      safe(runQuery<Row>(sql`SELECT * FROM sd_customers WHERE id = ${cid}`)),
      safe(runQuery<Row>(sql`
        SELECT id, order_number, status, total_amount, currency, created_at, delivery_date
        FROM sales_orders WHERE customer_id = ${cid} ORDER BY created_at DESC LIMIT 50
      `)),
      safe(runQuery<Row>(sql`SELECT * FROM sd_customer_contacts WHERE customer_id = ${cid} ORDER BY is_primary DESC, full_name`)),
      safe(runQuery<Row>(sql`SELECT * FROM sd_customer_documents WHERE customer_id = ${cid} ORDER BY created_at DESC LIMIT 20`)),
      safe(runQuery<Row>(sql`
        SELECT i.*, COALESCE(e.first_name,'') || ' ' || COALESCE(e.last_name,'') AS employee_name
        FROM sd_customer_interactions i LEFT JOIN employees e ON e.id::text = i.employee_id::text
        WHERE i.customer_id = ${cid} ORDER BY i.created_at DESC LIMIT 30
      `)),
      safe(runQuery<Row>(sql`SELECT * FROM sd_customer_competitors WHERE customer_id = ${cid}`)),
      safe(runQuery<Row>(sql`SELECT * FROM sd_payments WHERE customer_id = ${cid} ORDER BY payment_date DESC LIMIT 30`)),
    ]);

    const cust = customerRows[0] as Row | undefined;
    const orders = ordersRows;
    const payments = paymentsRows;

    // Buyurtmalar statistikasi
    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((s, o) => s + Number(o.total_amount ?? 0), 0);
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // LTV hisoblash
    const firstOrderDate = orders.length > 0 ? orders[orders.length - 1]?.created_at : null;
    const lastOrderDate = orders.length > 0 ? orders[0]?.created_at : null;

    // Frontend kutgan shakl:
    return {
      customer: cust,
      // basic — asosiy tab uchun
      basic: {
        id: cust?.id,
        title: cust?.name,
        name: cust?.name,
        customerCode: cust?.customer_code ?? null,
        customerType: cust?.customer_type ?? 'legal',
        customerCategory: cust?.segment ?? 'C',
        status: cust?.status ?? 'active',
        stir: cust?.stir ?? cust?.inn,
        industry: cust?.industry ?? null,
        address: cust?.address ?? cust?.actual_address,
        phones: cust?.phone ? [{ value: cust.phone, type: 'asosiy' }] : [],
        emails: cust?.email ? [{ value: cust.email, type: 'asosiy' }] : [],
        websites: [],
        source: cust?.source ?? null,
        creditLimit: cust?.credit_limit ?? 0,
        paymentTermsDays: cust?.payment_terms_days ?? 30,
        discountRate: cust?.discount_rate ?? 0,
        dateCreate: cust?.created_at,
        comments: cust?.notes,
      },
      // contacts — kontaktlar
      contacts: contactsRows.map(c => ({
        id: c.id,
        fullName: c.full_name,
        position: c.position,
        phone: c.phone,
        email: c.email,
        telegram: c.telegram,
        isPrimary: c.is_primary,
      })),
      // orders — buyurtmalar
      orders: orders.map(o => ({
        id: o.id,
        orderNumber: o.order_number,
        status: o.status,
        totalAmount: Number(o.total_amount ?? 0),
        currency: o.currency ?? 'UZS',
        createdAt: o.created_at,
        deliveryDate: o.delivery_date,
      })),
      // finance — moliya
      finance: {
        totalRevenue,
        totalOrders,
        avgOrderValue,
        totalPaid: payments.reduce((s, p) => s + Number(p.amount ?? 0), 0),
        openDebt: totalRevenue - payments.reduce((s, p) => s + Number(p.amount ?? 0), 0),
        payments: payments.map(p => ({
          id: p.id,
          amount: Number(p.amount ?? 0),
          paymentDate: p.payment_date,
          method: p.payment_method ?? p.method,
          status: p.status,
        })),
      },
      // communications — muloqotlar
      communications: interactionsRows.map(i => ({
        id: i.id,
        type: i.type,
        notes: i.notes,
        employeeName: i.employee_name,
        createdAt: i.created_at,
      })),
      // complaints — shikoyatlar
      complaints: interactionsRows
        .filter(i => i.type === 'complaint')
        .map(i => ({
          id: i.id,
          notes: i.notes,
          status: i.status ?? 'open',
          createdAt: i.created_at,
        })),
      // segmentation — ABC tahlili
      segmentation: {
        segment: cust?.segment ?? 'C',
        totalRevenue,
        totalOrders,
        avgOrderValue,
        lastOrderDate,
        firstOrderDate,
      },
      // growth — rivojlanish
      growth: {
        totalOrders,
        totalRevenue,
        avgOrderValue,
        trend: totalOrders > 3 ? 'growing' : totalOrders > 0 ? 'stable' : 'new',
      },
      // competitors — raqobatchilar
      competitors: competitorsRows.map(c => ({
        id: c.id,
        competitorName: c.competitor_name,
        product: c.product,
        notes: c.notes,
      })),
      // contracts — shartnomalar (hujjatlardan filter)
      contracts: documentsRows
        .filter(d => d.type === 'contract')
        .map(d => ({
          id: d.id,
          name: d.name,
          url: d.url,
          notes: d.notes,
          createdAt: d.created_at,
        })),
      // ltv — lifetime value
      ltv: {
        lifetimeValue: totalRevenue,
        totalOrders,
        avgOrderValue,
        firstOrderDate,
        lastOrderDate,
        daysSinceFirstOrder: firstOrderDate
          ? Math.floor((Date.now() - new Date(String(firstOrderDate)).getTime()) / 86400000)
          : 0,
      },
      // Qo'shimcha (legacy mos)
      recent_orders: orders.slice(0, 10),
      documents: documentsRows,
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
    const rows = await runQuery<Row>(sql`
      INSERT INTO sd_customers (name, stir, inn, phone, email, address, notes, status, created_at, updated_at)
      VALUES (${finalName}, ${finalStir}, ${finalStir}, ${phone ?? null}, ${email ?? null}, ${address ?? null}, ${notes ?? null}, 'active', NOW(), NOW())
      RETURNING *
    `);
    return rows.rows[0] as Row;
  }

  async softDelete(cid: number): Promise<void> {
    await execSdCustomerSoftDelete(cid);
  }

  async getContacts(cid: number): Promise<Row[]> {
    const rows = await runQuery<Row>(sql`SELECT * FROM sd_customer_contacts WHERE customer_id = ${cid} ORDER BY is_primary DESC, full_name`);
    return rows.rows as Row[];
  }

  async addContact(cid: number, full_name: unknown, phone: unknown, email: unknown, position: unknown, is_primary: unknown): Promise<Row> {
    const rows = await runQuery<Row>(sql`
      INSERT INTO sd_customer_contacts (customer_id, full_name, phone, email, position, is_primary)
      VALUES (${cid}, ${full_name}, ${phone ?? null}, ${email ?? null}, ${position ?? null}, ${is_primary ?? false})
      RETURNING *
    `);
    return rows.rows[0] as Row;
  }

  async updateContact(kid: number, cid: number, full_name: unknown, phone: unknown, email: unknown, position: unknown): Promise<Row[]> {
    const rows = await runQuery<Row>(sql`
      UPDATE sd_customer_contacts
      SET full_name = COALESCE(${full_name ?? null}, full_name), phone = COALESCE(${phone ?? null}, phone),
          email = COALESCE(${email ?? null}, email), position = COALESCE(${position ?? null}, position), updated_at = NOW()
      WHERE id = ${kid} AND customer_id = ${cid} RETURNING *
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
    const rows = await runQuery<Row>(sql`SELECT * FROM sd_customer_competitors WHERE customer_id = ${cid} ORDER BY name`);
    return rows.rows as Row[];
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
