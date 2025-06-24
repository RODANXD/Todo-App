import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosinstance from '../api/AxiosAuth';
import background from '../assets/background.jpg';
import loginbg from '../assets/loginbg.webp';




export default function Register() {
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

    const handleRegister = async (e) => {
        e.preventDefault();
        console.log('Form data being sent:', form); // Debugging form data
        try {
            await axiosinstance.post('auth/register/', form);
            alert('Registration successful');
            navigate('/login');
        } catch (error) {
            console.error('Registration failed:', error.response || error); // Log full error
            if (error.response) {
                alert(`Registration failed: ${error.response.data.detail || 'Please check your input'}`);
            } else {
                alert('Registration failed. Please check your connection.');
            }
        }
    };

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
                                onChange={handleChange}
                                className="w-full bg-gray-100 p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                                placeholder="Enter your email"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                            <input
                                type="password"
                                name="password"
                                onChange={handleChange}
                                className="w-full bg-gray-100 p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                                placeholder="Enter your password"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
                            <input
                                type="password"
                                name="password_confirm"
                                onChange={handleChange}
                                className="w-full bg-gray-100 p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                                placeholder="Confirm your password"
                                required
                            />
                        </div>
                        <button
                            type="submit"
                            className="w-full py-2 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
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