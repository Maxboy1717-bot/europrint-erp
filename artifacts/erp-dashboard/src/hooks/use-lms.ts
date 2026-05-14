/**
 * @module use-lms
 * @description React custom hook.
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchApi } from "@/lib/utils";

export function useCourses() {
  return useQuery({
    queryKey: ["/lms/courses"],
    queryFn: () => fetchApi("/lms/courses").then(res => res.data),
  });
}

export function useCourse(id: number) {
  return useQuery({
    queryKey: ["/lms/courses", id],
    queryFn: () => fetchApi(`/lms/courses/${id}`).then(res => res.data),
    enabled: !!id,
  });
}

export function useCreateCourse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => fetchApi("/lms/courses", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/lms/courses"] }),
  });
}

export function useUpdateCourse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: number; [key: string]: unknown }) => fetchApi(`/lms/courses/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/lms/courses"] }),
  });
}

export function usePublishCourse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => fetchApi(`/lms/courses/${id}/publish`, { method: "POST" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/lms/courses"] }),
  });
}

export function useEnrollments() {
  return useQuery({
    queryKey: ["/lms/enrollments"],
    queryFn: () => fetchApi("/lms/enrollments").then(res => res.data),
  });
}

export function useCreateEnrollment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => fetchApi("/lms/enrollments", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/lms/enrollments"] }),
  });
}

export function useStartEnrollment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => fetchApi(`/lms/enrollments/${id}/start`, { method: "PUT" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/lms/enrollments"] }),
  });
}

export function useUpdateEnrollmentProgress() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, progress }: { id: number; progress: number }) => fetchApi(`/lms/enrollments/${id}/progress`, { method: "PUT", body: JSON.stringify({ progress }) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/lms/enrollments"] }),
  });
}

export function useTests() {
  return useQuery({
    queryKey: ["/lms/tests"],
    queryFn: () => fetchApi("/lms/tests").then(res => res.data),
  });
}

export function useTest(id: number) {
  return useQuery({
    queryKey: ["/lms/tests", id],
    queryFn: () => fetchApi(`/lms/tests/${id}`).then(res => res.data),
    enabled: !!id,
  });
}

export function useCreateTest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => fetchApi("/lms/tests", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/lms/tests"] }),
  });
}

export function useCreateTestQuestion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ testId, ...data }: { testId: number; [key: string]: unknown }) => fetchApi(`/lms/tests/${testId}/questions`, { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/lms/tests"] }),
  });
}

export function useStartTestAttempt() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (testId: number) => fetchApi(`/lms/tests/${testId}/attempt`, { method: "POST" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/lms/tests"] }),
  });
}

export function useCertificates() {
  return useQuery({
    queryKey: ["/lms/certificates"],
    queryFn: () => fetchApi("/lms/certificates").then(res => res.data),
  });
}

export function useCreateCertificate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => fetchApi("/lms/certificates", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/lms/certificates"] }),
  });
}

export function useRevokeCertificate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => fetchApi(`/lms/certificates/${id}/revoke`, { method: "PUT" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/lms/certificates"] }),
  });
}
