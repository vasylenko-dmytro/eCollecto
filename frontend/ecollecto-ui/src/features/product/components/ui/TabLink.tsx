import React from 'react';

interface TabLinkProps {
  label: string;
  active: boolean;
  onClick: () => void;
}

export default function TabLink({ label, active, onClick }: TabLinkProps) {
  return (
    <button
      onClick={onClick}
      className={`group flex items-center justify-between px-6 py-5 rounded-2xl font-bold transition-all duration-300 text-left ${
        active
          ? 'bg-blue-900 text-white shadow-xl translate-x-3 scale-105'
          : 'text-gray-600 dark:text-neutral-400 hover:bg-gray-100 dark:hover:bg-neutral-800'
      }`}
    >
      <span>{label}</span>
      {/* Arrow Icon */}
      <svg
        className={`size-5 transition-transform duration-300 ${
          active ? 'translate-x-0 opacity-100' : '-translate-x-2 opacity-0'
        }`}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2.5"
          d="M9 5l7 7-7 7"
        />
      </svg>
    </button>
  );
}