import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

const API = import.meta.env.VITE_API_URL ?? "http://127.0.0.1:8000";

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

export interface AnalysisResult extends AnalyzeResponse {
  analysisId: string;
}

export interface AnalysisCreateResponse {
  analysis_id: string;
}

export interface ResumeMeta {
  filename: string;
  content_type: string;
  url: string;
}

export interface AnalysisDetailResponse {
  job_title: string;
  job_description: string;
  resume: ResumeMeta;
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
  url: string;
  description: string;
  reason: string;
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

async function apiRequest<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Erro desconhecido." }));
    throw new Error((err as { detail: string }).detail ?? "Erro na requisição.");
  }
  return res.json() as Promise<T>;
}

export function useCreateAnalysis() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (form: FormData): Promise<AnalysisResult> => {
      const { analysis_id } = await apiRequest<AnalysisCreateResponse>(
        `${API}/analysis`,
        { method: "POST", body: form },
      );
      const summary = await apiRequest<AnalyzeResponse>(
        `${API}/analysis/${encodeURIComponent(analysis_id)}/summary`,
      );
      return { analysisId: analysis_id, ...summary };
    },
    onSuccess: ({ analysisId }) => {
      // Gera/cacheia as recomendações logo após o match — página fica instantânea.
      // Non-blocking: a página ainda funciona standalone se o prefetch falhar.
      void queryClient.prefetchQuery({
        queryKey: ["analysis-code-challenges", analysisId],
        queryFn: () =>
          apiRequest<LeetCodeProblem[]>(
            `${API}/analysis/${encodeURIComponent(analysisId)}/code-challenges`,
          ),
      });
    },
  });
}

export function useAnalysis(analysisId: string) {
  return useQuery({
    queryKey: ["analysis", analysisId],
    queryFn: () =>
      apiRequest<AnalysisDetailResponse>(
        `${API}/analysis/${encodeURIComponent(analysisId)}`,
      ),
    enabled: !!analysisId,
  });
}

export function useAnalysisRoadmap(analysisId: string) {
  return useQuery({
    queryKey: ["analysis-roadmap", analysisId],
    queryFn: () =>
      apiRequest<RoadmapTask[]>(
        `${API}/analysis/${encodeURIComponent(analysisId)}/roadmap`,
      ),
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
        `${API}/analysis/${encodeURIComponent(analysisId)}/code-challenges`,
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
      apiRequest<PitchCard[]>(
        `${API}/analysis/${encodeURIComponent(analysisId)}/pitch`,
      ),
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
        `${API}/analysis/${encodeURIComponent(analysisId)}/interview-questions`,
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
        `${API}/analysis/${encodeURIComponent(analysisId)}/evaluate-interview-answer`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        },
      ),
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
