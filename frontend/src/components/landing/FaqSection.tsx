import FaqItem from "./FaqItem";
import AnimatedSection from "../common/AnimatedSection";

const faqs = [
  {
    q: "O CareerSync é gratuito?",
    a: "Sim, a plataforma foi desenvolvida para o Hackathon HB01-2026 e está disponível gratuitamente para acesso e avaliação.",
  },
  {
    q: "Quais formatos de currículo são aceitos?",
    a: "Aceitamos arquivos em PDF. A IA extrai o texto automaticamente para análise.",
  },
  {
    q: "Os problemas do LeetCode são atualizados?",
    a: "As sugestões são geradas dinamicamente pela IA com base nos seus gaps e perfil, garantindo relevância para cada candidato.",
  },
  {
    q: "Posso usar para qualquer vaga de tecnologia?",
    a: "Sim. Basta colar a descrição da vaga desejada — o sistema se adapta ao perfil exigido, independentemente da stack ou nível.",
  },
];

export default function FaqSection() {
  return (
    <section id="faq" className="py-20">
      <div className="max-w-3xl mx-auto px-4">
        <div className="text-center mb-8">
          <AnimatedSection animation="fade-up" delay={0} duration={400}>
            <h2 className="text-2xl font-semibold text-white">
              Perguntas frequentes
            </h2>
          </AnimatedSection>
        </div>

        <div className="space-y-2">
          {faqs.map((f, i) => (
            <AnimatedSection
              key={f.q}
              animation="fade-up"
              delay={i * 100}
              duration={500}
            >
              <FaqItem question={f.q} answer={f.a} />
            </AnimatedSection>
          ))}
        </div>
      </div>
    </section>
  );
}
