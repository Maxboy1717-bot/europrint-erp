/**
 * @module user.type
 * @description Source module. See exports for details.
 */

export interface User {
  id: string | number;
  username: string;
  name?: string;
  email?: string;
  role: string;
}
