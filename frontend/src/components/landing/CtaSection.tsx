import AnimatedSection from "../common/AnimatedSection";

export default function CtaSection() {
  return (
    <section className="py-20 bg-[#171717] text-white">
      <div className="max-w-4xl mx-auto px-4 text-center">
        <AnimatedSection
          animation="fade-up"
          delay={0}
          duration={800}
          className="mb-3"
        >
          <h2 className="text-3xl font-bold">
            Sua próxima entrevista pode ser diferente.
          </h2>
        </AnimatedSection>

        <AnimatedSection
          animation="fade-up"
          delay={200}
          duration={600}
          className="mb-6"
        >
          <p className="text-neutral-300">
            Junte-se a quem está usando IA para chegar preparado, confiante e
            com estratégia.
          </p>
        </AnimatedSection>

        <AnimatedSection
          animation="zoom-in"
          delay={400}
          duration={500}
          className="mb-3"
        >
          <a
            href="/new"
            className="inline-block bg-primary-500 text-black px-5 py-3 rounded-md font-semibold hover:bg-primary-600 transition-colors"
          >
            Criar minha conta grátis
          </a>
        </AnimatedSection>

        <AnimatedSection
          animation="fade"
          delay={550}
          duration={400}
          className="text-sm text-gray-400 mt-3"
        >
          <div>Sem cartão de crédito. Sem compromisso.</div>
        </AnimatedSection>
      </div>
    </section>
  );
}
