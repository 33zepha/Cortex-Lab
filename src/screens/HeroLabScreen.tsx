import Dither from "@/components/hero/Dither";
import cortexHeroMark from "@/assets/cortex-hero-mark.png";
import "./HeroLabScreen.css";

export function HeroLabScreen() {
  return (
    <main className="hero-lab relative min-h-[100dvh] overflow-hidden bg-black text-white">
      <div className="absolute inset-0">
        <Dither
          waveColor={[0.48, 0.58, 0.52]}
          colorNum={11.5}
          pixelSize={2}
          waveAmplitude={0.47}
          waveFrequency={3}
          waveSpeed={0.03}
          enableMouseInteraction={true}
          mouseRadius={0.3}
        />
      </div>

      <div className="hero-lab__veil pointer-events-none absolute inset-0" />
      <div className="hero-lab__frame pointer-events-none absolute inset-x-6 bottom-6 top-6 sm:inset-x-10 sm:bottom-9 sm:top-9 lg:inset-x-14 xl:inset-x-16" />

      <div className="relative z-10 mx-auto flex min-h-[100dvh] max-w-[1680px] flex-col px-6 pb-8 pt-8 sm:px-10 sm:pb-11 sm:pt-11 lg:px-14 xl:px-16">
        <header className="flex items-center justify-between" aria-label="Cortex visual lab">
          <img className="hero-lab__logo" src={cortexHeroMark} alt="Cortex" />
        </header>

        <div className="flex flex-1 items-end pb-[8svh] pt-20 sm:items-center sm:pb-0 sm:pt-0">
          <section className="hero-lab__copy max-w-[470px] lg:-translate-y-2 lg:max-w-[455px]">
            <h1 className="hero-lab__headline max-w-[470px] text-balance text-[#f2f4f1]">
              <span>Intelligence,</span>
              <span className="hero-lab__headline-italic">held in</span>
              <span className="hero-lab__headline-strong">form.</span>
            </h1>
            <p className="mt-7 max-w-[375px] text-pretty text-[14px] leading-[1.85] text-white/43 sm:text-[15px]">
              A living operational layer that gathers models, agents and context into one coherent system.
            </p>
          </section>
        </div>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/48 to-transparent" />
    </main>
  );
}
