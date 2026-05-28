import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface Gap {
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

interface SessionState {
  sessionId: string;
  matchScore: number | null;
  summary: string;
  gaps: Gap[];
  jobTitle: string;
  roadmap: RoadmapTask[];
  setAnalysis: (score: number, gaps: Gap[], summary: string) => void;
  setJobTitle: (title: string) => void;
  setRoadmap: (tasks: RoadmapTask[]) => void;
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
      roadmap: [],
      setAnalysis: (score, gaps, summary) => set({ matchScore: score, gaps, summary }),
      setJobTitle: (title) => set({ jobTitle: title }),
      setRoadmap: (tasks) => set({ roadmap: tasks }),
      reset: () =>
        set({
          sessionId: crypto.randomUUID(),
          matchScore: null,
          summary: "",
          gaps: [],
          jobTitle: "",
          roadmap: [],
        }),
    }),
    { name: "prep-ai-session" }
  )
);
