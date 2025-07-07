import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosinstance from '../api/AxiosAuth';
import background from '../assets/background.jpg';
import loginbg from '../assets/loginbg.webp';
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";
import { Button } from '../components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs"
import {
  User,
  BuildingIcon
} from "lucide-react"

export default function Register() {
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [activeTab, setActiveTab] = useState("User")
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    username: '',
    email: '',
    password: '',
    password_confirm: '',
    role: 'member',
    organization_name: ''
  });
  const navigate = useNavigate();

  useEffect(() => {
    setForm((prev) => ({
      ...prev,
      role: activeTab === "Admin" ? "admin" : "member"
    }));
  }, [activeTab]);

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
    
    const passwordValidation = validatePassword(form.password);
    if (!passwordValidation.isValid) {
      passwordValidation.errors.forEach(error => toast.error(error));
      return;
    }

    if (form.password !== form.password_confirm) {
      toast.error("Passwords do not match");
      return;
    }

    if (form.role === 'admin' && !form.organization_name.trim()) {
      toast.error("Organization name is required for admin registration");
      return;
    }

    try {
      const registrationData = {
        first_name: form.first_name,
        last_name: form.last_name,
        username: form.username,
        email: form.email,
        password: form.password,
        password_confirm: form.password_confirm,
        role: form.role
      };

      if (form.role === 'admin') {
        registrationData.organization_name = form.organization_name;
      }

      await axiosinstance.post('auth/register/', registrationData);
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
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col lg:flex-row justify-center items-center w-full max-w-7xl bg-white rounded-2xl shadow-xl p-4 sm:p-6 lg:p-8">
        <div className="w-full lg:w-1/2 max-w-md p-4 sm:p-6">
          <div className="text-center mb-6">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900">Create an Account</h2>
            <p className="text-gray-500 mt-2 text-sm sm:text-base">Sign up to get started</p>
          </div>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="flex flex-row sm:flex-row justify-center bg-transparent p-2 sm:p-4 space-x-2 sm:space-x-4">
              <TabsTrigger
                value="User"
                className="flex-1 sm:flex-none py-2 px-4 text-sm sm:text-base data-[state=active]:bg-blue-100 data-[state=active]:text-blue-700 rounded-lg"
              >
                <User className="w-4 h-4 mr-2 sm:mr-3" />
                User
              </TabsTrigger>
              <TabsTrigger
                value="Admin"
                className="flex-1 sm:flex-none py-2 px-4 text-sm sm:text-base data-[state=active]:bg-blue-100 data-[state=active]:text-blue-700 rounded-lg"
              >
                <BuildingIcon className="w-4 h-4 mr-2 sm:mr-3" />
                Admin
              </TabsTrigger>
            </TabsList>

            <TabsContent value="User" className="p-4 sm:p-6 space-y-4 m-0">
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                    <input
                      type="text"
                      name="first_name"
                      value={form.first_name}
                      onChange={handleChange}
                      className="w-full bg-gray-100 p-2 sm:p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm sm:text-base"
                      placeholder="Enter your First Name"
                      required
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                    <input
                      type="text"
                      name="last_name"
                      value={form.last_name}
                      onChange={handleChange}
                      className="w-full bg-gray-100 p-2 sm:p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm sm:text-base"
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
                    className="w-full bg-gray-100 p-2 sm:p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm sm:text-base"
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
                    className="w-full bg-gray-100 p-2 sm:p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm sm:text-base"
                    placeholder="Enter your email"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                  <div className="relative flex items-center">
                    <input
                      type={showCurrentPassword ? "text" : "password"}
                      name="password"
                      value={form.password}
                      onChange={handleChange}
                      className="w-full bg-gray-100 p-2 sm:p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm sm:text-base"
                      placeholder="Enter your password"
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-2 h-6 w-6 p-0"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    >
                      {showCurrentPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </Button>
                  </div>
                  {form.password && !passwordValidation.isValid && (
                    <div className="text-xs sm:text-sm text-red-500 mt-1">
                      {passwordValidation.errors.map((error, index) => (
                        <p key={index}>❌ {error}</p>
                      ))}
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
                  <div className="relative flex items-center">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      name="password_confirm"
                      value={form.password_confirm}
                      onChange={handleChange}
                      className="w-full bg-gray-100 p-2 sm:p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm sm:text-base"
                      placeholder="Confirm your password"
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-2 h-6 w-6 p-0"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </Button>
                  </div>
                  {form.password_confirm && (
                    <p className={`text-xs sm:text-sm mt-1 ${passwordMatch ? "text-green-600" : "text-red-500"}`}>
                      {passwordMatch ? "✅ Passwords match" : "❌ Passwords do not match"}
                    </p>
                  )}
                </div>
                <button
                  type="submit"
                  disabled={!passwordMatch || !passwordValidation.isValid}
                  className={`w-full py-2 sm:py-3 font-semibold rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm sm:text-base ${
                    passwordMatch && passwordValidation.isValid
                      ? 'bg-purple-600 text-white hover:bg-purple-700'
                      : 'bg-gray-400 text-gray-200 cursor-not-allowed'
                  }`}
                >
                  Register as User
                </button>
              </form>
            </TabsContent>
            <TabsContent value="Admin" className="p-4 sm:p-6 space-y-4 m-0">
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                    <input
                      type="text"
                      name="first_name"
                      value={form.first_name}
                      onChange={handleChange}
                      className="w-full bg-gray-100 p-2 sm:p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm sm:text-base"
                      placeholder="Enter your First Name"
                      required
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                    <input
                      type="text"
                      name="last_name"
                      value={form.last_name}
                      onChange={handleChange}
                      className="w-full bg-gray-100 p-2 sm:p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm sm:text-base"
                      placeholder="Enter your Last Name"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Organization Name</label>
                  <input
                    type="text"
                    name="organization_name"
                    value={form.organization_name}
                    onChange={handleChange}
                    className="w-full bg-gray-100 p-2 sm:p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm sm:text-base"
                    placeholder="Enter your organization name"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                  <input
                    type="text"
                    name="username"
                    value={form.username}
                    onChange={handleChange}
                    className="w-full bg-gray-100 p-2 sm:p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm sm:text-base"
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
                    className="w-full bg-gray-100 p-2 sm:p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm sm:text-base"
                    placeholder="Enter your email"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                  <div className="relative flex items-center">
                    <input
                      type={showCurrentPassword ? "text" : "password"}
                      name="password"
                      value={form.password}
                      onChange={handleChange}
                      className="w-full bg-gray-100 p-2 sm:p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm sm:text-base"
                      placeholder="Enter your password"
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-2 h-6 w-6 p-0"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    >
                      {showCurrentPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </Button>
                  </div>
                  {form.password && !passwordValidation.isValid && (
                    <div className="text-xs sm:text-sm text-red-500 mt-1">
                      {passwordValidation.errors.map((error, index) => (
                        <p key={index}>❌ {error}</p>
                      ))}
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
                  <div className="relative flex items-center">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      name="password_confirm"
                      value={form.password_confirm}
                      onChange={handleChange}
                      className="w-full bg-gray-100 p-2 sm:p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm sm:text-base"
                      placeholder="Confirm your password"
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-2 h-6 w-6 p-0"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </Button>
                  </div>
                  {form.password_confirm && (
                    <p className={`text-xs sm:text-sm mt-1 ${passwordMatch ? "text-green-600" : "text-red-500"}`}>
                      {passwordMatch ? "✅ Passwords match" : "❌ Passwords do not match"}
                    </p>
                  )}
                </div>
                <button
                  type="submit"
                  disabled={!passwordMatch || !passwordValidation.isValid}
                  className={`w-full py-2 sm:py-3 font-semibold rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm sm:text-base ${
                    passwordMatch && passwordValidation.isValid
                      ? 'bg-purple-600 text-white hover:bg-purple-700'
                      : 'bg-gray-400 text-gray-200 cursor-not-allowed'
                  }`}
                >
                  Register as Admin
                </button>
              </form>
            </TabsContent>
          </Tabs>
          <p className="mt-4 text-sm text-center text-gray-600">
            Already have an account? <a href="/login" className="text-purple-600 hover:text-purple-500">Login here</a>
          </p>
        </div>
        <div className="w-full lg:w-1/2 mt-6 lg:mt-0 lg:ml-8 hidden lg:block">
          <img src={loginbg} alt="Register Illustration" className="w-full h-auto rounded-lg object-cover" />
        </div>
      </div>
    </div>
  );
}