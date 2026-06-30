import { Link } from 'react-router-dom';

interface PlaceholderPageProps {
  title: string;
  icon: string;
  description: string;
  phase: number;
}

export default function PlaceholderPage({ title, icon, description, phase }: PlaceholderPageProps) {
  return (
    <div className="px-4 pt-6 pb-4">
      <div className="flex items-center gap-3 mb-6">
        <Link to="/dashboard" className="w-9 h-9 bg-background-100 rounded-lg flex items-center justify-center hover:bg-background-200 transition-colors cursor-pointer shrink-0">
          <i className="ri-arrow-left-line text-foreground-600"></i>
        </Link>
        <h1 className="text-lg font-heading font-bold text-foreground-950">{title}</h1>
      </div>

      <div className="flex flex-col items-center justify-center py-16 text-center">
        <span className="w-20 h-20 bg-accent-100 rounded-2xl flex items-center justify-center mb-5">
          <i className={`${icon} text-3xl text-accent-500`}></i>
        </span>
        <h2 className="text-base font-heading font-semibold text-foreground-950 mb-1">{title}</h2>
        <p className="text-sm text-foreground-500 max-w-xs mb-6">{description}</p>
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-secondary-100 rounded-full">
          <span className="w-5 h-5 bg-secondary-500 rounded-full flex items-center justify-center">
            <i className="ri-time-line text-xs text-white"></i>
          </span>
          <span className="text-xs font-medium text-secondary-700">Sẽ có trong Phase {phase}</span>
        </div>
      </div>
    </div>
  );
}