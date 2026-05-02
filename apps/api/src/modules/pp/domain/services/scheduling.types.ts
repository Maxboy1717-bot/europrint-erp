import { AppError } from '@common/result';

export interface Job {
  id: string;
  t1: number;
  t2: number;
}

export interface JohnsonResult {
  order: string[];
  makespan: number;
  machine1Timeline: { jobId: string; start: number; end: number }[];
  machine2Timeline: { jobId: string; start: number; end: number }[];
}

export interface Activity {
  id: string;
  duration: number;
  predecessors: string[];
}

export interface CpmActivity {
  id: string;
  duration: number;
  es: number;
  ef: number;
  ls: number;
  lf: number;
  totalFloat: number;
  isCritical: boolean;
}

export interface CpmResult {
  activities: CpmActivity[];
  criticalPath: string[];
  projectDuration: number;
}

export interface PertActivity {
  id: string;
  optimistic: number;
  mostLikely: number;
  pessimistic: number;
  predecessors: string[];
}

export interface PertResult {
  activities: (CpmActivity & { expectedDuration: number; variance: number })[];
  criticalPath: string[];
  projectDuration: number;
  projectVariance: number;
}

export interface WorkCenterLoad {
  workCenterId: string;
  arrivalRate: number;
  serviceRate: number;
}

export interface TocResult {
  bottleneck: string;
  utilization: number;
  allWorkCenters: { workCenterId: string; utilization: number }[];
  throughputIndex: number;
}

export function makeSchedErr(msg: string): AppError {
  return { code: 'VALIDATION', message: msg };
}
