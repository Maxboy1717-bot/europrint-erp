import { Role } from '../constants/roles.constants'

export interface JwtPayload {
  sub: number
  username: string
  email?: string
  role: Role
  departmentId?: number
  iat?: number
  exp?: number
}

export interface AuthenticatedUser {
  id: number
  sub?: number
  userId?: number
  employeeId?: number
  username: string
  email?: string
  role: Role
  firstName: string
  lastName: string
  departmentId?: number
  isActive: boolean
  lastLogin?: Date
}

export interface UserContext {
  userId: number
  username: string
  role: Role
  departmentId?: number
  permissions: string[]
}

export interface CreateUserDto {
  username: string
  email: string
  password: string
  firstName: string
  lastName: string
  role: Role
  departmentId?: number
}

export interface UpdateUserDto {
  email?: string
  firstName?: string
  lastName?: string
  departmentId?: number
  isActive?: boolean
}

export interface LoginDto {
  username: string
  password: string
}

export interface TokenResponse {
  accessToken: string
  refreshToken?: string
  expiresIn: number
  tokenType: 'Bearer'
}
