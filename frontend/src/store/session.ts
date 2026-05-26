import { create } from "zustand";
import { persist } from "zustand/middleware";

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

interface SessionState {
  sessionId: string;
  matchScore: number | null;
  gaps: Gap[];
  jobTitle: string;
  roadmap: RoadmapTask[];
  setAnalysis: (score: number, gaps: Gap[]) => void;
  setJobTitle: (title: string) => void;
  setRoadmap: (tasks: RoadmapTask[]) => void;
  reset: () => void;
}

export const useSession = create<SessionState>()(
  persist(
    (set) => ({
      sessionId: crypto.randomUUID(),
      matchScore: null,
      gaps: [],
      jobTitle: "",
      roadmap: [],
      setAnalysis: (score, gaps) => set({ matchScore: score, gaps }),
      setJobTitle: (title) => set({ jobTitle: title }),
      setRoadmap: (tasks) => set({ roadmap: tasks }),
      reset: () =>
        set({
          sessionId: crypto.randomUUID(),
          matchScore: null,
          gaps: [],
          jobTitle: "",
          roadmap: [],
        }),
    }),
    { name: "prep-ai-session" }
  )
);
