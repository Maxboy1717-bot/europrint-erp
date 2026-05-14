/**
 * @module index
 * @description Barrel re-export file. Surfaces the public API of this folder.
 */

export * from "./generated/api";
export * from "./generated/api.schemas";
export { setBaseUrl, setAuthTokenGetter } from "./custom-fetch";
export type { AuthTokenGetter } from "./custom-fetch";
