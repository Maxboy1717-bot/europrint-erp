/**
 * @module seed-sd-marketing
 * @description Source module. See exports for details.
 */

import 'dotenv/config';
import { Pool } from 'pg';

const log    = (msg: string) => process.stdout.write(msg + '\n');
const logErr = (msg: string, err: unknown) => process.stderr.write(`${msg} ${String(err)}\n`);

async function seed(): Promise<void> {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL muhit o'zgaruvchisi o'rnatilmagan");
  }
  const pool = new Pool({ connectionString });

  try {
    // 1. SD_CUSTOMERS  — keyed by stir (unique business identifier)
    log("sd_customers ga ma'lumot kiritilmoqda...");
    const seedCustomers: Array<[string, string, string, string, string, string, number, number, number, number, string, string]> = [
      ['Toshkent Matbaa Gruhi', '310450012', 'Toshkent sh., Yunusobod t.', 'Toshkent sh., Yunusobod t.', 'vip', 'manager-001', 50000000, 2500000, 12, 185000000, '2026-03-15', 'Asosiy VIP mijoz'],
      ["Samarqand Print LLC", '420561123', "Samarqand sh., Registon ko'chasi 5", 'Samarqand sh.', 'regular', 'manager-002', 20000000, 800000, 5, 42000000, '2026-04-01', ''],
      ["Andijon Qadoqlash", '512345678', "Andijon sh., Asaka ko'chasi 12", 'Andijon sh.', 'potential', 'manager-001', 5000000, 0, 1, 8500000, '2026-04-10', 'Yangi mijoz'],
    ];
    let custInserted = 0;
    for (const [name, stir, legalAddr, actualAddr, segment, managerId, creditLimit, openDebt, totalOrders, totalRevenue, lastOrderDate, notes] of seedCustomers) {
      const existing = await pool.query(`SELECT id FROM sd_customers WHERE stir = $1 LIMIT 1`, [stir]);
      if ((existing.rowCount ?? 0) > 0) continue;
      await pool.query(`
        INSERT INTO sd_customers
          (name, stir, legal_address, actual_address, segment, manager_id, status,
           is_blocked, credit_limit, open_debt, total_orders, total_revenue,
           last_order_date, notes, created_at, updated_at)
        VALUES ($1,$2,$3,$4,$5,$6,'active',false,$7,$8,$9,$10,$11,$12,NOW(),NOW())
      `, [name, stir, legalAddr, actualAddr, segment, managerId, creditLimit, openDebt, totalOrders, totalRevenue, lastOrderDate, notes || null]);
      custInserted++;
    }
    const custRes = { rowCount: custInserted };
    log(`  ${custRes.rowCount} ta yangi mijoz qo'shildi`);

    const custIdRes = await pool.query<{ id: number }>(
      `SELECT id FROM sd_customers WHERE stir = '310450012' LIMIT 1`
    );
    const custId = custIdRes.rows[0]?.id;
    if (!custId) { log('  WARN: mijoz id topilmadi'); return; }

    // 2. SD_LEADS  — keyed by contact_phone (stable business key for sample data)
    log("sd_leads ga ma'lumot kiritilmoqda...");
    const phones = ['+998901234567', '+998712345678', '+998905678901'];
    const existingLeads = await pool.query<{ contact_phone: string }>(
      `SELECT contact_phone FROM sd_leads WHERE contact_phone = ANY($1)`,
      [phones]
    );
    const existingPhones = new Set(existingLeads.rows.map(r => r.contact_phone));
    let leadsInserted = 0;
    const leadsData = [
      [String(custId), 'telegram', 'negotiating', 'Alisher Karimov', '+998901234567', 'manager-001',
       'Gofrokarton qutichalar BC flute', 50000, 12500000, '2026-05-05'],
      [null, 'exhibition', 'quoted', 'Nodira Yusupova', '+998712345678', 'manager-002',
       'Offset bosma qadoqlash', 20000, 6000000, '2026-05-10'],
      [null, 'website', 'working', 'Jasur Rahimov', '+998905678901', 'manager-001',
       'Pizza qutilari E flute', 10000, 2200000, '2026-05-03'],
    ];
    for (const row of leadsData) {
      const phone = row[4] as string;
      if (existingPhones.has(phone)) continue;
      await pool.query(`
        INSERT INTO sd_leads
          (customer_id, source, status, contact_name, contact_phone, manager_id,
           product_interest, estimated_volume, estimated_value,
           next_contact_date, created_at, updated_at)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,NOW(),NOW())
      `, row);
      leadsInserted++;
    }
    log(`  ${leadsInserted} ta yangi leed qo'shildi`);

    // 3. SD_PRICE_FORMULAS
    log("sd_price_formulas ga ma'lumot kiritilmoqda...");
    const pfCheck = await pool.query(`SELECT COUNT(*) as cnt FROM sd_price_formulas`);
    if (parseInt(pfCheck.rows[0].cnt) === 0) {
      await pool.query(`
        INSERT INTO sd_price_formulas
          (paper_b_price, paper_c_price, paper_bc_price, paper_e_price,
           print_1color_price, print_2color_price, print_4color_price,
           lamination_price, embossing_price, perforation_price,
           plate_cost_per_color, die_cost_new, die_cost_existing,
           hourly_labor_rate, delivery_base_cost,
           storage_daily_rate, storage_freedays,
           default_markup_percent, vat_rate,
           updated_by, updated_at)
        VALUES
          (4200, 4500, 5200, 3900,
           15000, 22000, 38000,
           3500, 2800, 1200,
           250000, 1800000, 0,
           25000, 50000,
           2500, 8,
           35, 12,
           'admin', NOW())
      `);
      log("  1 ta narx formulasi qo'shildi");
    } else {
      log("  Narx formulasi allaqachon mavjud — o'tkazib yuborildi");
    }

    // 4. SD_ORDERS (sd_contracts va sd_payments uchun kerak) — keyed by order_number (UNIQUE)
    log("sd_orders ga ma'lumot kiritilmoqda...");
    const orderRes = await pool.query<{ id: number }>(`
      INSERT INTO sd_orders
        (order_number, customer_id, manager_id, status, total_amount,
         advance_percent, advance_paid, balance_due,
         delivery_date, delivery_address, delivery_type,
         receiver_name, receiver_phone, version, created_at, updated_at)
      VALUES
        ('SO-2026-0001', $1, 'manager-001', 'delivered', 18500000,
         70, 12950000, 5550000,
         '2026-04-20', 'Toshkent sh., Yunusobod t., 15-uy', 'own',
         'Alisher Karimov', '+998901234567', 1, NOW(), NOW()),
        ('SO-2026-0002', $1, 'manager-002', 'production', 7200000,
         70, 5040000, 2160000,
         '2026-05-15', 'Toshkent sh., Chilonzor t., 8-uy', 'own',
         'Nodira Yusupova', '+998712345678', 1, NOW(), NOW())
      ON CONFLICT (order_number) DO NOTHING
      RETURNING id
    `, [String(custId)]);
    log(`  ${orderRes.rowCount} ta yangi buyurtma qo'shildi`);

    const orderIdRes = await pool.query<{ id: number }>(
      `SELECT id FROM sd_orders WHERE order_number = 'SO-2026-0001' LIMIT 1`
    );
    const orderId = orderIdRes.rows[0]?.id;

    // 5. SD_CONTRACTS — keyed by contract_number (UNIQUE)
    if (orderId) {
      log("sd_contracts ga ma'lumot kiritilmoqda...");
      const ctrRes = await pool.query(`
        INSERT INTO sd_contracts
          (order_id, contract_number, template_type, status,
           signed_at, valid_until, notes, created_at, updated_at)
        VALUES
          ($1, 'CTR-2026-0001', 'standard', 'signed',
           NOW() - INTERVAL '5 days', '2026-12-31',
           'Standart shartnoma — TO''LIQ IMZOLANGAN', NOW(), NOW())
        ON CONFLICT (contract_number) DO NOTHING
      `, [String(orderId)]);
      log(`  ${ctrRes.rowCount} ta shartnoma qo'shildi`);

      // 6. SD_PAYMENTS — keyed by (order_id, type) to avoid duplicates
      log("sd_payments ga ma'lumot kiritilmoqda...");
      const pmtTypes: Array<[string, number, string, string, string]> = [
        ['advance',  12950000, '2026-04-02', '2026-04-01', 'Avans to\'lovi — bank o\'tkazma'],
        ['balance',  5550000,  '2026-04-25', '2026-04-24', 'Qoldiq to\'lovi'],
      ];
      let pmtInserted = 0;
      for (const [type, amount, dueDate, paidDate, notes] of pmtTypes) {
        const existing = await pool.query(
          `SELECT id FROM sd_payments WHERE order_id = $1 AND type = $2 LIMIT 1`,
          [String(orderId), type]
        );
        if ((existing.rowCount ?? 0) > 0) continue;
        await pool.query(`
          INSERT INTO sd_payments
            (order_id, customer_id, amount, type, status, due_date, paid_date,
             payment_method, overdue_days, notes, created_by, created_at, updated_at)
          VALUES ($1,$2,$3,$4,'paid',$5,$6,'bank_transfer',0,$7,'admin',NOW(),NOW())
        `, [String(orderId), String(custId), amount, type, dueDate, paidDate, notes]);
        pmtInserted++;
      }
      log(`  ${pmtInserted} ta to'lov qo'shildi`);
    } else {
      log("  WARN: order_id topilmadi — contracts va payments o'tkazib yuborildi");
    }

    // 7. SD_MANAGER_QUOTAS — keyed by (manager_id, year, month) to prevent duplicates
    log("sd_manager_quotas ga ma'lumot kiritilmoqda...");
    const quotaRows: Array<[string, number, number, number, number]> = [
      ['manager-001', 2026, 4, 50000000, 42500000],
      ['manager-001', 2026, 3, 45000000, 47200000],
      ['manager-002', 2026, 4, 30000000, 18500000],
      ['manager-002', 2026, 3, 28000000, 31000000],
    ];
    let quotaInserted = 0;
    for (const [managerId, year, month, quota, achieved] of quotaRows) {
      const existing = await pool.query(
        `SELECT id FROM sd_manager_quotas WHERE manager_id=$1 AND year=$2 AND month=$3 LIMIT 1`,
        [managerId, year, month]
      );
      if ((existing.rowCount ?? 0) > 0) continue;
      await pool.query(`
        INSERT INTO sd_manager_quotas
          (manager_id, year, month, quota_amount, achieved_amount, created_at, updated_at)
        VALUES ($1,$2,$3,$4,$5,NOW(),NOW())
      `, [managerId, year, month, quota, achieved]);
      quotaInserted++;
    }
    log(`  ${quotaInserted} ta manager kvotasi qo'shildi`);

    // 8. MARKETING_CAMPAIGNS
    log("marketing_campaigns ga ma'lumot kiritilmoqda...");
    const campCheck = await pool.query(`SELECT COUNT(*) as cnt FROM marketing_campaigns`);
    if (parseInt(campCheck.rows[0].cnt) === 0) {
      await pool.query(`
        INSERT INTO marketing_campaigns
          (id, name, description, type, status, budget, spent_amount,
           platform, start_date, end_date,
           target_audience, goals, created_at, updated_at)
        VALUES
          (gen_random_uuid(), 'EuroPrint 2026 Yoz Kampaniyasi',
           'Gofrokarton va bosma qadoqlash mahsulotlari uchun yozgi reklama',
           'social', 'active', 15000000, 4200000,
           'instagram,telegram', NOW() - INTERVAL '15 days', NOW() + INTERVAL '45 days',
           'Oziq-ovqat va iste''mol tovarlar ishlab chiqaruvchilari',
           'Brand xabardorligi, 50+ yangi leed', NOW(), NOW()),
          (gen_random_uuid(), 'Telegram Bot Reklama',
           'Telegram orqali mahsulot taqdimoti va narx so''rovlari',
           'digital', 'active', 5000000, 1800000,
           'telegram', NOW() - INTERVAL '7 days', NOW() + INTERVAL '23 days',
           'SMB va o''rta korxonalar',
           '30+ yangi buyurtma', NOW(), NOW()),
          (gen_random_uuid(), 'Toshkent Savdo-Sanoat Ko''rgazmasi',
           'O''zbekiston Savdo-Sanoat palatasi ko''rgazmasida ishtirok etish',
           'event', 'completed', 8000000, 7650000,
           NULL, NOW() - INTERVAL '60 days', NOW() - INTERVAL '55 days',
           'Ishlab chiqaruvchi korxonalar va distributorlar',
           '100+ aloqa, 15+ shartnoma', NOW(), NOW())
      `);
      log("  3 ta marketing kampaniyasi qo'shildi");
    } else {
      log("  Marketing kampaniyalari allaqachon mavjud — o'tkazib yuborildi");
    }

    log("\n✓ Seed muvaffaqiyatli bajarildi!");
    log("  Tablitsalar: sd_customers, sd_leads, sd_price_formulas, sd_orders,");
    log("               sd_contracts, sd_payments, sd_manager_quotas, marketing_campaigns");

  } catch (err) {
    logErr('Seed xatolik bilan tugadi:', err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

seed();
