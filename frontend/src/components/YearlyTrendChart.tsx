import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface YearlyTrendChartProps {
  data: Array<{ year: number; count: number }>;
}

/**
 * YearlyTrendChart - records per year, bar chart.
 * Kept as bars (not a line) to match the app's structural/rectilinear look
 * rather than introducing a different chart language.
 */
export default function YearlyTrendChart({ data }: YearlyTrendChartProps) {
  return (
    <div className="border border-border bg-surface p-4">
      <h4 className="mb-3 text-xs font-bold uppercase tracking-wide text-muted">
        Records per Year
      </h4>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={data} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
          <XAxis
            dataKey="year"
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
          <Bar dataKey="count" fill="var(--color-ink)" radius={0} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
