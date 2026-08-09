import LetterGlitch from "@/components/hero/LetterGlitch";

export function HeroLabScreen() {
  return (
    <main className="relative min-h-[112dvh] overflow-hidden bg-black text-white sm:min-h-[108dvh] lg:min-h-[104dvh]">
      <div className="absolute inset-0">
        <LetterGlitch
          glitchColors={["#161c1a", "#394841", "#8b9b93"]}
          glitchSpeed={104}
          centerVignette={true}
          outerVignette={false}
          smooth={true}
          characters="CORTEX0123456789<>/{}[]+-_=.:"
        />
      </div>

      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(0,0,0,0.42)_0%,rgba(0,0,0,0.12)_31%,rgba(0,0,0,0.00)_58%,rgba(0,0,0,0.04)_100%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_73%_50%,rgba(128,151,141,0.025),transparent_47%)]" />

      <div className="relative z-10 mx-auto flex min-h-[112dvh] max-w-[1560px] items-end px-6 pb-[12dvh] pt-24 sm:min-h-[108dvh] sm:items-center sm:px-10 sm:py-24 lg:min-h-[104dvh] lg:px-14 xl:px-16">
        <section className="max-w-[510px] sm:max-w-[500px] lg:-translate-y-4 lg:max-w-[470px]">
          <div className="mb-6 flex items-center gap-3 text-[10px] font-semibold uppercase tracking-[0.24em] text-white/36">
            <span className="h-px w-7 bg-white/18" />
            Cortex / visual lab
          </div>
          <h1 className="max-w-[500px] text-balance text-[clamp(2.9rem,5.2vw,5.8rem)] font-semibold leading-[0.92] tracking-[-0.06em] text-[#f3f4f2]">
            Intelligence,<br />held in form.
          </h1>
          <p className="mt-6 max-w-[390px] text-pretty text-[14px] leading-7 text-white/44 sm:text-[15px]">
            A living operational layer that gathers models, agents and context into one coherent system.
          </p>
        </section>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black via-black/22 to-transparent" />
    </main>
  );
}
