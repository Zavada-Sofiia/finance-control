import { Navigation } from '../../Navigation';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Link } from 'react-router';
import { ArrowLeft } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface DayRate {
  date: string;
  USD_buy?: number;
  USD_sell?: number;
  EUR_buy?: number;
  EUR_sell?: number;
}

const CURRENCIES = [
  { flag: '🇺🇸', code: 'USD' as const },
  { flag: '🇪🇺', code: 'EUR' as const },
];

const LINE_COLORS = {
  USD_buy:  '#8b5cf6',
  USD_sell: '#c4b5fd',
  EUR_buy:  '#10b981',
  EUR_sell: '#6ee7b7',
};

const LINE_LABELS: Record<string, string> = {
  USD_buy: 'USD Buy', USD_sell: 'USD Sell',
  EUR_buy: 'EUR Buy', EUR_sell: 'EUR Sell',
};

function parseDate(d: string) {
  const [day, month, year] = d.split('.');
  return new Date(`${year}-${month}-${day}`).getTime();
}

export function Statistics() {
  const [history, setHistory] = useState<DayRate[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchHistory = async () => {
    try {
      const res = await fetch('/api/currency/history', { credentials: 'include' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: DayRate[] = await res.json();
      setHistory([...data].sort((a, b) => parseDate(a.date) - parseDate(b.date)).slice(-10));
    } catch (e) {
      console.error('fetchHistory error:', e);
      toast.error('Failed to fetch history');
    }
  };

  useEffect(() => {
    fetchHistory().finally(() => setLoading(false));
    const interval = setInterval(fetchHistory, 30_000);
    return () => clearInterval(interval);
  }, []);

  const getTrendAnalysis = (code: 'USD' | 'EUR') => {
    if (history.length < 2) return null;
    const buyKey  = `${code}_buy`  as keyof DayRate;
    const sellKey = `${code}_sell` as keyof DayRate;
    const first = history[0][buyKey] as number | undefined;
    const last  = history[history.length - 1][buyKey] as number | undefined;
    if (!first || !last) return null;
    const diff    = last - first;
    const percent = ((diff / first) * 100).toFixed(2);
    const trend: 'up' | 'down' | 'stable' = diff > 0 ? 'up' : diff < 0 ? 'down' : 'stable';
    return {
      percent, trend,
      currentBuy:  last,
      currentSell: history[history.length - 1][sellKey] as number,
    };
  };

  return (
    <div className="min-h-screen pb-16">
      <Navigation />
      <div className="max-w-6xl mx-auto px-4 md:px-8 py-8 md:py-12">
        <div className="space-y-8">

          <div>
            <div className="flex items-center gap-3 mb-3">
              <Link to="/currency" className="p-2 rounded-full hover:bg-gray-100 transition-colors">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <h1 className="text-3xl md:text-5xl font-bold">Statistics</h1>
            </div>
            <p className="text-gray-600">Currency exchange rate trends</p>
          </div>

          {/* Summary cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {CURRENCIES.map((currency) => {
              const analysis = getTrendAnalysis(currency.code);
              const percent  = analysis?.percent ?? '0.00';
              const trend    = analysis?.trend ?? 'stable';
              return (
                <div key={currency.code} className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 border border-gray-200">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{currency.flag}</span>
                      <span className="text-xl font-bold">{currency.code}</span>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                      trend === 'up'    ? 'bg-green-100 text-green-700'
                      : trend === 'down' ? 'bg-red-100 text-red-700'
                      : 'bg-gray-100 text-gray-700'
                    }`}>
                      {trend === 'up' ? '+' : trend === 'down' ? '-' : ''}{Math.abs(Number(percent))}%
                    </div>
                  </div>
                  {loading ? (
                    <div className="h-10 bg-gray-200 rounded animate-pulse" />
                  ) : (
                    <div className="flex gap-8">
                      <div>
                        <div className="text-xs text-gray-500 mb-0.5">Buy</div>
                        <div className="text-2xl font-bold">₴ {analysis?.currentBuy.toFixed(2) ?? '—'}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 mb-0.5">Sell</div>
                        <div className="text-2xl font-bold">₴ {analysis?.currentSell.toFixed(2) ?? '—'}</div>
                      </div>
                    </div>
                  )}
                  <div className="text-sm text-gray-600 mt-2">10-day change</div>
                </div>
              );
            })}
          </div>

          {/* USD chart */}
          <div className="bg-white rounded-2xl p-4 md:p-6 border border-gray-200">
            <h3 className="font-bold mb-6">🇺🇸 USD — Buy &amp; Sell (Last 10 Days)</h3>
            {loading ? (
              <div className="h-[220px] flex items-center justify-center text-gray-400">Loading...</div>
            ) : history.length === 0 ? (
              <div className="h-[220px] flex items-center justify-center text-gray-400">No data available</div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={history}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" stroke="#999" style={{ fontSize: '12px' }} tickFormatter={(d) => d.slice(0, 5)} />
                  <YAxis stroke="#999" style={{ fontSize: '12px' }} domain={['auto', 'auto']} />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                    formatter={(value: number, name: string) => [`₴ ${value.toFixed(4)}`, LINE_LABELS[name] ?? name]}
                  />
                  <Legend formatter={(name) => LINE_LABELS[name] ?? name} />
                  <Line type="monotone" dataKey="USD_buy"  stroke={LINE_COLORS.USD_buy}  strokeWidth={2.5} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="USD_sell" stroke={LINE_COLORS.USD_sell} strokeWidth={2.5} dot={{ r: 3 }} strokeDasharray="4 2" />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* EUR chart */}
          <div className="bg-white rounded-2xl p-4 md:p-6 border border-gray-200">
            <h3 className="font-bold mb-6">🇪🇺 EUR — Buy &amp; Sell (Last 10 Days)</h3>
            {loading ? (
              <div className="h-[220px] flex items-center justify-center text-gray-400">Loading...</div>
            ) : history.length === 0 ? (
              <div className="h-[220px] flex items-center justify-center text-gray-400">No data available</div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={history}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" stroke="#999" style={{ fontSize: '12px' }} tickFormatter={(d) => d.slice(0, 5)} />
                  <YAxis stroke="#999" style={{ fontSize: '12px' }} domain={['auto', 'auto']} />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                    formatter={(value: number, name: string) => [`₴ ${value.toFixed(4)}`, LINE_LABELS[name] ?? name]}
                  />
                  <Legend formatter={(name) => LINE_LABELS[name] ?? name} />
                  <Line type="monotone" dataKey="EUR_buy"  stroke={LINE_COLORS.EUR_buy}  strokeWidth={2.5} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="EUR_sell" stroke={LINE_COLORS.EUR_sell} strokeWidth={2.5} dot={{ r: 3 }} strokeDasharray="4 2" />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Analysis cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {CURRENCIES.map((currency) => {
              const analysis = getTrendAnalysis(currency.code);
              if (!analysis) return null;
              const { trend, percent, currentBuy } = analysis;
              const trendColor = trend === 'up'    ? 'bg-green-50 border-green-200'
                               : trend === 'down'  ? 'bg-red-50 border-red-200'
                               : 'bg-gray-50 border-gray-200';
              const trendText  = trend === 'up'    ? `increased by ${percent}%`
                               : trend === 'down'  ? `decreased by ${Math.abs(Number(percent))}%`
                               : 'remained stable';
              return (
                <div key={currency.code} className={`rounded-2xl p-6 border ${trendColor}`}>
                  <h3 className="font-bold mb-3 flex items-center gap-2">
                    <span className="text-2xl">{currency.flag}</span>
                    {currency.code} Analysis
                  </h3>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    Over the last 10 days, {currency.code} has {trendText}.
                    The current buy rate is ₴ {currentBuy.toFixed(2)}.
                  </p>
                </div>
              );
            })}
          </div>

          <div className="text-center">
            <Link
              to="/currency"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-purple-300 text-gray-900 font-medium hover:bg-purple-400 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Exchange Rates
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
}