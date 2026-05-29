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
  jobDescription: string;
  resumeUrl: string;
  roadmap: RoadmapTask[];
  setAnalysis: (score: number, gaps: Gap[], summary: string) => void;
  setJobTitle: (title: string) => void;
  setJobDescription: (desc: string) => void;
  setResumeUrl: (url: string) => void;
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
      jobDescription: "",
      resumeUrl: "",
      roadmap: [],
      setAnalysis: (score, gaps, summary) => set({ matchScore: score, gaps, summary }),
      setJobTitle: (title) => set({ jobTitle: title }),
      setJobDescription: (desc) => set({ jobDescription: desc }),
      setResumeUrl: (url) => set({ resumeUrl: url }),
      setRoadmap: (tasks) => set({ roadmap: tasks }),
      reset: () =>
        set({
          sessionId: crypto.randomUUID(),
          matchScore: null,
          summary: "",
          gaps: [],
          jobTitle: "",
          jobDescription: "",
          resumeUrl: "",
          roadmap: [],
        }),
    }),
    { name: "prep-ai-session" }
  )
);
