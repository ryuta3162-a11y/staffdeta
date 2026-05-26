import type { ReactNode } from "react";

interface FormSectionProps {
  step: string;
  label: string;
  hint?: string;
  children: ReactNode;
}

export function FormSection({ step, label, hint, children }: FormSectionProps) {
  return (
    <section className="border-t border-[var(--border)] pt-6 first:border-t-0 first:pt-0">
      <div className="mb-4 flex items-baseline gap-3">
        <span className="text-base font-medium text-[var(--accent-muted)]">
          {step}
        </span>
        <div>
          <h2 className="text-[0.9375rem] font-semibold text-[var(--ink)]">{label}</h2>
          {hint && (
            <p className="mt-0.5 text-[0.8125rem] leading-relaxed text-[var(--muted)]">
              {hint}
            </p>
          )}
        </div>
      </div>
      {children}
    </section>
  );
}
