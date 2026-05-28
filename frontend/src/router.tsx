import { type ReactNode } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import { ContextPage } from "./pages/Context";
import { InterviewPage } from "./pages/Interview";
import { LeetCodePage } from "./pages/LeetCode";
import { PitchPage } from "./pages/Pitch";
import { RoadmapPage } from "./pages/Roadmap";
import { UploadPage } from "./pages/Upload";
import { useSession } from "./store/session";
import { Layout } from "./components/Layout";

function RequireAnalysis({ children }: { children: ReactNode }) {
  const matchScore = useSession((s) => s.matchScore);
  if (matchScore === null) return <Navigate to="/upload" replace />;
  return <>{children}</>;
}

export function AppRouter() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Navigate to="/upload" replace />} />
          <Route path="/upload" element={<UploadPage />} />

          <Route
            path="/roadmap"
            element={
              <RequireAnalysis>
                <RoadmapPage />
              </RequireAnalysis>
            }
          />

          <Route
            path="/context/:gapId"
            element={
              <RequireAnalysis>
                <ContextPage />
              </RequireAnalysis>
            }
          />

          <Route
            path="/leetcode"
            element={
              <RequireAnalysis>
                <LeetCodePage />
              </RequireAnalysis>
            }
          />

          <Route
            path="/pitch"
            element={
              <RequireAnalysis>
                <PitchPage />
              </RequireAnalysis>
            }
          />

          <Route
            path="/interview"
            element={
              <RequireAnalysis>
                <InterviewPage />
              </RequireAnalysis>
            }
          />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
