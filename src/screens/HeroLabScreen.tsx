import LetterGlitch from "@/components/hero/LetterGlitch";
import "./HeroLabScreen.css";

export function HeroLabScreen() {
  return (
    <main className="hero-lab relative min-h-[100dvh] overflow-hidden bg-black text-white">
      <div className="absolute inset-0">
        <LetterGlitch
          glitchColors={["#121715", "#31413a", "#82978d"]}
          glitchSpeed={120}
          centerVignette={false}
          outerVignette={false}
          smooth={true}
          characters="CORTEX0123456789<>/{}[]+-_=.:"
        />
      </div>

      <div className="hero-lab__veil pointer-events-none absolute inset-0" />
      <div className="hero-lab__frame pointer-events-none absolute inset-x-6 bottom-6 top-6 sm:inset-x-10 sm:bottom-9 sm:top-9 lg:inset-x-14 xl:inset-x-16" />

      <div className="relative z-10 mx-auto flex min-h-[100dvh] max-w-[1680px] flex-col px-6 pb-8 pt-8 sm:px-10 sm:pb-11 sm:pt-11 lg:px-14 xl:px-16">
        <header className="flex items-center justify-between" aria-label="Cortex visual lab">
          <span className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#edf1ee]/82">
            Cortex
          </span>

          <div className="hidden items-center gap-2.5 text-[9px] font-medium uppercase tracking-[0.2em] text-white/30 sm:flex">
            <span className="hero-lab__status-dot" aria-hidden="true" />
            Operational intelligence
          </div>
        </header>

        <div className="flex flex-1 items-end pb-[8svh] pt-20 sm:items-center sm:pb-0 sm:pt-0">
          <section className="hero-lab__copy max-w-[470px] lg:-translate-y-2 lg:max-w-[455px]">
            <div className="mb-6 flex items-center gap-3 text-[9px] font-semibold uppercase tracking-[0.25em] text-white/30 sm:mb-7">
              <span className="h-px w-7 bg-white/16" />
              Visual system / 01
            </div>
            <h1 className="max-w-[470px] text-balance text-[clamp(3rem,5vw,5.5rem)] font-semibold leading-[0.9] tracking-[-0.064em] text-[#f2f4f1]">
              Intelligence,<br />held in form.
            </h1>
            <p className="mt-7 max-w-[375px] text-pretty text-[14px] leading-[1.85] text-white/43 sm:text-[15px]">
              A living operational layer that gathers models, agents and context into one coherent system.
            </p>
          </section>
        </div>

        <footer className="flex items-end justify-between text-[9px] font-medium uppercase tracking-[0.18em] text-white/22">
          <span>Models · Agents · Memory · Context</span>
          <span className="hidden sm:inline">Cortex / 2026</span>
        </footer>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/48 to-transparent" />
    </main>
  );
}
