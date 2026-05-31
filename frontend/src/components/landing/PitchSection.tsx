import AnimatedSection from "../common/AnimatedSection";

export default function PitchSection() {
  return (
    <AnimatedSection
      animation="zoom-in"
      delay={0}
      duration={800}
      className="block"
    >
      <section className="py-20 bg-gradient-to-r from-[#0d1117] to-[#085041] text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <AnimatedSection
            animation="fade-up"
            delay={200}
            duration={700}
            className="mb-4"
          >
            <h2 className="text-3xl font-bold">Pare de chegar despreparado.</h2>
          </AnimatedSection>

          <AnimatedSection
            animation="fade-up"
            delay={350}
            duration={600}
            className="mb-6"
          >
            <p className="opacity-90">
              A maioria dos candidatos não sabe onde estão seus gaps antes da
              entrevista. O CareerSync muda isso — com dados reais, plano
              concreto e prática guiada.
            </p>
          </AnimatedSection>

          <AnimatedSection animation="fade-up" delay={500} duration={600}>
            <a
              href="/new"
              className="inline-block bg-primary-500 text-black px-5 py-3 rounded-md font-semibold hover:bg-primary-600 transition-colors"
            >
              Quero me preparar agora
            </a>
          </AnimatedSection>
        </div>
      </section>
    </AnimatedSection>
  );
}
