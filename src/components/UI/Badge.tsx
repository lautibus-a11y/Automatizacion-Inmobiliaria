import type { ReactNode } from 'react';

const colorMap: Record<string, string> = {
  excelente: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
  muy_bueno: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  bueno: 'bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-400',
  regular: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
  malo: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  bajo: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
  medio: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
  alto: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  living: 'bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-400',
  cocina: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
  dormitorio: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400',
  bano: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-400',
  default: 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300',
};

interface Props {
  children: ReactNode;
  variant?: string;
  className?: string;
}

export function Badge({ children, variant, className = '' }: Props) {
  const color = colorMap[variant || ''] || colorMap.default;
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${color} ${className}`}>
      {children}
    </span>
  );
}
