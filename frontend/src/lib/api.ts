import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useAuth, type AuthUser } from "../store/auth";

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
  relevance_level: "alta" | "media";
}

export interface StrategicQuestion {
  question: string;
  type: "cultura" | "tecnico" | "desafios";
  why_strategic: string;
}

export interface InterviewEvaluateResponse {
  clarity_1_5: number;
  star_1_5: number;
  technical_1_5: number;
  score_1_5: number;
  strengths: string[];
  improvements: string[];
  tip: string;
}

export interface InterviewSummaryResponse {
  overall_score_1_5: number;
  rounds_completed: number;
  strengths: string[];
  improvements: string[];
  final_tip: string;
}

/** Timeout padrão de uma requisição. Endpoints de IA são lentos, daí o valor alto. */
const REQUEST_TIMEOUT_MS = 60_000;

/** Erro de requisição com o status HTTP, quando disponível, para decisões de retry. */
export class ApiError extends Error {
  status?: number;
  constructor(message: string, status?: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

/** Falhas que merecem uma nova tentativa: timeout/rede ou erro 5xx do servidor. */
function isRetryable(error: unknown): boolean {
  if (error instanceof ApiError) {
    return error.status === undefined || error.status >= 500;
  }
  // Erros sem status (abort por timeout, rede offline) também são retryáveis.
  return error instanceof Error;
}

/**
 * Só repetimos requisições idempotentes (GET). Repetir POST/PUT poderia
 * duplicar efeitos colaterais (ex: criar duas análises).
 */
function isIdempotent(init?: RequestInit): boolean {
  const method = (init?.method ?? "GET").toUpperCase();
  return method === "GET" || method === "HEAD";
}

async function fetchOnce<T>(url: string, init?: RequestInit): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const res = await fetch(url, { ...init, signal: controller.signal });
    if (!res.ok) {
      const err = await res
        .json()
        .catch(() => ({ detail: "Erro desconhecido." }));
      throw new ApiError(
        (err as { detail?: string }).detail ?? "Erro na requisição.",
        res.status,
      );
    }
    return res.json() as Promise<T>;
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new ApiError("Tempo de requisição esgotado. Tente novamente.");
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

/** Injeta o header Authorization a partir do token persistido no store de auth. */
function withAuth(init?: RequestInit): RequestInit | undefined {
  const token = useAuth.getState().token;
  if (!token) return init;
  return {
    ...init,
    headers: { ...(init?.headers ?? {}), Authorization: `Bearer ${token}` },
  };
}

/**
 * Sessão expirada/ inválida: 401 numa requisição que *enviou* token significa que
 * o token não vale mais → desloga e manda para o login. Para as rotas de auth
 * (login/register, sem token) o 401 é um erro de credencial normal e não deve
 * redirecionar — vira mensagem no formulário.
 */
function maybeHandleUnauthorized(
  url: string,
  hadToken: boolean,
  error: unknown,
): void {
  if (!(error instanceof ApiError) || error.status !== 401) return;
  if (!hadToken || url.includes("/auth/")) return;
  useAuth.getState().logout();
  // Não há mais página /login: volta pra landing com o modal de login aberto
  // via query param (o store em memória se perde nesse redirect "hard").
  window.location.assign("/?auth=login");
}

/**
 * Cliente HTTP central. Única fonte de retry da aplicação: 1 nova tentativa
 * automática em timeout ou erro 5xx. As queries do React Query usam `retry: false`
 * para não duplicar tentativas. Injeta o token de auth e trata 401 globalmente.
 */
async function apiRequest<T>(url: string, init?: RequestInit): Promise<T> {
  const hadToken = useAuth.getState().token !== null;
  const authedInit = withAuth(init);
  try {
    return await fetchOnce<T>(url, authedInit);
  } catch (error) {
    if (isIdempotent(init) && isRetryable(error)) {
      try {
        return await fetchOnce<T>(url, authedInit);
      } catch (retryError) {
        maybeHandleUnauthorized(url, hadToken, retryError);
        throw retryError;
      }
    }
    maybeHandleUnauthorized(url, hadToken, error);
    throw error;
  }
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: AuthUser;
}

export interface AnalysisListItem {
  analysis_id: string;
  job_title: string;
  company_name: string | null;
  created_at: string;
  match_score: number | null;
}

function jsonBody(body: unknown): RequestInit {
  return {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  };
}

export function useRegister() {
  const setAuth = useAuth((s) => s.setAuth);
  return useMutation({
    mutationFn: (body: { email: string; password: string }) =>
      apiRequest<AuthResponse>(`${API}/auth/register`, jsonBody(body)),
    onSuccess: (data) => setAuth(data.access_token, data.user),
  });
}

export function useLogin() {
  const setAuth = useAuth((s) => s.setAuth);
  return useMutation({
    mutationFn: (body: { email: string; password: string }) =>
      apiRequest<AuthResponse>(`${API}/auth/login`, jsonBody(body)),
    onSuccess: (data) => setAuth(data.access_token, data.user),
  });
}

export function useMe() {
  const token = useAuth((s) => s.token);
  return useQuery({
    queryKey: ["me"],
    queryFn: () => apiRequest<AuthUser>(`${API}/auth/me`),
    enabled: !!token,
    retry: false,
    staleTime: Infinity,
  });
}

export function useAnalysisList() {
  const token = useAuth((s) => s.token);
  return useQuery({
    queryKey: ["analysis-list"],
    queryFn: () => apiRequest<AnalysisListItem[]>(`${API}/analysis`),
    enabled: !!token,
    retry: false,
  });
}

export function useAnalysisSummary(analysisId: string) {
  return useQuery({
    queryKey: ["analysis-summary", analysisId],
    queryFn: () =>
      apiRequest<AnalyzeResponse>(
        `${API}/analysis/${encodeURIComponent(analysisId)}/summary`,
      ),
    enabled: !!analysisId,
    retry: false,
    staleTime: Infinity,
  });
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
      // Nova análise entra no histórico server-side — invalida a lista.
      void queryClient.invalidateQueries({ queryKey: ["analysis-list"] });
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

export function useStrategicQuestions(analysisId: string) {
  return useQuery({
    queryKey: ["analysis-strategic-questions", analysisId],
    queryFn: () =>
      apiRequest<StrategicQuestion[]>(
        `${API}/analysis/${encodeURIComponent(analysisId)}/strategic-questions`,
      ),
    enabled: !!analysisId,
    retry: false,
    staleTime: Infinity,
  });
}

export function useRegenerateStrategicQuestions(analysisId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () =>
      apiRequest<StrategicQuestion[]>(
        `${API}/analysis/${encodeURIComponent(analysisId)}/strategic-questions?refresh=true`,
      ),
    onSuccess: (data) => {
      queryClient.setQueryData(
        ["analysis-strategic-questions", analysisId],
        data,
      );
    },
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
      round: number;
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

/**
 * Busca o resumo final consolidado das rodadas da entrevista. Disparado sob
 * demanda (enabled) ao término da simulação — o backend gera sem cache.
 */
export function useInterviewSummary(analysisId: string, enabled: boolean) {
  return useQuery({
    queryKey: ["interview-summary", analysisId],
    queryFn: () =>
      apiRequest<InterviewSummaryResponse>(
        `${API}/analysis/${analysisId}/interview-summary`
      ),
    enabled: !!analysisId && enabled,
    retry: false,
    staleTime: Infinity,
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

export function useInterviewTTS() {
  return useMutation({
    mutationFn: async (body: {
      question_text: string;
      voice?: "alloy" | "nova";
    }): Promise<ArrayBuffer> => {
      const token = useAuth.getState().token;
      const res = await fetch(`${API}/interview/tts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
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
