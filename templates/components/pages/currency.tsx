import { Navigation } from '../../Navigation';
import { Link } from 'react-router';
import { TrendingUp, RefreshCw } from 'lucide-react';
import { toast, Toaster } from 'sonner';
import { useState, useEffect, useCallback } from 'react';
import currency_back_img from '../../assets/currency_back_img.png';

export function CurrencyImg() {
  return <img src={currency_back_img} alt="Currency" className="w-full h-auto object-contain" />;
}

interface ExchangeRate {
  flag: string;
  name: string;
  buy: number;
  sell: number;
  trend?: 'up' | 'down' | 'neutral';
}

interface RatesResponse {
  rates: Record<string, ExchangeRate>;
  last_update: string | null;
}

// Форматування числа: 40.4 -> "40.40", 3.2634 -> "3.2634"
function formatRate(value: number): string {
  // Показуємо мінімум 2 знаки після коми, максимум 4
  const str = value.toFixed(4);
  // Прибираємо зайві нулі, але залишаємо мінімум 2
  const trimmed = str.replace(/(\.\d{2,})0+$/, '$1');
  return trimmed;
}

export function Currency() {
  const [rates, setRates] = useState<ExchangeRate[]>([]);
  const [lastUpdate, setLastUpdate] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const parseRates = (data: RatesResponse) => {
    const order = ['USD', 'EUR', 'GBP', 'CAD', 'PLN', 'CZK', 'JPY'];
    const parsed: ExchangeRate[] = order
      .filter((code) => data.rates[code])
      .map((code) => data.rates[code]);
    setRates(parsed);
    setLastUpdate(data.last_update);
  };

  // Завантаження при першому рендері
  const loadRates = useCallback(async () => {
    try {
      const res = await fetch('/api/currency/rates');
      if (!res.ok) throw new Error('Failed to fetch');
      const data: RatesResponse = await res.json();
      parseRates(data);
    } catch {
      toast.error('Не вдалося завантажити курси валют');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRates();
    // Автоматичне оновлення кожні 30 секунд
    const interval = setInterval(loadRates, 30_000);
    return () => clearInterval(interval);
  }, [loadRates]);

  // Ручне оновлення через кнопку
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const res = await fetch('/api/currency/update');
      if (!res.ok) throw new Error('Failed to update');
      const data: RatesResponse = await res.json();
      parseRates(data);
      toast.success('Курси валют успішно оновлено!', {
        description: lastUpdate ? `Оновлено о ${data.last_update}` : 'Актуальні дані отримано',
        duration: 3000,
      });
    } catch {
      toast.error('Помилка оновлення курсів');
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
                <span className="ml-2 text-sm text-gray-400">· оновлено о {lastUpdate}</span>
              )}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
            {/* Left: Table */}
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
                        // Skeleton loader
                        Array.from({ length: 7 }).map((_, i) => (
                          <tr key={i} className="border-b border-gray-100">
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-6 bg-gray-200 rounded animate-pulse" />
                                <div className="w-16 h-4 bg-gray-200 rounded animate-pulse" />
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <div className="w-16 h-4 bg-gray-200 rounded animate-pulse" />
                            </td>
                            <td className="py-3 px-4">
                              <div className="w-16 h-4 bg-gray-200 rounded animate-pulse" />
                            </td>
                          </tr>
                        ))
                      ) : (
                        rates.map((rate, index) => (
                          <tr
                            key={index}
                            className="border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors"
                          >
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2">
                                <span className="text-2xl">{rate.flag}</span>
                                <span className="font-medium">{rate.name}</span>
                                {rate.trend && rate.trend !== 'neutral' && (
                                  <TrendingUp
                                    className={`w-4 h-4 ${
                                      rate.trend === 'up'
                                        ? 'text-green-500'
                                        : 'text-red-500 rotate-180'
                                    }`}
                                  />
                                )}
                              </div>
                            </td>
                            <td className="py-3 px-4 text-gray-900">{formatRate(rate.buy)}</td>
                            <td className="py-3 px-4 text-gray-900">{formatRate(rate.sell)}</td>
                          </tr>
                        ))
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
                  {refreshing ? 'Оновлення...' : 'Оновити курси'}
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

            {/* Right: Illustration */}
            <div className="hidden md:flex flex-col items-center justify-end">
              <CurrencyImg />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}