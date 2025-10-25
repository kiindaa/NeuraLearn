import React from 'react';

export type KpiVariant = 'sky' | 'emerald' | 'orange' | 'purple' | 'blue';

const variantStyles: Record<KpiVariant, { border: string; tint: string; iconColor: string }> = {
  sky: { border: 'border-sky-200', tint: 'from-sky-50 to-white', iconColor: 'text-sky-600' },
  emerald: { border: 'border-emerald-200', tint: 'from-emerald-50 to-white', iconColor: 'text-emerald-600' },
  orange: { border: 'border-amber-200', tint: 'from-amber-50 to-white', iconColor: 'text-amber-600' },
  purple: { border: 'border-purple-200', tint: 'from-purple-50 to-white', iconColor: 'text-purple-600' },
  blue: { border: 'border-blue-200', tint: 'from-blue-50 to-white', iconColor: 'text-blue-600' },
};

interface KpiTileProps {
  label: string;
  value: string | number;
  variant?: KpiVariant;
  icon?: React.ReactNode;
  onClick?: () => void;
  className?: string;
}

export const KpiTile: React.FC<KpiTileProps> = ({ label, value, variant = 'sky', icon, onClick, className = '' }) => {
  const v = variantStyles[variant];
  const content = (
    <div className={`rounded-xl border bg-gradient-to-br ${v.tint} ${v.border} p-4`}>
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <p className="text-xs text-gray-600">{label}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
        {icon ? <div className={`p-2 rounded-lg ${v.iconColor} bg-white/70`}>{icon}</div> : null}
      </div>
    </div>
  );

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={`text-left w-full ${className}`}>
        {content}
      </button>
    );
  }
  return <div className={className}>{content}</div>;
};

export default KpiTile;
