import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { Navigation } from '../Navigation';
import { useAuth } from '../../contexts/AuthContext';
import loginImg from 'figma:asset/2b47de896dd28d75efb59df4b2d7e597225f5c64.png';

export function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Reset errors
    setEmailError('');
    setPasswordError('');

    // Validate email is not empty
    if (!email.trim()) {
      setEmailError('Please enter your email address');
      return;
    }

    // Validate email format
    if (!validateEmail(email)) {
      setEmailError('Please enter a valid email address');
      return;
    }

    // Validate password is not empty
    if (!password) {
      setPasswordError('Please enter your password');
      return;
    }

    // Validate password length (minimum 6 characters)
    if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters long');
      return;
    }

    // If all validations pass
    login();
    navigate('/tracker');
  };

  return (
    <div className="min-h-screen">
      <Navigation />

      <div className="max-w-6xl mx-auto px-8 py-16">
        <div className="grid grid-cols-2 gap-16 items-center">
          {/* Left: Form */}
          <div className="space-y-8">
            <div>
              <h1 className="text-5xl font-bold mb-3">Log in to account</h1>
              <p className="text-gray-600">
                Join Finance Control and to Change your life activity
              </p>
            </div>

            <form onSubmit={handleSubmit} noValidate className="space-y-4">
              <div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email"
                  className="w-full px-5 py-3.5 rounded-full border-2 border-gray-200 focus:outline-none focus:border-purple-300 bg-white"
                />
                {emailError && <p className="text-red-500 text-sm mt-2 ml-5">{emailError}</p>}
              </div>

              <div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  className="w-full px-5 py-3.5 rounded-full border-2 border-gray-200 focus:outline-none focus:border-purple-300 bg-white"
                />
                {passwordError && <p className="text-red-500 text-sm mt-2 ml-5">{passwordError}</p>}
              </div>

              <button
                type="submit"
                className="w-full py-3.5 rounded-full bg-purple-300 text-gray-900 font-medium hover:bg-purple-400 transition-colors"
              >
                Sign in
              </button>
            </form>

            <div className="text-center text-sm">
              <span className="text-gray-600">Don't have an account? </span>
              <Link to="/signup" className="text-purple-600 hover:text-purple-700 font-medium">
                Sign up
              </Link>
            </div>
          </div>

          {/* Right: Illustration */}
          <div className="flex justify-center">
            <img
              src={loginImg}
              alt="Finance illustration"
              className="w-full max-w-lg h-auto object-contain"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
