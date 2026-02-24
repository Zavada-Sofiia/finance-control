import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { Navigation } from '../../Navigation';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';
import signup_back_Img from '../../assets/login_back_img.png';

export function SignupImg() {
  return <img src={signup_back_Img} alt="Signup" className="w-full h-auto object-contain" />;
}

export function Signup() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState(''); // додано
  const [error, setError] = useState<string | null>(null); // для повідомлень

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match!");
      return;
    }

    try {
      const formData = { username, email, password };
      const res = await axios.post("/register", formData, {
        headers: { "Content-Type": "application/json" },
      });
      login(res.data.access_token);
      navigate("/tracker");
    } catch (err: any) {
      setError(err.response?.data?.detail || "Error registering");
    }
  };

  return (
    <div className="min-h-screen">
      <Navigation />
      <div className="max-w-6xl mx-auto px-4 md:px-8 py-8 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16 items-center">

          {/* Left: Form */}
          <div className="space-y-8">
            <div>
              <h1 className="text-3xl md:text-5xl font-bold mb-3">Create an account</h1>
              <p className="text-gray-600">
                Join Finance Control and Change your life activity
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
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email"
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
              <div>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm Password"
                  className="w-full px-5 py-3.5 rounded-full border-2 border-gray-200 focus:outline-none focus:border-purple-300 bg-white"
                  required
                />
              </div>

              {error && <div className="text-red-500 text-sm">{error}</div>}

              <button
                type="submit"
                className="w-full py-3.5 rounded-full bg-purple-300 text-gray-900 font-medium hover:bg-purple-400 transition-colors"
              >
                Sign up
              </button>
            </form>
            <div className="text-center text-sm">
              <span className="text-gray-600">Already have an account? </span>
              <Link to="/login" className="text-purple-600 hover:text-purple-700 font-medium">
                Log in
              </Link>
            </div>
          </div>

          {/* Right: Illustration — прихована на мобільному */}
          <div className="hidden md:flex justify-center">
            <SignupImg />
          </div>

        </div>
      </div>
    </div>
  );
}
