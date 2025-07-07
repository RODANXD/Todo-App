import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosinstance from '../api/AxiosAuth';
import { useauth } from '../store/AuthContext';
import loginbg from '../assets/loginbg.webp';
import { toast } from "sonner";
import { Button } from '../components/ui/button';
import { Eye, EyeOff } from "lucide-react";

export default function Login() {
    const [form, setForm] = useState({ email: '', password: '' });
    const [error, setError] = useState('');
    const [showForgotPassword, setShowForgotPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const navigate = useNavigate();
    const { login } = useauth();

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
        setError('');
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            const response = await axiosinstance.post('auth/login/', form);
            if (response.data.access && response.data.refresh) {
                await login(response.data.access, response.data.refresh);
                toast.success("Login successful!");
                navigate('/');
            } else {
                toast.error("Invalid response from server");
                setError('Invalid response from server');
            }
        } catch (error) {
            if (error.response) {
                toast.error("Invalid credentials");
                setError(error.response.data.detail || 'Invalid credentials');
            } else {
                toast.error("Login failed. check inputs.");
                setError('Login failed. Please check your connection.');
            }
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 lg:p-8">
            <div className="flex flex-col lg:flex-row justify-center items-center w-full max-w-7xl bg-white rounded-2xl shadow-xl p-4 sm:p-6 lg:p-8">
                <div className="w-full lg:w-1/2 max-w-md p-4 sm:p-6">
                    {showForgotPassword ? (
                        <ForgotPasswordForm setShowForgotPassword={setShowForgotPassword} />
                    ) : (
                        <>
                            <div className="text-center mb-6">
                                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900">Hello, Welcome Back</h2>
                                <p className="text-gray-500 mt-2 text-sm sm:text-base">Hey, welcome back to your special place</p>
                            </div>
                            <form onSubmit={handleLogin} className="space-y-4">
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
                                            type={showConfirmPassword ? "text" : "password"}
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
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        >
                                            {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                        </Button>
                                    </div>
                                </div>
                                <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
                                    <div className="flex items-center">
                                        <input
                                            id="remember"
                                            type="checkbox"
                                            className="w-4 h-4 text-purple-600 border-gray-300 rounded"
                                        />
                                        <label htmlFor="remember" className="ml-2 text-sm text-gray-600">
                                            Remember me
                                        </label>
                                    </div>
                                    <span
                                        onClick={() => setShowForgotPassword(true)}
                                        className="text-sm text-purple-600 hover:text-purple-500 cursor-pointer"
                                    >
                                        Forgot password?
                                    </span>
                                </div>
                                <button
                                    type="submit"
                                    className="w-full py-2 sm:py-3 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm sm:text-base"
                                >
                                    Sign In
                                </button>
                            </form>
                            <p className="mt-4 text-sm text-center text-gray-600">
                                Don’t have an account? <a href="/register" className="text-purple-600 hover:text-purple-500">Sign Up</a>
                            </p>
                        </>
                    )}
                </div>
                <div className="w-full lg:w-1/2 mt-6 lg:mt-0 lg:ml-8 hidden lg:block">
                    <img src={loginbg} alt="Login Illustration" className="w-full h-auto rounded-lg object-cover" />
                </div>
            </div>
        </div>
    );
}

function ForgotPasswordForm({ setShowForgotPassword }) {
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
        <div className="w-full max-w-md p-4 sm:p-6">
            <h2 className="text-2xl sm:text-3xl font-bold text-center text-gray-900 mb-6">Forgot Password</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input
                        type="email"
                        name="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-gray-100 p-2 sm:p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm sm:text-base"
                        placeholder="Enter your email"
                        required
                    />
                </div>
                <button
                    type="submit"
                    className="w-full py-2 sm:py-3 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm sm:text-base"
                >
                    Send Reset Link
                </button>
                {message && <p className="mt-4 text-green-600 text-center text-sm">{message}</p>}
                <p
                    onClick={() => setShowForgotPassword(false)}
                    className="mt-4 text-sm text-center text-purple-600 hover:text-purple-500 cursor-pointer"
                >
                    Back to login
                </p>
            </form>
        </div>
    );
}