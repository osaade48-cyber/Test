import type { SizeKey } from "@/lib/configurator";
import { dimensions, FLOOR_HEIGHT as FL, GROUND } from "@/lib/dimensions";

const mm = (v: number) => `${(Math.round(v * 100) * 10).toLocaleString("en-AU")}`;

/**
 * Front elevation drawn from the same dimensions as the 3D model, in the manner of
 * an architect's drawing: thin lines, dimension strings in millimetres.
 */
export function Elevation({ size }: { size: SizeKey }) {
  const d = dimensions(size);
  const { W, H, R, s0, slatW, o0, o1, oh, sill, roofThickness: tt, overhangSide: ov, pitch } = d;
  const S = 260; // px per metre
  const padX = 0.45, padTop = 0.25, padBottom = 0.35;
  const left = -W / 2 - ov - padX, right = W / 2 + ov + padX + 0.25;
  const top = FL + H + R + tt + 0.12 + padTop;
  const vw = (right - left) * S, vh = (top + padBottom) * S;
  const X = (x: number) => (x - left) * S;
  const Y = (y: number) => (top - y) * S;

  // Roof slab (front face), following the skillion pitch
  const roofY = (x: number) => FL + H + R * ((x + W / 2) / W);
  const t = tt / Math.cos(pitch);
  const rl = -W / 2 - ov, rr = W / 2 + ov;
  const roof = [
    [rl, roofY(rl)],
    [rr, roofY(rr)],
    [rr, roofY(rr) + t],
    [rl, roofY(rl) + t],
  ];
  const ventTop = d.topAt(s0) - 0.14;
  const slats: number[] = [];
  for (let x = s0 + 0.012; x <= s0 + slatW - 0.03; x += 0.058) slats.push(x);
  const dw = d.ow + 0.04, dh = oh + 0.03;
  const doorX = o1 + 0.04;
  const line = "stroke-ink/70";
  const thin = "stroke-ink/35";

  return (
    <svg viewBox={`0 0 ${vw} ${vh}`} className="h-auto w-full" role="img" aria-label={`Front elevation, ${d.label}`}>
      <g fill="none" strokeWidth="1" vectorEffect="non-scaling-stroke">
        {/* ground */}
        <line x1={X(left + 0.1)} y1={Y(0)} x2={X(right - 0.1)} y2={Y(0)} className={thin} />
        {/* plinth */}
        <rect x={X(-W / 2 + 0.04)} y={Y(FL)} width={(W - 0.08) * S} height={(FL - GROUND) * S} className={thin} />
        {/* walls */}
        <polygon
          points={[
            [-W / 2, FL],
            [W / 2, FL],
            [W / 2, FL + H + R],
            [-W / 2, FL + H],
          ]
            .map(([x, y]) => `${X(x)},${Y(y)}`)
            .join(" ")}
          className={line}
        />
        {/* roof */}
        <polygon points={roof.map(([x, y]) => `${X(x)},${Y(y)}`).join(" ")} className="fill-timber/15 stroke-ink/80" />
        {/* vent slats */}
        {slats.map((x) => (
          <rect key={x} x={X(x)} y={Y(FL + 0.06 + ventTop - 0.02)} width={0.034 * S} height={(ventTop - 0.02) * S} className="fill-timber/20 stroke-ink/50" />
        ))}
        {/* opening */}
        <rect x={X(o0)} y={Y(FL + sill + oh)} width={(o1 - o0) * S} height={oh * S} className="stroke-ink/80" strokeWidth="2" />
        {/* sliding door (open) + track */}
        <line x1={X(o0 - 0.05)} y1={Y(FL + sill + oh + 0.07)} x2={X(W / 2 - 0.04)} y2={Y(FL + sill + oh + 0.07)} className={line} />
        <rect x={X(doorX)} y={Y(FL + sill + dh - 0.01)} width={dw * S} height={dh * S} className="fill-timber/15 stroke-ink/70" />
        {Array.from({ length: 6 }, (_, i) => (
          <line key={i} x1={X(doorX)} x2={X(doorX + dw)} y1={Y(FL + sill - 0.01 + ((i + 1) * dh) / 7)} y2={Y(FL + sill - 0.01 + ((i + 1) * dh) / 7)} className={thin} />
        ))}
        <rect x={X(doorX + 0.03 + dw / 2 - 0.125)} y={Y(FL + sill + dh * 0.74 + 0.044)} width={0.25 * S} height={0.088 * S} className={thin} />

        {/* dimensions */}
        <Dim x1={X(-W / 2)} x2={X(W / 2)} y={Y(0) + 34} label={`${mm(W)}`} />
        <Dim x1={X(o0)} x2={X(o1)} y={Y(FL + sill + oh) - 18} label={`${mm(o1 - o0)}`} small />
        <DimV x={X(right) - 34} y1={Y(0)} y2={Y(d.overallHeight)} label={`${mm(d.overallHeight)}`} />
        <DimV x={X(-W / 2) - 30} y1={Y(FL)} y2={Y(FL + H)} label={`${mm(H)}`} small />
      </g>
    </svg>
  );
}

function Dim({ x1, x2, y, label, small }: { x1: number; x2: number; y: number; label: string; small?: boolean }) {
  return (
    <g className="stroke-muted">
      <line x1={x1} x2={x2} y1={y} y2={y} />
      <line x1={x1} x2={x1} y1={y - 6} y2={y + 6} />
      <line x1={x2} x2={x2} y1={y - 6} y2={y + 6} />
      <text x={(x1 + x2) / 2} y={y - 8} textAnchor="middle" className="fill-muted stroke-none" style={{ font: `500 ${small ? 11 : 13}px var(--font-sans)`, letterSpacing: "0.08em" }}>
        {label}
      </text>
    </g>
  );
}

function DimV({ x, y1, y2, label, small }: { x: number; y1: number; y2: number; label: string; small?: boolean }) {
  const cy = (y1 + y2) / 2;
  return (
    <g className="stroke-muted">
      <line x1={x} x2={x} y1={y1} y2={y2} />
      <line x1={x - 6} x2={x + 6} y1={y1} y2={y1} />
      <line x1={x - 6} x2={x + 6} y1={y2} y2={y2} />
      <text
        x={x - 8}
        y={cy}
        textAnchor="middle"
        transform={`rotate(-90 ${x - 8} ${cy})`}
        className="fill-muted stroke-none"
        style={{ font: `500 ${small ? 11 : 13}px var(--font-sans)`, letterSpacing: "0.08em" }}
      >
        {label}
      </text>
    </g>
  );
}
