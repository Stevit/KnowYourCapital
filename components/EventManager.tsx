import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Trash2, TrendingUp, TrendingDown, Calendar, Repeat, Landmark, MousePointerClick, Zap } from 'lucide-react';
import { FinancialEvent, EventType } from '../types';
import { Card } from './ui/Card';

interface EventManagerProps {
  events: FinancialEvent[];
  onAddEvent: (event: FinancialEvent) => void;
  onRemoveEvent: (id: string) => void;
  maxYears: number;
  selectionStart: number;
  selectionEnd: number;
  startYear: number;
  onStartChange: (year: number) => void;
  onEndChange: (year: number) => void;
}

export const EventManager: React.FC<EventManagerProps> = ({ 
  events, 
  onAddEvent, 
  onRemoveEvent, 
  maxYears,
  selectionStart,
  selectionEnd,
  startYear,
  onStartChange,
  onEndChange
}) => {
  const [amount, setAmount] = useState<number>(10000);
  const [type, setType] = useState<EventType>(EventType.DEPOSIT);
  const [isRecurring, setIsRecurring] = useState<boolean>(false);
  
  // Loan specific states
  const [loanInterest, setLoanInterest] = useState<number>(5);
  const [loanDuration, setLoanDuration] = useState<number>(10);

  // Sync isRecurring based on selection range (UX enhancement)
  useEffect(() => {
     if (selectionEnd > selectionStart) {
         setIsRecurring(true);
     }
  }, [selectionStart, selectionEnd]);

  // Calculate estimated payment for preview
  const estimatedPayment = useMemo(() => {
    if (type !== EventType.LOAN && type !== EventType.LEVERAGE_LOAN) return 0;
    if (amount <= 0 || loanDuration <= 0) return 0;

    const rate = loanInterest / 100;
    let annualPmt = 0;
    
    if (rate === 0) {
        annualPmt = amount / loanDuration;
    } else {
        annualPmt = amount * (rate * Math.pow(1 + rate, loanDuration)) / (Math.pow(1 + rate, loanDuration) - 1);
    }
    return annualPmt;
  }, [amount, loanInterest, loanDuration, type]);

  const handleAdd = () => {
    const isLoanType = type === EventType.LOAN || type === EventType.LEVERAGE_LOAN;

    const newEvent: FinancialEvent = {
      id: Math.random().toString(36).substr(2, 9),
      year: selectionStart,
      amount,
      type,
      isRecurring: isLoanType ? false : isRecurring, 
      recurringEndYear: (!isLoanType && isRecurring) ? selectionEnd : undefined,
      loanInterestRate: isLoanType ? loanInterest : undefined,
      loanDurationYears: isLoanType ? loanDuration : undefined,
    };
    onAddEvent(newEvent);
    setIsRecurring(false);
  };

  const sortedEvents = [...events].sort((a, b) => a.year - b.year);
  
  const isLoanType = type === EventType.LOAN || type === EventType.LEVERAGE_LOAN;

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(val);

  return (
    <Card title="Movimenti Extra" className="h-[600px]" fillHeight>
      <div className="space-y-4 flex-shrink-0 mb-4">
        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-3">
          
          {/* Type Selector */}
          <div>
              <div className="flex bg-white rounded-md border border-slate-200 p-1 gap-1">
                  <button
                      onClick={() => setType(EventType.DEPOSIT)}
                      className={`flex-1 text-[10px] py-1.5 px-1 rounded flex items-center justify-center gap-1 font-medium transition-colors ${type === EventType.DEPOSIT ? 'bg-emerald-100 text-emerald-700' : 'text-slate-500 hover:bg-slate-50'}`}
                  >
                      <TrendingUp size={12} /> Versa
                  </button>
                  <button
                      onClick={() => setType(EventType.WITHDRAWAL)}
                      className={`flex-1 text-[10px] py-1.5 px-1 rounded flex items-center justify-center gap-1 font-medium transition-colors ${type === EventType.WITHDRAWAL ? 'bg-amber-100 text-amber-700' : 'text-slate-500 hover:bg-slate-50'}`}
                  >
                      <TrendingDown size={12} /> Preleva
                  </button>
                   <button
                      onClick={() => setType(EventType.LOAN)}
                      className={`flex-1 text-[10px] py-1.5 px-1 rounded flex items-center justify-center gap-1 font-medium transition-colors ${type === EventType.LOAN ? 'bg-indigo-100 text-indigo-700' : 'text-slate-500 hover:bg-slate-50'}`}
                  >
                      <Landmark size={12} /> Prestito
                  </button>
                  <button
                      onClick={() => setType(EventType.LEVERAGE_LOAN)}
                      className={`flex-1 text-[10px] py-1.5 px-1 rounded flex items-center justify-center gap-1 font-medium transition-colors ${type === EventType.LEVERAGE_LOAN ? 'bg-fuchsia-100 text-fuchsia-700' : 'text-slate-500 hover:bg-slate-50'}`}
                      title="Prestito per Reinvestimento (Paga col PAC)"
                  >
                      <Zap size={12} /> Leva Fin.
                  </button>
              </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
             <div>
                <label className="block text-[10px] font-medium text-slate-500 mb-1">Importo (€)</label>
                <input 
                    type="number" 
                    min={0}
                    step={100}
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    className="w-full px-2 py-1.5 text-sm bg-white text-slate-900 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
             </div>
             <div>
                 <label className="block text-[10px] font-medium text-slate-500 mb-1 flex items-center gap-1">
                    {isRecurring && !isLoanType ? 'Inizio' : 'Anno'} 
                    <MousePointerClick size={10} className="text-blue-500"/>
                 </label>
                 <div className="relative">
                    <Calendar className="absolute left-2 top-2 text-slate-400" size={12} />
                    <input 
                        type="number" 
                        min={1} 
                        max={maxYears} 
                        value={selectionStart}
                        onChange={(e) => onStartChange(Number(e.target.value))}
                        className="w-full pl-6 pr-2 py-1.5 text-sm bg-white text-slate-900 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold text-blue-700"
                    />
                 </div>
            </div>
          </div>

          {/* Loan Specific Inputs (Shared for both Loan types) */}
          {isLoanType && (
             <div className={`p-3 rounded border animate-in fade-in slide-in-from-top-2 ${type === EventType.LEVERAGE_LOAN ? 'bg-fuchsia-50 border-fuchsia-100' : 'bg-indigo-50 border-indigo-100'}`}>
                <div className="text-[10px] opacity-75 mb-2 italic">
                    {type === EventType.LEVERAGE_LOAN 
                        ? "La rata verrà sottratta dal PAC mensile."
                        : "La rata verrà prelevata dal saldo portafoglio."}
                </div>
                
                <div className="grid grid-cols-2 gap-2 mb-2">
                    <div>
                        <label className={`block text-[10px] font-medium mb-1 ${type === EventType.LEVERAGE_LOAN ? 'text-fuchsia-700' : 'text-indigo-700'}`}>Interesse (%)</label>
                        <input 
                            type="number" 
                            min={0}
                            max={100}
                            step={0.1}
                            value={loanInterest}
                            onChange={(e) => setLoanInterest(Number(e.target.value))}
                            className="w-full px-2 py-1 text-sm bg-white border border-slate-200 rounded focus:ring-2"
                        />
                    </div>
                    <div>
                        <label className={`block text-[10px] font-medium mb-1 ${type === EventType.LEVERAGE_LOAN ? 'text-fuchsia-700' : 'text-indigo-700'}`}>Durata (Anni)</label>
                        <input 
                            type="number" 
                            min={1}
                            max={30}
                            value={loanDuration}
                            onChange={(e) => setLoanDuration(Number(e.target.value))}
                            className="w-full px-2 py-1 text-sm bg-white border border-slate-200 rounded focus:ring-2"
                        />
                    </div>
                </div>

                {/* Payment Preview */}
                <div className="pt-2 border-t border-slate-200/50 flex justify-between items-end">
                    <span className="text-[10px] font-medium text-slate-500">Rata stimata:</span>
                    <div className="text-right">
                        <div className={`text-sm font-bold ${type === EventType.LEVERAGE_LOAN ? 'text-fuchsia-700' : 'text-indigo-700'}`}>
                            {formatCurrency(estimatedPayment)} <span className="text-[10px] font-normal text-slate-400">/anno</span>
                        </div>
                        <div className="text-[10px] text-slate-500">
                            ~{formatCurrency(estimatedPayment/12)} /mese
                        </div>
                    </div>
                </div>
             </div>
          )}

          {/* Recurring Checkbox (Hidden for Loans) */}
          {!isLoanType && (
            <>
              <div className="flex items-center gap-2 pt-1">
                <input 
                    type="checkbox" 
                    id="recurring"
                    checked={isRecurring}
                    onChange={(e) => setIsRecurring(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <label htmlFor="recurring" className="text-xs text-slate-700 font-medium select-none flex items-center gap-1">
                    <Repeat size={12} /> Ripeti in sequenza
                </label>
              </div>

              {isRecurring && (
                <div className="bg-blue-50 p-2 rounded border border-blue-100 animate-in fade-in slide-in-from-top-2">
                    <label className="block text-[10px] font-medium text-blue-700 mb-1 flex items-center gap-1">
                        Fino all'anno (relativo)
                    </label>
                    <input 
                        type="number" 
                        min={selectionStart} 
                        max={maxYears}
                        value={selectionEnd > maxYears ? maxYears : selectionEnd}
                        onChange={(e) => onEndChange(Number(e.target.value))}
                        className="w-full px-2 py-1 text-sm bg-white text-slate-900 border border-blue-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 font-bold text-blue-700"
                    />
                    <div className="text-[10px] text-right text-blue-400 mt-1">
                        Fino al {startYear + (selectionEnd > maxYears ? maxYears : selectionEnd)}
                    </div>
                </div>
              )}
            </>
          )}

          <button 
            onClick={handleAdd}
            className={`w-full text-white text-sm font-medium py-2 rounded-md flex items-center justify-center gap-2 transition-colors shadow-sm ${
                type === EventType.LEVERAGE_LOAN ? 'bg-fuchsia-600 hover:bg-fuchsia-700' : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            <Plus size={16} /> Aggiungi
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar space-y-2 border-t border-slate-100 pt-2">
            {sortedEvents.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-slate-300">
                    <MousePointerClick size={32} strokeWidth={1.5} className="mb-2 opacity-50"/>
                    <p className="text-xs text-center italic">Nessun movimento<br/>pianificato</p>
                </div>
            )}
            {sortedEvents.map(event => (
                <div key={event.id} className="flex items-center justify-between p-2.5 bg-white border border-slate-100 rounded-lg group hover:border-slate-300 transition-colors shadow-sm relative">
                    <div className="flex items-center gap-2.5">
                        <div className={`p-1.5 rounded-full flex-shrink-0 ${
                            event.type === EventType.DEPOSIT ? 'bg-emerald-50 text-emerald-600' : 
                            event.type === EventType.LOAN ? 'bg-indigo-50 text-indigo-600' :
                            event.type === EventType.LEVERAGE_LOAN ? 'bg-fuchsia-50 text-fuchsia-600' :
                            'bg-amber-50 text-amber-600'
                        }`}>
                            {event.type === EventType.DEPOSIT ? <TrendingUp size={12} /> : 
                             event.type === EventType.LOAN ? <Landmark size={12} /> :
                             event.type === EventType.LEVERAGE_LOAN ? <Zap size={12} /> :
                             <TrendingDown size={12} />}
                        </div>
                        <div className="min-w-0">
                             <div className="flex items-center gap-1 text-[10px] text-slate-500">
                                <span className="font-bold text-slate-600">{startYear + event.year}</span>
                                {event.isRecurring && (
                                    <span className="flex items-center text-blue-500">
                                        ➝ {startYear + (event.recurringEndYear || 0)}
                                    </span>
                                )}
                            </div>
                            <p className="text-xs font-semibold text-slate-700 truncate">
                                {event.type === EventType.DEPOSIT ? 'Versamento' : 
                                 event.type === EventType.LOAN ? 'Prestito (Prelievo)' : 
                                 event.type === EventType.LEVERAGE_LOAN ? 'Leva (Dal PAC)' :
                                 'Prelievo'}
                            </p>
                        </div>
                    </div>
                    <div className="flex flex-col items-end">
                        <span className={`text-xs font-mono font-medium ${
                                event.type === EventType.DEPOSIT || event.type.includes('LOAN') ? 'text-emerald-600' : 'text-amber-600'
                            }`}>
                            {event.type === EventType.WITHDRAWAL ? '-' : '+'}{event.amount >= 1000 ? (event.amount/1000).toFixed(0) + 'k' : event.amount}
                        </span>
                         <button 
                            onClick={() => onRemoveEvent(event.id)}
                            className="text-slate-300 hover:text-red-500 transition-colors mt-1"
                        >
                            <Trash2 size={12} />
                        </button>
                    </div>
                </div>
            ))}
        </div>
    </Card>
  );
};