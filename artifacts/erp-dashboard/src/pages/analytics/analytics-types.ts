/**
 * @module analytics-types
 * @description React page component. Route-level UI.
 */

export interface TopUser {
  userId: number;
  fullName: string;
  employeeId: string;
  completedLessons: number;
}

export interface AnalyticsStats {
  totalUsers: number;
  totalCourses: number;
  totalTests: number;
  passedTests: number;
  passRate: number;
  averageTestTime: number;
  completionRate: number;
  averageScore: number;
  topUsers: TopUser[];
  avgTestScore?: number;
  activeCourses?: number;
  completedCourses?: number;
}

export interface CourseProgressItem {
  courseId: number;
  courseTitle: string;
  enrolled: number;
  completed: number;
  completionRate: number;
}

export interface UserActivityItem {
  date: string;
  activeUsers: number;
}

export interface TestResultItem {
  testId: number;
  testTitle: string;
  totalAttempts: number;
  passRate: number;
  averageScore: number;
}

export interface LearningOutcomes {
  averageScore: number;
  completionRate: number;
  passRate: number;
  completedAssignments?: number;
  totalAssignments?: number;
  passedAttempts?: number;
  totalAttempts?: number;
  medianScore?: number;
  standardDeviation?: number;
}

export interface FunnelData {
  enrolled: number;
  started: number;
  completed: number;
  passed: number;
  assigned?: number;
  certificated?: number;
}

export interface DepartmentStat {
  departmentId: number;
  departmentName: string;
  userCount: number;
  completionRate: number;
  averageScore: number;
}

export interface PositionStat {
  positionId: number;
  positionName: string;
  userCount: number;
  completionRate: number;
  averageScore: number;
}

export interface LeaderboardEmployee {
  userId: number;
  fullName: string;
  positionName: string;
  departmentName: string;
  overallScore: number;
  completedCourses: number;
  passedTests: number;
  averageScore: number;
  totalBonus: number;
}

export interface DepartmentRanking {
  departmentId: number;
  departmentName: string;
  userCount: number;
  completedAssignments: number;
  totalAssignments: number;
  completionRate: number;
  averageScore: number;
}

export interface TopCourse {
  courseId: number;
  title: string;
  enrolled: number;
  completed: number;
  certificatesIssued: number;
  completionRate: number;
  passRate: number;
  averageScore: number;
  effectivenessScore: number;
}

export interface ActiveUsersData {
  dau: number;
  wau: number;
  mau: number;
  totalActiveUsers: number;
  dau_wau_ratio: number;
  wau_mau_ratio: number;
}

export interface RetentionData {
  day1Retention: number;
  day7Retention: number;
  day30Retention: number;
  day1Count: number;
  day7Count: number;
  day30Count: number;
  totalUsers: number;
}

export interface SessionStatsData {
  totalSessions: number;
  averageSessionDuration: number;
  sessionsPerUser: number;
  uniqueUsers: number;
}

export interface QuestionAnalysisItem {
  questionId: number;
  question: string;
  pValue: number;
  totalAttempts: number;
}

export interface DifficultyDistributionItem {
  category: string;
  count: number;
  percentage: number;
}

export interface DifficultyAnalysis {
  averageDifficulty: number;
  easiest: QuestionAnalysisItem[];
  hardest: QuestionAnalysisItem[];
}

export interface DiscriminationItem {
  questionId: number;
  question: string;
  discriminationIndex: number;
  topCorrect: number;
  bottomCorrect: number;
}

export interface DiscriminationData {
  averageDiscrimination: number;
  best: DiscriminationItem[];
  worst: DiscriminationItem[];
}

export interface ReliabilityTest {
  testId: number;
  testTitle: string;
  kr20: number;
  reliability: string;
  totalQuestions: number;
  totalAttempts: number;
}

export interface ReliabilityData {
  averageReliability: number;
  tests: ReliabilityTest[];
}

export interface ItemAnalysisData {
  totalQuestions: number;
  totalAttempts: number;
  difficultyDistribution: DifficultyDistributionItem[];
}

export interface HrStats {
  totalEmployees: number;
  activeEmployees: number;
  departments: number;
  positions: number;
  activeUsers?: number;
  inactiveUsers?: number;
  certificatesExpiringIn7Days?: number;
  totalLateRecords?: number;
  incompleteOnboardingCount?: number;
  incompleteOnboarding?: { userId: number; userName: string; hireDate: string; id?: number; step?: string }[];
}

export interface ExpiringCert {
  id: number;
  name: string;
  expiryDate: string;
  userId: number;
  userName: string;
}

export interface AttendanceStat {
  date: string;
  present: number;
  absent: number;
  late: number;
}

export interface RetakeNeeded {
  id: number;
  userId: number;
  testId: number;
  userName: string;
  testTitle: string;
}

export interface MentorInfo {
  mentorName: string;
  menteeCount: number;
}

export interface MentorshipsStats {
  total: number;
  active: number;
  completed: number;
  topMentors: MentorInfo[];
}

export interface EventTypeItem {
  type: string;
  count: number;
}

export interface EventsStats {
  total: number;
  scheduled: number;
  completed: number;
  byType: EventTypeItem[];
}

export interface ApplicationsStats {
  totalApplications: number;
  totalResponses: number;
  pendingResponses: number;
  approvedResponses: number;
  rejectedResponses: number;
}

export interface SurveysStats {
  total: number;
  active: number;
  closed: number;
  totalResponses: number;
  responseRate: number;
}

export interface BroadcastsStats {
  total: number;
  totalRecipients: number;
  totalSuccess: number;
  totalFailed: number;
  successRate: number;
}

export interface SkillCategoryItem {
  category: string;
  count: number;
}

export interface SkillsStats {
  totalSkills: number;
  totalUserSkills: number;
  verifiedSkills: number;
  byCategory: SkillCategoryItem[];
}

export interface EmployeeAnalyticsStats {
  newEmployees: number;
  departedEmployees: number;
  activeEmployees: number;
  nonParticipatingEmployees: number;
  studyingEmployees: number;
}

export interface AiAnalysis {
  analysis: string;
  generatedAt: string;
}

export interface ScoreDistribution {
  ranges: { range: string; count: number }[];
  distribution?: { name: string; value: number; [key: string]: unknown }[];
}

export interface SkillsMatrixItem {
  subject: string;
  A: number;
  B: number;
}
