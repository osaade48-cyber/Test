/** Minimal line icons for the climate features. 1px strokes, drawn to match the type. */
const base = { width: 44, height: 44, viewBox: "0 0 44 44", fill: "none", stroke: "currentColor", strokeWidth: 1 } as const;

export function IconInsulated() {
  return (
    <svg {...base} aria-hidden>
      <path d="M6 18 L22 8 L38 18" />
      <path d="M9 20 V36 H35 V20" />
      <path d="M13 24 h18 M13 28 h18 M13 32 h18" strokeDasharray="2 2" />
    </svg>
  );
}
export function IconVentilated() {
  return (
    <svg {...base} aria-hidden>
      <path d="M8 14 c6-4 10 4 16 0 s10-4 14 0" />
      <path d="M8 22 c6-4 10 4 16 0 s10-4 14 0" />
      <path d="M8 30 c6-4 10 4 16 0 s10-4 14 0" />
    </svg>
  );
}
export function IconRaised() {
  return (
    <svg {...base} aria-hidden>
      <rect x="8" y="12" width="28" height="16" />
      <path d="M12 28 V34 M32 28 V34 M4 36 H40" />
      <path d="M22 30 v4 M20 32 l2 2 2-2" />
    </svg>
  );
}
export function IconClean() {
  return (
    <svg {...base} aria-hidden>
      <path d="M8 34 H36 M8 34 V29 M36 34 V29" />
      <path d="M10 14 H34 M12 14 l2-5 H30 l2 5" />
      <path d="M22 18 V24 M19 21 l3 3 3-3" />
    </svg>
  );
}
