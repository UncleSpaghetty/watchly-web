"use client";

import type React from "react";
import { Check } from "lucide-react";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Toggle } from "@/components/ui/toggle";
import { cn } from "cn";

export function Chip({
  selected,
  className,
  children,
  ...props
}: Omit<React.ComponentProps<typeof Toggle>, "pressed"> & {
  selected?: boolean;
}) {
  return (
    <Toggle
      pressed={selected}
      variant="outline"
      {...props}
      className={cn(
        "ui-chip ui-filter-toggle cursor-pointer rounded-full border-border px-3.5 text-[13px] text-muted aria-pressed:border-primary aria-pressed:bg-primary aria-pressed:text-primary-foreground",
        className,
      )}
    >
      <span className="ui-filter-toggle-indicator" aria-hidden>
        {selected ? <Check size={12} strokeWidth={3} /> : null}
      </span>
      {children}
    </Toggle>
  );
}

export function ChoiceGroup<T extends string | number>({
  value,
  items,
  onChange,
  ariaLabel,
  className,
}: {
  value: T;
  items: Array<{ value: T; label: React.ReactNode }>;
  onChange: (value: T) => void;
  ariaLabel: string;
  className?: string;
}) {
  const moveSelection = (
    event: React.KeyboardEvent<HTMLButtonElement>,
    index: number,
  ) => {
    const direction =
      event.key === "ArrowRight" || event.key === "ArrowDown"
        ? 1
        : event.key === "ArrowLeft" || event.key === "ArrowUp"
          ? -1
          : 0;
    if (!direction) return;

    event.preventDefault();
    const nextIndex = (index + direction + items.length) % items.length;
    onChange(items[nextIndex]!.value);
    const options = event.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>(
      '[role="radio"]',
    );
    options?.[nextIndex]?.focus();
  };

  return (
    <div
      className={cn("ui-choice-group", className)}
      role="radiogroup"
      aria-label={ariaLabel}
    >
      {items.map((item, index) => {
        const selected = item.value === value;
        return (
          <button
            type="button"
            role="radio"
            aria-checked={selected}
            data-selected={selected ? "true" : "false"}
            tabIndex={selected ? 0 : -1}
            className="ui-choice-option"
            key={item.value}
            onClick={() => onChange(item.value)}
            onKeyDown={(event) => moveSelection(event, index)}
          >
            <span className="ui-choice-option-indicator" aria-hidden>
              {selected ? <Check size={12} strokeWidth={3} /> : null}
            </span>
            {item.label}
          </button>
        );
      })}
    </div>
  );
}

export function SegmentedTabs<T extends string | number>({
  value,
  items,
  onChange,
  ariaLabel,
  className,
}: {
  value: T;
  items: Array<{ value: T; label: string }>;
  onChange: (value: T) => void;
  ariaLabel: string;
  className?: string;
}) {
  return (
    <Tabs
      value={String(value)}
      onValueChange={(next) => {
        const item = items.find((candidate) => String(candidate.value) === next);
        if (item) onChange(item.value);
      }}
      className={cn(className)}
    >
      <TabsList aria-label={ariaLabel}>
        {items.map((item) => (
          <TabsTrigger key={item.value} value={String(item.value)}>
            {item.label}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
