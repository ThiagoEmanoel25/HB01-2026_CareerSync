import { Link } from "react-router-dom";
import HeroMockup from "./HeroMockup";
import AnimatedSection from "../common/AnimatedSection";

export default function HeroSection() {
  return (
    <section className="max-w-6xl mx-auto px-6 lg:px-6 pt-28 pb-20">
      <div className="grid lg:grid-cols-2 gap-8 items-center">
        <div>
          <AnimatedSection
            animation="fade-down"
            delay={0}
            duration={500}
            className="mb-4"
          >
            <div className="inline-flex items-center gap-2 bg-[#202020] border border-gray-700 text-gray-50 px-3 py-1 rounded-full text-sm">
              <span>⚡</span>
              <span>Powered by AI</span>
            </div>
          </AnimatedSection>

          <AnimatedSection
            animation="fade-up"
            delay={150}
            duration={700}
            className="mb-4"
          >
            <h1 className="text-3xl lg:text-4xl font-bold text-white">
              Chegue pronto para a vaga dos seus sonhos.
            </h1>
          </AnimatedSection>

          <AnimatedSection
            animation="fade-up"
            delay={300}
            duration={600}
            className="mb-6"
          >
            <p className="text-gray-400">
              O CareerSync analisa seu currículo, identifica seus gaps e monta
              um plano de estudo de 7 dias sob medida — com LeetCode
              personalizado e simulador de entrevista com feedback em tempo
              real.
            </p>
          </AnimatedSection>

          <AnimatedSection
            animation="fade-up"
            delay={450}
            duration={600}
            className="mb-2"
          >
            <div className="flex gap-3 items-center">
              <Link
                to="/new"
                className="bg-primary-500 hover:bg-primary-600 text-black px-5 py-3 rounded-md text-sm font-semibold"
              >
                Começar gratuitamente
              </Link>
              <a
                href="#how-it-works"
                className="text-sm text-primary-600 hover:underline"
              >
                Ver como funciona
              </a>
            </div>
          </AnimatedSection>

          <AnimatedSection
            animation="fade"
            delay={600}
            duration={400}
            className="text-sm text-gray-400 mt-4"
          >
            <div>
              🚀 Criado no Hackathon HB01-2026 · Programadores Sem Pátria
            </div>
          </AnimatedSection>
        </div>

        <div className="justify-center lg:justify-end hidden md:flex">
          <AnimatedSection
            animation="fade-left"
            delay={200}
            duration={800}
            className="max-w-sm min-w-0"
          >
            <HeroMockup />
          </AnimatedSection>
        </div>
      </div>
    </section>
  );
}
