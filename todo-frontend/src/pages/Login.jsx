import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosinstance from '../api/AxiosAuth';
import { useauth } from '../store/AuthContext';

export default function Login() {
    const [form, setForm] = useState({
        email: '',
        password: '',
    });
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const { login } = useauth(); 

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
        setError(''); // Clear error when user types
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            const response = await axiosinstance.post('auth/login/', form);
            console.log('Login response:', response.data);
            
            if (response.data.access && response.data.refresh) {
                login(response.data.access, response.data.refresh);
                navigate('/');
            } else {
                setError('Invalid response from server');
            }
        } catch (error) {
            console.error('Login failed:', error.response || error);
            if (error.response) {
                setError(error.response.data.detail || 'Invalid credentials');
            } else {
                setError('Login failed. Please check your connection.');
            }
        }
    };

    return (
        <div className=' grid place-items-center h-screen'>
        <div className="w-full bg-white rounded-lg shadow dark:border md:mt-0 sm:max-w-md xl:p-0 dark:bg-gray-800 dark:border-gray-700">
            <div className="p-6 space-y-4 md:space-y-6 sm:p-8">
                <h2 className="text-xl font-bold leading-tight tracking-tight text-gray-900 md:text-2xl dark:text-white">
                Sign in to your account
                </h2>
                {error && (
                    <div className="p-3 text-sm text-red-700 bg-red-100 rounded-md">
                        {error}
                    </div>
                )}
                <form className="space-y-4 md:space-y-6" onSubmit={handleLogin}>
                    <div>
                        <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Email</label>
                        <input
                            type="email"
                            name="email"
                            value={form.email}
                            onChange={handleChange}
                            className="bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                            placeholder="Enter your Email"
                            required
                        />
                    </div>
                    <div>
                        <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Password</label>
                        <input
                            type="password"
                            name="password"
                            value={form.password}
                            onChange={handleChange}
                            className="bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                            placeholder="Enter your password"
                            required
                        />
                    </div>
                    <div class="flex items-center justify-between">
                      <div class="flex items-start">
                          <div class="flex items-center h-5">
                            <input id="remember" aria-describedby="remember" type="checkbox" class="w-4 h-4 border border-gray-300 rounded bg-gray-50 focus:ring-3 focus:ring-primary-300 dark:bg-gray-700 dark:border-gray-600 dark:focus:ring-primary-600 dark:ring-offset-gray-800" required=""/>
                          </div>
                          <div class="ml-3 text-sm">
                            <label for="remember" class="text-gray-500 dark:text-gray-300">Remember me</label>
                          </div>
                      </div>
                      <a href="#" class="text-sm font-medium text-primary-600 hover:underline dark:text-primary-500">Forgot password?</a>
                  </div>
                    <button
                        type="submit"
                        className="w-full text-black outline outline-1 outline-offset-1 bg-blue-300/40 hover:bg-blue-400/50 focus:ring-4 focus:outline-none focus:ring-primary-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-primary-600 dark:hover:bg-primary-700 dark:focus:ring-primary-800"
                    >
                        Login
                    </button>
                </form>
                <p className="text-sm font-light text-gray-500 dark:text-gray-400">
                    Don't have an account?{' '}
                    <a href="/register" className="font-medium text-blue-600 hover:underline dark:text-blue-500">
                        Register here
                    </a>
                </p>
            </div>
        </div>
        </div>
    );
}