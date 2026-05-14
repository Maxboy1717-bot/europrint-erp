/**
 * @module types
 * @description React page component. Route-level UI.
 */

import { BookOpen, ClipboardList, Award, Trophy, Zap, DollarSign, FileText, Star, type LucideIcon } from "lucide-react";

export interface LMSCourse {
  id: number | string;
  title?: string;
  name?: string;
  status?: string;
  isPublished?: boolean;
  category?: string;
  level?: string;
  duration?: number | string;
  enrolledCount?: number;
}

export interface LMSTest {
  id: number | string;
  title?: string;
  name?: string;
  isActive?: boolean;
  passingScore?: number;
  timeLimit?: number;
  courseId?: number | string;
}

export const URL_TAB_MAP: Record<string, string> = {
  "/lms/test-management": "tests",
  "/lms/course-author": "author",
  "/lms/operator-certification": "cert",
  "/lms/leaderboard": "leaderboard",
  "/lms/micro-learning": "micro",
  "/lms/learning-budget": "budget",
  "/lms/knowledge-base": "knowledge",
  "/lms/gamification": "gamification",
};

export const tabMeta: Record<string, { title: string; icon: LucideIcon }> = {
  "author": { title: "Kurs Muallifi", icon: BookOpen },
  "tests": { title: "Testlar", icon: ClipboardList },
  "cert": { title: "Sertifikatsiya", icon: Award },
  "leaderboard": { title: "Leaderboard", icon: Trophy },
  "micro": { title: "Micro-learning", icon: Zap },
  "budget": { title: "O'quv Byudjet", icon: DollarSign },
  "knowledge": { title: "Bilim Bazasi", icon: FileText },
  "gamification": { title: "Geymifikatsiya", icon: Star },
};
