// Files where NestJS decorators got merged into '@common/time' import.
// Move all NestJS identifiers back to '@nestjs/common', keep only TashkentTimeService
// (and other time-related exports) in '@common/time'.

import fs from 'node:fs';
import { execSync } from 'node:child_process';

const NEST_COMMON = new Set([
  'Controller', 'Get', 'Post', 'Put', 'Delete', 'Patch', 'Body', 'Param', 'Query',
  'Headers', 'Req', 'Res', 'UseGuards', 'UseInterceptors', 'UsePipes', 'UseFilters',
  'HttpCode', 'HttpException', 'HttpStatus',
  'NotFoundException', 'BadRequestException', 'InternalServerErrorException',
  'ForbiddenException', 'UnauthorizedException', 'ConflictException',
  'Injectable', 'Inject', 'Logger', 'Module', 'Global', 'Optional', 'forwardRef',
  'OnModuleInit', 'OnModuleDestroy',
]);

const SOURCES = ['@common/time', '@common/assertions'];
const files = execSync(
  `grep -rlE "from '(${SOURCES.join('|').replace(/\//g, '\\/').replace(/@/g, '@')})'" apps/api/src`,
  { encoding: 'utf8' },
).split('\n').filter(Boolean);

let fixed = 0;
for (const file of files) {
  let src = fs.readFileSync(file, 'utf8');
  const original = src;

  // Find single-line imports from one of SOURCES
  const sourceAlt = SOURCES.map(s => s.replace(/\//g, '\\/')).join('|');
  const re = new RegExp(`^(\\s*)import\\s*\\{([^}\\n]+)\\}\\s*from\\s*['"](${sourceAlt})['"]\\s*;?\\s*$`, 'm');
  const m = src.match(re);
  if (!m) continue;

  const items = m[2].split(',').map(s => s.trim()).filter(Boolean);
  const otherOnly = items.filter(s => !NEST_COMMON.has(s));
  const nestNeed = items.filter(s => NEST_COMMON.has(s));

  if (nestNeed.length === 0) continue;

  // Rewrite original line with only non-nest identifiers
  let newTimeImport;
  if (otherOnly.length === 0) {
    newTimeImport = ''; // drop the line
  } else {
    newTimeImport = `${m[1]}import { ${otherOnly.sort().join(', ')} } from '${m[3]}';`;
  }

  // Find existing single-line @nestjs/common import and merge identifiers
  const nestRe = /^(\s*)import\s*\{([^}\n]+)\}\s*from\s*['"]@nestjs\/common['"]\s*;?\s*$/m;
  const nm = src.match(nestRe);
  if (nm) {
    const existing = nm[2].split(',').map(s => s.trim()).filter(Boolean);
    const merged = [...new Set([...existing, ...nestNeed])].sort();
    const newNest = `${nm[1]}import { ${merged.join(', ')} } from '@nestjs/common';`;
    src = src.replace(nm[0], newNest);
    src = src.replace(m[0], newTimeImport || '');
    // Remove possible empty leftover line
    src = src.replace(/\n\n\n+/g, '\n\n');
  } else {
    // No existing @nestjs/common single-line import — replace time line with two lines
    const newNestLine = `${m[1]}import { ${[...new Set(nestNeed)].sort().join(', ')} } from '@nestjs/common';`;
    src = src.replace(m[0], `${newNestLine}\n${newTimeImport}`.trim());
  }

  if (src !== original) {
    fs.writeFileSync(file, src);
    fixed++;
  }
}

console.log(`Fixed ${fixed}/${files.length} files`);
