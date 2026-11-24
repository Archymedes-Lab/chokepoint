import type { ReactNode } from "react";

export function Switch({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label?: string;
}) {
  return (
    <label className="switch" aria-label={label}>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span className="track" />
      <span className="thumb" />
    </label>
  );
}

export function Slider({
  value,
  min,
  max,
  step,
  onChange,
  id,
}: {
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  id?: string;
}) {
  return (
    <input
      id={id}
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
    />
  );
}

export function Tile({
  label,
  value,
  sub,
  tone,
}: {
  label: string;
  value: ReactNode;
  sub?: string;
  tone?: "attacker" | "advantage";
}) {
  return (
    <div className={`tile ${tone ?? ""}`}>
      <div className="t-lbl">{label}</div>
      <div className="t-val">{value}</div>
      {sub && <div className="t-sub">{sub}</div>}
    </div>
  );
}

export function HBar({
  label,
  pct,
  color,
  num,
}: {
  label: string;
  pct: number;
  color: string;
  num: string;
}) {
  return (
    <div className="hbar">
      <span className="lab" title={label}>
        {label}
      </span>
      <span className="track">
        <span className="fill" style={{ width: `${Math.max(0, Math.min(100, pct))}%`, background: color }} />
      </span>
      <span className="num">{num}</span>
    </div>
  );
}

export function fmtMoney(n: number): string {
  const abs = Math.abs(n);
  const sign = n < 0 ? "-" : "";
  if (abs >= 1_000_000) return `${sign}$${(abs / 1_000_000).toFixed(2)}M`;
  if (abs >= 1_000) return `${sign}$${(abs / 1_000).toFixed(0)}k`;
  return `${sign}$${abs.toFixed(0)}`;
}
