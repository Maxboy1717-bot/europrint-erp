/**
 * @module admin.tokens
 * @description Centralised import surface for DI tokens used in the admin module.
 *
 *   The canonical token values live next to their interface (e.g. `i-user.repo.ts`
 *   exports `USER_REPO = Symbol('IUserRepo')`). This barrel re-exports those
 *   Symbols so consumers can keep importing from a stable, module-scoped path
 *   (`./admin.tokens`) without caring where the Symbol is physically defined.
 *
 *   Audit P0-8: previously this file declared `USER_REPO = 'USER_REPO'` and
 *   `SETTINGS_REPO = 'SETTINGS_REPO'` as plain strings, colliding with the
 *   Symbols co-located with the interfaces. That meant `@Inject(USER_REPO)`
 *   resolved to a string while `provide: USER_REPO` in the module resolved
 *   either way depending on the import path — a silent DI failure waiting
 *   to happen. The Symbol is canonical because identity-based DI tokens are
 *   immune to accidental string collisions across modules.
 */

export { USER_REPO } from './domain/repositories/i-user.repo';
export { SETTINGS_REPO } from './domain/repositories/i-settings.repo';
