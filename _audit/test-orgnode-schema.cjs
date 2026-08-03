/**
 * READ-ONLY validation test (no auth, no HTTP, no DB write).
 * Reproduces the EXACT OrgNodeSchema from org-structure.controller.ts:30-37
 * and parses the EXACT body AddNodeDialog.tsx:54-61 sends.
 * Proves whether the .strict() schema accepts or rejects the FE create payload.
 */
// Resolve zod exactly as the api app (and thus the controller) resolves it.
const { createRequire } = require('module');
const apiRequire = createRequire(require('path').resolve(__dirname, '../apps/api/package.json'));
const zmod = apiRequire('zod');
const z = zmod.z || zmod;
const zodVersion = apiRequire('zod/package.json').version;

// --- VERBATIM from org-structure.controller.ts OrgNodeSchema AFTER STEP B fix ---
const OrgNodeSchema = z.object({
  name:        z.string().max(500).optional(),
  nameRu:      z.string().max(500).optional(),
  nodeType:    z.string().max(50).optional(),
  tskp:        z.string().max(500).optional(),
  tskpRu:      z.string().max(500).optional(),
  color:       z.string().max(20).optional(),
  parentId:    z.union([z.string(), z.number()]).nullable().optional(),
  positionId:  z.union([z.string(), z.number()]).optional(),
  description: z.string().max(2000).optional(),
  level:       z.union([z.string(), z.number()]).nullable().optional(),
  headUserId:  z.union([z.number(), z.null()]).optional(),
}).strict();

// --- VERBATIM shape from AddNodeDialog.tsx:54-61 (what the FE POSTs) ---
const feCreateBody = {
  name: 'TEST-DRIFT-PROBE',
  nameRu: 'ТЕСТ',
  nodeType: 'department',
  tskp: 'asosiy vazifa',
  parentId: null,
  level: 0,
};

// --- shape from EditDialog AFTER STEP C (now also sends headUserId) ---
const feEditBody = {
  name: 'TEST', nameRu: 'ТЕСТ', color: '#3b82f6',
  tskp: 'x', tskpRu: 'y', description: 'z', nodeType: 'department', headUserId: 5,
};
const feEditClearHead = { name: 'TEST', headUserId: null };

function run(label, schema, body) {
  const r = schema.safeParse(body);
  if (r.success) {
    console.log(`[${label}] ACCEPTED (parsed) ->`, JSON.stringify(r.data));
  } else {
    const issues = r.error.issues.map(i => `${i.code}${i.keys ? ' ['+i.keys.join(', ')+']' : ''}: ${i.message}`);
    console.log(`[${label}] REJECTED ->`, issues.join(' | '));
  }
}

console.log('zod version (as apps/api resolves):', zodVersion);
run('CREATE (AddNodeDialog body)', OrgNodeSchema, feCreateBody);
run('UPDATE (EditDialog body + head)', OrgNodeSchema.partial(), feEditBody);
run('UPDATE (clear head -> null)', OrgNodeSchema.partial(), feEditClearHead);
