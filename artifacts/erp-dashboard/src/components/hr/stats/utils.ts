/**
 * @module utils
 * @description React UI component.
 */

import { Employee, Assignment, Attempt, Certificate, Progress, AttendanceRecord, DisciplineRecord } from "./types";

export function useEmployeeData(id: string | undefined, assignments: Assignment[], attempts: Attempt[], certificates: Certificate[], progress: Progress[], allAttendance: AttendanceRecord[], allDisciplineRecords: DisciplineRecord[]) {
  const employeeAssignments = (Array.isArray(assignments) ? assignments : []).filter((a) => a.userId === id);
  const employeeAttempts = (Array.isArray(attempts) ? attempts : []).filter((a) => a.userId === id);
  const employeeCertificates = (Array.isArray(certificates) ? certificates : []).filter((c) => c.userId === id);
  const employeeProgress = (Array.isArray(progress) ? progress : []).filter((p) => p.userId === id);
  const employeeAttendance = (Array.isArray(allAttendance) ? allAttendance : []).filter((a) => a.userId === id);
  const employeeDisciplineRecords = (Array.isArray(allDisciplineRecords) ? allDisciplineRecords : []).filter((d) => d.userId === id);

  const completedCourses = (Array.isArray(employeeAssignments) ? employeeAssignments : []).filter((a) => a.completedAt).length;
  const passedTests = (Array.isArray(employeeAttempts) ? employeeAttempts : []).filter((a) => a.passed).length;
  const completedLessons = (Array.isArray(employeeProgress) ? employeeProgress : []).filter((p) => p.completed).length;

  const presentCount = (Array.isArray(employeeAttendance) ? employeeAttendance : []).filter((a) => a.status === "present").length;
  const absentCount = (Array.isArray(employeeAttendance) ? employeeAttendance : []).filter((a) => a.status === "absent").length;
  const lateCount = (Array.isArray(employeeAttendance) ? employeeAttendance : []).filter((a) => a.status === "late").length;

  const attendanceChartData = ([
    { name: "Kelgan", value: presentCount },
    { name: "Kelmagan", value: absentCount },
    { name: "Kechikkan", value: lateCount },
  ]).filter(d => d.value > 0);

  return {
    employeeAssignments,
    employeeAttempts,
    employeeCertificates,
    employeeProgress,
    employeeAttendance,
    employeeDisciplineRecords,
    completedCourses,
    passedTests,
    completedLessons,
    attendanceChartData,
  };
}

export const getInitials = (name: string) => {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
};

export const getStatusBadge = (status: string) => {
  switch (status) {
    case "active":
      return { variant: "default" as const, label: "Ishlamoqda" };
    case "resigned":
      return { variant: "secondary" as const, label: "Ishdan ketgan" };
    case "inactive":
      return { variant: "secondary" as const, label: "Nofaol" };
    default:
      return { variant: "secondary" as const, label: status };
  }
};

export const getAttendanceStatusBadge = (status: string) => {
  switch (status) {
    case "present":
      return { variant: "default" as const, label: "Keldi" };
    case "absent":
      return { variant: "destructive" as const, label: "Kelmadi" };
    case "late":
      return { variant: "secondary" as const, label: "Kechikdi" };
    default:
      return { variant: "secondary" as const, label: status };
  }
};

export const getDisciplineTypeBadge = (type: string) => {
  switch (type) {
    case "warning":
      return { variant: "secondary" as const, label: "Ogohlantirish" };
    case "reprimand":
      return { variant: "destructive" as const, label: "Tanbeh" };
    case "commendation":
      return { variant: "default" as const, label: "Rag'batlantirish" };
    default:
      return { variant: "secondary" as const, label: type };
  }
};

export const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
};
