import type { ReactNode } from 'react';

interface Props {
  children: ReactNode;
  className?: string;
  padding?: boolean;
}

export function Card({ children, className = '', padding = true }: Props) {
  return (
    <div className={`bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl ${padding ? 'p-6' : ''} ${className}`}>
      {children}
    </div>
  );
}
