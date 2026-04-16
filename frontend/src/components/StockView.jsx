import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getStockHistory, analyzeStock } from '../api/stocks';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area 
} from 'recharts';
import { Brain, TrendingUp, AlertTriangle, Lightbulb, Loader2, Sparkles, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const StockView = ({ ticker }) => {
  const [analysis, setAnalysis] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);

  const { data: history, isLoading: historyLoading } = useQuery({
    queryKey: ['stockHistory', ticker],
    queryFn: () => getStockHistory(ticker),
  });

  const handleAnalyze = async () => {
    setAnalyzing(true);
    try {
      const result = await analyzeStock(ticker);
      setAnalysis(result);
    } catch (err) {
      console.error(err);
    } finally {
      setAnalyzing(false);
    }
  };

  const currentPrice = history?.[history.length - 1]?.close || 0;
  const startPrice = history?.[0]?.close || 0;
  const priceChange = currentPrice - startPrice;
  const priceChangePercent = (priceChange / startPrice) * 100;

  return (
    <div className="space-y-8">
      {/* Stock Header Info */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-5xl font-black text-white mb-2">{ticker}</h2>
          <div className="flex items-center gap-4">
            <span className="text-3xl font-mono text-gray-300">${currentPrice.toFixed(2)}</span>
            <span className={`text-lg font-bold ${priceChange >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)} ({priceChangePercent.toFixed(2)}%)
            </span>
            <span className="text-gray-500 text-sm uppercase font-bold tracking-widest bg-white/5 px-2 py-1 rounded">6 MONTH PERFORMANCE</span>
          </div>
        </div>
        
        {!analysis && !analyzing && (
          <button 
            onClick={handleAnalyze}
            className="group glass-button bg-blue-500/10 border-blue-500/30 text-blue-400 flex items-center gap-3 px-8 py-4 text-lg font-bold hover:bg-blue-500/20 active:scale-95 transition-all shadow-lg shadow-blue-500/10"
          >
            <Brain className="w-6 h-6 group-hover:rotate-12 transition-transform" />
            GENERATE AI ANALYSIS
            <Sparkles className="w-4 h-4 text-yellow-400" />
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Chart */}
        <div className="lg:col-span-2 glass-card p-6 h-[450px]">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-gray-400 font-bold uppercase tracking-wider text-sm">Historical Trend</h3>
            <div className="flex gap-2">
              <span className="flex items-center gap-2 text-xs text-gray-500 bg-white/5 px-3 py-1 rounded-full">
                <div className="w-2 h-2 rounded-full bg-blue-500"></div> Price
              </span>
            </div>
          </div>
          
          {historyLoading ? (
            <div className="w-full h-full flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="85%">
              <AreaChart data={history}>
                <defs>
                  <linearGradient id="colorClose" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#2d3748" vertical={false} />
                <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: '#718096', fontSize: 12}}
                  minTickGap={30}
                />
                <YAxis 
                  domain={['auto', 'auto']} 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: '#718096', fontSize: 12}}
                  orientation="right"
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1a202c', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="close" 
                  stroke="#3b82f6" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorClose)" 
                  animationDuration={1500}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* AI Insight Box */}
        <div className="lg:col-span-1">
          <AnimatePresence mode="wait">
            {analyzing ? (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="glass-card p-8 h-full flex flex-col items-center justify-center gap-6 border-blue-500/20"
              >
                <div className="relative">
                  <Brain className="w-16 h-16 text-blue-400 animate-pulse" />
                  <div className="absolute inset-0 bg-blue-400/20 blur-xl rounded-full"></div>
                </div>
                <div className="space-y-2 text-center">
                  <h4 className="text-xl font-bold text-white">AI Analyst is Thinking</h4>
                  <p className="text-gray-400 text-sm">Processing 6 months of historical data points...</p>
                </div>
                <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                  <motion.div 
                    className="h-full bg-blue-500"
                    initial={{ width: "0%" }}
                    animate={{ width: "100%" }}
                    transition={{ duration: 3, repeat: Infinity }}
                  />
                </div>
              </motion.div>
            ) : analysis ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="glass-card border-emerald-500/20 overflow-hidden h-full flex flex-col"
              >
                <div className="p-6 bg-emerald-500/10 border-b border-emerald-500/20 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-emerald-400 font-bold uppercase tracking-tighter">
                    <Sparkles className="w-4 h-4" />
                    AI Intelligence Report
                  </div>
                  <div className="text-[10px] bg-emerald-500/20 px-2 py-0.5 rounded text-emerald-400 font-black">LATEST DATA</div>
                </div>
                
                <div className="p-6 space-y-6 flex-grow">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <span className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Trend</span>
                      <div className="text-lg font-black text-white flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-emerald-400" />
                        {analysis.trend}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Risk Level</span>
                      <div className={cn(
                        "text-lg font-black flex items-center gap-2",
                        analysis.risk_level === 'High' ? 'text-rose-400' : analysis.risk_level === 'Medium' ? 'text-amber-400' : 'text-emerald-400'
                      )}>
                        <AlertTriangle className="w-4 h-4" />
                        {analysis.risk_level}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <span className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Suggested Action</span>
                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 text-blue-100 font-bold flex items-center justify-between group">
                      {analysis.suggested_action}
                      <ChevronRight className="w-4 h-4 opacity-50 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>

                  <div className="space-y-2 bg-white/5 p-4 rounded-xl border border-white/5">
                    <div className="flex items-center gap-2 text-[10px] text-gray-400 uppercase font-black tracking-widest">
                      <Lightbulb className="w-4 h-4 text-yellow-400" />
                      Analytical Reasoning
                    </div>
                    <p className="text-sm text-gray-300 leading-relaxed font-medium italic">
                      "{analysis.reasoning}"
                    </p>
                  </div>
                </div>
                
                <div className="p-4 bg-black/20 text-[10px] text-gray-500 italic text-center">
                  Based on algorithmic variance and technical pattern recognition.
                </div>
              </motion.div>
            ) : (
              <div className="glass-card p-8 h-full flex flex-col items-center justify-center gap-4 border-dashed border-white/10 opacity-50">
                <Brain className="w-12 h-12 text-gray-600" />
                <p className="text-gray-500 text-sm text-center">Click the button above to unlock deep AI-driven insights for {ticker}</p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

function cn(...inputs) {
  return inputs.filter(Boolean).join(' ');
}

export default StockView;
