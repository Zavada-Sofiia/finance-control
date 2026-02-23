import { Navigation } from '../Navigation';
import { Link } from 'react-router';
import { TrendingUp } from 'lucide-react';
import { toast, Toaster } from 'sonner@2.0.3';
import currencyImg from 'figma:asset/c0e6d6904dcc5e535d27afa4fe0bebd179d55f76.png';

interface ExchangeRate {
  flag: string;
  name: string;
  buy: string;
  sell: string;
  trend?: 'up' | 'down';
}

export function Currency() {
  const rates: ExchangeRate[] = [
    { flag: '🇺🇸', name: 'USD', buy: '40,40', sell: '40,8000', trend: 'up' },
    { flag: '🇪🇺', name: 'EUR', buy: '50,450', sell: '50,8000', trend: 'down' },
    { flag: '🇬🇧', name: 'GBP', buy: '55,550', sell: '56,2000', trend: 'up' },
    { flag: '🇨🇦', name: 'CAD (100)', buy: '8,8000', sell: '1,9899' },
    { flag: '🇵🇱', name: 'PLN (10)', buy: '3,2634', sell: '3,5900' },
    { flag: '🇨🇿', name: 'CZK (10)', buy: '3,2500', sell: '3,4900' },
    { flag: '🇯🇵', name: 'JPY (10)', buy: '27,7163', sell: '29,1400' },
  ];

  const handleRefresh = () => {
    toast.success('Курси валют успішно оновлено!', {
      description: 'Актуальні дані отримано',
      duration: 3000,
    });
  };

  return (
    <div className="min-h-screen pb-16">
      <Toaster position="top-center" richColors />
      <Navigation />

      <div className="max-w-6xl mx-auto px-8 py-12">
        <div className="space-y-8">
          <div>
            <h1 className="text-5xl font-bold mb-2">Exchange rates</h1>
            <p className="text-gray-600">Current currency exchange rates</p>
          </div>

          <div className="grid grid-cols-2 gap-8 items-start">
            {/* Left: Table */}
            <div className="space-y-6">
              <div className="bg-white rounded-2xl overflow-hidden border border-gray-200 shadow-sm">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50">
                      <th className="text-left py-3 px-4 font-medium text-gray-600 text-sm">Currency</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600 text-sm">Buy</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600 text-sm">Sell</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rates.map((rate, index) => (
                      <tr key={index} className="border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <span className="text-2xl">{rate.flag}</span>
                            <span className="font-medium">{rate.name}</span>
                            {rate.trend && (
                              <TrendingUp
                                className={`w-4 h-4 ${rate.trend === 'up' ? 'text-green-500' : 'text-red-500 rotate-180'}`}
                              />
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-gray-900">{rate.buy}</td>
                        <td className="py-3 px-4 text-gray-900">{rate.sell}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleRefresh}
                  className="flex-1 py-3.5 rounded-full bg-yellow-300 text-gray-900 font-medium hover:bg-yellow-400 transition-colors"
                >
                  Оновити курси
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
            <div className="flex flex-col items-center justify-end">
              <img
                src={currencyImg}
                alt="Currency exchange"
                className="w-full h-auto object-contain"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
