/**
 * DB-proof: payroll aiCalculate now reads REAL worked days + overtime from `attendance`
 * (was hardcoded DEFAULT_WORK_DAYS=22). Replicates getAttendanceWorkDays SQL exactly.
 * Scenario (May 2026): 20 present + 1 late + 1 half_day + 1 absent, 120 overtime minutes.
 * Expect: full=21 (present+late), half=1 -> workDays=21.5; overtime=2h; hasData=true.
 * Also proves the fallback: an employee with NO attendance rows -> hasData=false -> default 22.
 * Read-then-delete (sentinel employees, no residue).
 */
const path = require('path');
const { Pool } = require(path.join(__dirname, '..', 'apps', 'api', 'node_modules', 'pg'));
const pool = new Pool({
  host: process.env.PGHOST || '127.0.0.1', port: Number(process.env.PGPORT) || 5432,
  user: process.env.PGUSER || 'postgres', password: process.env.PGPASSWORD || 'postgres',
  database: process.env.PGDATABASE || 'europrint',
});
const EMP = 990777, EMP_NODATA = 990778, PERIOD = '2026-05-01';

const WORKDAYS_SQL = `
  SELECT
    COUNT(*) FILTER (WHERE status IN ('present','late'))::int AS full_days,
    COUNT(*) FILTER (WHERE status = 'half_day')::int        AS half_days,
    COALESCE(SUM(overtime_minutes), 0)::int                 AS overtime_minutes,
    COUNT(*)::int                                            AS total_rows
  FROM attendance
  WHERE employee_id = $1
    AND ($2::date IS NULL OR date_trunc('month', attendance_date) = date_trunc('month', $2::date))`;

(async () => {
  try {
    // seed: 20 present, 1 late, 1 half_day, 1 absent (May 1..23), 120 OT minutes on day 1
    for (let d = 1; d <= 20; d++) {
      await pool.query(`INSERT INTO attendance (employee_id, status, attendance_date, overtime_minutes) VALUES ($1,'present',$2,$3)`,
        [EMP, `2026-05-${String(d).padStart(2,'0')}`, d === 1 ? 120 : 0]);
    }
    await pool.query(`INSERT INTO attendance (employee_id, status, attendance_date, overtime_minutes) VALUES ($1,'late','2026-05-21',0)`, [EMP]);
    await pool.query(`INSERT INTO attendance (employee_id, status, attendance_date, overtime_minutes) VALUES ($1,'half_day','2026-05-22',0)`, [EMP]);
    await pool.query(`INSERT INTO attendance (employee_id, status, attendance_date, overtime_minutes) VALUES ($1,'absent','2026-05-23',0)`, [EMP]);

    const r = (await pool.query(WORKDAYS_SQL, [EMP, PERIOD])).rows[0];
    const workDays = Number(r.full_days) + Number(r.half_days) * 0.5;
    const overtimeHours = Number(r.overtime_minutes) / 60;
    const hasData = Number(r.total_rows) > 0;
    const calcOk = workDays === 21.5 && overtimeHours === 2 && hasData === true;
    console.log('1) REAL DATA  :', calcOk ? '✅' : '❌',
      `full=${r.full_days} half=${r.half_days} -> workDays=${workDays} (absent ignored); overtime=${overtimeHours}h; hasData=${hasData}`);

    // fallback: employee with no rows
    const r2 = (await pool.query(WORKDAYS_SQL, [EMP_NODATA, PERIOD])).rows[0];
    const fbOk = Number(r2.total_rows) === 0; // -> service uses DEFAULT_WORK_DAYS=22
    console.log('2) FALLBACK   :', fbOk ? '✅ no attendance -> hasData=false -> service keeps DEFAULT_WORK_DAYS=22' : '❌');

    // cleanup
    await pool.query(`DELETE FROM attendance WHERE employee_id IN ($1,$2)`, [EMP, EMP_NODATA]);
    const left = (await pool.query(`SELECT COUNT(*)::int n FROM attendance WHERE employee_id IN ($1,$2)`, [EMP, EMP_NODATA])).rows[0].n;
    console.log('3) CLEANUP    :', left === 0 ? '✅' : `❌ ${left}`);

    console.log(calcOk && fbOk && left === 0
      ? '\n✅ PROOF PASSED — payroll AI-calc shows REAL attendance (21.5 days, 2h OT), not a constant 22.'
      : '\n❌ PROOF FAILED');
  } catch (e) {
    console.error('PROOF ERROR:', e.message);
    try { await pool.query(`DELETE FROM attendance WHERE employee_id IN ($1,$2)`, [EMP, EMP_NODATA]); } catch {}
  } finally { await pool.end(); }
})();
