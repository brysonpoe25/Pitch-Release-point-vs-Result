"use client";

import * as React from "react";

export type SortDir = "asc" | "desc";

/**
 * Minimal client-side table sort: tracks {key, dir} and returns a sorted
 * copy of `rows` plus a `toggle(key)` handler and the active sort state, so
 * a <TableHead> can render an indicator and flip direction on click.
 */
export function useSort<T>(
  rows: T[],
  initialKey: string,
  getValue: (row: T, key: string) => string | number | null,
  initialDir: SortDir = "desc"
) {
  const [key, setKey] = React.useState(initialKey);
  const [dir, setDir] = React.useState<SortDir>(initialDir);

  const sorted = React.useMemo(() => {
    const copy = [...rows];
    copy.sort((a, b) => {
      const av = getValue(a, key);
      const bv = getValue(b, key);
      if (av === null && bv === null) return 0;
      if (av === null) return 1;
      if (bv === null) return -1;
      const cmp = typeof av === "string" ? av.localeCompare(bv as string) : av - (bv as number);
      return dir === "asc" ? cmp : -cmp;
    });
    return copy;
  }, [rows, key, dir, getValue]);

  function toggle(nextKey: string) {
    if (nextKey === key) {
      setDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setKey(nextKey);
      setDir("desc");
    }
  }

  return { sorted, sortKey: key, sortDir: dir, toggle };
}
