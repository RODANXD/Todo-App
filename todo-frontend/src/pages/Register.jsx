import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosinstance from '../api/AxiosAuth';
import background from '../assets/background.jpg';
import loginbg from '../assets/loginbg.webp';
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";
import { Button } from '../components/ui/button';

export default function Register() {
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    username: '',
    email: '',
    password: '',
    password_confirm: '',
  });
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const validatePassword = (password) => {
    const minLength = password.length >= 8;
    const hasNumeric = /\d/.test(password);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    return {
      isValid: minLength && hasNumeric && hasSpecial,
      errors: [
        !minLength && "Password must be at least 8 characters long",
        !hasNumeric && "Password must contain at least one number",
        !hasSpecial && "Password must contain at least one special character"
      ].filter(Boolean)
    };
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    
    // Validate password requirements
    const passwordValidation = validatePassword(form.password);
    if (!passwordValidation.isValid) {
      passwordValidation.errors.forEach(error => toast.error(error));
      return;
    }

    // Check password match
    if (form.password !== form.password_confirm) {
      toast.error("Passwords do not match");
      return;
    }

    try {
      await axiosinstance.post('auth/register/', form);
      toast.success("Registration successful! Please log in.");
      navigate('/login');
    } catch (error) {
      console.error('Registration failed:', error.response || error);
      
      if (error.response) {
        const { data } = error.response;
        
        if (data.username) {
          toast.error("This username is already taken");
        } else if (data.email) {
          toast.error("This email is already registered");
        } else if (data.detail) {
          toast.error(`Registration failed: ${data.detail}`);
        } else if (data.non_field_errors) {
          toast.error(`Registration failed: ${data.non_field_errors[0]}`);
        } else {
          toast.error("Registration failed: Please check your input");
        }
      } else {
        toast.error("Registration failed: Network error. Please check your connection.");
      }
    }
  };

  const passwordMatch = form.password && form.password_confirm && form.password === form.password_confirm;
  const passwordValidation = validatePassword(form.password);

  return (
    <div className="min-h-screen flex items-center justify-center p-2">
      <div className="flex justify-center items-center w-full max-w-6xl bg-white rounded-2xl shadow-xl p-8">
        <div className="w-full max-w-md p-6 bg-white rounded-lg">
          <div className="text-center mb-6">
            <h2 className="text-4xl font-bold text-gray-900">Create an Account</h2>
            <p className="text-gray-500 mt-2">Sign up to get started</p>
          </div>
          <form onSubmit={handleRegister} className="space-y-4">
            <div className="flex gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                <input
                  type="text"
                  name="first_name"
                  value={form.first_name}
                  onChange={handleChange}
                  className="w-full bg-gray-100 p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Enter your First Name"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                <input
                  type="text"
                  name="last_name"
                  value={form.last_name}
                  onChange={handleChange}
                  className="w-full bg-gray-100 p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Enter your Last Name"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
              <input
                type="text"
                name="username"
                value={form.username}
                onChange={handleChange}
                className="w-full bg-gray-100 p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Enter your username"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                className="w-full bg-gray-100 p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Enter your email"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <div className="flex items-center">
                <input
                  type={showCurrentPassword ? "text" : "password"}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  className="w-full bg-gray-100 p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Enter your password"
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="relative right-8 h-6 w-1 p-0"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                >
                  {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
              </div>
              {form.password && !passwordValidation.isValid && (
                <div className="text-sm text-red-500 mt-1">
                  {passwordValidation.errors.map((error, index) => (
                    <p key={index}>❌ {error}</p>
                  ))}
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
              <div className="flex items-center">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  name="password_confirm"
                  value={form.password_confirm}
                  onChange={handleChange}
                  className="w-full bg-gray-100 p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Confirm your password"
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="relative right-8 h-6 w-1 p-0"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
              </div>
              {form.password_confirm && (
                <p className={`text-sm mt-1 ${passwordMatch ? "text-green-600" : "text-red-500"}`}>
                  {passwordMatch ? "✅ Passwords match" : "❌ Passwords do not match"}
                </p>
              )}
            </div>
            <button
              type="submit"
              disabled={!passwordMatch || !passwordValidation.isValid}
              className={`w-full py-2 font-semibold rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                passwordMatch && passwordValidation.isValid
                  ? 'bg-purple-600 text-white hover:bg-purple-700'
                  : 'bg-gray-400 text-gray-200 cursor-not-allowed'
              }`}
            >
              Register
            </button>
          </form>
          <p className="mt-4 text-sm text-center text-gray-600">
            Already have an account? <a href="/login" className="text-purple-600 hover:text-purple-500">Login here</a>
          </p>
        </div>
        <div className="w-2/5 ml-8">
          <img src={loginbg} alt="Register Illustration" className="w-full rounded-lg aspect-3/2 object-cover" />
        </div>
      </div>
    </div>
  );
}