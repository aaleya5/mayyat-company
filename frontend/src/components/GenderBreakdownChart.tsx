import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, ResponsiveContainer } from "recharts";

interface GenderBreakdownChartProps {
  data: Array<{ gender: "MALE" | "FEMALE" | "UNKNOWN"; count: number }>;
}

// Same mapping used for the gender badges in RecordTable, so the color
// coding is consistent between the records table and this chart.
const GENDER_COLOR: Record<string, string> = {
  MALE: "var(--color-ink)",
  FEMALE: "var(--color-accent)",
  UNKNOWN: "var(--color-muted)",
};

export default function GenderBreakdownChart({ data }: GenderBreakdownChartProps) {
  return (
    <div className="border border-border bg-surface p-4">
      <h4 className="mb-3 text-xs font-bold uppercase tracking-wide text-muted">
        Gender Breakdown
      </h4>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={data} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
          <XAxis
            dataKey="gender"
            tick={{ fontSize: 11, fill: "var(--color-muted)" }}
            axisLine={{ stroke: "var(--color-border)" }}
            tickLine={false}
          />
          <YAxis
            allowDecimals={false}
            tick={{ fontSize: 11, fill: "var(--color-muted)" }}
            axisLine={{ stroke: "var(--color-border)" }}
            tickLine={false}
          />
          <Tooltip
            cursor={{ fill: "var(--color-paper)" }}
            contentStyle={{
              border: "1px solid var(--color-border)",
              fontSize: "12px",
              fontFamily: "var(--font-sans)",
            }}
          />
          <Bar dataKey="count" radius={0}>
            {data.map((entry) => (
              <Cell key={entry.gender} fill={GENDER_COLOR[entry.gender]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
