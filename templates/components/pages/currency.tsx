import { Navigation } from '../../Navigation';
import { Link } from 'react-router';
import { RefreshCw, TrendingUp } from 'lucide-react';
import { toast, Toaster } from 'sonner';
import { useState, useEffect, useCallback } from 'react';
import currency_back_img from '../../assets/currency_back_img.png';

export function CurrencyImg() {
  return <img src={currency_back_img} alt="Currency" className="w-full h-auto object-contain" />;
}

const ORDER = ['USD', 'EUR', 'GBP', 'CAD', 'PLN', 'CZK', 'JPY'];

interface RateEntry {
  flag: string;
  name: string;
  buy: number;
  sell: number;
  trend?: 'up' | 'down' | 'neutral';
}

interface ApiResponse {
  rates: Record<string, RateEntry>;
  last_update: string | null;
}

function formatRate(value: number): string {
  return value.toFixed(4).replace(/(\.\d{2,})0+$/, '$1');
}

export function Currency() {
  const [rates, setRates] = useState<Record<string, RateEntry>>({});
  const [lastUpdate, setLastUpdate] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const applyResponse = (data: ApiResponse) => {
    setRates(data.rates ?? {});
    setLastUpdate(data.last_update ?? null);
  };

  const loadRates = useCallback(async () => {
    try {
      const res = await fetch('/api/currency/rates', { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch');
      applyResponse(await res.json());
    } catch {
      toast.error('Failed to load exchange rates');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRates();
    const interval = setInterval(loadRates, 30_000);
    return () => clearInterval(interval);
  }, [loadRates]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const res = await fetch('/api/currency/update');
      if (!res.ok) throw new Error('Failed to update');
      const data: ApiResponse = await res.json();
      applyResponse(data);
      toast.success('Exchange rates updated!', {
        description: data.last_update ? `Updated at ${data.last_update}` : 'Latest data received',
        duration: 3000,
      });
    } catch {
      toast.error('Failed to update rates');
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <div className="min-h-screen pb-16">
      <Toaster position="top-center" richColors />
      <Navigation />
      <div className="max-w-6xl mx-auto px-4 md:px-8 py-8 md:py-12">
        <div className="space-y-8">
          <div>
            <h1 className="text-3xl md:text-5xl font-bold mb-2">Exchange rates</h1>
            <p className="text-gray-600">
              Current currency exchange rates
              {lastUpdate && (
                <span className="ml-2 text-sm text-gray-400">· updated at {lastUpdate}</span>
              )}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
            <div className="space-y-6">
              <div className="bg-white rounded-2xl overflow-hidden border border-gray-200 shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200 bg-gray-50">
                        <th className="text-left py-3 px-4 font-medium text-gray-600 text-sm">Currency</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600 text-sm">Buy</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600 text-sm">Sell</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loading ? (
                        Array.from({ length: 7 }).map((_, i) => (
                          <tr key={i} className="border-b border-gray-100">
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-6 bg-gray-200 rounded animate-pulse" />
                                <div className="w-16 h-4 bg-gray-200 rounded animate-pulse" />
                              </div>
                            </td>
                            <td className="py-3 px-4"><div className="w-16 h-4 bg-gray-200 rounded animate-pulse" /></td>
                            <td className="py-3 px-4"><div className="w-16 h-4 bg-gray-200 rounded animate-pulse" /></td>
                          </tr>
                        ))
                      ) : (
                        ORDER.filter((code) => rates[code]).map((code) => {
                          const r = rates[code];
                          return (
                            <tr key={code} className="border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors">
                              <td className="py-3 px-4">
                                <div className="flex items-center gap-2">
                                  <span className="text-2xl">{r.flag}</span>
                                  <span className="font-medium">{r.name}</span>
                                  {r.trend && r.trend !== 'neutral' && (
                                    <TrendingUp className={`w-4 h-4 ${r.trend === 'up' ? 'text-green-500' : 'text-red-500 rotate-180'}`} />
                                  )}
                                </div>
                              </td>
                              <td className="py-3 px-4 text-gray-900">{formatRate(r.buy)}</td>
                              <td className="py-3 px-4 text-gray-900">{formatRate(r.sell)}</td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={handleRefresh}
                  disabled={refreshing || loading}
                  className="flex-1 py-3.5 rounded-full bg-yellow-300 text-gray-900 font-medium hover:bg-yellow-400 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                  {refreshing ? 'Updating...' : 'Refresh rates'}
                </button>
                <Link
                  to="/statistics"
                  onClick={() => sessionStorage.setItem('fromCurrency', 'true')}
                  className="flex-1 py-3.5 rounded-full bg-purple-300 text-gray-900 font-medium hover:bg-purple-400 transition-colors text-center"
                >
                  View Statistics
                </Link>
              </div>
            </div>

            <div className="hidden md:flex flex-col items-center justify-end">
              <CurrencyImg />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}