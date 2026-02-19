import { Link } from 'react-router';
import { Navigation } from '../../Navigation';
import { useAuth } from '../../contexts/AuthContext';
import home_back_Img from '../../assets/home_back_img.png';

export function HomeImg() {
  return <img src={home_back_Img} alt="Home" className="w-full h-auto object-contain" />;
}


export function Landing() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen pb-16">
      <Navigation />

      <div className="max-w-7xl mx-auto px-8 py-16">
        <div className="grid grid-cols-2 gap-20 items-center mb-24">
          {/* Left: Content */}
          <div className="space-y-8">
            <h1 className="text-7xl font-bold leading-tight">
              Finance<br />Control
            </h1>

            <p className="text-xl text-gray-600 max-w-md leading-relaxed">
              Predict decisions and manage your finances wisely. Track expenses, set goals, and achieve financial freedom.
            </p>

            <div className="flex flex-wrap gap-4 pt-6">
              <Link
                to="/tracker"
                className="px-10 py-4 rounded-full bg-purple-300 text-gray-900 font-medium hover:bg-purple-400 transition-colors text-lg"
              >
                Tracker
              </Link>

              <Link
                to="/wishlist"
                className="px-10 py-4 rounded-full bg-green-300 text-gray-900 font-medium hover:bg-green-400 transition-colors text-lg"
              >
                Wishlist
              </Link>

              <Link
                to="/currency"
                className="px-10 py-4 rounded-full bg-yellow-300 text-gray-900 font-medium hover:bg-yellow-400 transition-colors text-lg"
              >
                Currency
              </Link>
            </div>
          </div>

          {/* Right: Illustration */}
          <div className="flex items-center justify-center">
            <HomeImg />
          </div>
        </div>

        {/* Features Section */}
        <div className="space-y-12">
          <div className="text-center">
            <h2 className="text-4xl font-bold mb-4">Why Finance Control?</h2>
            <p className="text-gray-600 max-w-2xl mx-auto text-lg">
              Everything you need to manage your money in one place
            </p>
          </div>

          <div className="grid grid-cols-3 gap-8">
            <div className="bg-gradient-to-br from-purple-100 to-purple-50 rounded-3xl p-8 border border-purple-200">
              <div className="text-4xl mb-4">📊</div>
              <h3 className="text-xl font-bold mb-3">Smart Tracking</h3>
              <p className="text-gray-700 leading-relaxed">
                Automatically categorize and track your expenses with beautiful visualizations and detailed insights.
              </p>
            </div>

            <div className="bg-gradient-to-br from-green-100 to-green-50 rounded-3xl p-8 border border-green-200">
              <div className="text-4xl mb-4">🎯</div>
              <h3 className="text-xl font-bold mb-3">Goal Setting</h3>
              <p className="text-gray-700 leading-relaxed">
                Set financial goals and track your progress with our intuitive wishlist feature and progress bars.
              </p>
            </div>

            <div className="bg-gradient-to-br from-yellow-100 to-yellow-50 rounded-3xl p-8 border border-yellow-200">
              <div className="text-4xl mb-4">💱</div>
              <h3 className="text-xl font-bold mb-3">Live Exchange Rates</h3>
              <p className="text-gray-700 leading-relaxed">
                Stay updated with real-time currency exchange rates and historical trends for informed decisions.
              </p>
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <div className="mt-20 bg-gradient-to-r from-purple-200 via-pink-200 to-yellow-200 rounded-3xl p-12">
          <div className="grid grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-5xl font-bold text-gray-900 mb-2">10K+</div>
              <div className="text-gray-700">Active Users</div>
            </div>
            <div>
              <div className="text-5xl font-bold text-gray-900 mb-2">₴500M+</div>
              <div className="text-gray-700">Money Managed</div>
            </div>
            <div>
              <div className="text-5xl font-bold text-gray-900 mb-2">98%</div>
              <div className="text-gray-700">Satisfaction Rate</div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        {!isAuthenticated && (
          <div className="mt-20 text-center space-y-6">
            <h2 className="text-4xl font-bold">Ready to take control?</h2>
            <p className="text-gray-600 text-lg">
              Join thousands of users managing their finances smartly
            </p>
            <div className="flex gap-4 justify-center pt-4">
              <Link
                to="/signup"
                className="px-12 py-4 rounded-full bg-purple-400 text-white font-medium hover:bg-purple-500 transition-colors text-lg shadow-lg"
              >
                Get Started Free
              </Link>
              <Link
                to="/login"
                className="px-12 py-4 rounded-full bg-white text-gray-900 font-medium hover:bg-gray-50 transition-colors text-lg border-2 border-gray-200"
              >
                Sign In
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
