import type { ReactNode } from "react";

export function Panel({ title, description, children, action, className = "" }: {
  title: string; description?: string; children: ReactNode; action?: ReactNode; className?: string
}) {
  return <section className={"panel " + className}>
    <div className="panel-head"><div><h2>{title}</h2>{description && <p className="muted">{description}</p>}</div>{action}</div>
    {children}
  </section>;
}
export function Toggle({ checked, onChange, label, description, disabled = false }: {
  checked: boolean; onChange: (value: boolean) => void; label: string; description?: string; disabled?: boolean
}) {
  return <label className="toggle-row">
    <span><strong>{label}</strong>{description && <span className="muted subtext">{description}</span>}</span>
    <input type="checkbox" className="switch-input" checked={checked} disabled={disabled}
      onChange={e => onChange(e.target.checked)} aria-label={label} />
    <span className={"switch " + (checked ? "on" : "")} aria-hidden="true" />
  </label>;
}
export function Range({ title, value, min, max, step = 1, onChange, suffix = "" }: {
  title: string; value: number; min: number; max: number; step?: number;
  onChange: (value: number) => void; suffix?: string
}) {
  return <label className="range-wrap">
    <span className="range-label"><span>{title}</span><output>{value}{suffix}</output></span>
    <input type="range" min={min} max={max} step={step} value={value}
      onChange={e => onChange(Number(e.target.value))} />
  </label>;
}
export function Status({ kind, children }: { kind: "ok" | "warn" | "neutral"; children: ReactNode }) {
  return <span className={"status status-" + kind}><span className="status-indicator" />{children}</span>;
}
export function Empty({ children }: { children: ReactNode }) {
  return <p className="empty-state">{children}</p>;
}
