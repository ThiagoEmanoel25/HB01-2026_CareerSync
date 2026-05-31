import { Helmet } from "react-helmet-async";
import LandingHeader from "../components/landing/LandingHeader";
import { ScrollProgressBar } from "../components/common/ScrollProgressBar";
import HeroSection from "../components/landing/HeroSection";
import StackSection from "../components/landing/StackSection";
import FeaturesSection from "../components/landing/FeaturesSection";
import HowItWorksSection from "../components/landing/HowItWorksSection";
import PitchSection from "../components/landing/PitchSection";
import FaqSection from "../components/landing/FaqSection";
import CtaSection from "../components/landing/CtaSection";
import LandingFooter from "../components/landing/LandingFooter";

export default function LandingPage() {
  return (
    <div className="bg-[#171717] text-white min-h-screen">
      <Helmet>
        <title>CareerSync — Prepare-se para entrevistas técnicas com IA</title>
        <meta
          name="description"
          content="O CareerSync analisa seu currículo, identifica seus gaps e gera um plano de estudo personalizado para você arrasar na próxima entrevista técnica."
        />
        <meta
          property="og:title"
          content="CareerSync — Preparação inteligente para entrevistas"
        />
        <meta
          property="og:description"
          content="Match score real, plano de 7 dias, LeetCode personalizado e simulador de entrevista com IA."
        />
        <meta property="og:type" content="website" />
        <meta name="robots" content="index, follow" />
      </Helmet>

      <ScrollProgressBar />
      <LandingHeader />

      <main className="mt-16">
        <HeroSection />
        <StackSection />
        <FeaturesSection />
        <HowItWorksSection />
        <PitchSection />
        <FaqSection />
        <CtaSection />
      </main>

      <LandingFooter />
    </div>
  );
}
