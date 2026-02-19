import { useState } from 'react';
import { Navigation } from '../../Navigation';
import { Plus, X } from 'lucide-react';
import wishlist_back_Img from '../../assets/wish_list_back_img.png';

export function WishlistImg() {
  return <img src={wishlist_back_Img} alt="Savings" className="w-full h-auto object-contain" />;
}

interface WishlistItem {
  id: string;
  name: string;
  amount: number;
  checked: boolean;
}

export function Wishlist() {
  const [items, setItems] = useState<WishlistItem[]>([
    { id: '1', name: 'Бюджетна надпакет', amount: 9000, checked: false },
    { id: '2', name: 'Захід подорожі', amount: 25000, checked: false },
    { id: '3', name: 'Новий ноутбук', amount: 35000, checked: false },
    { id: '4', name: 'Відпустка', amount: 40000, checked: true },
  ]);

  const [showModal, setShowModal] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [newItemAmount, setNewItemAmount] = useState('');

  const toggleItem = (id: string) => {
    setItems(items.map(item =>
      item.id === id ? { ...item, checked: !item.checked } : item
    ));
  };

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();

    if (!newItemName || !newItemAmount) return;

    const newItem: WishlistItem = {
      id: Date.now().toString(),
      name: newItemName,
      amount: parseFloat(newItemAmount),
      checked: false,
    };

    setItems([...items, newItem]);
    setNewItemName('');
    setNewItemAmount('');
    setShowModal(false);
  };

  const handleDelete = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };

  const totalAmount = items.reduce((sum, item) => sum + item.amount, 0);
  const completedAmount = items.filter(item => item.checked).reduce((sum, item) => sum + item.amount, 0);
  const progress = totalAmount > 0 ? (completedAmount / totalAmount) * 100 : 0;

  return (
    <div className="min-h-screen pb-16">
      <Navigation />

      <div className="max-w-6xl mx-auto px-8 py-12">
        <div className="grid grid-cols-2 gap-12">
          {/* Left: Wishlist */}
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-5xl font-bold mb-2">Wishlist</h1>
                <p className="text-gray-600">Track your financial goals</p>
              </div>
            </div>

            {/* Progress Overview */}
            <div className="bg-gradient-to-br from-purple-100 to-pink-100 rounded-3xl p-6">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-gray-700">Overall Progress</span>
                <span className="text-sm font-bold text-gray-900">{progress.toFixed(0)}%</span>
              </div>
              <div className="w-full bg-white rounded-full h-3 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-purple-400 to-pink-400 h-full rounded-full transition-all duration-500"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
              <div className="mt-4 flex items-center justify-between text-sm">
                <span className="text-gray-600">Completed: ₴ {completedAmount.toLocaleString()}</span>
                <span className="text-gray-600">Total: ₴ {totalAmount.toLocaleString()}</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <h3 className="font-medium text-gray-600">Your goals</h3>
              <button
                onClick={() => setShowModal(true)}
                className="px-6 py-2.5 rounded-full bg-yellow-300 text-gray-900 font-medium hover:bg-yellow-400 transition-colors flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Goal
              </button>
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between py-4 px-6 bg-white rounded-2xl border border-gray-200 group hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <button
                      onClick={() => toggleItem(item.id)}
                      className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors flex-shrink-0 ${
                        item.checked
                          ? 'bg-purple-400 border-purple-400'
                          : 'border-gray-300'
                      }`}
                    >
                      {item.checked && (
                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </button>
                    <span className={item.checked ? 'line-through text-gray-400' : 'text-gray-900'}>
                      {item.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`font-semibold ${item.checked ? 'text-gray-400' : 'text-gray-900'}`}>
                      ₴ {item.amount.toLocaleString()}
                    </span>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:text-red-700"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Illustrations */}
          <div className="flex flex-col items-center justify-center space-y-8">
            <WishlistImg />

            <div className="bg-white rounded-3xl p-6 border border-gray-200 max-w-sm">
              <h3 className="font-bold mb-2">Pro Tip</h3>
              <p className="text-sm text-gray-600">
                Break down large goals into smaller milestones to stay motivated and track progress more effectively.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Add Goal Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-3xl p-8 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Add New Goal</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleAddItem} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Goal Name</label>
                <input
                  type="text"
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  placeholder="Enter goal name"
                  className="w-full px-5 py-3.5 rounded-full border-2 border-gray-200 focus:outline-none focus:border-purple-300 bg-white"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Target Amount</label>
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
                  className="flex-1 py-3.5 rounded-full bg-yellow-300 text-gray-900 font-medium hover:bg-yellow-400 transition-colors"
                >
                  Add Goal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
