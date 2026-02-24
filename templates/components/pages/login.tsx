import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { Navigation } from '../../Navigation';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';
import login_back_Img from '../../assets/login_back_img.png';

export function LoginImg() {
  return <img src={login_back_Img} alt="Login" className="w-full h-auto object-contain" />;
}

type Mode = 'login' | 'forgot' | 'reset';

export function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [mode, setMode] = useState<Mode>('login');

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const [resetUsername, setResetUsername] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // LOGIN
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(username, password);
      navigate('/tracker');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Error logging in');
    }
  };

  // STEP 1 — SEND CODE
  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');

    try {
      await axios.post('/forgot-password', { username: resetUsername });
      setMessage('Verification code sent to your email');
      setMode('reset');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Error sending reset code');
    }
  };

  // STEP 2 — RESET PASSWORD
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (newPassword !== confirmNewPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      await axios.post('/reset-password', {
        username: resetUsername,
        code,
        new_password: newPassword,
      });

      setMessage('Password successfully changed. You can now log in.');
      setMode('login');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Invalid code or error resetting password');
    }
  };

  return (
    <div className="min-h-screen">
      <Navigation />
      <div className="max-w-6xl mx-auto px-4 md:px-8 py-8 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16 items-center">

          <div className="space-y-8">
            <div>
              <h1 className="text-3xl md:text-5xl font-bold mb-3">
                {mode === 'login' && 'Log in to account'}
                {mode === 'forgot' && 'Reset Password'}
                {mode === 'reset' && 'Enter Code'}
              </h1>
            </div>

            {/* LOGIN FORM */}
            {mode === 'login' && (
              <form onSubmit={handleLogin} className="space-y-4">
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Username"
                  className="w-full px-5 py-3.5 rounded-full border-2 border-gray-200"
                  required
                />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  className="w-full px-5 py-3.5 rounded-full border-2 border-gray-200"
                  required
                />
                <button className="w-full py-3.5 rounded-full bg-purple-300 hover:bg-purple-400">
                  Sign in
                </button>

                <div className="text-right text-sm">
                  <button
                    type="button"
                    className="text-purple-600"
                    onClick={() => setMode('forgot')}
                  >
                    Forgot password?
                  </button>
                </div>
              </form>
            )}

            {/* FORGOT FORM */}
            {mode === 'forgot' && (
              <form onSubmit={handleSendCode} className="space-y-4">
                <input
                  type="text"
                  value={resetUsername}
                  onChange={(e) => setResetUsername(e.target.value)}
                  placeholder="Username"
                  className="w-full px-5 py-3.5 rounded-full border-2 border-gray-200"
                  required
                />
                <button className="w-full py-3.5 rounded-full bg-purple-300 hover:bg-purple-400">
                  Send Code
                </button>
                <button
                  type="button"
                  className="text-sm text-gray-500"
                  onClick={() => setMode('login')}
                >
                  Back to login
                </button>
              </form>
            )}

            {/* RESET FORM */}
            {mode === 'reset' && (
              <form onSubmit={handleResetPassword} className="space-y-4">
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="Verification Code"
                  className="w-full px-5 py-3.5 rounded-full border-2 border-gray-200"
                  required
                />
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="New Password"
                  className="w-full px-5 py-3.5 rounded-full border-2 border-gray-200"
                  required
                />
                <input
                  type="password"
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  placeholder="Confirm New Password"
                  className="w-full px-5 py-3.5 rounded-full border-2 border-gray-200"
                  required
                />
                <button className="w-full py-3.5 rounded-full bg-purple-300 hover:bg-purple-400">
                  Reset Password
                </button>
              </form>
            )}

            {error && <div className="text-red-500 text-sm">{error}</div>}
            {message && <div className="text-green-500 text-sm">{message}</div>}

            {mode === 'login' && (
              <div className="text-center text-sm">
                <span className="text-gray-600">Don't have an account? </span>
                <Link to="/signup" className="text-purple-600">
                  Sign up
                </Link>
              </div>
            )}
          </div>

          <div className="hidden md:flex justify-center">
            <LoginImg />
          </div>

        </div>
      </div>
    </div>
  );
}
