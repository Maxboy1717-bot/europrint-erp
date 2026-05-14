// Recover from buggy multiline regex that shuffled identifiers between imports.
// Known canonical sources are hardcoded. Process import lines that reference
// '@shared/db' | '@common/result' | 'drizzle-orm' | '@nestjs/common' | '@nestjs/cqrs'
// — collect all identifiers across these imports for the file, then re-emit them
// from the correct source.

import fs from 'node:fs';
import { execSync } from 'node:child_process';

const SOURCES = {
  '@shared/db':     new Set(['db', 'pool', 'runQuery', 'rawSql', 'ddlRun', 'castTo', 'schema']),
  '@common/result': new Set(['Ok', 'Err', 'Result', 'safeCall', 'AppError', 'unwrapOrThrow', 'isOk', 'isErr', 'AppErr', 'fromPromise', 'okValue', 'err', 'ok']),
  'drizzle-orm':    new Set(['sql', 'SQL', 'SQLWrapper', 'eq', 'and', 'or', 'not', 'gt', 'gte', 'lt', 'lte', 'inArray', 'notInArray', 'isNull', 'isNotNull', 'desc', 'asc', 'between', 'notBetween', 'like', 'notLike', 'ilike', 'notIlike', 'exists', 'notExists', 'count', 'sum', 'avg', 'min', 'max', 'getTableColumns', 'getTableName', 'relations', 'aliasedTable']),
  '@nestjs/common': new Set(['Injectable', 'Inject', 'Logger', 'HttpException', 'HttpStatus', 'NotFoundException', 'BadRequestException', 'InternalServerErrorException', 'ForbiddenException', 'UnauthorizedException', 'ConflictException', 'Module', 'Controller', 'Get', 'Post', 'Put', 'Delete', 'Patch', 'Body', 'Param', 'Query', 'Headers', 'Req', 'Res', 'UseGuards', 'UseInterceptors', 'UsePipes', 'UseFilters', 'OnModuleInit', 'OnModuleDestroy', 'Global', 'Optional', 'forwardRef']),
  '@nestjs/cqrs':   new Set(['CommandBus', 'QueryBus', 'EventBus', 'CommandHandler', 'QueryHandler', 'EventHandler', 'ICommand', 'IQuery', 'IEvent', 'ICommandHandler', 'IQueryHandler', 'IEventHandler', 'Saga', 'CqrsModule']),
};

const ALL_KNOWN = new Map();
for (const [src, ids] of Object.entries(SOURCES)) {
  for (const id of ids) {
    if (!ALL_KNOWN.has(id)) ALL_KNOWN.set(id, src);
  }
}

const importLineRe = /^import\s*(type\s+)?\{([^}\n]+)\}\s*from\s*(['"])(@shared\/db|@common\/result|drizzle-orm|@nestjs\/common|@nestjs\/cqrs)\3\s*;?\s*$/gm;

const files = execSync(
  `grep -rlE "@shared/db|@common/result|drizzle-orm|@nestjs/common|@nestjs/cqrs" apps/api/src`,
  { encoding: 'utf8' },
).split('\n').filter(Boolean);

let fixed = 0;
for (const file of files) {
  let src = fs.readFileSync(file, 'utf8');
  const original = src;

  // Collect identifiers and their original source, then group by canonical source
  const matches = [...src.matchAll(importLineRe)];
  if (matches.length === 0) continue;

  // Build map: canonicalSource -> Set<identifier>
  const byCanon = {};
  const unknowns = {};  // src -> Set<id>
  for (const m of matches) {
    const fromSrc = m[4];
    const items = m[2].split(',').map(s => s.trim()).filter(Boolean);
    for (const item of items) {
      // Strip alias: "X as Y" → canonical "X"
      const name = item.split(/\s+as\s+/)[0].trim();
      const canon = ALL_KNOWN.get(name);
      if (canon) {
        if (!byCanon[canon]) byCanon[canon] = new Map();
        byCanon[canon].set(name, item); // keep aliased form
      } else {
        if (!unknowns[fromSrc]) unknowns[fromSrc] = new Map();
        unknowns[fromSrc].set(name, item);
      }
    }
  }

  // Build new import block
  const lines = [];
  // Preserve original ordering preference: @common/result, @nestjs/common, @nestjs/cqrs, @shared/db, drizzle-orm
  const orderedCanons = ['@common/result', '@nestjs/common', '@nestjs/cqrs', '@shared/db', 'drizzle-orm'];
  for (const canon of orderedCanons) {
    const all = new Map([...(byCanon[canon] ?? new Map())]);
    if (unknowns[canon]) {
      for (const [k, v] of unknowns[canon]) all.set(k, v);
    }
    if (all.size === 0) continue;
    const sorted = [...all.values()].sort();
    lines.push(`import { ${sorted.join(', ')} } from '${canon}';`);
  }

  // Preserve any unknown sources that weren't in our list
  for (const [s, m] of Object.entries(unknowns)) {
    if (orderedCanons.includes(s)) continue;
    const sorted = [...m.values()].sort();
    lines.push(`import { ${sorted.join(', ')} } from '${s}';`);
  }

  // Replace the contiguous block of these imports
  // Strategy: find first match and last match, replace everything between with our block
  const first = matches[0].index;
  const last = matches[matches.length - 1].index + matches[matches.length - 1][0].length;

  // Within that range, also preserve OTHER imports (not in our canon list).
  // Simpler: collect all imports in that range that AREN'T from our managed sources, keep them.
  const inRange = src.slice(first, last);
  const otherImportsInRange = [];
  const otherImportRe = /^import\s.*?from\s*(['"])([^'"]+)\1\s*;?\s*$/gm;
  let om;
  while ((om = otherImportRe.exec(inRange)) !== null) {
    const fromS = om[2];
    if (!['@shared/db', '@common/result', 'drizzle-orm', '@nestjs/common', '@nestjs/cqrs'].includes(fromS)) {
      otherImportsInRange.push(om[0]);
    }
  }

  const newBlock = [...lines, ...otherImportsInRange].join('\n');
  src = src.slice(0, first) + newBlock + src.slice(last);

  if (src !== original) {
    fs.writeFileSync(file, src);
    fixed++;
  }
}

console.log(`Fixed ${fixed}/${files.length} files`);
