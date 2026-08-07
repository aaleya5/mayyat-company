import { useStats } from "../hooks/useStats";
import TallyGrid from "../components/TallyGrid";
import YearlyTrendChart from "../components/YearlyTrendChart";
import GenderBreakdownChart from "../components/GenderBreakdownChart";
import AgeBracketChart from "../components/AgeBracketChart";

interface StatsPageProps {
  token: string | null;
}

function SummaryCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="border border-border bg-surface p-5">
      <p className="text-xs font-medium uppercase tracking-wide text-muted">{label}</p>
      <p className="mt-1 font-display text-3xl font-extrabold text-ink">{value}</p>
    </div>
  );
}

export default function StatsPage({ token }: StatsPageProps) {
  const { stats, loading, error } = useStats(token);

  if (loading && !stats) {
    return <p className="text-sm text-muted">Loading stats...</p>;
  }

  if (error) {
    return (
      <div className="border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
        ⚠️ {error}
      </div>
    );
  }

  if (!stats) return null;

  const currentYear = new Date().getFullYear();
  const thisYearCount =
    stats.byYear.find((y) => y.year === currentYear)?.count ?? 0;

  return (
    <div>
      <h2 className="mb-6 font-display text-2xl font-extrabold uppercase tracking-tight text-ink">
        Tally
      </h2>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <SummaryCard label="Total Records" value={stats.totalRecords} />
        <SummaryCard
          label="Years Covered"
          value={
            stats.yearsCovered.first && stats.yearsCovered.last
              ? `${stats.yearsCovered.first}–${stats.yearsCovered.last}`
              : "–"
          }
        />
        <SummaryCard label={`Records in ${currentYear}`} value={thisYearCount} />
      </div>

      <h3 className="mb-3 mt-8 font-display text-lg font-bold uppercase tracking-tight text-ink">
        Year &times; Month Tally
      </h3>
      <TallyGrid rows={stats.tallyGrid} />

      <div className="mt-8 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <YearlyTrendChart data={stats.byYear} />
        <GenderBreakdownChart data={stats.byGender} />
      </div>

      <div className="mt-4">
        <AgeBracketChart data={stats.byAgeBracket} />
      </div>
    </div>
  );
}
