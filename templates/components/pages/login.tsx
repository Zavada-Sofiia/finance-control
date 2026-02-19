import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { Navigation } from '../../Navigation';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';


import login_back_Img from '../../assets/login_back_img.png';

export function LoginImg() {
  return <img src={login_back_Img} alt="Login" className="w-full h-auto object-contain" />;
}


export function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const formData = new URLSearchParams();
      formData.append('username', username);
      formData.append('password', password);

      const res = await axios.post('/token', formData, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      });


      // передаємо токен у AuthContext
      login(res.data.access_token);

      navigate('/tracker');
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Error logging in');
    }
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

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Username"
                  className="w-full px-5 py-3.5 rounded-full border-2 border-gray-200 focus:outline-none focus:border-purple-300 bg-white"
                  required
                />
              </div>

              <div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  className="w-full px-5 py-3.5 rounded-full border-2 border-gray-200 focus:outline-none focus:border-purple-300 bg-white"
                  required
                />
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
            <LoginImg />
          </div>
        </div>
      </div>
    </div>
  );
}
