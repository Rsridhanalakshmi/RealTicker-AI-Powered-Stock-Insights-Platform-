import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { getTop10Stocks } from '../api/stocks';
import { ArrowUpRight, ArrowDownRight, Loader2, RefreshCw } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

const StockTable = ({ onSelect }) => {
  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['top10Stocks'],
    queryFn: getTop10Stocks,
    refetchInterval: 60000, // Refresh every minute
  });

  if (isLoading) {
    return (
      <div className="glass-card p-12 flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-10 h-10 text-blue-400 animate-spin" />
        <p className="text-gray-400 animate-pulse">Fetching global market leaders...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-card p-12 flex flex-col items-center justify-center gap-4 border-red-500/20 bg-red-500/5">
        <p className="text-red-400 text-center font-medium">Failed to load market data</p>
        <button onClick={() => refetch()} className="glass-button text-sm flex items-center gap-2">
          <RefreshCw className="w-4 h-4" /> Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="glass-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead className="bg-white/5 border-b border-white/10">
            <tr>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-500">Ticker</th>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-500">Company</th>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-500 text-right">Price</th>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-500 text-right">Change %</th>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-500 text-right">Volume</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {data?.map((stock, idx) => (
              <tr 
                key={stock.ticker}
                onClick={() => onSelect(stock.ticker)}
                className="hover:bg-white/10 cursor-pointer transition-colors group"
                style={{ animationDelay: `${idx * 50}ms` }}
              >
                <td className="px-6 py-5 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white group-hover:text-blue-400 transition-colors uppercase">
                      {stock.ticker}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-5 whitespace-nowrap">
                  <span className="text-gray-300 font-medium">{stock.name}</span>
                </td>
                <td className="px-6 py-5 whitespace-nowrap text-right">
                  <span className="font-mono text-white text-lg">${stock.price.toFixed(2)}</span>
                </td>
                <td className="px-6 py-5 whitespace-nowrap text-right">
                  <div className={cn(
                    "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold",
                    stock.change_percent >= 0 
                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
                      : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                  )}>
                    {stock.change_percent >= 0 ? <ArrowUpRight className="w-3 h-3 mr-1" /> : <ArrowDownRight className="w-3 h-3 mr-1" />}
                    {Math.abs(stock.change_percent)}%
                  </div>
                </td>
                <td className="px-6 py-5 whitespace-nowrap text-right">
                  <span className="text-gray-400 text-sm font-medium">{stock.volume}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {isFetching && !isLoading && (
        <div className="absolute top-4 right-4 animate-spin">
          <RefreshCw className="w-4 h-4 text-gray-500" />
        </div>
      )}
    </div>
  );
};

export default StockTable;
