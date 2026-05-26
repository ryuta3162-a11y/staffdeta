import type { ReactNode } from "react";

interface PageHeaderProps {
  badge?: string;
  title: string;
  description?: string;
  meta?: ReactNode;
  action?: ReactNode;
}

export function PageHeader({
  badge = "Nice Play Share",
  title,
  description,
  meta,
  action,
}: PageHeaderProps) {
  return (
    <header className="page-header">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="header-brand">
            <span className="header-brand-line" aria-hidden="true" />
            <p className="header-brand-text">{badge}</p>
          </div>
          <h1 className="page-title">{title}</h1>
          {description && <p className="page-desc">{description}</p>}
          {meta && <div className="meta-badge mt-5">{meta}</div>}
        </div>
        {action && <div className="shrink-0 pt-1">{action}</div>}
      </div>
    </header>
  );
}
