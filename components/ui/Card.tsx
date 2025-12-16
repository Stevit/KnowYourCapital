import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  fillHeight?: boolean;
}

export const Card: React.FC<CardProps> = ({ children, className = '', title, fillHeight = false }) => {
  return (
    <div className={`bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col ${className}`}>
      {title && (
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex-shrink-0">
          <h3 className="font-semibold text-slate-800">{title}</h3>
        </div>
      )}
      <div className={`p-6 ${fillHeight ? 'flex-1 flex flex-col min-h-0' : ''}`}>
        {children}
      </div>
    </div>
  );
};