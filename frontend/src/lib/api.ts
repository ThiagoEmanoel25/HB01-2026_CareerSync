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

// ── Novo contrato /analysis ───────────────────────────────────────────────────

export interface AnalysisResult extends AnalyzeResponse {
  analysisId: string;
}

/**
 * Cria a análise (POST /analysis → analysis_id) e em seguida busca o summary
 * (GET /analysis/{id}/summary, que dispara a LLM no backend). Combina os dois
 * passos num único fluxo para a tela de Nova Análise.
 */
export function useCreateAnalysis() {
  return useMutation({
    mutationFn: async (form: FormData): Promise<AnalysisResult> => {
      const { analysis_id } = await apiRequest<{ analysis_id: string }>(
        `${API}/analysis`,
        { method: "POST", body: form }
      );
      const summary = await apiRequest<AnalyzeResponse>(
        `${API}/analysis/${analysis_id}/summary`
      );
      return { analysisId: analysis_id, ...summary };
    },
  });
}

/**
 * Busca o roadmap da análise. O backend gera sob demanda na primeira chamada
 * (cache-or-generate) e devolve do cache nas seguintes.
 */
export function useAnalysisRoadmap(analysisId: string) {
  return useQuery({
    queryKey: ["analysis-roadmap", analysisId],
    queryFn: () =>
      apiRequest<RoadmapTask[]>(`${API}/analysis/${analysisId}/roadmap`),
    enabled: !!analysisId,
    retry: false,
    staleTime: Infinity,
  });
}

export function useAnalysisCodeChallenges(analysisId: string) {
  return useQuery({
    queryKey: ["analysis-code-challenges", analysisId],
    queryFn: () =>
      apiRequest<LeetCodeProblem[]>(
        `${API}/analysis/${analysisId}/code-challenges`
      ),
    enabled: !!analysisId,
    retry: false,
    staleTime: Infinity,
  });
}

export function useAnalysisPitch(analysisId: string) {
  return useQuery({
    queryKey: ["analysis-pitch", analysisId],
    queryFn: () =>
      apiRequest<PitchCard[]>(`${API}/analysis/${analysisId}/pitch`),
    enabled: !!analysisId,
    retry: false,
    staleTime: Infinity,
  });
}

export function useAnalysisInterviewQuestions(analysisId: string) {
  return useQuery({
    queryKey: ["analysis-interview-questions", analysisId],
    queryFn: () =>
      apiRequest<{ questions: string[] }>(
        `${API}/analysis/${analysisId}/interview-questions`
      ),
    enabled: !!analysisId,
    retry: false,
    staleTime: Infinity,
  });
}

export function useEvaluateInterviewAnswer(analysisId: string) {
  return useMutation({
    mutationFn: (body: {
      question: string;
      transcript: string;
      gaps: string[];
    }) =>
      apiRequest<InterviewEvaluateResponse>(
        `${API}/analysis/${analysisId}/evaluate-interview-answer`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }
      ),
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
      analysis_id: string;
      slug: string;
      title: string;
      description: string;
      solution: string;
      language: string;
    }) =>
      apiRequest<LeetCodeEvaluateResponse>(`${API}/evaluate-solution`, {
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

export function useInterviewTTS() {
  return useMutation({
    mutationFn: async (body: {
      question_text: string;
      voice?: "alloy" | "nova";
    }): Promise<ArrayBuffer> => {
      const res = await fetch(`${API}/interview/tts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ voice: "alloy", ...body }),
      });
      if (!res.ok || !res.body) {
        const err = await res
          .json()
          .catch(() => ({ detail: "Falha ao gerar o áudio." }));
        throw new Error((err as { detail: string }).detail ?? "Falha no TTS.");
      }

      // Consome o ReadableStream chunk a chunk e remonta num único ArrayBuffer,
      // pronto para AudioContext.decodeAudioData().
      const reader = res.body.getReader();
      const chunks: Uint8Array[] = [];
      let total = 0;
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
        total += value.length;
      }
      const merged = new Uint8Array(total);
      let offset = 0;
      for (const chunk of chunks) {
        merged.set(chunk, offset);
        offset += chunk.length;
      }
      return merged.buffer;
    },
  });
}
