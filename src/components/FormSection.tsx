import type { ReactNode } from "react";

interface FormSectionProps {
  step: string;
  label: string;
  hint?: string;
  children: ReactNode;
}

export function FormSection({ step, label, hint, children }: FormSectionProps) {
  return (
    <section className="section-divider pt-6 first:border-t-0 first:pt-0">
      <div className="mb-4 flex items-start gap-3">
        <span className="step-marker">{step}</span>
        <div>
          <h2 className="section-label">{label}</h2>
          {hint && <p className="section-hint">{hint}</p>}
        </div>
      </div>
      {children}
    </section>
  );
}
