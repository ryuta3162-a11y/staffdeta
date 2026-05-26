import type { ReactNode } from "react";

interface PageHeaderProps {
  badge?: string;
  title: string;
  description?: string;
  meta?: ReactNode;
  action?: ReactNode;
}

export function PageHeader({
  badge = "Nice Place Share",
  title,
  description,
  meta,
  action,
}: PageHeaderProps) {
  return (
    <header className="mb-10">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.22em] text-[var(--accent-muted)]">
            {badge}
          </p>
          <h1 className="mt-3 text-[1.75rem] font-bold leading-tight tracking-tight text-[var(--ink)] sm:text-[2rem]">
            {title}
          </h1>
          {description && (
            <p className="mt-3 max-w-md text-[0.9375rem] leading-relaxed text-[var(--muted)]">
              {description}
            </p>
          )}
          {meta && (
            <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-white/70 px-3.5 py-1.5 text-[0.8125rem] text-[var(--muted)]">
              {meta}
            </div>
          )}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
    </header>
  );
}
