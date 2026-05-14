/**
 * @module lms
 * @description Frontend utility / library module.
 */

import { apiRequest } from "@/lib/queryClient";

export const lmsApi = {
  updateCourse: (id: number | string, data: Record<string, unknown>) =>
    apiRequest("PUT", `/api/courses/${id}`, data),
  createKnowledgeBase: (data: Record<string, unknown>) =>
    apiRequest("POST", "/api/knowledge-base", data),
  updateKnowledgeBase: (id: number | string, data: Record<string, unknown>) =>
    apiRequest("PUT", `/api/knowledge-base/${id}`, data),
  patchKnowledgeBase: (id: number | string, data: Record<string, unknown>) =>
    apiRequest("PATCH", `/api/knowledge-base/${id}`, data),
  deleteKnowledgeBase: (id: number | string) =>
    apiRequest("DELETE", `/api/knowledge-base/${id}`),
  uploadKnowledgeBase: (data: Record<string, unknown>) =>
    apiRequest("POST", "/api/knowledge-base/upload", data),
  createLesson: (data: Record<string, unknown>) =>
    apiRequest("POST", "/api/lessons", data),
  updateLesson: (id: number | string, data: Record<string, unknown>) =>
    apiRequest("PUT", `/api/lessons/${id}`, data),
  viewMicroModule: (id: number | string) =>
    apiRequest("POST", `/api/micro-modules/${id}/view`),
  updateQuestionnaireQuestion: (id: number | string, data: Record<string, unknown>) =>
    apiRequest("PUT", `/api/questionnaire/questions/${id}`, data),
  submitQuestionnaireResponse: (data: Record<string, unknown>) =>
    apiRequest("POST", "/api/questionnaire/responses", data),
  createQuestionnaire: (data: Record<string, unknown>) =>
    apiRequest("POST", "/api/questionnaire", data),
  updateQuestionnaire: (id: number | string, data: Record<string, unknown>) =>
    apiRequest("PUT", `/api/questionnaire/${id}`, data),
  deleteQuestionnaire: (id: number | string) =>
    apiRequest("DELETE", `/api/questionnaire/${id}`),
  updateTest: (id: number | string, data: Record<string, unknown>) =>
    apiRequest("PUT", `/api/tests/${id}`, data),
  updateTestQuestion: (questionId: number | string, data: Record<string, unknown>) =>
    apiRequest("PUT", `/api/tests/${questionId}`, data),
};
