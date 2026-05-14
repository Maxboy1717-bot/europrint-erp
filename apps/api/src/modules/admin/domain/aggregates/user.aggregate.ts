/**
 * @module user.aggregate
 * @description Source module. See exports for details.
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
export enum UserRole {
  SUPER_ADMIN = 'super_admin',
  DIRECTOR = 'director',
  DEPARTMENT_HEAD = 'department_head',
  ACCOUNTANT = 'accountant',
  EMPLOYEE = 'employee',
}

export interface UserAggregateData {
  id: number;
  username: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  departmentId: number | null;
  positionId: number | null;
  isActive: boolean;
  lastLogin: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export class UserAggregate {
  private id: number;
  private username: string;
  private email: string;
  private passwordHash: string;
  private role: UserRole;
  private departmentId: number | null;
  private positionId: number | null;
  private isActive: boolean;
  private lastLogin: Date | null;
  private createdAt: Date;
  private updatedAt: Date;

  constructor(data: UserAggregateData) {
    this.id = data.id;
    this.username = data.username;
    this.email = data.email;
    this.passwordHash = data.passwordHash;
    this.role = data.role;
    this.departmentId = data.departmentId;
    this.positionId = data.positionId;
    this.isActive = data.isActive;
    this.lastLogin = data.lastLogin;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
  }

  static create(
    username: string,
    email: string,
    passwordHash: string,
    role: UserRole = UserRole.EMPLOYEE,
  ): UserAggregate {
    return new UserAggregate({
      id: 0,
      username,
      email,
      passwordHash,
      role,
      departmentId: null,
      positionId: null,
      isActive: true,
      lastLogin: null,
      createdAt: _time.now(),
      updatedAt: _time.now(),
    });
  }

  getId(): number {
    return this.id;
  }

  getUsername(): string {
    return this.username;
  }

  getEmail(): string {
    return this.email;
  }

  getRole(): UserRole {
    return this.role;
  }

  getDepartmentId(): number | null {
    return this.departmentId;
  }

  getPositionId(): number | null {
    return this.positionId;
  }

  isUserActive(): boolean {
    return this.isActive;
  }

  activate(): void {
    this.isActive = true;
    this.updatedAt = _time.now();
  }

  deactivate(): void {
    this.isActive = false;
    this.updatedAt = _time.now();
  }

  changeRole(newRole: UserRole): void {
    this.role = newRole;
    this.updatedAt = _time.now();
  }

  assignDepartment(departmentId: number): void {
    this.departmentId = departmentId;
    this.updatedAt = _time.now();
  }

  assignPosition(positionId: number): void {
    this.positionId = positionId;
    this.updatedAt = _time.now();
  }

  resetPassword(newPasswordHash: string): void {
    this.passwordHash = newPasswordHash;
    this.updatedAt = _time.now();
  }

  toPersistence(): UserAggregateData {
    return {
      id: this.id,
      username: this.username,
      email: this.email,
      passwordHash: this.passwordHash,
      role: this.role,
      departmentId: this.departmentId,
      positionId: this.positionId,
      isActive: this.isActive,
      lastLogin: this.lastLogin,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
