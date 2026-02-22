import { Link, useLocation } from 'react-router';
import { useAuth } from './contexts/AuthContext';
import { LogOut, Menu, X } from 'lucide-react';
import { useState } from 'react';

export function Navigation() {
  const location = useLocation();
  const { isAuthenticated, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  const navItems = [
    { path: '/', label: 'Home' },
    { path: '/tracker', label: 'Tracker', protected: true },
    { path: '/wishlist', label: 'Wishlist', protected: true },
    { path: '/currency', label: 'Currency' },
  ];

  return (
    <nav className="px-6 py-4 sticky top-0 bg-[#fef9f5] z-50 border-b border-gray-100">
      <div className="max-w-7xl mx-auto flex items-center justify-between">

        {/* Лого */}
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            <div className="w-2 h-6 bg-purple-400 rounded-full"></div>
            <div className="w-2 h-6 bg-green-400 rounded-full"></div>
            <div className="w-2 h-6 bg-yellow-400 rounded-full"></div>
          </div>
        </div>

        {/* Десктоп навігація */}
        <div className="hidden md:flex items-center gap-8">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`text-sm font-medium transition-colors ${
                  isActive ? 'text-gray-900' : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </div>

        {/* Десктоп кнопки */}
        <div className="hidden md:flex items-center gap-3">
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

        {/* Бургер кнопка — тільки мобільний */}
        <button
          className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Мобільне меню */}
      {menuOpen && (
        <div className="md:hidden mt-4 pb-4 flex flex-col gap-3 border-t border-gray-100 pt-4">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMenuOpen(false)}
                className={`text-sm font-medium px-2 py-1 ${
                  isActive ? 'text-gray-900' : 'text-gray-500'
                }`}
              >
                {item.label}
              </Link>
            );
          })}

          <div className="flex flex-col gap-2 mt-2">
            {isAuthenticated ? (
              <button
                onClick={() => { logout(); setMenuOpen(false); }}
                className="px-6 py-2 rounded-full bg-red-100 text-red-700 text-sm font-medium flex items-center gap-2 justify-center"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            ) : (
              <>
                <Link
                  to="/login"
                  onClick={() => setMenuOpen(false)}
                  className="px-6 py-2 rounded-full bg-purple-300 text-gray-900 text-sm font-medium text-center hover:bg-purple-400 transition-colors"
                >
                  Log in
                </Link>
                <Link
                  to="/signup"
                  onClick={() => setMenuOpen(false)}
                  className="px-6 py-2 rounded-full bg-green-300 text-gray-900 text-sm font-medium text-center hover:bg-green-400 transition-colors"
                >
                  Sign up
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}