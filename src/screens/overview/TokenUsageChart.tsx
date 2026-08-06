const WIDTH = 600;
const HEIGHT = 220;
const PAD_LEFT = 40;
const PAD_BOTTOM = 24;
const PAD_TOP = 16;
const BAR_GAP = 16;

export function TokenUsageChart({ data }: { data: { day: string; tokens: number }[] }) {
  const max = Math.max(...data.map((d) => d.tokens));
  const plotW = WIDTH - PAD_LEFT;
  const plotH = HEIGHT - PAD_TOP - PAD_BOTTOM;
  const barWidth = (plotW - BAR_GAP * (data.length - 1)) / data.length;

  const points = data.map((d, i) => {
    const x = PAD_LEFT + i * (barWidth + BAR_GAP) + barWidth / 2;
    const y = PAD_TOP + plotH - (d.tokens / max) * plotH;
    return { x, y, d };
  });

  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");
  const gridLines = [0, 0.5, 1];

  return (
    <div>
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        preserveAspectRatio="xMidYMid meet"
        className="h-64 w-full"
        role="img"
        aria-label="Tokens Claude Code consommés par jour sur les 7 derniers jours"
      >
        {/* Grille horizontale */}
        {gridLines.map((f) => {
          const y = PAD_TOP + plotH * f;
          return (
            <g key={f}>
              <line x1={PAD_LEFT} y1={y} x2={WIDTH} y2={y} className="stroke-border" strokeWidth={1} />
              <text x={0} y={y + 4} className="fill-text-muted text-[10px]">
                {Math.round((max * (1 - f)) / 1000)}k
              </text>
            </g>
          );
        })}

        {/* Barres */}
        {points.map(({ x, y, d }, i) => {
          const isLast = i === points.length - 1;
          return (
            <rect
              key={d.day}
              x={x - barWidth / 2}
              y={y}
              width={barWidth}
              height={PAD_TOP + plotH - y}
              rx={4}
              className={isLast ? "fill-chart-bar" : "fill-surface-3"}
            />
          );
        })}

        {/* Ligne de tendance */}
        <path d={linePath} fill="none" className="stroke-chart-line" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        {points.map(({ x, y, d }) => (
          <circle key={d.day} cx={x} cy={y} r={3} className="fill-surface-1 stroke-chart-line" strokeWidth={2} />
        ))}
      </svg>
      <div className="mt-1 flex justify-between pl-10 text-label text-text-muted">
        {data.map((d) => (
          <span key={d.day}>{d.day}</span>
        ))}
      </div>
    </div>
  );
}
