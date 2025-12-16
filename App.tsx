import React, { useState, useMemo } from "react";
import { SimulationParams, FinancialEvent, EventType } from "./types";
import { calculateProjection } from "./services/calculator";
import { Card } from "./components/ui/Card";
import { InputControl } from "./components/InputControl";
import { EventManager } from "./components/EventManager";
import { PortfolioChart } from "./components/PortfolioChart";
import { Summary } from "./components/Summary";
import {
  Calculator,
  HelpCircle,
  Download,
  FileJson,
  Copy,
  Check,
  FileText,
} from "lucide-react";

// Error Boundary Component
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("App Error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: "20px", color: "red", fontFamily: "monospace" }}>
          <h1>Application Error</h1>
          <p>{this.state.error?.message || "Unknown error occurred"}</p>
        </div>
      );
    }

    return this.props.children;
  }
}

const App: React.FC = () => {
  // Global Simulation State
  const [params, setParams] = useState<SimulationParams>({
    startYear: new Date().getFullYear(),
    initialCapital: 0,
    monthlyContribution: 1000, // Default PAC value
    adjustContributionForInflation: true, // Default enabled
    annualReturnRate: 10,
    isTaxEnabled: false, // Default disabled
    taxRate: 26, // Italy Capital Gain standard (kept in state but disabled)
    taxAdjustedForInflation: false, // New: Default disabled
    durationYears: 50,
    inflationRate: 3,
    targetMonthlyIncome: 2000, // Default target passive income
  });

  const [events, setEvents] = useState<FinancialEvent[]>([]);

  // State for interaction between Chart and EventManager
  const [selectionStart, setSelectionStart] = useState<number>(1);
  const [selectionEnd, setSelectionEnd] = useState<number>(5);
  const [copied, setCopied] = useState(false);

  // Derived Data
  const chartData = useMemo(
    () => calculateProjection(params, events),
    [params, events]
  );

  // JSON representation of current state for export
  const configString = useMemo(
    () => JSON.stringify({ params, events }, null, 2),
    [params, events]
  );

  // Handlers
  const updateParam = (
    key: keyof SimulationParams,
    value: number | boolean
  ) => {
    setParams((prev) => ({ ...prev, [key]: value }));
  };

  const addEvent = (event: FinancialEvent) => {
    setEvents((prev) => [...prev, event]);
  };

  const removeEvent = (id: string) => {
    setEvents((prev) => prev.filter((e) => e.id !== id));
  };

  const handleChartYearSelect = (year: number) => {
    if (year <= 0 || year > params.durationYears) return;

    if (year < selectionStart) {
      setSelectionStart(year);
    } else if (year > selectionStart) {
      setSelectionEnd(year);
    }
  };

  const downloadCSV = () => {
    const headers = [
      "Anno",
      "Etichetta",
      "Valore Portafoglio",
      "Capitale Investito",
      "Prelievi Totali",
      "Profitto Annuo",
      "Tasse",
      "Valore Reale (Inflazione)",
    ];
    const rows = chartData.map((row) => [
      row.year,
      row.label,
      row.portfolioValue.toFixed(2),
      row.totalInvested.toFixed(2),
      row.totalWithdrawn.toFixed(2),
      row.yearlyProfit.toFixed(2),
      row.yearlyTax.toFixed(2),
      row.inflationAdjustedValue.toFixed(2),
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      headers.join(",") +
      "\n" +
      rows.map((e) => e.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `know_your_capital_data_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadTextReport = () => {
    const {
      startYear,
      initialCapital,
      monthlyContribution,
      adjustContributionForInflation,
      annualReturnRate,
      isTaxEnabled,
      taxRate,
      taxAdjustedForInflation,
      durationYears,
      inflationRate,
      targetMonthlyIncome,
    } = params;

    // Calcolo metriche finali
    const finalData = chartData[chartData.length - 1];
    const totalTax = chartData.reduce((acc, curr) => acc + curr.yearlyTax, 0);
    const netProfit = finalData.portfolioValue - finalData.totalInvested;
    const roi =
      finalData.totalInvested > 0
        ? (netProfit / finalData.totalInvested) * 100
        : 0;
    const inflationLoss =
      finalData.portfolioValue - finalData.inflationAdjustedValue;

    // Calcolo anno libertà finanziaria
    const freedomData = chartData.find(
      (d) => d.netGrowth / 12 >= targetMonthlyIncome
    );

    let content = `KNOW YOUR CAPITAL - REPORT SCENARIO\n`;
    content += `Generato il: ${new Date().toLocaleDateString()}\n`;
    content += `========================================\n\n`;

    content += `1. OBIETTIVI E PARAMETRI\n`;
    content += `--------------------\n`;
    content += `• Obiettivo Rendita Mensile: ${targetMonthlyIncome.toLocaleString(
      "it-IT"
    )} €\n`;
    if (freedomData) {
      content += `• STIMA RAGGIUNGIMENTO OBIETTIVO: Anno ${freedomData.label} (tra ${freedomData.year} anni)\n`;
    } else {
      content += `• STIMA RAGGIUNGIMENTO OBIETTIVO: Non raggiunto nel periodo selezionato (${durationYears} anni)\n`;
    }
    content += `\n`;
    content += `• Anno di Partenza: ${startYear}\n`;
    content += `• Durata della Simulazione: ${durationYears} anni (Termine stimato: ${
      startYear + durationYears
    })\n`;
    content += `• Capitale Iniziale: ${initialCapital.toLocaleString(
      "it-IT"
    )} €\n`;
    content += `• Piano di Accumulo (PAC): ${monthlyContribution.toLocaleString(
      "it-IT"
    )} € al mese\n`;
    content += `  - Adeguamento Inflazione PAC: ${
      adjustContributionForInflation
        ? "SÌ (Il versamento aumenta annualmente per contrastare l'inflazione)"
        : "NO (Il versamento rimane fisso nominalmente)"
    }\n`;
    content += `• Rendimento Annuo Lordo Atteso: ${annualReturnRate}%\n`;
    content += `• Inflazione Stimata: ${inflationRate}% (Riduce il potere d'acquisto reale nel tempo)\n`;
    content += `• Tassazione: ${
      isTaxEnabled
        ? `ATTIVA (Aliquota ${taxRate}%)`
        : "DISATTIVATA (Calcolo al lordo delle tasse)"
    }\n`;
    if (isTaxEnabled) {
      content += `  - Metodo Calcolo Tasse: ${
        taxAdjustedForInflation
          ? "SUL RENDIMENTO REALE (Viene tassata solo la parte eccedente l'inflazione)"
          : "SUL RENDIMENTO NOMINALE (Standard)"
      }\n`;
    }
    content += `\n`;

    content += `2. MOVIMENTI PIANIFICATI\n`;
    content += `------------------------\n`;
    if (events.length === 0) {
      content += `Nessun movimento extra (prelievi, versamenti aggiuntivi o prestiti) pianificato.\n`;
    } else {
      const sortedEvents = [...events].sort((a, b) => a.year - b.year);
      sortedEvents.forEach((e) => {
        const calendarYear = startYear + e.year;
        let typeDesc = "";
        let details = "";

        switch (e.type) {
          case EventType.DEPOSIT:
            typeDesc = "VERSAMENTO EXTRA";
            break;
          case EventType.WITHDRAWAL:
            typeDesc = "PRELIEVO";
            break;
          case EventType.LOAN:
            typeDesc = "RICHIESTA PRESTITO (Prelievo)";
            details = `\n  - Dettagli Prestito: Tasso ${e.loanInterestRate}%, Durata ${e.loanDurationYears} anni. La rata viene PRELEVATA dal portafoglio.`;
            break;
          case EventType.LEVERAGE_LOAN:
            typeDesc = "LEVA FINANZIARIA (Reinvestimento)";
            details = `\n  - Dettagli Leva: Tasso ${e.loanInterestRate}%, Durata ${e.loanDurationYears} anni.\n  - NOTA: La rata riduce automaticamente il PAC mensile futuro.`;
            break;
        }

        if (e.isRecurring && !e.type.includes("LOAN")) {
          details += `\n  - Frequenza: Ricorrente ogni anno dal ${calendarYear} fino al ${
            startYear + (e.recurringEndYear || 0)
          }`;
        } else if (!e.isRecurring && !e.type.includes("LOAN")) {
          details += `\n  - Frequenza: Una tantum`;
        }

        content += `[Anno ${calendarYear}] ${typeDesc}: ${e.amount.toLocaleString(
          "it-IT"
        )} €${details}\n`;
      });
    }

    content += `\n3. RISULTATI DELLA PROIEZIONE (ANNO ${
      startYear + durationYears
    })\n`;
    content += `------------------------------------------------------------\n`;
    content += `• Valore Finale Portafoglio (Nominale): ${finalData.portfolioValue.toLocaleString(
      "it-IT"
    )} €\n`;
    content += `• Valore Reale Portafoglio (Netto Inflazione): ${finalData.inflationAdjustedValue.toLocaleString(
      "it-IT"
    )} €\n`;
    content += `• Capitale Totale Investito: ${finalData.totalInvested.toLocaleString(
      "it-IT"
    )} €\n`;
    content += `• Utile Netto Totale: ${netProfit.toLocaleString(
      "it-IT"
    )} € (ROI: ${roi.toFixed(2)}%)\n`;
    if (isTaxEnabled) {
      content += `• Tasse Totali Stimate: ${totalTax.toLocaleString(
        "it-IT"
      )} €\n`;
    }
    content += `• Totale Prelievi effettuati: ${finalData.totalWithdrawn.toLocaleString(
      "it-IT"
    )} €\n`;
    content += `\nANALISI IMPATTO INFLAZIONE\n`;
    content += `• Perdita di valore nominale causa inflazione: -${inflationLoss.toLocaleString(
      "it-IT"
    )} €\n`;

    content += `\n========================================\n`;
    content += `NOTA: Questa è una simulazione basata su rendimenti costanti. I mercati reali sono volatili.`;

    const element = document.createElement("a");
    const file = new Blob([content], { type: "text/plain" });
    element.href = URL.createObjectURL(file);
    element.download = `know_your_capital_report_${new Date()
      .toISOString()
      .slice(0, 10)}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(configString).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20 font-sans">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 p-2 rounded-lg text-white shadow-blue-200 shadow-lg">
              <Calculator size={20} />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-800 leading-tight">
                Know Your Capital
              </h1>
              <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">
                Pro Edition
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4 text-sm text-slate-500">
            <button className="text-slate-400 hover:text-blue-600 transition-colors">
              <HelpCircle size={20} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Grid */}
      <main className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
          {/* COLUMN 1: Configuration (Left) - 3 Spans */}
          <div className="xl:col-span-3 space-y-6">
            <Card title="Obiettivo Libertà">
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
                <p className="text-[10px] text-amber-800 leading-tight">
                  Definisci quanto vuoi guadagnare mensilmente dagli interessi
                  del tuo portafoglio.
                </p>
              </div>
              <InputControl
                label="Rendita Mensile Target"
                value={params.targetMonthlyIncome}
                onChange={(val) => updateParam("targetMonthlyIncome", val)}
                min={500}
                max={20000}
                step={100}
                unit="€"
                description="Reddito passivo desiderato"
              />
            </Card>

            <Card title="Parametri Generali">
              <div className="space-y-1">
                <InputControl
                  label="Anno di Partenza"
                  value={params.startYear}
                  onChange={(val) => updateParam("startYear", val)}
                  min={2000}
                  max={2050}
                  step={1}
                  unit=""
                />
                <InputControl
                  label="Capitale Iniziale"
                  value={params.initialCapital}
                  onChange={(val) => updateParam("initialCapital", val)}
                  min={0}
                  max={500000}
                  step={500}
                  unit="€"
                />
                <div className="relative pt-2">
                  <InputControl
                    label="Versamento Mensile"
                    value={params.monthlyContribution}
                    onChange={(val) => updateParam("monthlyContribution", val)}
                    min={0}
                    max={5000}
                    step={50}
                    unit="€"
                    description="PAC Mensile"
                  />
                  <div className="flex items-start gap-2 mb-4 px-1 -mt-2">
                    <div className="relative flex items-center">
                      <input
                        type="checkbox"
                        id="inflationAdjust"
                        checked={params.adjustContributionForInflation}
                        onChange={(e) =>
                          updateParam(
                            "adjustContributionForInflation",
                            e.target.checked
                          )
                        }
                        className="peer h-4 w-4 cursor-pointer appearance-none rounded border border-slate-300 shadow transition-all checked:border-blue-600 checked:bg-blue-600 hover:shadow-md"
                      />
                      <span className="absolute text-white opacity-0 peer-checked:opacity-100 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-3.5 w-3.5"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </span>
                    </div>
                    <label
                      htmlFor="inflationAdjust"
                      className="text-xs text-slate-600 cursor-pointer select-none leading-tight"
                    >
                      Adegua versamenti all'inflazione
                    </label>
                  </div>
                </div>

                <InputControl
                  label="Rendimento Annuo"
                  value={params.annualReturnRate}
                  onChange={(val) => updateParam("annualReturnRate", val)}
                  min={-10}
                  max={30}
                  step={0.5}
                  unit="%"
                />
                <InputControl
                  label="Durata (Anni)"
                  value={params.durationYears}
                  onChange={(val) => {
                    if (val < params.durationYears) {
                      setEvents((prev) => prev.filter((e) => e.year <= val));
                    }
                    updateParam("durationYears", val);
                  }}
                  min={1}
                  max={50}
                  unit=""
                />

                <div className="pt-4 border-t border-slate-100">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="relative flex items-center">
                      <input
                        type="checkbox"
                        id="taxEnabled"
                        checked={params.isTaxEnabled}
                        onChange={(e) =>
                          updateParam("isTaxEnabled", e.target.checked)
                        }
                        className="peer h-4 w-4 cursor-pointer appearance-none rounded border border-slate-300 shadow transition-all checked:border-blue-600 checked:bg-blue-600 hover:shadow-md"
                      />
                      <span className="absolute text-white opacity-0 peer-checked:opacity-100 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-3.5 w-3.5"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </span>
                    </div>
                    <label
                      htmlFor="taxEnabled"
                      className="text-sm font-medium text-slate-700 cursor-pointer select-none"
                    >
                      Applica Tassazione
                    </label>
                  </div>

                  <div
                    className={`transition-all duration-300 overflow-hidden ${
                      params.isTaxEnabled
                        ? "opacity-100 max-h-40"
                        : "opacity-40 max-h-0 pointer-events-none"
                    }`}
                  >
                    <InputControl
                      label="Aliquota Fiscale"
                      value={params.taxRate}
                      onChange={(val) => updateParam("taxRate", val)}
                      min={0}
                      max={50}
                      unit="%"
                    />
                    <div className="flex items-start gap-2 mb-4 px-1">
                      <input
                        type="checkbox"
                        id="taxAdjusted"
                        checked={params.taxAdjustedForInflation}
                        onChange={(e) =>
                          updateParam(
                            "taxAdjustedForInflation",
                            e.target.checked
                          )
                        }
                        className="mt-1 h-3 w-3 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                      <div>
                        <label
                          htmlFor="taxAdjusted"
                          className="text-xs font-medium text-slate-700 cursor-pointer select-none block"
                        >
                          Tassa solo il rendimento reale
                        </label>
                        <p className="text-[10px] text-slate-400 leading-tight">
                          L'inflazione viene dedotta dai guadagni prima del
                          calcolo tasse.
                        </p>
                      </div>
                    </div>
                  </div>

                  <InputControl
                    label="Inflazione Stimata"
                    value={params.inflationRate}
                    onChange={(val) => updateParam("inflationRate", val)}
                    min={0}
                    max={20}
                    unit="%"
                  />
                </div>
              </div>
            </Card>

            <Card title="Esporta & Salva">
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-slate-500 mb-2">Formato Export:</p>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={downloadCSV}
                      className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium py-2 px-2 rounded-md flex items-center justify-center gap-1 transition-colors border border-slate-200"
                    >
                      <Download size={14} /> CSV (Excel)
                    </button>
                    <button
                      onClick={downloadTextReport}
                      className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium py-2 px-2 rounded-md flex items-center justify-center gap-1 transition-colors border border-slate-200"
                    >
                      <FileText size={14} /> Report (TXT)
                    </button>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                      <FileJson size={14} /> Dati Raw
                    </div>
                    <button
                      onClick={copyToClipboard}
                      className={`text-xs flex items-center gap-1 px-2 py-1 rounded transition-colors ${
                        copied
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      {copied ? <Check size={12} /> : <Copy size={12} />}{" "}
                      {copied ? "Copiato" : "Copia"}
                    </button>
                  </div>
                  <textarea
                    readOnly
                    value={configString}
                    className="w-full h-20 text-[10px] font-mono bg-slate-50 border border-slate-200 rounded p-2 text-slate-600 resize-none focus:outline-none"
                  />
                </div>
              </div>
            </Card>
          </div>

          {/* COLUMN 2: Visualization (Center) - 6 Spans */}
          <div className="xl:col-span-6 space-y-6">
            {/* KPI Summary */}
            <Summary
              data={chartData}
              initialCapital={params.initialCapital}
              targetMonthlyIncome={params.targetMonthlyIncome}
            />

            {/* Main Chart */}
            <PortfolioChart
              data={chartData}
              selectionStart={selectionStart}
              selectionEnd={selectionEnd}
              onYearSelect={handleChartYearSelect}
            />

            {/* Info Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-md border-0">
                <h3 className="font-semibold text-base mb-2">
                  Interesse Composto
                </h3>
                <p className="text-blue-100 text-sm leading-relaxed">
                  Nota come la curva del valore si distacca dal capitale
                  investito dopo il 10° anno. Questo è l'effetto esponenziale.
                </p>
              </Card>
              <Card className="bg-white border-l-4 border-l-amber-400">
                <h3 className="font-semibold text-slate-800 text-base mb-2">
                  Realtà vs Nominale
                </h3>
                <p className="text-slate-600 text-sm leading-relaxed">
                  La linea tratteggiata mostra il vero potere d'acquisto
                  rettificato per l'inflazione e le tasse.
                </p>
              </Card>
            </div>
          </div>

          {/* COLUMN 3: Events (Right) - 3 Spans */}
          <div className="xl:col-span-3">
            <EventManager
              events={events}
              onAddEvent={addEvent}
              onRemoveEvent={removeEvent}
              maxYears={params.durationYears}
              selectionStart={selectionStart}
              selectionEnd={selectionEnd}
              startYear={params.startYear}
              onStartChange={setSelectionStart}
              onEndChange={setSelectionEnd}
            />
          </div>
        </div>
      </main>
    </div>
  );
};

export default function AppWithErrorBoundary() {
  return (
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  );
}
