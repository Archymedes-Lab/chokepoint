/**
 * Thin, Swiss-styled wrappers over Radix UI primitives. Keeping them in one
 * place lets every control share the same accessible behaviour and the same
 * hairline visual language. Styling lives in styles.css under `.rx-*`.
 */
import type { ReactNode } from "react";
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
