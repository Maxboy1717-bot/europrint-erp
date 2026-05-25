/**
 * @module RemainingTabsTypes
 * @description Interfaces, types, and constants for RemainingTabs components.
 */

export type {
  AnalyticsStats,
  TopUser,
  CourseProgressItem,
  UserActivityItem,
  TestResultItem,
  LearningOutcomes,
  HrStats,
  AttendanceStat,
} from "./analytics-types";

export interface RemainingTabsProps {
  stats: import("./analytics-types").AnalyticsStats | undefined;
  courseProgress: import("./analytics-types").CourseProgressItem[];
  userActivity: import("./analytics-types").UserActivityItem[];
  testResults: import("./analytics-types").TestResultItem[];
  learningOutcomes: import("./analytics-types").LearningOutcomes | undefined;
  activityTrend: import("./analytics-types").UserActivityItem[];
  hrStats: import("./analytics-types").HrStats | undefined;
  attendanceStats: import("./analytics-types").AttendanceStat[];
  COLORS: string[];
}
