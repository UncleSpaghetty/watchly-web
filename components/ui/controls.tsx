"use client";

import type React from "react";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Toggle } from "@/components/ui/toggle";
import { cn } from "cn";

export function Chip({
  selected,
  className,
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
        "ui-chip rounded-full border-border px-3.5 text-[13px] text-muted aria-pressed:border-primary aria-pressed:bg-primary aria-pressed:text-primary-foreground",
        className,
      )}
    />
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
