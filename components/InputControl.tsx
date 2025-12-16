import React from 'react';

interface InputControlProps {
  label: string;
  value: number;
  onChange: (val: number) => void;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  description?: string;
}

export const InputControl: React.FC<InputControlProps> = ({
  label,
  value,
  onChange,
  min = 0,
  max,
  step = 1,
  unit,
  description
}) => {
  return (
    <div className="mb-4">
      <div className="flex justify-between items-baseline mb-1">
        <label className="text-sm font-medium text-slate-700">{label}</label>
        {unit && <span className="text-xs text-slate-500">{unit}</span>}
      </div>
      <div className="flex items-center gap-2">
        <input
          type="range"
          min={min}
          max={max || 100}
          step={step}
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
        />
        <div className="relative w-24">
            <input
            type="number"
            value={value}
            onChange={(e) => onChange(parseFloat(e.target.value))}
            className="w-full px-3 py-1.5 text-right text-sm bg-white text-slate-900 border border-slate-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
        </div>
      </div>
      {description && <p className="mt-1 text-xs text-slate-400">{description}</p>}
    </div>
  );
};