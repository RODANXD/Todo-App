import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosinstance from '../api/AxiosAuth';
import { useauth } from '../store/AuthContext';

const AuthForm = () => {
  const [isRightPanelActive, setIsRightPanelActive] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [registerForm, setRegisterForm] = useState({
    first_name: '',
    last_name: '',
    username: '',
    email: '',
    password: '',
    password_confirm: '',
  });
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login } = useauth();

  const handleRegisterChange = (e) => {
    setRegisterForm({ ...registerForm, [e.target.name]: e.target.value });
  };

  const handleLoginChange = (e) => {
    setLoginForm({ ...loginForm, [e.target.name]: e.target.value });
    setError('');
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      await axiosinstance.post('auth/register/', registerForm);
      alert('Registration successful');
      navigate('/login');
    } catch (error) {
      console.error('Registration failed:', error.response || error);
      alert(
        error.response
          ? `Registration failed: ${error.response.data.detail || 'Please check your input'}`
          : 'Registration failed. Please check your connection.'
      );
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await axiosinstance.post('auth/login/', loginForm);
      if (response.data.access && response.data.refresh) {
        login(response.data.access, response.data.refresh);
        navigate('/');
      } else {
        setError('Invalid response from server');
      }
    } catch (error) {
      setError(
        error.response ? error.response.data.detail || 'Invalid credentials' : 'Login failed. Please check your connection.'
      );
    }
  };

  const handleSignUpClick = () => {
    setIsRightPanelActive(true);
    setShowForgotPassword(false);
    setError('');
  };

  const handleSignInClick = () => {
    setIsRightPanelActive(false);
    setShowForgotPassword(false);
    setError('');
  };

  return (
    <div className="bg-gray-100 flex justify-center items-center flex-col font-montserrat min-h-screen m-0">
      <div className={`bg-white rounded-lg shadow-2xl relative overflow-hidden w-full max-w-3xl min-h-[480px] ${isRightPanelActive ? 'right-panel-active' : ''}`}>
        {/* Sign Up Form */}
        <div className={`absolute top-0 h-full transition-all duration-600 ease-in-out ${isRightPanelActive ? 'translate-x-full opacity-100 z-50' : 'opacity-0 z-10'} left-0 w-1/2`}>
          <form className="bg-white flex items-center justify-center flex-col px-10 h-full text-center" onSubmit={handleRegister}>
            <h1 className="font-bold text-2xl mb-4">Create Account</h1>
            <div className="flex gap-4 w-full">
              <div className="w-1/2">
                <label className="block mb-2 text-sm font-medium text-gray-900">First Name</label>
                <input
                  type="text"
                  name="first_name"
                  onChange={handleRegisterChange}
                  className="bg-gray-200 border-none p-3 my-2 w-full rounded-lg"
                  placeholder="Enter your First Name"
                  required
                />
              </div>
              <div className="w-1/2">
                <label className="block mb-2 text-sm font-medium text-gray-900">Last Name</label>
                <input
                  type="text"
                  name="last_name"
                  onChange={handleRegisterChange}
                  className="bg-gray-200 border-none p-3 my-2 w-full rounded-lg"
                  placeholder="Enter your Last Name"
                  required
                />
              </div>
            </div>
            <div className="w-full">
              <label className="block mb-2 text-sm font-medium text-gray-900">Username</label>
              <input
                type="text"
                name="username"
                onChange={handleRegisterChange}
                className="bg-gray-200 border-none p-3 my-2 w-full rounded-lg"
                placeholder="Enter your username"
                required
              />
            </div>
            <div className="w-full">
              <label className="block mb-2 text-sm font-medium text-gray-900">Email</label>
              <input
                type="email"
                name="email"
                onChange={handleRegisterChange}
                className="bg-gray-200 border-none p-3 my-2 w-full rounded-lg"
                placeholder="Enter your email"
                required
              />
            </div>
            <div className="w-full">
              <label className="block mb-2 text-sm font-medium text-gray-900">Password</label>
              <input
                type="password"
                name="password"
                onChange={handleRegisterChange}
                className="bg-gray-200 border-none p-3 my-2 w-full rounded-lg"
                placeholder="Enter your password"
                required
              />
            </div>
            <div className="w-full">
              <label className="block mb-2 text-sm font-medium text-gray-900">Confirm Password</label>
              <input
                type="password"
                name="password_confirm"
                onChange={handleRegisterChange}
                className="bg-gray-200 border-none p-3 my-2 w-full rounded-lg"
                placeholder="Confirm your password"
                required
              />
            </div>
            <button
              type="submit"
              className="rounded-full border border-red-500 bg-red-500 text-white font-bold py-3 px-12 uppercase mt-4 transform transition-transform hover:scale-95"
            >
              Sign Up
            </button>
          </form>
        </div>
        {/* Sign In Form */}
        <div className={`absolute top-0 h-full transition-all duration-600 ease-in-out ${isRightPanelActive ? 'translate-x-full' : ''} left-0 w-1/2 z-20`}>
          {showForgotPassword ? (
            <ForgotPasswordForm setShowForgotPassword={setShowForgotPassword} />
          ) : (
            <form className="bg-white flex items-center justify-center flex-col px-10 h-full text-center" onSubmit={handleLogin}>
              <h1 className="font-bold text-2xl mb-4">Sign in</h1>
              {error && (
                <div className="mb-4 p-3 text-sm text-red-300 bg-red-500/20 rounded-lg text-center animate-pulse">
                  {error}
                </div>
              )}
              <div className="w-full">
                <label className="block mb-2 text-sm font-medium text-gray-900">Email</label>
                <input
                  type="email"
                  name="email"
                  value={loginForm.email}
                  onChange={handleLoginChange}
                  className="bg-gray-200 border-none p-3 my-2 w-full rounded-lg"
                  placeholder="Enter your email"
                  required
                />
              </div>
              <div className="w-full">
                <label className="block mb-2 text-sm font-medium text-gray-900">Password</label>
                <input
                  type="password"
                  name="password"
                  value={loginForm.password}
                  onChange={handleLoginChange}
                  className="bg-gray-200 border-none p-3 my-2 w-full rounded-lg"
                  placeholder="Enter your password"
                  required
                />
              </div>
              <span
                onClick={() => setShowForgotPassword(true)}
                className="text-gray-700 text-sm my-4 cursor-pointer hover:underline"
              >
                Forgot your password?
              </span>
              <button
                type="submit"
                className="rounded-full border border-red-500 bg-red-500 text-white font-bold py-3 px-12 uppercase transform transition-transform hover:scale-95"
              >
                Sign In
              </button>
            </form>
          )}
        </div>
        {/* Overlay Container */}
        <div className={`absolute top-0 left-1/2 w-1/2 h-full overflow-hidden transition-transform duration-600 ease-in-out ${isRightPanelActive ? '-translate-x-full' : ''} z-[100]`}>
          <div className="bg-gradient-to-r from-red-500 to-pink-500 text-white relative -left-full h-full w-[200%] transform transition-transform duration-600 ease-in-out" style={{ transform: isRightPanelActive ? 'translateX(50%)' : 'translateX(0)' }}>
            <div className={`absolute flex items-center justify-center flex-col px-10 text-center top-0 h-full w-1/2 transform transition-transform duration-600 ease-in-out ${isRightPanelActive ? 'translate-x-0' : '-translate-x-1/5'}`}>
              <h1 className="font-bold text-2xl mb-4">Welcome Back!</h1>
              <p className="text-sm font-light leading-5 mb-6">To keep connected with us please login with your personal info</p>
              <button
                type="button"
                className="rounded-full border border-white bg-transparent text-white font-bold py-3 px-12 uppercase transform transition-transform hover:scale-95"
                onClick={handleSignInClick}
              >
                Sign In
              </button>
            </div>
            <div className={`absolute flex items-center justify-center flex-col px-10 text-center top-0 h-full w-1/2 right-0 transform transition-transform duration-600 ease-in-out ${isRightPanelActive ? 'translate-x-1/5' : 'translate-x-0'}`}>
              <h1 className="font-bold text-2xl mb-4">Hello, Friend!</h1>
              <p className="text-sm font-light leading-5 mb-6">Enter your personal details and start your journey with us</p>
              <button
                type="button"
                className="rounded-full border border-white bg-transparent text-white font-bold py-3 px-12 uppercase transform transition-transform hover:scale-95"
                onClick={handleSignUpClick}
              >
                Sign Up
              </button>
            </div>
          </div>
        </div>
      </div>
      <footer className="bg-gray-800 text-white text-sm fixed bottom-0 left-0 right-0 text-center py-2 z-[999]">
        <p>
          Created with <i className="fa fa-heart text-red-500"></i> by
          <a target="_blank" href="https://florin-pop.com" className="text-blue-400 mx-1">Florin Pop</a>
          - Read how I created this and how you can join the challenge
          <a target="_blank" href="https://www.florin-pop.com/blog/2019/03/double-slider-sign-in-up-form/" className="text-blue-400 mx-1">here</a>.
        </p>
      </footer>
    </div>
  );
};

