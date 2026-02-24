import { useState, useEffect } from 'react';
import axios from 'axios';
import { Navigation } from '../../Navigation';
import { Plus, X } from 'lucide-react';
import wishlist_back_Img from '../../assets/wish_list_back_img.png';

const WishlistImg = () => <img src={wishlist_back_Img} alt="Savings" className="w-full h-auto object-contain" />;

interface WishlistItem {
  id: number;
  name: string;
  price: number;
  is_bought: boolean;
}

export function Wishlist() {
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [newItemAmount, setNewItemAmount] = useState('');

  const token = localStorage.getItem('access_token'); // JWT

  // --- Fetch wishlist from backend
  const fetchWishlist = async () => {
    const res = await axios.get('/wishlist/', {
      headers: { Authorization: `Bearer ${token}` }
    });
    setItems(res.data);
  };

  useEffect(() => {
    fetchWishlist();
  }, []);

  // --- Toggle item (is_bought)
  const toggleItem = async (id: number) => {
    const res = await axios.patch(`/wishlist/${id}`, {}, {
      headers: { Authorization: `Bearer ${token}` }
    });
    setItems(items.map(i => i.id === id ? res.data : i));
  };

  // --- Add new item
  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName || !newItemAmount) return;
    const res = await axios.post('/wishlist/', {
      name: newItemName,
      price: parseFloat(newItemAmount)
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    setItems([...items, res.data]);
    setNewItemName('');
    setNewItemAmount('');
    setShowModal(false);
  };

  // --- Delete item
  const handleDelete = async (id: number) => {
    await axios.delete(`/wishlist/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    setItems(items.filter(i => i.id !== id));
  };

  const totalAmount = items.reduce((sum, i) => sum + i.price, 0);
  const completedAmount = items.filter(i => i.is_bought).reduce((sum, i) => sum + i.price, 0);
  const progress = totalAmount > 0 ? (completedAmount / totalAmount) * 100 : 0;

  return (
    <div className="min-h-screen pb-16">
      <Navigation />
      <div className="max-w-6xl mx-auto px-4 md:px-8 py-8 md:py-12 grid md:grid-cols-2 gap-8">
        <div>
          <h1 className="text-3xl font-bold">Wishlist</h1>
          <div className="bg-gradient-to-br from-purple-100 to-pink-100 rounded-3xl p-6 my-4">
            <div className="flex justify-between">
              <span>Progress</span>
              <span>{progress.toFixed(0)}%</span>
            </div>
            <div className="w-full bg-white h-3 rounded-full overflow-hidden">
              <div className="bg-gradient-to-r from-purple-400 to-pink-400 h-full" style={{ width: `${progress}%` }}></div>
            </div>
          </div>

          <button onClick={() => setShowModal(true)}>Add Goal</button>

          <div className="mt-4 space-y-3">
            {items.map(item => (
              <div key={item.id} className="flex justify-between items-center p-4 bg-white rounded-2xl border">
                <div className="flex items-center gap-2">
                  <button onClick={() => toggleItem(item.id)}>
                    {item.is_bought ? '✔️' : '⬜'}
                  </button>
                  <span className={item.is_bought ? 'line-through text-gray-400' : ''}>{item.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>₴ {item.price.toLocaleString()}</span>
                  <button onClick={() => handleDelete(item.id)}>❌</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="hidden md:flex flex-col items-center justify-center space-y-8">
          <WishlistImg />
        </div>

        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4">
            <div className="bg-white rounded-3xl p-6 md:p-8 w-full max-w-md">
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
                    onChange={e => setNewItemName(e.target.value)}
                    placeholder="Enter goal name"
                    className="w-full px-5 py-3.5 rounded-full border-2 border-gray-200 focus:outline-none focus:border-purple-300 bg-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Amount</label>
                  <input
                    type="number"
                    value={newItemAmount}
                    onChange={e => setNewItemAmount(e.target.value)}
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
    </div>
  );
}
