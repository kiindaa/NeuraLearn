import React from 'react';

export type KpiVariant = 'sky' | 'emerald' | 'orange' | 'purple' | 'blue';

const variantStyles: Record<KpiVariant, { border: string; tint: string; iconColor: string; hoverBorder: string; shadowColor: string }> = {
  sky: { border: 'border-sky-200', tint: 'from-sky-50 to-white', iconColor: 'text-sky-600', hoverBorder: 'hover:border-sky-300', shadowColor: 'hover:shadow-sky-200/50' },
  emerald: { border: 'border-emerald-200', tint: 'from-emerald-50 to-white', iconColor: 'text-emerald-600', hoverBorder: 'hover:border-emerald-300', shadowColor: 'hover:shadow-emerald-200/50' },
  orange: { border: 'border-amber-200', tint: 'from-amber-50 to-white', iconColor: 'text-amber-600', hoverBorder: 'hover:border-amber-300', shadowColor: 'hover:shadow-amber-200/50' },
  purple: { border: 'border-purple-200', tint: 'from-purple-50 to-white', iconColor: 'text-purple-600', hoverBorder: 'hover:border-purple-300', shadowColor: 'hover:shadow-purple-200/50' },
  blue: { border: 'border-blue-200', tint: 'from-blue-50 to-white', iconColor: 'text-blue-600', hoverBorder: 'hover:border-blue-300', shadowColor: 'hover:shadow-blue-200/50' },
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
  const isClickable = !!onClick;
  
  const content = (
    <div className={`
      rounded-xl border bg-gradient-to-br ${v.tint} ${v.border} p-4
      transition-all duration-200 ease-in-out
      hover:shadow-lg ${v.shadowColor} ${v.hoverBorder} hover:-translate-y-1
      ${isClickable ? 'cursor-pointer active:translate-y-0 active:shadow-md active:brightness-95' : ''}
    `}>
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <p className="text-xs text-gray-600">{label}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
        {icon ? <div className={`p-2 rounded-lg ${v.iconColor} bg-white/70 transition-transform duration-200 group-hover:scale-110`}>{icon}</div> : null}
      </div>
    </div>
  );

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={`text-left w-full group ${className}`}>
        {content}
      </button>
    );
  }
  return <div className={`group ${className}`}>{content}</div>;
};

export default KpiTile;
