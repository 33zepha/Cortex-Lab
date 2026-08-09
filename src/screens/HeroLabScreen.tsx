import LetterGlitch from "@/components/hero/LetterGlitch";

export function HeroLabScreen() {
  return (
    <main className="relative min-h-[100dvh] overflow-hidden bg-black text-white">
      <div className="absolute inset-0">
        <LetterGlitch
          glitchColors={["#1b211f", "#46534e", "#9aa8a2"]}
          glitchSpeed={72}
          centerVignette={true}
          outerVignette={false}
          smooth={true}
          characters="CORTEX0123456789<>/{}[]+-_=.:"
        />
      </div>

      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(0,0,0,0.98)_0%,rgba(0,0,0,0.88)_22%,rgba(0,0,0,0.52)_48%,rgba(0,0,0,0.12)_76%,rgba(0,0,0,0.02)_100%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_72%_48%,rgba(130,155,145,0.06),transparent_34%)]" />

      <div className="relative z-10 mx-auto flex min-h-[100dvh] max-w-[1480px] items-center px-6 py-24 sm:px-10 lg:px-16">
        <section className="max-w-[590px] lg:-translate-y-3">
          <div className="mb-7 flex items-center gap-3 text-[10px] font-semibold uppercase tracking-[0.24em] text-white/38">
            <span className="h-px w-7 bg-white/20" />
            Cortex / visual lab
          </div>
          <h1 className="max-w-[560px] text-balance text-[clamp(3rem,6.3vw,6.7rem)] font-semibold leading-[0.91] tracking-[-0.065em] text-[#f3f4f2]">
            Intelligence,<br />held in form.
          </h1>
          <p className="mt-7 max-w-[430px] text-pretty text-[15px] leading-7 text-white/46 sm:text-[16px]">
            A living operational layer that gathers models, agents and context into one coherent system.
          </p>
        </section>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-black via-black/36 to-transparent" />
    </main>
  );
}
