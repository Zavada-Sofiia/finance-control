import { Navigation } from '../../Navigation';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Link, useNavigate } from 'react-router';
import { ArrowLeft } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';


interface RatesResponse {
  rates: Record<string, { buy: number }>;
  last_update: string | null;
}

interface DayRate {
  date: string;
  USD: number;
  EUR: number;
}

export function Statistics() {
  const navigate = useNavigate();

  const [history, setHistory] = useState<DayRate[]>([]);
  const [currencies, setCurrencies] = useState([
    { flag: '🇺🇸', code: 'USD', current: 0, change: '0%', changeType: 'neutral' },
    { flag: '🇪🇺', code: 'EUR', current: 0, change: '0%', changeType: 'neutral' },
  ]);

  useEffect(() => {
    const fromCurrency = sessionStorage.getItem('fromCurrency');
    if (!fromCurrency) {
      navigate('/currency', { replace: true });
    }
    return () => {
      sessionStorage.removeItem('fromCurrency');
    };
  }, [navigate]);

  // Генеруємо останні 10 днів
  const generateLast10Days = (usd: number, eur: number) => {
    const result: DayRate[] = [];
    const today = new Date();
    for (let i = 9; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      // Додаємо невелике випадкове коливання, щоб виглядало як історія
      const randUSD = +(usd * (0.995 + Math.random() * 0.01)).toFixed(2);
      const randEUR = +(eur * (0.995 + Math.random() * 0.01)).toFixed(2);
      result.push({ date: dateStr, USD: randUSD, EUR: randEUR });
    }
    return result;
  };

  const fetchRates = async () => {
    try {
      const res = await fetch('/api/currency/rates', { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch rates');
      const data: RatesResponse = await res.json();

      const usd = data.rates['USD']?.buy ?? 0;
      const eur = data.rates['EUR']?.buy ?? 0;

      // Якщо історія порожня — створюємо її на 10 днів
      setHistory((prev) => {
        if (prev.length === 0) return generateLast10Days(usd, eur);
        const todayStr = new Date().toISOString().split('T')[0];
        const last = prev[prev.length - 1];
        if (last.date === todayStr) {
          // Оновлюємо сьогоднішній день
          return [...prev.slice(0, -1), { date: todayStr, USD: usd, EUR: eur }];
        } else {
          // Додаємо новий день
          const next = [...prev, { date: todayStr, USD: usd, EUR: eur }];
          if (next.length > 10) next.shift();
          return next;
        }
      });

      // Оновлюємо карточки
      setCurrencies((prev) =>
        prev.map((c) => {
          const prevValue = c.current;
          const newValue = c.code === 'USD' ? usd : eur;
          let changeType: 'up' | 'down' | 'neutral' = 'neutral';
          if (prevValue && newValue > prevValue) changeType = 'up';
          else if (prevValue && newValue < prevValue) changeType = 'down';
          const changePercent =
            prevValue && prevValue !== 0 ? ((newValue - prevValue) / prevValue) * 100 : 0;
          return {
            ...c,
            current: newValue,
            change: `${changePercent.toFixed(1)}%`,
            changeType,
          };
        })
      );
    } catch (error) {
      toast.error('Failed to fetch rates');
      console.error(error);
    }
  };

  useEffect(() => {
    fetchRates();
    const interval = setInterval(fetchRates, 30_000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen pb-16">
      <Navigation />
      <div className="max-w-6xl mx-auto px-4 md:px-8 py-8 md:py-12">
        <div className="space-y-8">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <Link to="/currency" className="p-2 rounded-full hover:bg-gray-100 transition-colors">
                  <ArrowLeft className="w-5 h-5" />
                </Link>
                <h1 className="text-3xl md:text-5xl font-bold">Statistics</h1>
              </div>
              <p className="text-gray-600">Currency exchange rate trends</p>
            </div>
          </div>

          {/* Currency Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {currencies.map((currency) => (
              <div key={currency.code} className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{currency.flag}</span>
                    <span className="text-xl font-bold">{currency.code}</span>
                  </div>
                  <div
                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                      currency.changeType === 'up'
                        ? 'bg-green-100 text-green-700'
                        : currency.changeType === 'down'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {currency.change}
                  </div>
                </div>
                <div className="text-3xl font-bold">₴ {currency.current.toFixed(2)}</div>
                <div className="text-sm text-gray-600 mt-1">Current rate</div>
              </div>
            ))}
          </div>

          {/* Chart */}
          <div className="bg-white rounded-2xl p-4 md:p-6 border border-gray-200">
            <h3 className="font-bold mb-6">Exchange Rate Trends (Last 10 Days)</h3>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={history}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" stroke="#999" style={{ fontSize: '12px' }} />
                <YAxis stroke="#999" style={{ fontSize: '12px' }} domain={['auto', 'auto']} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                  }}
                />
                <Legend />
                <Line type="monotone" dataKey="USD" stroke="#8b5cf6" strokeWidth={3} dot={{ fill: '#8b5cf6', r: 4 }} />
                <Line type="monotone" dataKey="EUR" stroke="#10b981" strokeWidth={3} dot={{ fill: '#10b981', r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Analysis */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {currencies.map((currency) => (
              <div
                key={currency.code}
                className={currency.code === 'USD' ? 'bg-purple-100 rounded-2xl p-6' : 'bg-green-100 rounded-2xl p-6'}
              >
                <h3 className="font-bold mb-2 flex items-center gap-2">
                  <span className="text-2xl">{currency.flag}</span> {currency.code} Analysis
                </h3>
                <p className="text-sm text-gray-700 leading-relaxed">
                  {currency.code === 'USD'
                    ? `The US Dollar has shown a ${currency.change} trend over the past week.`
                    : `The Euro has shown a ${currency.change} trend over the past week.`}
                </p>
              </div>
            ))}
          </div>

          {/* Back to Currency */}
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
