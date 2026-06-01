import { useEffect, type ReactNode } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import { ContextPage } from "./pages/Context";
import { InterviewPage } from "./pages/Interview";
import { CodeChallengePage } from "./pages/CodeChallenge";
import { PitchPage } from "./pages/Pitch";
import { RoadmapPage } from "./pages/Roadmap";
import { NewAnalysisPage } from "./pages/NewAnalysis";
import { AnalysisSummaryPage } from "./pages/AnalysisSummary";
import { useAuth } from "./store/auth";
import { useAuthModal } from "./store/authModal";
import { Layout } from "./components/Layout";
import { AnalysisGate } from "./components/AnalysisGate";
import { AuthModal } from "./components/AuthModal";
import LandingPage from "./pages/LandingPage";

function RequireAuth({ children }: { children: ReactNode }) {
  const token = useAuth((s) => s.token);
  const show = useAuthModal((s) => s.show);

  // Sem sessão: abre o modal de login e volta pra landing (não há mais /login).
  useEffect(() => {
    if (!token) show("login");
  }, [token, show]);

  if (!token) return <Navigate to="/" replace />;
  return <>{children}</>;
}

export function AppRouter() {
  return (
    <BrowserRouter
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
    >
      <Routes>
        <Route path="/" element={<LandingPage />} />

        <Route
          element={
            <RequireAuth>
              <Layout />
            </RequireAuth>
          }
        >
          <Route path="/new" element={<NewAnalysisPage />} />

          <Route path="/analysis/:analysisId" element={<AnalysisGate />}>
            <Route path="summary" element={<AnalysisSummaryPage />} />
            <Route path="roadmap" element={<RoadmapPage />} />
            <Route path="code-challenge" element={<CodeChallengePage />} />
            <Route path="pitch" element={<PitchPage />} />
            <Route path="interview" element={<InterviewPage />} />
            <Route path="context/:gapId" element={<ContextPage />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      <AuthModal />
    </BrowserRouter>
  );
}
