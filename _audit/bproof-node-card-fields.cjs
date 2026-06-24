const path=require('path');const {Pool}=require(path.join(__dirname,'..','apps','api','node_modules','pg'));
const pool=new Pool({host:'127.0.0.1',port:5432,user:'postgres',password:'postgres',database:'europrint'});
(async()=>{const c=await pool.connect();try{
const n=(await c.query(`SELECT id,name FROM org_departments WHERE node_type='position' AND is_active=true ORDER BY id LIMIT 1`)).rows[0];
await c.query('BEGIN');
await c.query(`UPDATE org_departments SET salary_type='oylik',min_salary=3000000,max_salary=5000000,rbac_tier='operator',tskp_target=100,tskp_measurement_unit='FOIZ',work_schedule='09:00-18:00',current_state='faol',bonus_config='5% reja oshsa' WHERE id=$1`,[n.id]);
const r=(await c.query(`SELECT id,name,salary_type,min_salary,max_salary,rbac_tier,tskp_target,work_schedule,current_state,bonus_config FROM org_departments WHERE id=$1`,[n.id])).rows[0];
console.log('UPDATED node-card:',JSON.stringify(r));
await c.query('ROLLBACK');
const a=(await c.query(`SELECT salary_type FROM org_departments WHERE id=$1`,[n.id])).rows[0];
console.log('ROLLBACK -> salary_type =',a.salary_type,'(unchanged null:',a.salary_type===null,')');
}catch(e){await c.query('ROLLBACK');console.error('ERR',e.message)}finally{c.release();await pool.end()}})();
