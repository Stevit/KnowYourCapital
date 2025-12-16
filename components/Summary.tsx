import React from 'react';
import { YearlyData } from '../types';
import { ArrowUpRight, PiggyBank, Receipt, Wallet, TrendingDown, Sun, Coins } from 'lucide-react';

interface SummaryProps {
  data: YearlyData[];
  initialCapital: number;
  targetMonthlyIncome?: number;
}

export const Summary: React.FC<SummaryProps> = ({ data, initialCapital, targetMonthlyIncome = 0 }) => {
  if (!data.length) return null;
  
  const final = data[data.length - 1];
  const totalGrowth = final.portfolioValue - final.totalInvested;
  const growthPercentage = final.totalInvested > 0 
    ? (totalGrowth / final.totalInvested) * 100 
    : 0;

  const totalTax = data.reduce((acc, curr) => acc + curr.yearlyTax, 0);
  const inflationLoss = final.portfolioValue - final.inflationAdjustedValue;

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(val);

  // Calculate Financial Freedom Year
  const freedomData = data.find(d => (d.netGrowth / 12) >= targetMonthlyIncome && d.year > 0);
  const maxMonthlyIncomeReached = Math.max(...data.map(d => d.netGrowth / 12));
  const progressPercent = Math.min((maxMonthlyIncomeReached / targetMonthlyIncome) * 100, 100);

  return (
    <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
      
      {/* Financial Freedom Card */}
      {targetMonthlyIncome > 0 && (
          <div className={`col-span-2 lg:col-span-3 p-3 rounded-xl shadow-sm border border-slate-200 flex items-center justify-between relative overflow-hidden ${freedomData ? 'bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200' : 'bg-white'}`}>
            <div className="z-10 w-full">
                <div className="flex items-center gap-2 mb-2">
                    <div className="p-1.5 bg-amber-100 text-amber-600 rounded-lg">
                        <Sun size={16} />
                    </div>
                    <span className="text-xs font-bold text-amber-800 uppercase tracking-wide">
                        Obiettivo Rendita: {formatCurrency(targetMonthlyIncome)}/mese
                    </span>
                </div>
                
                <div className="flex items-end justify-between">
                    <div>
                        {freedomData ? (
                            <>
                                <p className="text-xl font-bold text-slate-800">
                                    Raggiunto nel <span className="text-amber-600">{freedomData.label}</span>
                                </p>
                                <p className="text-[10px] text-slate-500">
                                    Tra {freedomData.year} anni il portafoglio genererà {formatCurrency(freedomData.netGrowth/12)}/mese
                                </p>
                            </>
                        ) : (
                            <>
                                <p className="text-sm font-semibold text-slate-600">
                                    Obiettivo non raggiunto
                                </p>
                                <p className="text-[10px] text-slate-400">
                                    Massimo raggiunto: {formatCurrency(maxMonthlyIncomeReached)}/mese
                                </p>
                            </>
                        )}
                    </div>
                    
                    {/* Progress Bar */}
                    <div className="w-1/3 flex flex-col items-end">
                         <span className="text-[10px] font-bold text-slate-500 mb-1">{progressPercent.toFixed(0)}%</span>
                         <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                            <div 
                                className={`h-full rounded-full transition-all duration-1000 ${freedomData ? 'bg-amber-500' : 'bg-slate-400'}`} 
                                style={{ width: `${progressPercent}%` }}
                            ></div>
                         </div>
                    </div>
                </div>
            </div>
          </div>
      )}

      {/* 1. Nominal Value */}
      <div className="bg-white p-3 rounded-xl shadow-sm border border-slate-200 lg:col-span-1">
        <div className="flex items-center gap-2 mb-1">
            <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
                <Wallet size={16} />
            </div>
            <span className="text-xs text-slate-500 font-medium">Valore Nominale</span>
        </div>
        <p className="text-xl font-bold text-slate-900">{formatCurrency(final.portfolioValue)}</p>
        <p className="text-[10px] text-slate-400">Cifra numerica (Lorda Inflazione)</p>
      </div>

      {/* 2. REAL VALUE (New Card) */}
      <div className="bg-white p-3 rounded-xl shadow-sm border border-indigo-200 lg:col-span-1">
         <div className="flex items-center gap-2 mb-1">
            <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
                <Coins size={16} />
            </div>
            <span className="text-xs text-slate-500 font-medium">Valore Reale</span>
        </div>
        <p className="text-xl font-bold text-indigo-700">{formatCurrency(final.inflationAdjustedValue)}</p>
        <p className="text-[10px] text-indigo-300">Potere d'acquisto effettivo</p>
      </div>

      {/* 3. Net Profit */}
      <div className="bg-white p-3 rounded-xl shadow-sm border border-slate-200 lg:col-span-1">
        <div className="flex items-center gap-2 mb-1">
            <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg">
                <ArrowUpRight size={16} />
            </div>
            <span className="text-xs text-slate-500 font-medium">Guadagno Netto</span>
        </div>
        <p className={`text-xl font-bold ${totalGrowth >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
            {totalGrowth >= 0 ? '+' : ''}{formatCurrency(totalGrowth)}
        </p>
        <p className={`text-[10px] font-medium ${growthPercentage >= 0 ? 'text-emerald-500' : 'text-red-400'}`}>
             {growthPercentage.toFixed(1)}% ROI
        </p>
      </div>

      {/* 4. Invested */}
      <div className="bg-white p-3 rounded-xl shadow-sm border border-slate-200 lg:col-span-1">
        <div className="flex items-center gap-2 mb-1">
            <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
                <PiggyBank size={16} />
            </div>
            <span className="text-xs text-slate-500 font-medium">Investito</span>
        </div>
        <p className="text-xl font-bold text-slate-900">{formatCurrency(final.totalInvested)}</p>
        <p className="text-[10px] text-slate-400">Prelievi: {formatCurrency(final.totalWithdrawn)}</p>
      </div>

      {/* 5. Taxes */}
      <div className="bg-white p-3 rounded-xl shadow-sm border border-slate-200 lg:col-span-1 md:col-span-1">
        <div className="flex items-center gap-2 mb-1">
            <div className="p-1.5 bg-amber-50 text-amber-600 rounded-lg">
                <Receipt size={16} />
            </div>
            <span className="text-xs text-slate-500 font-medium">Tasse Totali</span>
        </div>
        <p className="text-lg font-bold text-slate-900">{formatCurrency(totalTax)}</p>
        <p className="text-[10px] text-slate-400">Stimato</p>
      </div>

      {/* 6. Inflation Loss */}
      <div className="bg-white p-3 rounded-xl shadow-sm border border-slate-200 lg:col-span-1 md:col-span-1">
        <div className="flex items-center gap-2 mb-1">
            <div className="p-1.5 bg-red-50 text-red-600 rounded-lg">
                <TrendingDown size={16} />
            </div>
            <span className="text-xs text-slate-500 font-medium">Persi per Inflazione</span>
        </div>
        <div className="flex items-baseline justify-between">
            <p className="text-lg font-bold text-red-600">-{formatCurrency(inflationLoss)}</p>
            <p className="text-[10px] text-slate-400">Erosione</p>
        </div>
      </div>
    </div>
  );
};