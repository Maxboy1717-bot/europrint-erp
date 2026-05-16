/**
 * Runtime CJS shim — required because apps/api/tsconfig.json `paths` maps
 * `@workspace/db` to `../../lib/db/src/index.ts`, and SWC bakes that path
 * into the compiled output as `require("../../../../../../lib/db/src")`.
 *
 * Node can't `require` a `.ts` file, so without this `.js` sibling Node
 * resolves the directory and finds no entrypoint → MODULE_NOT_FOUND.
 *
 * This file simply forwards the require to the compiled CJS bundle that
 * `pnpm --filter @workspace/db run build` produces.
 *
 * If you ever change tsconfig paths to point at `dist/cjs/index.js` directly,
 * or remove the `@workspace/db` path mapping entirely (letting Node use the
 * package.json `exports.require` field), this shim becomes unnecessary.
 */
module.exports = require('../dist/cjs/index.js');
