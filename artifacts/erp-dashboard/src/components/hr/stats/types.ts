export interface Subordinate {
  id: string;
  fullName: string;
  profileImageUrl?: string;
  positionName?: string;
  departmentName?: string;
}

export interface Employee {
  id: string;
  fullName: string;
  profileImageUrl?: string;
  departmentName?: string;
  positionName?: string;
  status: string;
  employeeId?: string;
  phone?: string;
  birthDate?: string;
  address?: string;
  rating: number;
  failedTests: number;
  bonusAmount: number;
  positionOfficialTitle?: string;
  positionCkp?: string;
  managerName?: string;
  managerProfileImageUrl?: string;
  managerEmployeeId?: string;
  subordinates?: Subordinate[];
  // Personal info fields for EditPersonalInfoDialog
  age?: number | string;
  gender?: string;
  childrenCount?: number;
  maritalStatus?: string;
  childrenEducation?: string;
  householdSize?: number;
  householdMembers?: string;
  housingType?: string;
}

export interface Assignment {
  id: string;
  userId: string;
  courseName?: string;
  assignedAt?: string;
  dueAt?: string;
  completedAt?: string | null;
}

export interface Attempt {
  id: string;
  userId: string;
  score: number;
  passed: boolean;
}

export interface Certificate {
  id: string;
  userId: string;
  certificateNumber: string;
  courseName?: string;
  issuedAt?: string;
  bonusAmount?: number;
  score?: number;
}

export interface Progress {
  id: string;
  userId: string;
  completed: boolean;
}

export interface AttendanceRecord {
  id: string;
  userId: string;
  date: string;
  status: string;
  notes?: string;
}

export interface DisciplineRecord {
  id: string;
  userId: string;
  date: string;
  type: string;
  description?: string;
  issuedByName?: string;
}

export interface EmployeeFile {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  filePath: string;
  description?: string;
  createdAt: string;
}

export interface AbcAnalysis {
  id: string;
  grade: string;
  score: number;
  testPassRate?: number;
  courseCompletionRate?: number;
  performanceRate?: number;
  attendanceRate?: number;
  disciplineScore?: number;
  taskCompletionRate?: number;
  punctualityRate?: number;
  initiativeCount?: number;
  benefits?: unknown[];
  notes?: string;
  lastCalculated?: string;
  [key: string]: unknown;
}
