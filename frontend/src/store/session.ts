import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

import { useProgress } from "./progress";

export interface Gap {
  id: string;
  skill: string;
  level: "critical" | "moderate";
  reason: string;
}

export interface RoadmapTask {
  day: number;
  gap_id: string;
  task: string;
  minutes: number;
  category: "conceito" | "pratica" | "revisao";
}

export interface HistoryItem {
  sessionId: string;
  matchScore: number | null;
  summary: string;
  gaps: Gap[];
  jobTitle: string;
  jobDescription: string;
  fileName: string;
  roadmap: RoadmapTask[];
}

interface SessionState {
  sessionId: string;
  matchScore: number | null;
  summary: string;
  gaps: Gap[];
  jobTitle: string;
  jobDescription: string;
  fileName: string;
  roadmap: RoadmapTask[];

  history: HistoryItem[];

  setAnalysis: (score: number, gaps: Gap[], summary: string) => void;
  setJobTitle: (title: string) => void;
  setJobDescription: (desc: string) => void;
  setFileName: (name: string) => void;
  setRoadmap: (tasks: RoadmapTask[]) => void;

  saveFullSession: (data: {
    score: number;
    gaps: Gap[];
    summary: string;
    jobTitle: string;
    jobDescription: string;
    fileName: string;
  }) => void;
  loadSession: (sessionId: string) => void;
  reset: () => void;
}

export const useSession = create<SessionState>()(
  persist(
    (set) => ({
      sessionId: crypto.randomUUID(),
      matchScore: null,
      summary: "",
      gaps: [],
      jobTitle: "",
      jobDescription: "",
      fileName: "",
      roadmap: [],
      history: [],

      setAnalysis: (score, gaps, summary) =>
        set({ matchScore: score, gaps, summary }),
      setJobTitle: (title) => set({ jobTitle: title }),
      setJobDescription: (desc) => set({ jobDescription: desc }),
      setFileName: (name) => set({ fileName: name }),

      setRoadmap: (tasks) =>
        set((state) => {
          const historyList = state.history || [];
          const updatedHistory = historyList.map((item) =>
            item.sessionId === state.sessionId
              ? { ...item, roadmap: tasks }
              : item
          );
          return { roadmap: tasks, history: updatedHistory };
        }),

      saveFullSession: (data) =>
        set((state) => {
          const newHistoryItem: HistoryItem = {
            sessionId: state.sessionId,
            matchScore: data.score,
            gaps: data.gaps,
            summary: data.summary,
            jobTitle: data.jobTitle,
            jobDescription: data.jobDescription,
            fileName: data.fileName,
            roadmap: state.roadmap,
          };

          const historyList = state.history || [];
          const exists = historyList.some(
            (item) => item.sessionId === state.sessionId
          );

          const updatedHistory = exists
            ? historyList.map((item) =>
                item.sessionId === state.sessionId ? newHistoryItem : item
              )
            : [newHistoryItem, ...historyList];

          return {
            matchScore: data.score,
            gaps: data.gaps,
            summary: data.summary,
            jobTitle: data.jobTitle,
            jobDescription: data.jobDescription,
            fileName: data.fileName,
            history: updatedHistory,
          };
        }),

      loadSession: (id) =>
        set((state) => {
          const historyList = state.history || [];
          const target = historyList.find((item) => item.sessionId === id);
          if (!target) return {};
          return {
            sessionId: target.sessionId,
            matchScore: target.matchScore,
            summary: target.summary,
            gaps: target.gaps,
            jobTitle: target.jobTitle,
            jobDescription: target.jobDescription,
            fileName: target.fileName,
            roadmap: target.roadmap,
          };
        }),

      reset: () =>
        set((state) => {
          const prevSessionId = state.sessionId;
          useProgress.getState().resetProgress(prevSessionId);
          return {
            sessionId: crypto.randomUUID(),
            matchScore: null,
            summary: "",
            gaps: [],
            jobTitle: "",
            jobDescription: "",
            fileName: "",
            roadmap: [],
            history: state.history || [],
          };
        }),
    }),
    {
      name: "prep-ai-session",
      storage: createJSONStorage(() => localStorage),
    }
  )
);
