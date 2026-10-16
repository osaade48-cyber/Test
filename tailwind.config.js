/** @type {import('tailwindcss').Config} */
const c = (name) => `rgb(var(--c-${name}) / <alpha-value>)`;

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  darkMode: ["class", '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        bg: c("bg"),
        surface: c("surface"),
        "surface-2": c("surface-2"),
        ink: c("ink"),
        muted: c("muted"),
        line: c("line"),
        brand: c("brand"),
        "brand-soft": c("brand-soft"),
        lilac: c("lilac"),
        "lilac-soft": c("lilac-soft"),
        sky: c("sky"),
        "sky-soft": c("sky-soft"),
        success: c("success"),
        "success-soft": c("success-soft"),
        warn: c("warn"),
        "warn-soft": c("warn-soft"),
        danger: c("danger"),
        "danger-soft": c("danger-soft"),
        "on-ink": c("on-ink"),
      },
      fontFamily: {
        serif: ['"Fraunces"', "Georgia", "serif"],
        sans: ['"DM Sans"', "system-ui", "-apple-system", "Segoe UI", "sans-serif"],
      },
      fontSize: {
        display: ["clamp(2rem, 1.4rem + 2.6vw, 3.25rem)", { lineHeight: "1.08", letterSpacing: "-0.02em", fontWeight: "600" }],
        h1: ["clamp(1.5rem, 1.3rem + 0.8vw, 1.875rem)", { lineHeight: "1.2", letterSpacing: "-0.01em", fontWeight: "600" }],
        h2: ["1.25rem", { lineHeight: "1.3", fontWeight: "600" }],
        h3: ["1.0625rem", { lineHeight: "1.35", fontWeight: "600" }],
        body: ["0.9375rem", { lineHeight: "1.55" }],
        caption: ["0.8125rem", { lineHeight: "1.4" }],
        micro: ["0.6875rem", { lineHeight: "1.3", letterSpacing: "0.04em" }],
      },
      borderRadius: {
        sm: "var(--radius-sm)",
        md: "var(--radius-md)",
        lg: "var(--radius-lg)",
        xl: "var(--radius-xl)",
      },
      boxShadow: {
        card: "var(--shadow-card)",
        pop: "var(--shadow-pop)",
      },
      spacing: {
        gutter: "var(--space-gutter)",
        tap: "44px",
      },
      minHeight: { tap: "44px" },
      minWidth: { tap: "44px" },
      keyframes: {
        pop: { "0%": { transform: "scale(1)" }, "40%": { transform: "scale(1.3)" }, "100%": { transform: "scale(1)" } },
        shimmer: { "100%": { transform: "translateX(100%)" } },
        "toast-in": { from: { opacity: "0", transform: "translateY(8px)" }, to: { opacity: "1", transform: "translateY(0)" } },
        "drawer-in": { from: { transform: "translateX(100%)" }, to: { transform: "translateX(0)" } },
        "sheet-in": { from: { transform: "translateY(100%)" }, to: { transform: "translateY(0)" } },
        fade: { from: { opacity: "0" }, to: { opacity: "1" } },
      },
      animation: {
        pop: "pop 0.35s ease-out",
        shimmer: "shimmer 1.4s infinite",
        "toast-in": "toast-in 0.2s ease-out",
        "drawer-in": "drawer-in 0.22s ease-out",
        "sheet-in": "sheet-in 0.22s ease-out",
        fade: "fade 0.15s ease-out",
      },
    },
  },
  plugins: [],
};
