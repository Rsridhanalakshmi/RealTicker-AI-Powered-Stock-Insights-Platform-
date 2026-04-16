import React, { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import StockTable from './components/StockTable';
import StockView from './components/StockView';
import { TrendingUp, BarChart3, Info } from 'lucide-react';

const queryClient = new QueryClient();

function App() {
  const [selectedTicker, setSelectedTicker] = useState(null);

  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen w-full px-4 py-8 md:px-8 lg:px-16 max-w-7xl mx-auto">
        {/* Header */}
        <header className="mb-12 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="text-emerald-400 w-8 h-8" />
              <h1 className="text-4xl font-bold tracking-tight text-white uppercase tracking-[0.2em]">
                Real<span className="gradient-text">Ticker</span>
              </h1>
            </div>
            <p className="text-gray-400 text-lg">AI-Powered Stock Insights & Advanced Market Analytics</p>
          </div>
          
          <div className="flex gap-4">
            <div className="glass-card px-6 py-3 flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
              <span className="text-sm font-medium text-emerald-500">MARKET OPEN</span>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="space-y-8 pb-12">
          {!selectedTicker ? (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
              <div className="flex items-center gap-2 mb-6 text-gray-300">
                <BarChart3 className="w-5 h-5" />
                <h2 className="text-xl font-semibold">Top 10 Market Leaders</h2>
              </div>
              <StockTable onSelect={setSelectedTicker} />
            </div>
          ) : (
            <div className="animate-in fade-in slide-in-from-right-4 duration-500">
              <button 
                onClick={() => setSelectedTicker(null)}
                className="mb-8 glass-button flex items-center gap-2 text-sm text-gray-300 transition-all"
              >
                ← Back to Overview
              </button>
              <StockView ticker={selectedTicker} />
            </div>
          )}
        </main>

        {/* Footer Disclaimer */}
        <footer className="mt-auto border-t border-white/10 pt-8 pb-12 flex items-start gap-3">
          <Info className="w-5 h-5 text-gray-500 shrink-0 mt-0.5" />
          <p className="text-sm text-gray-500 max-w-3xl italic">
            Disclaimer: This is AI-generated analysis and not financial advice. Investing in stocks involves risk. 
            Always conduct your own research or consult with a qualified financial advisor before making any investment decisions.
            Data provided by Yahoo Finance through yfinance.
          </p>
        </footer>
      </div>
    </QueryClientProvider>
  );
}

export default App;
