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
          <p className="badge-accent">{badge}</p>
          <h1 className="page-title mt-3 sm:text-[2rem]">{title}</h1>
          {description && <p className="page-desc">{description}</p>}
          {meta && <div className="meta-badge mt-4">{meta}</div>}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
    </header>
  );
}
