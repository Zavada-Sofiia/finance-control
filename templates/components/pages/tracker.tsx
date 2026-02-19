import { useState, useMemo } from 'react';
import { Navigation } from '../../Navigation';
import { Plus, X, Calendar } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

interface Transaction {
  id: string;
  name: string;
  amount: number;
  color: string;
  date: string;
}

export function Tracker() {
  const [activeTab, setActiveTab] = useState<'expenses' | 'income'>('expenses');
  const [timePeriod, setTimePeriod] = useState<'day' | 'week' | 'month' | 'year'>('month');
  const [showModal, setShowModal] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [newItemName, setNewItemName] = useState('');
  const [newItemAmount, setNewItemAmount] = useState('');
  const [newItemDate, setNewItemDate] = useState(new Date().toISOString().split('T')[0]);

  const [expenses, setExpenses] = useState<Transaction[]>([
    { id: '1', name: 'Підписки', amount: 8200, color: '#c084fc', date: '2026-02-10' },
    { id: '2', name: 'Їжа', amount: 8200, color: '#d8b4fe', date: '2026-02-09' },
    { id: '3', name: 'Інше', amount: 16283, color: '#fde047', date: '2026-02-05' },
  ]);

  const [income, setIncome] = useState<Transaction[]>([
    { id: '1', name: 'Зарплата', amount: 45000, color: '#86efac', date: '2026-02-01' },
    { id: '2', name: 'Фріланс', amount: 12000, color: '#6ee7b7', date: '2026-02-08' },
    { id: '3', name: 'Інше', amount: 3000, color: '#fde047', date: '2026-02-10' },
  ]);

  const colors = ['#c084fc', '#d8b4fe', '#fde047', '#86efac', '#6ee7b7', '#fbbf24', '#fb923c'];

  // Filter data by time period
  const filteredData = useMemo(() => {
    const currentData = activeTab === 'expenses' ? expenses : income;
    const referenceDate = selectedDate;

    return currentData.filter(item => {
      const itemDate = new Date(item.date);

      switch(timePeriod) {
        case 'day':
          return itemDate.toDateString() === referenceDate.toDateString();
        case 'week':
          const weekStart = new Date(referenceDate);
          weekStart.setDate(referenceDate.getDate() - referenceDate.getDay());
          const weekEnd = new Date(weekStart);
          weekEnd.setDate(weekStart.getDate() + 6);
          return itemDate >= weekStart && itemDate <= weekEnd;
        case 'month':
          return itemDate.getMonth() === referenceDate.getMonth() &&
                 itemDate.getFullYear() === referenceDate.getFullYear();
        case 'year':
          return itemDate.getFullYear() === referenceDate.getFullYear();
        default:
          return true;
      }
    });
  }, [activeTab, expenses, income, timePeriod, selectedDate]);

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();

    if (!newItemName || !newItemAmount || !newItemDate) return;

    const newItem: Transaction = {
      id: Date.now().toString(),
      name: newItemName,
      amount: parseFloat(newItemAmount),
      color: colors[Math.floor(Math.random() * colors.length)],
      date: newItemDate,
    };

    if (activeTab === 'expenses') {
      setExpenses([...expenses, newItem]);
    } else {
      setIncome([...income, newItem]);
    }

    setNewItemName('');
    setNewItemAmount('');
    setNewItemDate(new Date().toISOString().split('T')[0]);
    setShowModal(false);
  };

  const handleDelete = (id: string) => {
    if (activeTab === 'expenses') {
      setExpenses(expenses.filter(item => item.id !== id));
    } else {
      setIncome(income.filter(item => item.id !== id));
    }
  };

  const getPeriodLabel = () => {
    switch(timePeriod) {
      case 'day':
        return selectedDate.toLocaleDateString('uk-UA', { day: 'numeric', month: 'long', year: 'numeric' });
      case 'week':
        const weekStart = new Date(selectedDate);
        weekStart.setDate(selectedDate.getDate() - selectedDate.getDay());
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        return `${weekStart.toLocaleDateString('uk-UA', { day: 'numeric', month: 'short' })} - ${weekEnd.toLocaleDateString('uk-UA', { day: 'numeric', month: 'short', year: 'numeric' })}`;
      case 'month':
        return selectedDate.toLocaleDateString('uk-UA', { month: 'long', year: 'numeric' });
      case 'year':
        return selectedDate.getFullYear().toString();
      default:
        return '';
    }
  };

  const handleDateChange = (direction: 'prev' | 'next') => {
    const newDate = new Date(selectedDate);

    switch(timePeriod) {
      case 'day':
        newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1));
        break;
      case 'week':
        newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
        break;
      case 'month':
        newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
        break;
      case 'year':
        newDate.setFullYear(newDate.getFullYear() + (direction === 'next' ? 1 : -1));
        break;
    }

    setSelectedDate(newDate);
  };

  return (
    <div className="min-h-screen pb-16">
      <Navigation />

      <div className="max-w-6xl mx-auto px-8 py-12">
        <div className="flex items-start justify-between mb-12">
          <div>
            <h1 className="text-5xl font-bold mb-2">Tracker</h1>
            <p className="text-gray-600">Manage your finances and track spending</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-12">
          {/* Left: Controls and List */}
          <div className="space-y-8">
            {/* Total */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className={`w-2 h-2 rounded-full ${activeTab === 'expenses' ? 'bg-purple-400' : 'bg-green-400'}`}></div>
                <span className="text-2xl font-bold">
                  ₴ {filteredData.reduce((sum, item) => sum + item.amount, 0).toLocaleString()}
                </span>
              </div>
              <p className="text-sm text-gray-500">
                {getPeriodLabel()} ({filteredData.length} transactions)
              </p>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 bg-gray-100 p-1 rounded-full w-fit">
              <button
                onClick={() => setActiveTab('expenses')}
                className={`px-6 py-2 rounded-full text-sm font-medium transition-colors ${
                  activeTab === 'expenses'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600'
                }`}
              >
                Expenses
              </button>
              <button
                onClick={() => setActiveTab('income')}
                className={`px-6 py-2 rounded-full text-sm font-medium transition-colors ${
                  activeTab === 'income'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600'
                }`}
              >
                Income
              </button>
            </div>

            {/* Time Period */}
            <div className="flex gap-2 text-sm">
              {['Day', 'Week', 'Month', 'Year'].map((period) => (
                <button
                  key={period}
                  onClick={() => setTimePeriod(period.toLowerCase() as any)}
                  className={`px-4 py-1.5 rounded-full transition-colors ${
                    timePeriod === period.toLowerCase()
                      ? 'bg-gray-900 text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {period}
                </button>
              ))}
            </div>

            {/* Date Selector */}
            <div className="bg-white rounded-xl p-3 border border-gray-200">
              <div className="flex items-center justify-between">
                <button
                  onClick={() => handleDateChange('prev')}
                  className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
                >
                  ←
                </button>

                <button
                  onClick={() => setShowDatePicker(!showDatePicker)}
                  className="flex items-center gap-2 px-3 py-1.5 hover:bg-gray-50 rounded-full transition-colors"
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span className="text-sm font-medium">{getPeriodLabel()}</span>
                </button>

                <button
                  onClick={() => handleDateChange('next')}
                  className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
                >
                  →
                </button>
              </div>

              {showDatePicker && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <input
                    type="date"
                    value={selectedDate.toISOString().split('T')[0]}
                    onChange={(e) => {
                      setSelectedDate(new Date(e.target.value));
                      setShowDatePicker(false);
                    }}
                    className="w-full px-3 py-2 text-sm rounded-full border border-gray-200 focus:outline-none focus:border-purple-300"
                  />
                </div>
              )}
            </div>

            {/* Transactions List */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-bold">{activeTab === 'expenses' ? 'Expenses' : 'Income'}</h3>
                <button
                  onClick={() => setShowModal(true)}
                  className="text-purple-600 text-sm hover:text-purple-700 flex items-center gap-1"
                >
                  <Plus className="w-4 h-4" />
                  Add {activeTab === 'expenses' ? 'expense' : 'income'}
                </button>
              </div>

              <div className="max-h-96 overflow-y-auto pr-2">
                {filteredData.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between py-3 border-b border-gray-200 group"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <div
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: item.color }}
                      ></div>
                      <div className="flex-1">
                        <span className="text-gray-900 block">{item.name}</span>
                        <span className="text-xs text-gray-500">{new Date(item.date).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-semibold">₴ {item.amount.toLocaleString()}</span>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:text-red-700"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}

                {filteredData.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No transactions for this period
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right: Chart */}
          <div className="flex flex-col items-center space-y-8">
            <div className="relative w-96 h-96">
              {filteredData.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={filteredData}
                        cx="50%"
                        cy="50%"
                        innerRadius={110}
                        outerRadius={170}
                        paddingAngle={2}
                        dataKey="amount"
                        minAngle={5}
                      >
                        {filteredData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="text-center">
                      <div className="text-sm text-gray-600">Total</div>
                      <div className="text-2xl font-bold">
                        ₴ {filteredData.reduce((sum, item) => sum + item.amount, 0).toLocaleString()}
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400">
                  No data to display
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Add Item Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-3xl p-8 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">
                Add {activeTab === 'expenses' ? 'Expense' : 'Income'}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleAddItem} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                <input
                  type="text"
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  placeholder={`Enter ${activeTab === 'expenses' ? 'expense' : 'income'} name`}
                  className="w-full px-5 py-3.5 rounded-full border-2 border-gray-200 focus:outline-none focus:border-purple-300 bg-white"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Amount</label>
                <input
                  type="number"
                  value={newItemAmount}
                  onChange={(e) => setNewItemAmount(e.target.value)}
                  placeholder="Enter amount"
                  className="w-full px-5 py-3.5 rounded-full border-2 border-gray-200 focus:outline-none focus:border-purple-300 bg-white"
                  required
                  min="0"
                  step="0.01"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                <input
                  type="date"
                  value={newItemDate}
                  onChange={(e) => setNewItemDate(e.target.value)}
                  className="w-full px-5 py-3.5 rounded-full border-2 border-gray-200 focus:outline-none focus:border-purple-300 bg-white"
                  required
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-3.5 rounded-full bg-gray-100 text-gray-900 font-medium hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3.5 rounded-full bg-purple-300 text-gray-900 font-medium hover:bg-purple-400 transition-colors"
                >
                  Add
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
