import React from 'react';

interface InfoBlockProps {
  label: string;
  value: string | number | null | undefined;
}

export default function InfoBlock({ label, value }: InfoBlockProps) {
  return (
    <div className="flex items-center justify-between border-b border-gray-100 dark:border-neutral-700/50 pb-2 last:border-0">
      <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">
        {label}
      </span>
      <p className="text-gray-900 dark:text-white font-bold">
        {value === -1 ? 'Mass-issue' : value || 'N/A'}
      </p>
    </div>
  );
}