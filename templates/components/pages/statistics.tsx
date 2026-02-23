import { Navigation } from '../Navigation';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Link, useNavigate } from 'react-router';
import { ArrowLeft } from 'lucide-react';
import { useEffect } from 'react';

export function Statistics() {
  const navigate = useNavigate();

  // Check if user came from currency page
  useEffect(() => {
    const fromCurrency = sessionStorage.getItem('fromCurrency');
    if (!fromCurrency) {
      // Redirect back to currency if not coming from there
      navigate('/currency', { replace: true });
    }

    // Clear the flag
    return () => {
      sessionStorage.removeItem('fromCurrency');
    };
  }, [navigate]);

  // Historical data for USD and EUR
  const exchangeData = [
    { date: 'Feb 1', usd: 40.2, eur: 50.1 },
    { date: 'Feb 3', usd: 40.3, eur: 50.3 },
    { date: 'Feb 5', usd: 40.5, eur: 50.2 },
    { date: 'Feb 7', usd: 40.4, eur: 50.4 },
    { date: 'Feb 9', usd: 40.6, eur: 50.3 },
    { date: 'Feb 11', usd: 40.8, eur: 50.5 },
  ];

  const currencies = [
    { flag: '🇺🇸', code: 'USD', current: '40.80', change: '+1.5%', changeType: 'up' },
    { flag: '🇪🇺', code: 'EUR', current: '50.50', change: '+0.8%', changeType: 'up' },
  ];

  return (
    <div className="min-h-screen pb-16">
      <Navigation />

      <div className="max-w-6xl mx-auto px-8 py-12">
        <div className="space-y-8">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <Link
                  to="/currency"
                  className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                >
                  <ArrowLeft className="w-5 h-5" />
                </Link>
                <h1 className="text-5xl font-bold">Statistics</h1>
              </div>
              <p className="text-gray-600">Currency exchange rate trends</p>
            </div>
          </div>

          {/* Currency Cards */}
          <div className="grid grid-cols-2 gap-4">
            {currencies.map((currency) => (
              <div
                key={currency.code}
                className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 border border-gray-200"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{currency.flag}</span>
                    <span className="text-xl font-bold">{currency.code}</span>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                    currency.changeType === 'up'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-red-100 text-red-700'
                  }`}>
                    {currency.change}
                  </div>
                </div>
                <div className="text-3xl font-bold">₴ {currency.current}</div>
                <div className="text-sm text-gray-600 mt-1">Current rate</div>
              </div>
            ))}
          </div>

          {/* Chart */}
          <div className="bg-white rounded-2xl p-6 border border-gray-200">
            <h3 className="font-bold mb-6">Exchange Rate Trends (Last 10 Days)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={exchangeData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="date"
                  stroke="#999"
                  style={{ fontSize: '12px' }}
                />
                <YAxis
                  stroke="#999"
                  style={{ fontSize: '12px' }}
                  domain={[38, 52]}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="usd"
                  stroke="#8b5cf6"
                  strokeWidth={3}
                  name="USD"
                  dot={{ fill: '#8b5cf6', r: 4 }}
                />
                <Line
                  type="monotone"
                  dataKey="eur"
                  stroke="#10b981"
                  strokeWidth={3}
                  name="EUR"
                  dot={{ fill: '#10b981', r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Analysis */}
          <div className="grid grid-cols-2 gap-6">
            <div className="bg-purple-100 rounded-2xl p-6">
              <h3 className="font-bold mb-2 flex items-center gap-2">
                <span className="text-2xl">🇺🇸</span> USD Analysis
              </h3>
              <p className="text-sm text-gray-700 leading-relaxed">
                The US Dollar has shown a steady upward trend over the past week,
                increasing by 1.5%. This indicates a strengthening dollar against
                the local currency.
              </p>
            </div>

            <div className="bg-green-100 rounded-2xl p-6">
              <h3 className="font-bold mb-2 flex items-center gap-2">
                <span className="text-2xl">🇪🇺</span> EUR Analysis
              </h3>
              <p className="text-sm text-gray-700 leading-relaxed">
                The Euro has maintained a stable position with a modest 0.8% increase.
                The currency shows consistent growth with minor fluctuations.
              </p>
            </div>
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
