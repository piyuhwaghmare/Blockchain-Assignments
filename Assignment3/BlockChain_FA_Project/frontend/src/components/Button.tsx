import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";

const variants: Record<Variant, string> = {
  primary:
    "bg-gradient-to-r from-cyan-500 to-emerald-500 text-ledger-950 font-semibold shadow-glow hover:brightness-110 active:scale-[0.98]",
  secondary:
    "glass-strong text-cyan-100 hover:border-cyan-400/40 hover:bg-white/[0.06] active:scale-[0.98]",
  ghost: "text-slate-300 hover:text-white hover:bg-white/5 active:scale-[0.98]",
  danger: "bg-rose-500/20 text-rose-200 border border-rose-500/40 hover:bg-rose-500/30",
};

export function Button({
  children,
  className = "",
  variant = "primary",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; children: ReactNode }) {
  return (
    <button
      type="button"
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm transition-all disabled:cursor-not-allowed disabled:opacity-40 ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
