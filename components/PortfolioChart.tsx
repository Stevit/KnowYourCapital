import React, { useState } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceArea,
  ReferenceLine
} from 'recharts';
import { YearlyData } from '../types';
import { Card } from './ui/Card';
import { Check, Circle } from 'lucide-react';

interface PortfolioChartProps {
  data: YearlyData[];
  onYearSelect?: (year: number) => void;
  selectionStart?: number;
  selectionEnd?: number;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const format = (val: number) => 
      new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(val);
    
    // Helper to safe get value from payload
    const getValue = (key: string) => {
        const item = payload.find((p: any) => p.dataKey === key);
        return item ? item.value : 0;
    };
    
    // Check which items are actually present in payload (visible)
    const hasReal = payload.some((p: any) => p.dataKey === 'inflationAdjustedValue');
    const hasInflation = payload.some((p: any) => p.dataKey === 'totalInflationLoss');
    const hasInvested = payload.some((p: any) => p.dataKey === 'totalInvested');

    const realValue = getValue('inflationAdjustedValue');
    const inflationLoss = getValue('totalInflationLoss');
    const invested = getValue('totalInvested');

    // Nominal Total is sum of stack components
    const nominalTotal = realValue + inflationLoss;

    return (
      <div className="bg-white/95 backdrop-blur-sm p-3 border border-slate-200 shadow-xl rounded-lg text-sm z-50 min-w-[200px]">
        <p className="font-bold text-slate-800 mb-2 border-b border-slate-100 pb-1">Anno {label}</p>
        
        {/* Show Nominal Total if at least one of its components is visible */}
        {(hasReal || hasInflation) && (
            <div className="flex items-center gap-2 mb-2 pb-2 border-b border-slate-100">
            <div className="w-2 h-2 rounded-full bg-blue-600"></div>
            <span className="text-slate-700 font-semibold">Totale Nominale:</span>
            <span className="font-mono font-bold text-blue-700 ml-auto">{format(nominalTotal)}</span>
            </div>
        )}

        {/* Breakdown */}
        <div className="space-y-1 mb-2">
            {hasReal && (
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                    <span className="text-slate-500 text-xs">Valore Reale:</span>
                    <span className="font-mono font-medium text-slate-700 ml-auto text-xs">{format(realValue)}</span>
                </div>
            )}
            {hasInflation && (
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-red-400"></div>
                    <span className="text-slate-500 text-xs">Inflazione (Erosione):</span>
                    <span className="font-mono font-medium text-red-500 ml-auto text-xs">{format(inflationLoss)}</span>
                </div>
            )}
        </div>
        
        {/* Invested */}
        {hasInvested && (
            <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
                <div className="w-2 h-2 rounded-full bg-slate-500"></div>
                <span className="text-slate-500 text-xs">Capitale Investito:</span>
                <span className="font-mono font-medium text-slate-700 ml-auto text-xs">{format(invested)}</span>
            </div>
        )}

        <p className="text-[10px] text-blue-400 mt-2 italic text-center">Clicca per selezionare periodo</p>
      </div>
    );
  }
  return null;
};

