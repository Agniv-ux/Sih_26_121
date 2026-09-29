import type { ReactNode } from 'react';

export default function PageHeader({ title, subtitle, right }: { title: string; subtitle?: ReactNode; right?: ReactNode }) {
  return (
    <div className="mb-3 flex items-end justify-between gap-4">
      <div>
        <h1 className="text-[1.35rem] font-semibold text-ink">{title}</h1>
        {subtitle && <p className="mt-0.5 text-[0.9rem] text-muted">{subtitle}</p>}
      </div>
      {right}
    </div>
  );
}
