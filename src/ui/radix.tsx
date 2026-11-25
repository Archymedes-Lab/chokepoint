/**
 * Thin, Swiss-styled wrappers over Radix UI primitives. Keeping them in one
 * place lets every control share the same accessible behaviour and the same
 * hairline visual language. Styling lives in styles.css under `.rx-*`.
 */
import { useState, type ReactNode } from "react";
import * as RCollapsibleP from "@radix-ui/react-collapsible";
import * as RSliderP from "@radix-ui/react-slider";
import * as RSwitchP from "@radix-ui/react-switch";
import * as RTabsP from "@radix-ui/react-tabs";
import * as RTooltipP from "@radix-ui/react-tooltip";
import * as RToggleGroupP from "@radix-ui/react-toggle-group";
import * as RScrollAreaP from "@radix-ui/react-scroll-area";
import * as RSeparatorP from "@radix-ui/react-separator";

export function Slider({
  value,
  min,
  max,
  step,
  onValueChange,
  onCommit,
  "aria-label": ariaLabel,
}: {
  value: number;
  min: number;
  max: number;
  step: number;
  onValueChange: (v: number) => void;
  onCommit?: (v: number) => void;
  "aria-label"?: string;
}) {
  return (
    <RSliderP.Root
      className="rx-slider"
      value={[value]}
      min={min}
      max={max}
      step={step}
      onValueChange={(v) => onValueChange(v[0])}
      onValueCommit={(v) => onCommit?.(v[0])}
      aria-label={ariaLabel}
    >
      <RSliderP.Track className="rx-slider-track">
        <RSliderP.Range className="rx-slider-range" />
      </RSliderP.Track>
      <RSliderP.Thumb className="rx-slider-thumb" aria-label={ariaLabel} />
    </RSliderP.Root>
  );
}

export function Switch({
  checked,
  onCheckedChange,
  "aria-label": ariaLabel,
}: {
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
  "aria-label"?: string;
}) {
  return (
    <RSwitchP.Root className="rx-switch" checked={checked} onCheckedChange={onCheckedChange} aria-label={ariaLabel}>
      <RSwitchP.Thumb className="rx-switch-thumb" />
    </RSwitchP.Root>
  );
}

export const Tabs = RTabsP.Root;
export function TabsList({ children, "aria-label": ariaLabel }: { children: ReactNode; "aria-label"?: string }) {
  return (
    <RTabsP.List className="rx-tabs-list" aria-label={ariaLabel}>
      {children}
    </RTabsP.List>
  );
}
export function Tab({ value, children }: { value: string; children: ReactNode }) {
  return (
    <RTabsP.Trigger className="rx-tab" value={value}>
      {children}
    </RTabsP.Trigger>
  );
}
export const TabPanel = RTabsP.Content;

export function ToggleGroup({
  value,
  onValueChange,
  children,
  "aria-label": ariaLabel,
}: {
  value: string;
  onValueChange: (v: string) => void;
  children: ReactNode;
  "aria-label"?: string;
}) {
  return (
    <RToggleGroupP.Root
      className="rx-toggle-group"
      type="single"
      value={value}
      onValueChange={(v) => v && onValueChange(v)}
      aria-label={ariaLabel}
    >
      {children}
    </RToggleGroupP.Root>
  );
}
export function ToggleItem({ value, children }: { value: string; children: ReactNode }) {
  return (
    <RToggleGroupP.Item className="rx-toggle-item" value={value}>
      {children}
    </RToggleGroupP.Item>
  );
}

export function TooltipProvider({ children }: { children: ReactNode }) {
  return <RTooltipP.Provider delayDuration={200}>{children}</RTooltipP.Provider>;
}

/** An info affordance that reveals a longer hint on hover/focus — keeps the
 *  surface clean without hiding the explanation from anyone who wants it. */
export function Info({ children }: { children: ReactNode }) {
  return (
    <RTooltipP.Root>
      <RTooltipP.Trigger asChild>
        <button className="rx-info" aria-label="More information" type="button">
          i
        </button>
      </RTooltipP.Trigger>
      <RTooltipP.Portal>
        <RTooltipP.Content className="rx-tooltip" side="top" align="end" sideOffset={6} collisionPadding={10}>
          {children}
          <RTooltipP.Arrow className="rx-tooltip-arrow" />
        </RTooltipP.Content>
      </RTooltipP.Portal>
    </RTooltipP.Root>
  );
}

export function Separator({ className }: { className?: string }) {
  return <RSeparatorP.Root className={`rx-sep ${className ?? ""}`} />;
}

/** A section label that groups panels (eyebrow + hairline). */
export function SectionLabel({ children }: { children: ReactNode }) {
  return <div className="section-label">{children}</div>;
}

/**
 * A panel whose body collapses. The header carries the title, an optional
 * `right` slot for controls (kept out of the toggle button so there's no
 * nested-button problem), and a chevron that toggles it.
 */
export function CollapsiblePanel({
  title,
  sub,
  right,
  defaultOpen = true,
  className,
  embedded,
  children,
}: {
  title: string;
  sub?: string;
  right?: ReactNode;
  defaultOpen?: boolean;
  className?: string;
  /** Render without the collapsible chrome — for use inside a tab/drawer that
   *  already names the content. Header controls (`right`) are kept. */
  embedded?: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  if (embedded) {
    return (
      <div className={`embedded ${className ?? ""}`}>
        {(sub || right) && (
          <div className="embedded-hd">
            {sub && <span className="sub">{sub}</span>}
            <span className="cpanel-spacer" />
            {right}
          </div>
        )}
        {children}
      </div>
    );
  }
  return (
    <RCollapsibleP.Root className={`panel cpanel ${className ?? ""}`} open={open} onOpenChange={setOpen}>
      <div className="cpanel-hd">
        <button
          className={`cpanel-toggle ${open ? "open" : ""}`}
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-label={open ? `Collapse ${title}` : `Expand ${title}`}
        >
          <span className="cpanel-chevron">›</span>
        </button>
        <h2 className="cpanel-title" onClick={() => setOpen((o) => !o)}>
          {title}
        </h2>
        {sub && <span className="sub">{sub}</span>}
        <span className="cpanel-spacer" />
        {right}
      </div>
      <RCollapsibleP.Content className="cpanel-body">
        <div className="cpanel-body-inner">{children}</div>
      </RCollapsibleP.Content>
    </RCollapsibleP.Root>
  );
}

export function ScrollArea({ children, maxHeight }: { children: ReactNode; maxHeight: number }) {
  return (
    <RScrollAreaP.Root className="rx-scroll" style={{ maxHeight }}>
      <RScrollAreaP.Viewport className="rx-scroll-viewport">{children}</RScrollAreaP.Viewport>
      <RScrollAreaP.Scrollbar className="rx-scrollbar" orientation="vertical">
        <RScrollAreaP.Thumb className="rx-scrollbar-thumb" />
      </RScrollAreaP.Scrollbar>
    </RScrollAreaP.Root>
  );
}

/** Progressive disclosure for explanatory copy: the panel shows the numbers,
 *  the "why" is one click away instead of always competing for attention. */
export function Explainer({ label = "How to read this", children }: { label?: string; children: ReactNode }) {
  return (
    <details className="explainer">
      <summary>{label}</summary>
      <div className="explainer-body">{children}</div>
    </details>
  );
}
