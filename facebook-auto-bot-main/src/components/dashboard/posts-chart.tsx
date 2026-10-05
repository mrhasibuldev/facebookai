"use client";

import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

export function PostsChart({ data }: { data: { date: string; label: string; count: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="postsFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2c5fd4" stopOpacity={0.35} />
            <stop offset="100%" stopColor="#2c5fd4" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#e7e5ea" vertical={false} />
        <XAxis
          dataKey="label"
          tick={{ fill: "#6b7280", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          allowDecimals={false}
          tick={{ fill: "#6b7280", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          width={28}
        />
        <Tooltip
          cursor={{ stroke: "#e7e5ea" }}
          contentStyle={{
            background: "#ffffff",
            border: "1px solid #e7e5ea",
            borderRadius: 12,
            fontSize: 12,
            color: "#17151a",
          }}
          labelFormatter={(label) => label}
          formatter={(value) => [`${value} post${value === 1 ? "" : "s"}`, "Posted"]}
        />
        <Area
          type="monotone"
          dataKey="count"
          stroke="#2c5fd4"
          strokeWidth={2}
          fill="url(#postsFill)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