export const PortfolioChart: React.FC<PortfolioChartProps> = ({ 
  data, 
  onYearSelect, 
  selectionStart, 
  selectionEnd 
}) => {
  const [visibility, setVisibility] = useState({
    real: true,
    inflation: true,
    invested: true
  });

  const toggle = (key: keyof typeof visibility) => {
    setVisibility(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <Card title="Composizione Portafoglio" className="h-[450px] md:h-[550px]" fillHeight>
      
      {/* Visibility Controls */}
      <div className="flex flex-wrap gap-2 md:gap-4 mb-4 pb-2 border-b border-slate-50 flex-shrink-0">
        <button 
            onClick={() => toggle('real')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${
                visibility.real 
                ? 'bg-indigo-50 border-indigo-200 text-indigo-700 shadow-sm' 
                : 'bg-white border-slate-200 text-slate-400 hover:bg-slate-50'
            }`}
        >
            {visibility.real ? <Check size={14} className="text-indigo-600"/> : <Circle size={14} />}
            Valore Reale
        </button>

        <button 
            onClick={() => toggle('inflation')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${
                visibility.inflation 
                ? 'bg-red-50 border-red-200 text-red-700 shadow-sm' 
                : 'bg-white border-slate-200 text-slate-400 hover:bg-slate-50'
            }`}
        >
            {visibility.inflation ? <Check size={14} className="text-red-500"/> : <Circle size={14} />}
            Erosione Inflazione
        </button>

        <button 
            onClick={() => toggle('invested')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${
                visibility.invested 
                ? 'bg-slate-100 border-slate-200 text-slate-700 shadow-sm' 
                : 'bg-white border-slate-200 text-slate-400 hover:bg-slate-50'
            }`}
        >
            {visibility.invested ? <Check size={14} className="text-slate-600"/> : <Circle size={14} />}
            Capitale Investito
        </button>
      </div>

      <div className="w-full flex-1 min-h-0 relative">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            onClick={(e: any) => {
              if (e && e.activePayload && e.activePayload.length > 0) {
                const year = e.activePayload[0].payload.year;
                if (onYearSelect) onYearSelect(year);
              }
            }}
            margin={{
              top: 10,
              right: 10,
              left: 0,
              bottom: 0,
            }}
            style={{ cursor: 'pointer' }}
          >
            <defs>
              <linearGradient id="colorReal" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0.1}/>
              </linearGradient>
              <linearGradient id="colorInflation" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f87171" stopOpacity={0.6}/>
                <stop offset="95%" stopColor="#f87171" stopOpacity={0.1}/>
              </linearGradient>
              <linearGradient id="colorInvested" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#64748b" stopOpacity={0.4}/>
                <stop offset="95%" stopColor="#64748b" stopOpacity={0.05}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
            <XAxis 
                dataKey="year" 
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#64748b', fontSize: 12 }}
                tickMargin={10}
                minTickGap={30}
                tickFormatter={(val) => {
                    const item = data.find(d => d.year === val);
                    return item ? item.label : val;
                }}
            />
            <YAxis 
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#64748b', fontSize: 12 }}
                tickFormatter={(value) => `€${(value / 1000).toFixed(0)}k`}
                width={60}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#94a3b8', strokeWidth: 1, strokeDasharray: '4 4' }} />
            
            {selectionStart && (
                <ReferenceLine x={selectionStart} stroke="#3b82f6" strokeDasharray="3 3" />
            )}
            
            {selectionStart && selectionEnd && selectionStart < selectionEnd && (
                <ReferenceArea 
                    x1={selectionStart} 
                    x2={selectionEnd} 
                    fill="#3b82f6" 
                    fillOpacity={0.05} 
                />
            )}

            {/* STACKED AREAS: Real + Inflation = Nominal */}
            
            {/* 1. Real Value (Bottom of Stack) */}
            <Area
                type="monotone"
                dataKey="inflationAdjustedValue"
                name="Valore Reale (Potere d'acquisto)"
                stackId="1"
                stroke="#6366f1"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorReal)"
                animationDuration={300}
                hide={!visibility.real}
            />

            {/* 2. Inflation Loss (Top of Stack) */}
            <Area
                type="monotone"
                dataKey="totalInflationLoss"
                name="Erosione da Inflazione"
                stackId="1"
                stroke="#f87171"
                strokeWidth={1}
                strokeDasharray="2 2"
                fillOpacity={1}
                fill="url(#colorInflation)"
                animationDuration={300}
                hide={!visibility.inflation}
            />

            {/* 3. Invested (Overlay - No Stack) */}
            <Area
                type="stepAfter"
                dataKey="totalInvested"
                name="Capitale Investito"
                stroke="#64748b"
                strokeWidth={2}
                strokeDasharray="4 4"
                fillOpacity={1}
                fill="url(#colorInvested)"
                animationDuration={300}
                hide={!visibility.invested}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
};