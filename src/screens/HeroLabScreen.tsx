import LetterGlitch from "@/components/hero/LetterGlitch";

export function HeroLabScreen() {
  return (
    <main className="relative min-h-[118dvh] overflow-hidden bg-black text-white sm:min-h-[112dvh] lg:min-h-[108dvh]">
      <div className="absolute inset-0">
        <LetterGlitch
          glitchColors={["#151b19", "#34443d", "#83958d"]}
          glitchSpeed={110}
          centerVignette={true}
          outerVignette={false}
          smooth={true}
          characters="CORTEX0123456789<>/{}[]+-_=.:"
        />
      </div>

      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_22%_52%,rgba(0,0,0,0.42)_0%,rgba(0,0,0,0.17)_28%,rgba(0,0,0,0.00)_50%)]" />

      <div className="relative z-10 mx-auto flex min-h-[118dvh] max-w-[1680px] items-end px-6 pb-[10dvh] pt-24 sm:min-h-[112dvh] sm:items-center sm:px-10 sm:py-24 lg:min-h-[108dvh] lg:px-14 xl:px-16">
        <section className="max-w-[470px] sm:max-w-[470px] lg:-translate-y-3 lg:max-w-[450px]">
          <div className="mb-6 flex items-center gap-3 text-[10px] font-semibold uppercase tracking-[0.24em] text-white/34">
            <span className="h-px w-7 bg-white/16" />
            Cortex / visual lab
          </div>
          <h1 className="max-w-[470px] text-balance text-[clamp(2.8rem,4.9vw,5.4rem)] font-semibold leading-[0.92] tracking-[-0.06em] text-[#f3f4f2]">
            Intelligence,<br />held in form.
          </h1>
          <p className="mt-6 max-w-[370px] text-pretty text-[14px] leading-7 text-white/42 sm:text-[15px]">
            A living operational layer that gathers models, agents and context into one coherent system.
          </p>
        </section>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black via-black/18 to-transparent" />
    </main>
  );
}
