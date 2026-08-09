import Dither from "@/components/hero/Dither";
import cortexHeroMark from "@/assets/cortex-hero-mark.png";
import "./HeroLabScreen.css";

export function HeroLabScreen() {
  return (
    <main className="hero-lab relative min-h-[100dvh] overflow-hidden bg-[#18372c] text-white" aria-labelledby="hero-lab-title">
      <div className="hero-lab__field pointer-events-auto absolute inset-0" data-hero-layer="field" aria-hidden="true">
        <Dither
          waveColor={[0.5, 0.63, 0.55]}
          baseColor={[0.1, 0.16, 0.13]}
          highlightColor={[0.76, 0.82, 0.77]}
          colorNum={16}
          pixelSize={1.5}
          ditherBias={0.035}
          waveAmplitude={0.38}
          waveFrequency={2.45}
          waveSpeed={0.038}
          enableMouseInteraction={true}
          mouseRadius={0.34}
        />
      </div>

      <div className="hero-lab__veil pointer-events-none absolute inset-0" />
      <div className="hero-lab__frame pointer-events-none absolute inset-x-6 bottom-6 top-6 sm:inset-x-10 sm:bottom-9 sm:top-9 lg:inset-x-14 xl:inset-x-16" />

      <div className="hero-lab__shell relative z-10 mx-auto flex min-h-[100dvh] max-w-[1680px] flex-col">
        <div className="hero-lab__content flex flex-1 items-center">
          <section className="hero-lab__copy max-w-[470px] lg:-translate-y-2 lg:max-w-[455px]">
            <div className="hero-lab__brand" aria-label="Cortex">
              <img className="hero-lab__logo" src={cortexHeroMark} alt="Cortex mark" draggable={false} />
            </div>
            <h1 id="hero-lab-title" className="hero-lab__headline max-w-[470px] text-balance text-[#f2f4f1]">
              <span>Complexity,</span>
              <span className="hero-lab__headline-italic">made</span>
              <span className="hero-lab__headline-strong">coherent.</span>
            </h1>
          </section>
        </div>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[#10261d]/24 to-transparent" />
    </main>
  );
}
