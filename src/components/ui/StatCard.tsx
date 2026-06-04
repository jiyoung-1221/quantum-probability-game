import type { ReactNode } from 'react';

type StatCardProps = {
  label: string;
  value: string;
  tone: 'blue' | 'green' | 'orange';
  children?: ReactNode;
};

const toneClasses = {
  blue: 'border-blue-200 bg-blue-50 text-blue-700',
  green: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  orange: 'border-orange-200 bg-orange-50 text-orange-700',
};

export function StatCard({ label, value, tone, children }: StatCardProps) {
  return (
    <article className={`rounded-lg border p-4 ${toneClasses[tone]}`}>
      <p className="text-sm font-semibold">{label}</p>
      <p className="mt-2 text-2xl font-bold">{value}</p>
      {children ? <div className="mt-3 text-sm text-slate-600">{children}</div> : null}
    </article>
  );
}
