import { useMutation, useQuery } from "@tanstack/react-query";

const API = import.meta.env.VITE_API_URL as string;

// ── Types ─────────────────────────────────────────────────────────────────────

export interface Gap {
  id: string;
  skill: string;
  level: "critical" | "moderate";
  reason: string;
}

export interface AnalyzeResponse {
  match_score: number;
  gaps: Gap[];
  summary: string;
}

export interface RoadmapTask {
  day: number;
  gap_id: string;
  task: string;
  minutes: number;
  category: "conceito" | "pratica" | "revisao";
}

export interface ContextResponse {
  title: string;
  definition: string;
  relevance: string;
  how_to_show: string;
}

export interface LeetCodeProblem {
  slug: string;
  title: string;
  difficulty: "Easy" | "Medium" | "Hard";
  category: string;
  reason: string;
}

export interface LeetCodeEvaluateResponse {
  correct: boolean;
  time_complexity: string;
  space_complexity: string;
  strengths: string[];
  improvements: string[];
  optimal_hint: string;
}

export interface PitchCard {
  project: string;
  situation: string;
  task: string;
  action: string;
  result: string;
  vaga_connection: string;
  relevance: string;
}

export interface InterviewEvaluateResponse {
  score_1_5: number;
  strengths: string[];
  improvements: string[];
  tip: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

async function apiRequest<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Erro desconhecido." }));
    throw new Error((err as { detail: string }).detail ?? "Erro na requisição.");
  }
  return res.json() as Promise<T>;
}

// ── Hooks ─────────────────────────────────────────────────────────────────────

export function useAnalyze() {
  return useMutation({
    mutationFn: (form: FormData) =>
      apiRequest<AnalyzeResponse>(`${API}/analyze/`, { method: "POST", body: form }),
  });
}

export function useGenerateRoadmap() {
  return useMutation({
    mutationFn: (body: { session_id: string; gaps: Gap[]; job_title: string }) =>
      apiRequest<RoadmapTask[]>(`${API}/roadmap`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }),
  });
}

export function useGetRoadmap(sessionId: string) {
  return useQuery({
    queryKey: ["roadmap", sessionId],
    queryFn: () => apiRequest<RoadmapTask[]>(`${API}/roadmap/${sessionId}`),
    enabled: !!sessionId,
    retry: false,
  });
}

export function useContext(gapId: string) {
  return useQuery({
    queryKey: ["context", gapId],
    queryFn: () => apiRequest<ContextResponse>(`${API}/context/${encodeURIComponent(gapId)}`),
    staleTime: Infinity,
    enabled: !!gapId,
  });
}

export function useLeetCodeProblems(stack: string, seniority: string, gaps: string) {
  return useQuery({
    queryKey: ["leetcode", stack, seniority, gaps],
    queryFn: () => {
      const params = new URLSearchParams({ stack, seniority, gaps });
      return apiRequest<LeetCodeProblem[]>(`${API}/leetcode/?${params}`);
    },
    staleTime: Infinity,
    enabled: !!stack && !!gaps,
  });
}

export function useEvaluateSolution() {
  return useMutation({
    mutationFn: (body: {
      slug: string;
      title: string;
      description: string;
      solution: string;
      language: string;
    }) =>
      apiRequest<LeetCodeEvaluateResponse>(`${API}/leetcode/evaluate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }),
  });
}

export function useGeneratePitch() {
  return useMutation({
    mutationFn: (body: { candidate_json: object; job_json: object }) =>
      apiRequest<PitchCard[]>(`${API}/pitch/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }),
  });
}

export function useStartInterview() {
  return useMutation({
    mutationFn: (body: { gaps: string[]; session_id: string }) =>
      apiRequest<{ questions: string[] }>(`${API}/interview/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }),
  });
}

export function useEvaluateAnswer() {
  return useMutation({
    mutationFn: (body: {
      question: string;
      transcript: string;
      gaps: string[];
      round: number;
    }) =>
      apiRequest<InterviewEvaluateResponse>(`${API}/interview/evaluate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }),
  });
}
