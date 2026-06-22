"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { fmtDate, fmtDayMonth, fmtInt } from "@/lib/format";
import type { GscPoint, PositionsPoint, TimelinePoint } from "@/lib/types";

const tooltipStyle = {
  background: "#fbfaf5",
  border: "1px solid #ddd8c8",
  borderRadius: 0,
  fontSize: 12,
  padding: "8px 10px",
} as const;

const axisTick = { fontSize: 11, fill: "#8e8a7b" } as const;

export function TrafficChart({ data, height = 280 }: { data: TimelinePoint[]; height?: number }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid stroke="#e9e5d7" vertical={false} />
        <XAxis
          dataKey="date"
          tickFormatter={fmtDayMonth}
          tick={axisTick}
          tickLine={false}
          axisLine={{ stroke: "#ddd8c8" }}
          minTickGap={28}
        />
        <YAxis tick={axisTick} tickLine={false} axisLine={false} width={48} tickFormatter={(v) => fmtInt(Number(v))} />
        <Tooltip
          contentStyle={tooltipStyle}
          formatter={(value) => fmtInt(Number(value))}
          labelFormatter={(label) => fmtDate(String(label))}
        />
        <Area
          type="monotone"
          dataKey="visits"
          name="Визиты"
          stroke="#1b1a14"
          strokeWidth={1.5}
          fill="#1b1a14"
          fillOpacity={0.05}
        />
        <Area
          type="monotone"
          dataKey="organic"
          name="Органика"
          stroke="#1e5b43"
          strokeWidth={1.5}
          fill="#1e5b43"
          fillOpacity={0.16}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function GscChart({ data, height = 260 }: { data: GscPoint[]; height?: number }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid stroke="#e9e5d7" vertical={false} />
        <XAxis
          dataKey="date"
          tickFormatter={fmtDayMonth}
          tick={axisTick}
          tickLine={false}
          axisLine={{ stroke: "#ddd8c8" }}
          minTickGap={28}
        />
        <YAxis
          yAxisId="clicks"
          tick={axisTick}
          tickLine={false}
          axisLine={false}
          width={44}
          tickFormatter={(v) => fmtInt(Number(v))}
        />
        <YAxis
          yAxisId="impressions"
          orientation="right"
          tick={axisTick}
          tickLine={false}
          axisLine={false}
          width={52}
          tickFormatter={(v) => fmtInt(Number(v))}
        />
        <Tooltip
          contentStyle={tooltipStyle}
          formatter={(value) => fmtInt(Number(value))}
          labelFormatter={(label) => fmtDate(String(label))}
        />
        <Area
          yAxisId="impressions"
          type="monotone"
          dataKey="impressions"
          name="Показы"
          stroke="#c2772b"
          strokeWidth={1.2}
          fill="#c2772b"
          fillOpacity={0.08}
        />
        <Area
          yAxisId="clicks"
          type="monotone"
          dataKey="clicks"
          name="Клики"
          stroke="#1e5b43"
          strokeWidth={1.5}
          fill="#1e5b43"
          fillOpacity={0.16}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function PositionsChart({ data, height = 240 }: { data: PositionsPoint[]; height?: number }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid stroke="#e9e5d7" vertical={false} />
        <XAxis
          dataKey="date"
          tickFormatter={fmtDayMonth}
          tick={axisTick}
          tickLine={false}
          axisLine={{ stroke: "#ddd8c8" }}
          minTickGap={28}
        />
        <YAxis
          yAxisId="share"
          tick={axisTick}
          tickLine={false}
          axisLine={false}
          width={44}
          unit="%"
          domain={[0, 100]}
        />
        <YAxis
          yAxisId="pos"
          orientation="right"
          reversed
          tick={axisTick}
          tickLine={false}
          axisLine={false}
          width={40}
        />
        <Tooltip
          contentStyle={tooltipStyle}
          formatter={(value, name) =>
            name === "Доля в топ-10" ? `${value}%` : String(value)
          }
          labelFormatter={(label) => fmtDate(String(label))}
        />
        <Area
          yAxisId="share"
          type="monotone"
          dataKey="top10Share"
          name="Доля в топ-10"
          stroke="#1e5b43"
          strokeWidth={1.5}
          fill="#1e5b43"
          fillOpacity={0.16}
        />
        <Area
          yAxisId="pos"
          type="monotone"
          dataKey="avgPosition"
          name="Ср. позиция"
          stroke="#c2772b"
          strokeWidth={1.2}
          fill="none"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
