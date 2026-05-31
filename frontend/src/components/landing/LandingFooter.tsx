import AnimatedSection from "../common/AnimatedSection";

export default function LandingFooter() {
  return (
    <AnimatedSection animation="fade" delay={0} duration={700}>
      <footer className="bg-[#171717] text-white mt-8 border-t border-neutral-800">
        <div className="max-w-6xl mx-auto px-4 py-10 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="font-bold">CareerSync</div>
            </div>
            <div className="text-neutral-400 text-sm">
              Sincronizando você e sua vaga!
            </div>
          </div>

          <div>
            <div className="text-neutral-500 uppercase text-xs mb-2">
              Navegação
            </div>
            <div className="text-neutral-400 text-sm flex flex-col gap-1">
              <a href="#features">Funcionalidades</a>
              <a href="#how-it-works">Como funciona</a>
              <a href="#faq">FAQ</a>
            </div>
          </div>

          <div>
            <div className="text-neutral-500 uppercase text-xs mb-2">
              Equipe
            </div>
            <div className="text-neutral-400 text-sm">
              Desenvolvido no Hackathon HB01-2026 — Programadores Sem Pátria
            </div>
            <div className="text-neutral-400 text-sm mt-2">
              Felipe Torres · José Nauã · Juliecio Cedraz · Thiago Emanuel
            </div>
          </div>
        </div>

        <div className="border-t border-neutral-800 py-4 text-center text-neutral-500 text-sm">
          © 2026 CareerSync. Todos os direitos reservados.
        </div>
      </footer>
    </AnimatedSection>
  );
}
