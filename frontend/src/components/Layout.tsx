import type { ReactNode } from "react";

export type AppView = "records" | "stats";

interface LayoutProps {
  user?: { email: string; name: string; role: string };
  onLogout: () => void;
  view: AppView;
  onNavigate: (view: AppView) => void;
  children: ReactNode;
}

/**
 * Layout - shared page shell (header + nav + main container).
 *
 * Extracted out of RecordsPage in increment 4.2 so StatsPage doesn't have to
 * duplicate the header markup. Both pages now render just their own content;
 * this owns the brand, nav links, user badge, logout, and the max-width
 * content container.
 */
export default function Layout({ user, onLogout, view, onNavigate, children }: LayoutProps) {
  const navLinkClass = (active: boolean) =>
    `border-none bg-transparent text-sm font-medium transition-colors ${
      active ? "text-accent-light" : "text-paper/70 hover:text-paper"
    }`;

  return (
    <div className="min-h-screen bg-paper font-sans text-ink-text">
      {/* Header */}
      <header className="border-b border-ink-dark bg-ink shadow-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-8 py-4 md:px-12">
          <div className="flex items-center gap-8">
            <div>
              <h1 className="font-display text-2xl font-extrabold uppercase tracking-tight leading-tight text-paper">
                Mayyat
              </h1>
              <p className="text-xs uppercase tracking-wide text-accent-light/80">
                Death Records Registry
              </p>
            </div>

            <nav className="flex items-center gap-5">
              <button onClick={() => onNavigate("records")} className={navLinkClass(view === "records")}>
                Records
              </button>
              <button onClick={() => onNavigate("stats")} className={navLinkClass(view === "stats")}>
                Tally
              </button>
            </nav>
          </div>

          <div className="flex items-center gap-4">
            {user && (
              <div className="flex items-center gap-2 text-sm text-paper/90">
                <span>{user.name}</span>
                <span className="border border-accent-light/40 bg-ink-light px-2 py-0.5 text-xs font-medium uppercase tracking-wide text-accent-light">
                  {user.role}
                </span>
              </div>
            )}
            <button
              onClick={onLogout}
              className="border border-paper/20 px-4 py-1.5 text-sm font-medium text-paper transition-colors hover:bg-ink-light"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-8 py-8 md:px-12">{children}</main>
    </div>
  );
}