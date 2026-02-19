import { Link, useLocation } from 'react-router';
import { useAuth } from './contexts/AuthContext';
import { LogOut } from 'lucide-react';

export function Navigation() {
  const location = useLocation();
  const { isAuthenticated, logout } = useAuth();

  const navItems = [
    { path: '/', label: 'Home' },
    { path: '/tracker', label: 'Tracker', protected: true },
    { path: '/wishlist', label: 'Wishlist', protected: true },
    { path: '/currency', label: 'Currency' },
  ];

  return (
    <nav className="px-6 py-4 sticky top-0 bg-[#fef9f5] z-50 border-b border-gray-100">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            <div className="w-2 h-6 bg-purple-400 rounded-full"></div>
            <div className="w-2 h-6 bg-green-400 rounded-full"></div>
            <div className="w-2 h-6 bg-yellow-400 rounded-full"></div>
          </div>
        </div>

        <div className="flex items-center gap-8">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`text-sm font-medium transition-colors ${
                  isActive
                    ? 'text-gray-900'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </div>

        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <button
              onClick={logout}
              className="px-6 py-2 rounded-full bg-red-100 text-red-700 text-sm font-medium hover:bg-red-200 transition-colors flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          ) : (
            <>
              <Link
                to="/login"
                className="px-6 py-2 rounded-full bg-purple-300 text-gray-900 text-sm font-medium hover:bg-purple-400 transition-colors"
              >
                Log in
              </Link>
              <Link
                to="/signup"
                className="px-6 py-2 rounded-full bg-green-300 text-gray-900 text-sm font-medium hover:bg-green-400 transition-colors"
              >
                Sign up
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
