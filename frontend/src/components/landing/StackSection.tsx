const stacks = [
  "React",
  "FastAPI",
  "OpenAI",
  "Postgres",
  "Supabase",
  "Railway",
  "Vercel",
];

import AnimatedSection from "../common/AnimatedSection";

export default function StackSection() {
  return (
    <div className="bg-[#171717] py-6">
      <div className="max-w-6xl mx-auto px-4 text-center">
        <AnimatedSection
          animation="fade"
          delay={0}
          duration={400}
          className="mb-3"
        >
          <div className="text-xs text-white font-bold uppercase tracking-wide">
            Stack utilizada
          </div>
        </AnimatedSection>

        <div className="flex gap-6 items-center justify-center flex-wrap">
          {stacks.map((s, i) => (
            <AnimatedSection
              key={s}
              animation="fade-up"
              delay={i * 80}
              duration={400}
              className="text-gray-400 hover:text-primary-500"
            >
              <div>{s}</div>
            </AnimatedSection>
          ))}
        </div>
      </div>
    </div>
  );
}
