"use client";

import { ArrowDownIcon, ArrowUpIcon, ChevronsUpDownIcon } from "lucide-react";

import { TableHead } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import type { SortDir } from "@/hooks/use-sort";

export function SortableHead({
  label,
  sortKey,
  activeKey,
  dir,
  onSort,
  align = "left",
  className,
}: {
  label: string;
  sortKey: string;
  activeKey: string;
  dir: SortDir;
  onSort: (key: string) => void;
  align?: "left" | "right";
  className?: string;
}) {
  const active = activeKey === sortKey;
  const Icon = !active ? ChevronsUpDownIcon : dir === "asc" ? ArrowUpIcon : ArrowDownIcon;

  return (
    <TableHead className={cn(align === "right" && "text-right", className)}>
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        className={cn(
          "inline-flex items-center gap-1 uppercase tracking-wide hover:text-foreground",
          active && "text-foreground",
          align === "right" && "flex-row-reverse"
        )}
      >
        {label}
        <Icon className={cn("size-3", !active && "opacity-40")} />
      </button>
    </TableHead>
  );
}
