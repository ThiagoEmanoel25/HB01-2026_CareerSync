import FeatureCard from "./FeatureCard";
import { FileText, Target, Calendar, Code, Mic, Cpu } from "lucide-react";
import AnimatedSection from "../common/AnimatedSection";

const features = [
  {
    icon: <FileText size={20} />,
    title: "Análise de Currículo",
    desc: "Faça upload do seu PDF e extraia automaticamente suas experiências, skills e histórico profissional.",
  },
  {
    icon: <Target size={20} />,
    title: "Match Score Real",
    desc: "Descubra sua aderência à vaga com um score preciso e uma lista dos gaps que você precisa cobrir.",
  },
  {
    icon: <Calendar size={20} />,
    title: "Plano de 7 Dias",
    desc: "Receba um roadmap de estudo gerado por IA, focado exatamente nos seus pontos de melhoria.",
  },
  {
    icon: <Code size={20} />,
    title: "LeetCode Personalizado",
    desc: "Pratique os problemas certos para o seu perfil, com avaliação de código e análise de complexidade.",
  },
  {
    icon: <Mic size={20} />,
    title: "Pitches STAR",
    desc: "Transforme suas experiências em respostas estruturadas e impactantes para perguntas comportamentais.",
  },
  {
    icon: <Cpu size={20} />,
    title: "Simulador de Entrevista",
    desc: "Responda perguntas em áudio e receba feedback detalhado com score por resposta.",
  },
];

export default function FeaturesSection() {
  return (
    <section id="features" className="max-w-6xl mx-auto px-4 py-20">
      <div className="text-center mb-10">
        <AnimatedSection
          animation="fade"
          delay={0}
          duration={400}
          className="mb-2"
        >
          <div className="inline-block bg-primary-500/10 text-primary-700 px-3 py-1 rounded-full text-sm">
            Funcionalidades
          </div>
        </AnimatedSection>

        <AnimatedSection
          animation="fade-up"
          delay={100}
          duration={500}
          className="mb-2"
        >
          <h2 className="text-2xl font-semibold text-white">
            Tudo que você precisa para se destacar
          </h2>
        </AnimatedSection>

        <AnimatedSection animation="fade-up" delay={200} duration={500}>
          <p className="text-neutral-300 mt-2">
            Do upload do currículo ao simulador de entrevista — em uma única
            plataforma.
          </p>
        </AnimatedSection>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {features.map((f, i) => (
          <AnimatedSection
            key={f.title}
            animation="zoom-in"
            delay={(i % 3) * 100 + Math.floor(i / 3) * 150}
            duration={500}
          >
            <FeatureCard icon={f.icon} title={f.title}>
              {f.desc}
            </FeatureCard>
          </AnimatedSection>
        ))}
      </div>
    </section>
  );
}
