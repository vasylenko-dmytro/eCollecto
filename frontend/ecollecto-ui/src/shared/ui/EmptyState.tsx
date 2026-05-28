import { Link } from 'react-router-dom';

interface EmptyStateProps {
  icon: string;
  title: string;
  description: string;
  ctaLabel: string;
  ctaTo: string;
}

export function EmptyState({ icon, title, description, ctaLabel, ctaTo }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="text-6xl mb-6">{icon}</div>
      <h2 className="text-2xl font-bold text-white mb-3">{title}</h2>
      <p className="text-gray-400 mb-8 max-w-md">{description}</p>
      <Link
        to={ctaTo}
        className="px-6 py-3 bg-yellow-400 text-black font-semibold rounded hover:bg-yellow-300 transition-colors"
      >
        {ctaLabel}
      </Link>
    </div>
  );
}

