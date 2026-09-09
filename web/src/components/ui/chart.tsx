"use client";

import * as React from "react";
import * as RechartsPrimitive from "recharts";

import { cn } from "@/lib/utils";

export type ChartConfig = {
  [k: string]: {
    label?: React.ReactNode;
    icon?: React.ComponentType;
    color?: string;
  };
};

type ChartContextProps = {
  config: ChartConfig;
};

const ChartContext = React.createContext<ChartContextProps | null>(null);

function useChart() {
  const context = React.useContext(ChartContext);
  if (!context) {
    throw new Error("useChart must be used within a <ChartContainer />");
  }
  return context;
}

function ChartContainer({
  id,
  className,
  children,
  config,
  ...props
}: React.ComponentProps<"div"> & {
  config: ChartConfig;
  children: React.ComponentProps<
    typeof RechartsPrimitive.ResponsiveContainer
  >["children"];
}) {
  const uniqueId = React.useId();
  const chartId = `chart-${id ?? uniqueId.replace(/:/g, "")}`;

  return (
    <ChartContext.Provider value={{ config }}>
      <div
        data-slot="chart"
        data-chart={chartId}
        className={cn(
          "[&_.recharts-cartesian-axis-tick_text]:fill-muted-foreground [&_.recharts-cartesian-grid_line]:stroke-border/50 [&_.recharts-dot[stroke='#fff']]:stroke-transparent [&_.recharts-layer]:outline-hidden [&_.recharts-sector]:outline-hidden [&_.recharts-sector[stroke='#fff']]:stroke-transparent [&_.recharts-surface]:outline-hidden flex aspect-video justify-center text-xs",
          className
        )}
        {...props}
      >
        <ChartStyle id={chartId} config={config} />
        <RechartsPrimitive.ResponsiveContainer>
          {children}
        </RechartsPrimitive.ResponsiveContainer>
      </div>
    </ChartContext.Provider>
  );
}

const ChartStyle = ({ id, config }: { id: string; config: ChartConfig }) => {
  const colorConfig = Object.entries(config).filter(
    ([, cfg]) => cfg.color
  );

  if (!colorConfig.length) return null;

  return (
    <style
      dangerouslySetInnerHTML={{
        __html: `[data-chart=${id}] {\n${colorConfig
          .map(([key, cfg]) => `  --color-${key}: ${cfg.color};`)
          .join("\n")}\n}`,
      }}
    />
  );
};

const ChartTooltip = RechartsPrimitive.Tooltip;

interface TooltipPayloadItem {
  dataKey?: string | number;
  name?: string | number;
  value?: number | string;
  color?: string;
  payload?: Record<string, unknown> & { fill?: string };
}

interface ChartTooltipContentProps extends Omit<React.ComponentProps<"div">, "color"> {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: React.ReactNode;
  labelFormatter?: (label: React.ReactNode, payload: TooltipPayloadItem[]) => React.ReactNode;
  formatter?: (
    value: TooltipPayloadItem["value"],
    name: TooltipPayloadItem["name"],
    item: TooltipPayloadItem,
    index: number,
    payload: TooltipPayloadItem["payload"]
  ) => React.ReactNode;
  indicator?: "line" | "dot" | "dashed";
  hideLabel?: boolean;
  hideIndicator?: boolean;
  color?: string;
  labelClassName?: string;
}

function ChartTooltipContent({
  active,
  payload,
  className,
  indicator = "dot",
  hideLabel = false,
  hideIndicator = false,
  label,
  labelFormatter,
  formatter,
  color,
  labelClassName,
}: ChartTooltipContentProps) {
  const { config } = useChart();

  if (!active || !payload?.length) return null;

  const tooltipLabel = !hideLabel ? (
    <div className={cn("font-medium", labelClassName)}>
      {labelFormatter ? labelFormatter(label, payload) : label}
    </div>
  ) : null;

  return (
    <div
      className={cn(
        "border-border/50 bg-popover text-popover-foreground grid min-w-[9rem] items-start gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs shadow-xl",
        className
      )}
    >
      {tooltipLabel}
      <div className="grid gap-1.5">
        {payload.map((item, index) => {
          const key = String(item.dataKey ?? item.name ?? "value");
          const itemConfig = config[key];
          const indicatorColor = color ?? item.payload?.fill ?? item.color;

          return (
            <div
              key={item.dataKey ?? index}
              className="flex w-full flex-wrap items-center gap-2"
            >
              {formatter && item?.value !== undefined && item.name ? (
                formatter(item.value, item.name, item, index, item.payload)
              ) : (
                <>
                  {!hideIndicator && (
                    <div
                      className={cn(
                        "shrink-0 rounded-[2px]",
                        indicator === "dot" && "size-2",
                        indicator === "line" && "w-1 h-2.5",
                        indicator === "dashed" &&
                          "w-0 border-[1.5px] border-dashed h-2.5"
                      )}
                      style={
                        {
                          backgroundColor: indicatorColor,
                          borderColor: indicatorColor,
                        } as React.CSSProperties
                      }
                    />
                  )}
                  <div className="flex flex-1 justify-between leading-none items-center">
                    <span className="text-muted-foreground">
                      {itemConfig?.label ?? item.name}
                    </span>
                    {item.value !== undefined && (
                      <span className="text-foreground font-mono font-medium tabular-nums">
                        {item.value.toLocaleString?.() ?? item.value}
                      </span>
                    )}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

const ChartLegend = RechartsPrimitive.Legend;

function ChartLegendContent({
  className,
  payload,
  hideIcon = false,
}: React.ComponentProps<"div"> & {
  payload?: readonly { value?: string; color?: string; dataKey?: string }[];
  hideIcon?: boolean;
}) {
  const { config } = useChart();

  if (!payload?.length) return null;

  return (
    <div className={cn("flex flex-wrap items-center justify-center gap-3.5 pt-2", className)}>
      {payload.map((item) => {
        const key = String(item.dataKey ?? item.value ?? "value");
        const itemConfig = config[key];

        return (
          <div key={key} className="flex items-center gap-1.5 text-xs">
            {!hideIcon && (
              <div
                className="size-2 shrink-0 rounded-[2px]"
                style={{ backgroundColor: item.color }}
              />
            )}
            {itemConfig?.label ?? item.value}
          </div>
        );
      })}
    </div>
  );
}

export {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  useChart,
};