const ForgotPasswordForm = ({ setShowForgotPassword }) => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axiosinstance.post('/auth/forgotpassword/', { email });
      setMessage(res.data.message);
    } catch (err) {
      setMessage(err.response?.data?.error || 'Something went wrong');
    }
  };

  return (
    <div className="bg-white flex items-center justify-center flex-col px-10 h-full text-center">
      <h1 className="font-bold text-2xl mb-4">Forgot Password</h1>
      <form className="w-full" onSubmit={handleSubmit}>
        <div className="w-full">
          <label className="block mb-2 text-sm font-medium text-gray-900">Email</label>
          <input
            type="email"
            name="email"
            className="bg-gray-200 border-none p-3 my-2 w-full rounded-lg"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <button
          type="submit"
          className="rounded-full border border-red-500 bg-red-500 text-white font-bold py-3 px-12 uppercase mt-4 transform transition-transform hover:scale-95"
        >
          Send Reset Link
        </button>
        {message && <p className="mt-4 text-green-500 text-center text-sm">{message}</p>}
        <p
          onClick={() => setShowForgotPassword(false)}
          className="mt-4 text-sm text-center cursor-pointer text-blue-500 hover:underline"
        >
          Back to login
        </p>
      </form>
    </div>
  );
};

export default AuthForm;